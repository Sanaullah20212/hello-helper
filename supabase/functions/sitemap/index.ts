import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://www.bengalitvserial24.com";

// Types
interface Show {
  slug: string;
  title: string;
  updated_at: string | null;
  poster_url: string | null;
  thumbnail_url: string | null;
}

interface Category {
  slug: string;
  name: string;
  updated_at: string | null;
  image_url: string | null;
}

interface Section {
  slug: string;
  title: string;
  created_at: string | null;
}

interface Episode {
  id: string;
  title: string;
  air_date: string | null;
  episode_number: number | null;
  updated_at: string | null;
  show_id: string;
  thumbnail_url: string | null;
  watch_url: string | null;
}

interface ShowBasic {
  id: string;
  slug: string;
  title: string;
}

// deno-lint-ignore no-explicit-any
type SupabaseClientType = SupabaseClient<any, "public", any>;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "index";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString();

    let xml = "";

    switch (type) {
      case "index":
        xml = await generateSitemapIndex(supabase, today);
        break;
      case "pages":
        xml = generatePagesSitemap(today);
        break;
      case "shows":
        xml = await generateShowsSitemap(supabase, today);
        break;
      case "categories":
        xml = await generateCategoriesSitemap(supabase, today);
        break;
      case "episodes": {
        const page = parseInt(url.searchParams.get("page") || "1", 10);
        xml = await generateEpisodesSitemap(supabase, today, page);
        break;
      }
      default:
        xml = await generateSitemapIndex(supabase, today);
    }

    console.log(`Sitemap generated: type=${type}`);

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Sitemap Error:", error);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><error>${errorMessage}</error>`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  }
});

