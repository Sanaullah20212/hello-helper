import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get access token using refresh token
async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch("https://www.googleapis.com/oauth2/v4/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OAuth token error:", error);
    throw new Error("Failed to get access token");
  }

  const data = await response.json();
  return data.access_token;
}

// List files in a Google Drive folder
async function listDriveFiles(
  accessToken: string,
  folderId: string,
  pageToken?: string
): Promise<{ files: any[]; nextPageToken?: string }> {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "nextPageToken,files(id,name,mimeType,size,modifiedTime,createdTime)",
    pageSize: "100",
    orderBy: "name",
  });

  if (pageToken) {
    params.append("pageToken", pageToken);
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Drive API error:", error);
    throw new Error("Failed to list drive files");
  }

  return response.json();
}

// Extract quality from folder name (HD, Medium, Low)
function extractQuality(folderName: string): string | null {
  const qualityMatch = folderName.match(/\((HD|Medium|Low|SD|480p|720p|1080p)\)/i);
  return qualityMatch ? qualityMatch[1] : null;
}

// Parse episode info from filename
// Format: "Show Name YYYY-MM-DD Episode XXX.mp4" or "Show Name Episode XXX.mp4"
function parseEpisodeInfo(filename: string): {
  showName: string;
  airDate: string | null;
  episodeNumber: number | null;
  title: string;
} | null {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  
  // Try to extract date (YYYY-MM-DD)
  const dateMatch = nameWithoutExt.match(/(\d{4}-\d{2}-\d{2})/);
  const airDate = dateMatch ? dateMatch[1] : null;
  
  // Try to extract episode number
  const episodeMatch = nameWithoutExt.match(/Episode\s*(\d+)/i);
  const episodeNumber = episodeMatch ? parseInt(episodeMatch[1], 10) : null;
  
  // Extract show name (everything before the date or episode)
  let showName = nameWithoutExt;
  
  if (airDate) {
    showName = nameWithoutExt.split(airDate)[0].trim();
  } else if (episodeMatch) {
    showName = nameWithoutExt.split(/Episode\s*\d+/i)[0].trim();
  }
  
  // Clean up show name
  showName = showName.replace(/[-_]+$/, "").trim();
  
  if (!showName) {
    return null;
  }
  
  // Create title
  let title = showName;
  if (airDate) {
    title = `${showName} - ${airDate}`;
  }
  if (episodeNumber) {
    title = `${title} - Episode ${episodeNumber}`;
  }
  
  return {
    showName,
    airDate,
    episodeNumber,
    title,
  };
}