// Generate Sitemap Index (like Rank Math)
async function generateSitemapIndex(supabase: SupabaseClientType, today: string): Promise<string> {
  // Count episodes to determine how many episode sitemaps we need
  const { count: episodeCount } = await supabase
    .from("episodes")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const episodePages = Math.ceil((episodeCount || 0) / 1000); // 1000 episodes per sitemap

  // Get last modified dates
  const { data: lastShow } = await supabase
    .from("shows")
    .select("updated_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  const { data: lastEpisode } = await supabase
    .from("episodes")
    .select("updated_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  const { data: lastCategory } = await supabase
    .from("content_categories")
    .select("updated_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  const showDate = (lastShow as { updated_at: string } | null)?.updated_at || today;
  const episodeDate = (lastEpisode as { updated_at: string } | null)?.updated_at || today;
  const categoryDate = (lastCategory as { updated_at: string } | null)?.updated_at || today;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${SITE_URL}/sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  
  <!-- Static Pages Sitemap -->
  <sitemap>
    <loc>${SITE_URL}/sitemap-pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  
  <!-- Shows Sitemap -->
  <sitemap>
    <loc>${SITE_URL}/sitemap-shows.xml</loc>
    <lastmod>${showDate}</lastmod>
  </sitemap>
  
  <!-- Categories Sitemap -->
  <sitemap>
    <loc>${SITE_URL}/sitemap-categories.xml</loc>
    <lastmod>${categoryDate}</lastmod>
  </sitemap>
`;

  // Add episode sitemaps (paginated)
  for (let i = 1; i <= Math.max(1, episodePages); i++) {
    xml += `
  <!-- Episodes Sitemap ${i} -->
  <sitemap>
    <loc>${SITE_URL}/sitemap-episodes-${i}.xml</loc>
    <lastmod>${episodeDate}</lastmod>
  </sitemap>
`;
  }

  xml += `</sitemapindex>`;

  return xml;
}

// Generate Static Pages Sitemap
function generatePagesSitemap(today: string): string {
  const todayDate = today.split('T')[0];
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${todayDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <url>
    <loc>${SITE_URL}/free-episodes</loc>
    <lastmod>${todayDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>${SITE_URL}/search</loc>
    <lastmod>${todayDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

</urlset>`;
}

// Generate Shows Sitemap
async function generateShowsSitemap(supabase: SupabaseClientType, today: string): Promise<string> {
  const { data } = await supabase
    .from("shows")
    .select("slug, title, updated_at, poster_url, thumbnail_url")
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  const shows = (data || []) as Show[];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

  for (const show of shows) {
    const lastmod = show.updated_at ? show.updated_at.split('T')[0] : today.split('T')[0];
    xml += `
  <url>
    <loc>${SITE_URL}/show/${show.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>`;
    
    // Add image if available (only valid HTTP URLs, not data: URIs)
    const showImage = show.poster_url || show.thumbnail_url;
    if (isValidImageUrl(showImage)) {
      xml += `
    <image:image>
      <image:loc>${escapeXml(showImage!)}</image:loc>
      <image:title>${escapeXml(show.title)} Poster</image:title>
      <image:caption>${escapeXml(show.title)} - Bengali TV Serial</image:caption>
    </image:image>`;
    }
    
    xml += `
  </url>`;
  }

  xml += `
</urlset>`;

  return xml;
}

// Generate Categories Sitemap
async function generateCategoriesSitemap(supabase: SupabaseClientType, today: string): Promise<string> {
  const { data: catData } = await supabase
    .from("content_categories")
    .select("slug, name, updated_at, image_url")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const { data: secData } = await supabase
    .from("content_sections")
    .select("slug, title, created_at")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const categories = (catData || []) as Category[];
  const sections = (secData || []) as Section[];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

  // Categories
  for (const cat of categories) {
    const lastmod = cat.updated_at ? cat.updated_at.split('T')[0] : today.split('T')[0];
    xml += `
  <url>
    <loc>${SITE_URL}/category/${cat.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;
    
    if (isValidImageUrl(cat.image_url)) {
      xml += `
    <image:image>
      <image:loc>${escapeXml(cat.image_url!)}</image:loc>
      <image:title>${escapeXml(cat.name)} Logo</image:title>
    </image:image>`;
    }
    
    xml += `
  </url>`;
  }

  // Sections
  for (const section of sections) {
    const lastmod = section.created_at ? section.created_at.split('T')[0] : today.split('T')[0];
    xml += `
  <url>
    <loc>${SITE_URL}/section/${section.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }

  xml += `
</urlset>`;

  return xml;
}

// Generate Episodes Sitemap (Paginated - 1000 per page)
async function generateEpisodesSitemap(
  supabase: SupabaseClientType, 
  today: string, 
  page: number
): Promise<string> {
  const limit = 1000;
  const offset = (page - 1) * limit;

  const { data: epData } = await supabase
    .from("episodes")
    .select("id, title, air_date, episode_number, updated_at, show_id, thumbnail_url, watch_url")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const episodes = (epData || []) as Episode[];

  // Get show info for episodes
  const showIds = [...new Set(episodes.map(ep => ep.show_id))];
  const { data: showData } = await supabase
    .from("shows")
    .select("id, slug, title")
    .in("id", showIds)
    .eq("is_active", true);
  
  const shows = (showData || []) as ShowBasic[];
  const showMap = new Map(shows.map(s => [s.id, s]));

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
`;

  for (const ep of episodes) {
    const show = showMap.get(ep.show_id);
    if (!show) continue;

    const episodeSlug = ep.air_date || `episode-${ep.episode_number}`;
    const lastmod = ep.updated_at ? ep.updated_at.split('T')[0] : today.split('T')[0];
    const epUrl = `${SITE_URL}/watch/${show.slug}/${episodeSlug}`;

    xml += `
  <url>
    <loc>${epUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>`;

    // Add video sitemap extension for Google Video Search (only if we have a valid watch_url)
    const watchUrl = ep.watch_url;
    const hasValidPlayerUrl = watchUrl && (watchUrl.startsWith('http://') || watchUrl.startsWith('https://'));
    
    if (hasValidPlayerUrl) {
      const thumbUrl = isValidImageUrl(ep.thumbnail_url) ? ep.thumbnail_url : `${SITE_URL}/og-image.png`;
      // Determine player_loc: convert Google Drive view links to embed, use YouTube embeds, etc.
      const playerLoc = convertToEmbedUrl(watchUrl!);
      
      xml += `
    <video:video>
      <video:thumbnail_loc>${thumbUrl}</video:thumbnail_loc>
      <video:title>${escapeXml(show.title)} - ${escapeXml(ep.title)}</video:title>
      <video:description>Watch ${escapeXml(show.title)} ${escapeXml(ep.title)} Episode ${ep.episode_number}. Bengali TV Serial download in HD quality.</video:description>
      <video:player_loc>${escapeXml(playerLoc)}</video:player_loc>
      ${ep.air_date ? `<video:publication_date>${ep.air_date}T00:00:00+00:00</video:publication_date>` : ""}
      <video:family_friendly>yes</video:family_friendly>
      <video:requires_subscription>no</video:requires_subscription>
      <video:live>no</video:live>
    </video:video>`;
    }

    if (isValidImageUrl(ep.thumbnail_url)) {
      xml += `
    <image:image>
      <image:loc>${ep.thumbnail_url}</image:loc>
      <image:title>${escapeXml(show.title)} ${escapeXml(ep.title)}</image:title>
    </image:image>`;
    }

    xml += `
  </url>`;
  }

  xml += `
</urlset>`;

  return xml;
}

// Helper: Escape XML special characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper: Check if URL is a valid HTTP(S) URL (filter out data: URIs, etc.)
function isValidImageUrl(url: string | null): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

// Helper: Convert watch URLs to proper embed/player URLs for video sitemap
function convertToEmbedUrl(url: string): string {
  // YouTube: convert watch URLs to embed
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  
  // Google Drive: convert /view or /d/ links to preview embed
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (driveMatch) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }
  
  // Already a valid URL, return as-is
  return url;
}