// Create slug from text
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await req.json();
    const action = body.action || "list-folders";
    const folderId = body.folderId || Deno.env.get("GOOGLE_DRIVE_ROOT_FOLDER_ID");
    const isFree = body.isFree ?? false;
    const replaceDuplicates = body.replaceDuplicates ?? false;

    console.log(`Drive sync action: ${action}, folderId: ${folderId}`);

    // Get access token
    const accessToken = await getAccessToken();

    if (action === "list-folders") {
      // List only folders in the root
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: "files(id,name,modifiedTime)",
        pageSize: "100",
        orderBy: "name desc",
      });

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!response.ok) {
        throw new Error("Failed to list folders");
      }

      const data = await response.json();
      console.log(`Found ${data.files?.length || 0} folders`);

      return new Response(JSON.stringify({ folders: data.files || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list-files") {
      // List video files in a specific folder (handles nested show folders)
      const folderName = body.folderName || "";
      const allFiles: any[] = [];
      
      // First, check if this folder has subfolders (show folders)
      const subfolderParams = new URLSearchParams({
        q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: "files(id,name)",
        pageSize: "100",
      });
      
      const subfolderResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?${subfolderParams.toString()}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      const subfolderData = await subfolderResponse.json();
      const subfolders = subfolderData.files || [];
      
      console.log(`Found ${subfolders.length} subfolders in ${folderName}`);
      
      // If there are subfolders (show/quality folders), scan each one for videos
      if (subfolders.length > 0) {
        for (const subfolder of subfolders) {
          // Extract quality from subfolder name
          const quality = extractQuality(subfolder.name);
          
          let pageToken: string | undefined;
          do {
            const result = await listDriveFiles(accessToken, subfolder.id, pageToken);
            
            // Filter for video files only
            const videoFiles = result.files.filter(
              (f: any) =>
                f.mimeType?.startsWith("video/") ||
                f.name?.match(/\.(mp4|mkv|avi|mov|wmv|flv|webm)$/i)
            );
            
            // Add subfolder name and quality to each file for URL generation
            videoFiles.forEach((file: any) => {
              allFiles.push({
                ...file,
                parentFolder: subfolder.name,
                quality: quality || "HD", // Default to HD if not specified
              });
            });
            
            pageToken = result.nextPageToken;
          } while (pageToken);
        }
      } else {
        // No subfolders, check for video files directly
        let pageToken: string | undefined;
        do {
          const result = await listDriveFiles(accessToken, folderId, pageToken);
          
          const videoFiles = result.files.filter(
            (f: any) =>
              f.mimeType?.startsWith("video/") ||
              f.name?.match(/\.(mp4|mkv|avi|mov|wmv|flv|webm)$/i)
          );
          
          allFiles.push(...videoFiles);
          pageToken = result.nextPageToken;
        } while (pageToken);
      }

      console.log(`Found ${allFiles.length} video files total in folder ${folderName}`);

      // Parse episode info for each file
      const episodes = allFiles.map((file) => {
        const info = parseEpisodeInfo(file.name);
        return {
          fileId: file.id,
          fileName: file.name,
          fileSize: file.size,
          modifiedTime: file.modifiedTime,
          folderName: folderName,
          parentFolder: file.parentFolder || null,
          quality: file.quality || null,
          ...(info || { showName: null, airDate: null, episodeNumber: null, title: file.name }),
        };
      });

      return new Response(JSON.stringify({ files: episodes }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "import") {
      // Import files to database with quality variants merged
      const files = body.files || [];
      const results = {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [] as string[],
      };

      // Group files by show + date/episode (to merge quality variants)
      const episodeGroups = new Map<string, any[]>();
      
      for (const file of files) {
        const info = parseEpisodeInfo(file.fileName);
        if (!info) continue;
        
        // Create unique key: showName + (airDate or episodeNumber)
        const key = `${info.showName.toLowerCase()}|${info.airDate || info.episodeNumber || file.fileName}`;
        
        if (!episodeGroups.has(key)) {
          episodeGroups.set(key, []);
        }
        episodeGroups.get(key)!.push({
          ...file,
          parsedInfo: info,
        });
      }

      // Create service role client for admin operations
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

      // Get all existing shows
      const { data: existingShows } = await adminSupabase
        .from("shows")
        .select("id, title, slug");

      const showMap = new Map<string, { id: string; slug: string }>();
      existingShows?.forEach((show: any) => {
        showMap.set(show.title.toLowerCase(), { id: show.id, slug: show.slug });
      });

      // Process each episode group (merging quality variants)
      for (const [_key, groupFiles] of episodeGroups) {
        try {
          const firstFile = groupFiles[0];
          const info = firstFile.parsedInfo;
          const showNameLower = info.showName.toLowerCase();
          
          // Find or create show
          let showData = showMap.get(showNameLower);
          
          if (!showData) {
            const slug = createSlug(info.showName);
            const { data: newShow, error: showError } = await adminSupabase
              .from("shows")
              .insert({
                title: info.showName,
                slug,
                is_active: true,
              })
              .select("id, slug")
              .single();

            if (showError) {
              results.errors.push(`Failed to create show ${info.showName}: ${showError.message}`);
              results.skipped += groupFiles.length;
              continue;
            }

            showData = { id: newShow.id, slug: newShow.slug };
            showMap.set(showNameLower, showData);
            console.log(`Created show: ${info.showName}`);
          }

          // Build download links from all quality variants
          const downloadLinks: { label: string; url: string; quality: string }[] = [];
          let primaryWatchUrl = "";
          
          // Sort by quality priority: HD > Medium > Low
          const qualityOrder: { [key: string]: number } = { "HD": 1, "1080p": 1, "720p": 2, "Medium": 2, "480p": 3, "Low": 3, "SD": 3 };
          groupFiles.sort((a: any, b: any) => {
            const aOrder = qualityOrder[a.quality] || 99;
            const bOrder = qualityOrder[b.quality] || 99;
            return aOrder - bOrder;
          });
          
          for (const file of groupFiles) {
            const encodedFolder = encodeURIComponent(file.folderName || "");
            const encodedParent = file.parentFolder ? encodeURIComponent(file.parentFolder) : null;
            const encodedFileName = encodeURIComponent(file.fileName || "");
            
            let url: string;
            if (encodedParent) {
              url = `https://dash.btspro24.xyz/0:/${encodedFolder}/${encodedParent}/${encodedFileName}`;
            } else {
              url = `https://dash.btspro24.xyz/0:/${encodedFolder}/${encodedFileName}`;
            }
            
            // First (highest quality) becomes watch URL
            if (!primaryWatchUrl) {
              primaryWatchUrl = url;
            }
            
            downloadLinks.push({
              label: `Download ${file.quality || "HD"}`,
              url: url,
              quality: file.quality || "HD",
            });
          }

          // Check for existing episode
          let existingQuery = adminSupabase
            .from("episodes")
            .select("id, download_links")
            .eq("show_id", showData.id);

          if (info.airDate) {
            existingQuery = existingQuery.eq("air_date", info.airDate);
          } else if (info.episodeNumber) {
            existingQuery = existingQuery.eq("episode_number", info.episodeNumber);
          } else {
            existingQuery = existingQuery.eq("title", info.title);
          }

          const { data: existingEpisode } = await existingQuery.maybeSingle();

          const episodeData = {
            show_id: showData.id,
            title: info.title,
            air_date: info.airDate,
            episode_number: info.episodeNumber,
            watch_url: primaryWatchUrl,
            download_links: downloadLinks,
            is_free: isFree,
            is_active: true,
          };

          if (existingEpisode) {
            if (replaceDuplicates) {
              const { error: updateError } = await adminSupabase
                .from("episodes")
                .update(episodeData)
                .eq("id", existingEpisode.id);

              if (updateError) {
                results.errors.push(`Failed to update ${info.title}: ${updateError.message}`);
              } else {
                results.updated++;
              }
            } else {
              results.skipped++;
            }
          } else {
            const { error: insertError } = await adminSupabase
              .from("episodes")
              .insert(episodeData);

            if (insertError) {
              results.errors.push(`Failed to import ${info.title}: ${insertError.message}`);
            } else {
              results.created++;
            }
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          results.errors.push(`Error processing episode: ${errorMsg}`);
        }
      }

      console.log(`Import complete: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`);

      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Drive sync error:", error);
    const errorMsg = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMsg }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
