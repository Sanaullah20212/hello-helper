import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Bot user agents that need pre-rendered content
const BOT_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'yandexbot',
  'duckduckbot',
  'slurp',
  'baiduspider',
  'facebookexternalhit',
  'twitterbot',
  'rogerbot',
  'linkedinbot',
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
  'pinterest',
  'slackbot',
  'vkshare',
  'w3c_validator',
  'redditbot',
  'applebot',
  'whatsapp',
  'flipboard',
  'tumblr',
  'bitlybot',
  'skypeuripreview',
  'nuzzel',
  'discordbot',
  'qwantify',
  'pinterestbot',
  'bitrix link preview',
  'xing-contenttabreceiver',
  'chrome-lighthouse',
  'telegrambot'
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "/";
    const userAgent = req.headers.get("user-agent") || "";

    // Check if it's a bot
    if (!isBot(userAgent)) {
      return new Response(JSON.stringify({ 
        isBot: false, 
        message: "Not a bot, serve SPA normally" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Bot detected: ${userAgent}`);
    console.log(`Rendering path: ${path}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get site settings
    const { data: settings } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", "main")
      .single();

    const siteTitle = settings?.site_title || "BTSPRO24";
    const siteDescription = settings?.site_description || "বাংলা মুভি, সিরিয়াল এবং টিভি শো ডাউনলোড করার জন্য সেরা ওয়েবসাইট।";
    const siteUrl = "https://www.btspro24.com";

    let title = siteTitle;
    let description = siteDescription;
    let ogImage = `${siteUrl}/og-image.png`;
    let canonicalUrl = `${siteUrl}${path}`;
    let jsonLd: Record<string, unknown> = {};
    let bodyContent = "";

    // Route-specific content
    if (path === "/" || path === "") {
      // Homepage - Zee5 style with proper sections
      title = `${siteTitle} - Download Bengali TV Serials & Movies HD`;
      description = `Watch and download Star Jalsha, Zee Bangla, Colors Bangla, Sun Bangla TV serials and movies in HD quality. ${siteDescription}`;
      
      // Get all categories
      const { data: categories } = await supabase
        .from("content_categories")
        .select("id, name, slug, image_url")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      // Get all active sections with shows
      const { data: sections } = await supabase
        .from("content_sections")
        .select("id, title, slug")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(10);

      // Get featured shows
      const { data: featuredShows } = await supabase
        .from("shows")
        .select("id, title, slug, poster_url, thumbnail_url, description")
        .eq("is_active", true)
        .eq("is_featured", true)
        .limit(20);

      // Get latest episodes
      const { data: latestEpisodes } = await supabase
        .from("episodes")
        .select("id, title, air_date, episode_number, show_id, thumbnail_url")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);

      const showIds = [...new Set(latestEpisodes?.map(ep => ep.show_id) || [])];
      const { data: episodeShows } = await supabase
        .from("shows")
        .select("id, title, slug")
        .in("id", showIds)
        .eq("is_active", true);
      const showMap = new Map(episodeShows?.map(s => [s.id, s]) || []);

      bodyContent = `
        <header>
          <h1>${siteTitle} - বাংলা টিভি সিরিয়াল ও মুভি ডাউনলোড</h1>
          <p>${description}</p>
        </header>

        <nav aria-label="Categories">
          <h2>TV Channels | টিভি চ্যানেল</h2>
          <ul class="categories" itemscope itemtype="https://schema.org/ItemList">
            ${(categories || []).map((cat: { slug: string; name: string; image_url: string | null }, i: number) => `
              <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                <a itemprop="url" href="${siteUrl}/category/${cat.slug}" title="Watch ${cat.name} Serials">
                  ${cat.image_url ? `<img src="${cat.image_url}" alt="${cat.name} Logo" title="${cat.name}" loading="lazy" />` : ""}
                  <span itemprop="name">${cat.name}</span>
                </a>
                <meta itemprop="position" content="${i + 1}" />
              </li>
            `).join("")}
          </ul>
        </nav>

        <section aria-label="Latest Episodes">
          <h2>Latest Episodes | সর্বশেষ এপিসোড</h2>
          <div class="episodes" itemscope itemtype="https://schema.org/ItemList">
            ${(latestEpisodes || []).map((ep, i) => {
              const show = showMap.get(ep.show_id);
              if (!show) return "";
              const epSlug = ep.air_date || `episode-${ep.episode_number}`;
              return `
                <article itemprop="itemListElement" itemscope itemtype="https://schema.org/TVEpisode">
                  <a href="${siteUrl}/watch/${show.slug}/${epSlug}" title="Watch ${show.title} ${ep.title}">
                    <figure>
                      ${ep.thumbnail_url ? `<img itemprop="image" src="${ep.thumbnail_url}" alt="${show.title} ${ep.title}" title="${show.title} Episode ${ep.episode_number}" loading="lazy" />` : ""}
                    </figure>
                    <h3 itemprop="name">${show.title} - ${ep.title}</h3>
                    ${ep.air_date ? `<time itemprop="datePublished" datetime="${ep.air_date}">${ep.air_date}</time>` : ""}
                  </a>
                  <meta itemprop="position" content="${i + 1}" />
                </article>
              `;
            }).join("")}
          </div>
        </section>

        <section aria-label="Featured Shows">
          <h2>Featured Shows | জনপ্রিয় সিরিয়াল</h2>
          <div class="shows" itemscope itemtype="https://schema.org/ItemList">
            ${(featuredShows || []).map((show: { slug: string; title: string; poster_url: string | null; description: string | null }, i: number) => `
              <article itemprop="itemListElement" itemscope itemtype="https://schema.org/TVSeries">
                <a href="${siteUrl}/show/${show.slug}" title="Watch ${show.title} All Episodes">
                  <figure class="poster">
                    ${show.poster_url ? `<img itemprop="image" src="${show.poster_url}" alt="${show.title} TV Serial" title="${show.title} Poster" loading="lazy" />` : ""}
                  </figure>
                  <h3 itemprop="name">${show.title}</h3>
                  ${show.description ? `<p itemprop="description">${show.description.substring(0, 100)}...</p>` : ""}
                </a>
                <meta itemprop="position" content="${i + 1}" />
              </article>
            `).join("")}
          </div>
        </section>

        ${(sections || []).map((section: { slug: string; title: string }) => `
          <section aria-label="${section.title}">
            <h2><a href="${siteUrl}/section/${section.slug}" title="View All ${section.title}">${section.title}</a></h2>
          </section>
        `).join("")}
      `;

      jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": `${siteUrl}/#website`,
            "name": siteTitle,
            "url": siteUrl,
            "description": description,
            "inLanguage": ["bn", "en"],
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${siteUrl}/search?q={search_term_string}`
              },
              "query-input": "required name=search_term_string"
            }
          },
          {
            "@type": "Organization",
            "@id": `${siteUrl}/#organization`,
            "name": siteTitle,
            "url": siteUrl,
            "logo": {
              "@type": "ImageObject",
              "url": `${siteUrl}/logo.png`
            },
            "sameAs": []
          },
          {
            "@type": "WebPage",
            "@id": `${siteUrl}/#webpage`,
            "url": siteUrl,
            "name": title,
            "description": description,
            "isPartOf": { "@id": `${siteUrl}/#website` },
            "about": { "@id": `${siteUrl}/#organization` },
            "primaryImageOfPage": { "@type": "ImageObject", "url": ogImage }
          },
          {
            "@type": "ItemList",
            "name": "Featured Bengali TV Shows",
            "numberOfItems": featuredShows?.length || 0,
            "itemListElement": (featuredShows || []).slice(0, 10).map((show: { slug: string; title: string; poster_url: string | null }, i: number) => ({
              "@type": "ListItem",
              "position": i + 1,
              "item": {
                "@type": "TVSeries",
                "name": show.title,
                "url": `${siteUrl}/show/${show.slug}`,
                "image": show.poster_url
              }
            }))
          }
        ]
      };

    } else if (path.startsWith("/show/")) {
      // Show page
      const showSlug = path.replace("/show/", "");
      
      const { data: show } = await supabase
        .from("shows")
        .select("*")
        .eq("slug", showSlug)
        .eq("is_active", true)
        .single();

      if (show) {
        // Get category name
        let categoryName = "";
        if (show.category_id) {
          const { data: category } = await supabase
            .from("content_categories")
            .select("name, slug")
            .eq("id", show.category_id)
            .single();
          categoryName = category?.name || "";
        }

        title = `${show.title} TV Serial Online - Watch Latest Show Episodes & Download HD | ${siteTitle}`;
        description = `Watch ${show.title} Latest Episodes Online in full HD on ${siteTitle}. Enjoy ${show.title} best trending moments, video clips, promos & more. ${show.description ? show.description.substring(0, 120) : `Download ${show.title} all episodes free. ${categoryName} serial.`}`;
        ogImage = show.poster_url || show.thumbnail_url || ogImage;

        // Get episodes
        const { data: episodes } = await supabase
          .from("episodes")
          .select("id, title, episode_number, air_date, thumbnail_url")
          .eq("show_id", show.id)
          .eq("is_active", true)
          .order("episode_number", { ascending: false })
          .limit(100);

        const episodeList = (episodes || []).map((ep: { air_date: string; episode_number: number; title: string }) => ({
          "@type": "TVEpisode",
          "episodeNumber": ep.episode_number,
          "name": ep.title,
          "datePublished": ep.air_date,
          "url": `${siteUrl}/watch/${showSlug}/${ep.air_date || `episode-${ep.episode_number}`}`
        }));

        bodyContent = `
          <nav aria-label="Breadcrumb">
            <ol itemscope itemtype="https://schema.org/BreadcrumbList">
              <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                <a itemprop="item" href="${siteUrl}"><span itemprop="name">Home</span></a>
                <meta itemprop="position" content="1" />
              </li>
              ${categoryName ? `
              <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                <a itemprop="item" href="${siteUrl}/category/${show.category_id}"><span itemprop="name">${categoryName}</span></a>
                <meta itemprop="position" content="2" />
              </li>` : ""}
              <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                <span itemprop="name">${show.title}</span>
                <meta itemprop="position" content="${categoryName ? 3 : 2}" />
              </li>
            </ol>
          </nav>
          <article itemscope itemtype="https://schema.org/TVSeries">
            <h1 itemprop="name">${show.title}</h1>
            ${show.poster_url ? `<img itemprop="image" src="${show.poster_url}" alt="${show.title} poster" />` : ""}
            <p itemprop="description">${show.description || ""}</p>
            ${categoryName ? `<p>Category: <span itemprop="genre">${categoryName}</span></p>` : ""}
            <section>
              <h2>Episodes (${episodes?.length || 0} total)</h2>
              <ul>
                ${(episodes || []).map((ep: { air_date: string; episode_number: number; title: string }) => `
                  <li itemscope itemtype="https://schema.org/TVEpisode">
                    <a itemprop="url" href="${siteUrl}/watch/${showSlug}/${ep.air_date || `episode-${ep.episode_number}`}">
                      <span itemprop="episodeNumber">${ep.episode_number}</span>: 
                      <span itemprop="name">${ep.title}</span>
                      ${ep.air_date ? `<time itemprop="datePublished" datetime="${ep.air_date}">${ep.air_date}</time>` : ""}
                    </a>
                  </li>
                `).join("")}
              </ul>
            </section>
          </article>
        `;

        jsonLd = {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "TVSeries",
              "@id": `${canonicalUrl}#tvseries`,
              "name": show.title,
              "description": show.description,
              "image": ogImage,
              "url": canonicalUrl,
              "genre": categoryName || undefined,
              "numberOfEpisodes": episodes?.length || 0,
              "containsSeason": {
                "@type": "TVSeason",
                "seasonNumber": 1,
                "numberOfEpisodes": episodes?.length || 0,
                "episode": episodeList.slice(0, 20)
              }
            },
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
                ...(categoryName ? [{ "@type": "ListItem", "position": 2, "name": categoryName, "item": `${siteUrl}/category/${show.category_id}` }] : []),
                { "@type": "ListItem", "position": categoryName ? 3 : 2, "name": show.title, "item": canonicalUrl }
              ]
            }
          ]
        };
      }

    } else if (path.startsWith("/watch/")) {
      // Watch/Episode page
      const pathParts = path.replace("/watch/", "").split("/");
      const showSlug = pathParts[0];
      const episodeSlug = pathParts[1];

      const { data: show } = await supabase
        .from("shows")
        .select("*")
        .eq("slug", showSlug)
        .eq("is_active", true)
        .single();

      if (show) {
        // Find episode by air_date or episode number
        let episodeQuery = supabase
          .from("episodes")
          .select("*")
          .eq("show_id", show.id)
          .eq("is_active", true);

        if (episodeSlug.match(/^\d{4}-\d{2}-\d{2}$/)) {
          episodeQuery = episodeQuery.eq("air_date", episodeSlug);
        } else if (episodeSlug.startsWith("episode-")) {
          const epNum = parseInt(episodeSlug.replace("episode-", ""), 10);
          episodeQuery = episodeQuery.eq("episode_number", epNum);
        }

        const { data: episode } = await episodeQuery.single();

        if (episode) {
          title = `${show.title} ${episode.title} - Watch & Download HD Episode Online | ${siteTitle}`;
          description = `Watch ${show.title} ${episode.title} full episode online in HD quality. Episode ${episode.episode_number}${episode.air_date ? ` aired on ${episode.air_date}` : ""}. Free Bengali TV serial download on ${siteTitle}.`;
          ogImage = episode.thumbnail_url || show.poster_url || show.thumbnail_url || ogImage;

          // Get adjacent episodes for navigation
          const { data: prevEpisode } = await supabase
            .from("episodes")
            .select("title, episode_number, air_date")
            .eq("show_id", show.id)
            .eq("is_active", true)
            .lt("episode_number", episode.episode_number)
            .order("episode_number", { ascending: false })
            .limit(1)
            .single();

          const { data: nextEpisode } = await supabase
            .from("episodes")
            .select("title, episode_number, air_date")
            .eq("show_id", show.id)
            .eq("is_active", true)
            .gt("episode_number", episode.episode_number)
            .order("episode_number", { ascending: true })
            .limit(1)
            .single();

          bodyContent = `
            <nav aria-label="Breadcrumb">
              <ol itemscope itemtype="https://schema.org/BreadcrumbList">
                <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                  <a itemprop="item" href="${siteUrl}"><span itemprop="name">Home</span></a>
                  <meta itemprop="position" content="1" />
                </li>
                <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                  <a itemprop="item" href="${siteUrl}/show/${showSlug}"><span itemprop="name">${show.title}</span></a>
                  <meta itemprop="position" content="2" />
                </li>
                <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                  <span itemprop="name">${episode.title}</span>
                  <meta itemprop="position" content="3" />
                </li>
              </ol>
            </nav>
            <article itemscope itemtype="https://schema.org/TVEpisode">
              <h1 itemprop="name">${show.title} - ${episode.title}</h1>
              <figure>
                ${episode.thumbnail_url ? `<img itemprop="image" src="${episode.thumbnail_url}" alt="${show.title} ${episode.title}" title="Watch ${show.title} Episode ${episode.episode_number}" />` : ""}
              </figure>
              <div class="meta">
                <p>Show: <a itemprop="partOfSeries" itemscope itemtype="https://schema.org/TVSeries" href="${siteUrl}/show/${showSlug}">
                  <span itemprop="name">${show.title}</span>
                </a></p>
                <p>Episode: <span itemprop="episodeNumber">${episode.episode_number}</span></p>
                ${episode.air_date ? `<p>Air Date: <time itemprop="datePublished" datetime="${episode.air_date}">${episode.air_date}</time></p>` : ""}
              </div>
              <nav class="episode-nav">
                ${prevEpisode ? `<a href="${siteUrl}/watch/${showSlug}/${prevEpisode.air_date || `episode-${prevEpisode.episode_number}`}" rel="prev" title="Previous Episode">← ${prevEpisode.title}</a>` : ""}
                ${nextEpisode ? `<a href="${siteUrl}/watch/${showSlug}/${nextEpisode.air_date || `episode-${nextEpisode.episode_number}`}" rel="next" title="Next Episode">${nextEpisode.title} →</a>` : ""}
              </nav>
              <section class="download">
                <h2>Download ${show.title} ${episode.title}</h2>
                <p>Download this episode in HD 480p, 720p, 1080p quality.</p>
              </section>
            </article>
          `;

          // VideoObject schema for Google Video Search
          jsonLd = {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "VideoObject",
                "@id": `${canonicalUrl}#video`,
                "name": `${show.title} ${episode.title}`,
                "description": description,
                "thumbnailUrl": ogImage,
                "uploadDate": episode.created_at || episode.air_date,
                "duration": "PT22M", // Approximate TV episode duration
                "contentUrl": canonicalUrl,
                "embedUrl": canonicalUrl,
                "publisher": {
                  "@type": "Organization",
                  "name": siteTitle,
                  "logo": {
                    "@type": "ImageObject",
                    "url": `${siteUrl}/logo.png`
                  }
                },
                "partOfSeries": {
                  "@type": "TVSeries",
                  "name": show.title,
                  "url": `${siteUrl}/show/${showSlug}`
                }
              },
              {
                "@type": "TVEpisode",
                "@id": `${canonicalUrl}#episode`,
                "name": episode.title,
                "episodeNumber": episode.episode_number,
                "datePublished": episode.air_date,
                "image": ogImage,
                "url": canonicalUrl,
                "video": { "@id": `${canonicalUrl}#video` },
                "partOfSeries": {
                  "@type": "TVSeries",
                  "name": show.title,
                  "url": `${siteUrl}/show/${showSlug}`
                }
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
                  { "@type": "ListItem", "position": 2, "name": show.title, "item": `${siteUrl}/show/${showSlug}` },
                  { "@type": "ListItem", "position": 3, "name": episode.title, "item": canonicalUrl }
                ]
              }
            ]
          };
        }
      }

    } else if (path.startsWith("/category/")) {
      // Category page
      const categorySlug = path.replace("/category/", "").replace("section/", "");
      const isSection = path.includes("/section/");

      if (isSection) {
        const { data: section } = await supabase
          .from("content_sections")
          .select("*")
          .eq("slug", categorySlug)
          .eq("is_active", true)
          .single();

        if (section) {
          title = `${section.title} - ${siteTitle}`;
          description = `Browse ${section.title} shows and serials on ${siteTitle}.`;
          
          // Get shows in section
          const { data: sectionShows } = await supabase
            .from("section_shows")
            .select("show_id")
            .eq("section_id", section.id);

          const showIds = sectionShows?.map((s: { show_id: string }) => s.show_id) || [];
          
          const { data: shows } = await supabase
            .from("shows")
            .select("id, title, slug, poster_url")
            .in("id", showIds)
            .eq("is_active", true);

          bodyContent = `
            <nav aria-label="Breadcrumb">
              <ol itemscope itemtype="https://schema.org/BreadcrumbList">
                <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                  <a itemprop="item" href="${siteUrl}"><span itemprop="name">Home</span></a>
                  <meta itemprop="position" content="1" />
                </li>
                <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                  <span itemprop="name">${section.title}</span>
                  <meta itemprop="position" content="2" />
                </li>
              </ol>
            </nav>
            <h1>${section.title}</h1>
            <ul itemscope itemtype="https://schema.org/ItemList">
              ${(shows || []).map((s: { slug: string; title: string; poster_url: string | null }, i: number) => `
                <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                  <a itemprop="url" href="${siteUrl}/show/${s.slug}">
                    <span itemprop="name">${s.title}</span>
                  </a>
                  <meta itemprop="position" content="${i + 1}" />
                </li>
              `).join("")}
            </ul>
          `;

          jsonLd = {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "CollectionPage",
                "name": section.title,
                "url": canonicalUrl,
                "mainEntity": {
                  "@type": "ItemList",
                  "numberOfItems": shows?.length || 0,
                  "itemListElement": (shows || []).map((s: { slug: string; title: string }, i: number) => ({
                    "@type": "ListItem",
                    "position": i + 1,
                    "url": `${siteUrl}/show/${s.slug}`,
                    "name": s.title
                  }))
                }
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
                  { "@type": "ListItem", "position": 2, "name": section.title, "item": canonicalUrl }
                ]
              }
            ]
          };
        }
      } else {
        const { data: category } = await supabase
          .from("content_categories")
          .select("*")
          .eq("slug", categorySlug)
          .eq("is_active", true)
          .single();

        if (category) {
          title = `${category.name} - ${siteTitle}`;
          description = category.description || `Browse ${category.name} shows and serials on ${siteTitle}.`;
          ogImage = category.image_url || ogImage;

          const { data: shows } = await supabase
            .from("shows")
            .select("id, title, slug, poster_url")
            .eq("category_id", category.id)
            .eq("is_active", true);

          bodyContent = `
            <nav aria-label="Breadcrumb">
              <ol itemscope itemtype="https://schema.org/BreadcrumbList">
                <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                  <a itemprop="item" href="${siteUrl}"><span itemprop="name">Home</span></a>
                  <meta itemprop="position" content="1" />
                </li>
                <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                  <span itemprop="name">${category.name}</span>
                  <meta itemprop="position" content="2" />
                </li>
              </ol>
            </nav>
            <article>
              <h1>${category.name}</h1>
              ${category.image_url ? `<img src="${category.image_url}" alt="${category.name}" />` : ""}
              <p>${category.description || ""}</p>
              <ul itemscope itemtype="https://schema.org/ItemList">
                ${(shows || []).map((s: { slug: string; title: string }, i: number) => `
                  <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                    <a itemprop="url" href="${siteUrl}/show/${s.slug}">
                      <span itemprop="name">${s.title}</span>
                    </a>
                    <meta itemprop="position" content="${i + 1}" />
                  </li>
                `).join("")}
              </ul>
            </article>
          `;

          jsonLd = {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "CollectionPage",
                "name": category.name,
                "description": category.description,
                "image": category.image_url,
                "url": canonicalUrl,
                "mainEntity": {
                  "@type": "ItemList",
                  "numberOfItems": shows?.length || 0,
                  "itemListElement": (shows || []).map((s: { slug: string; title: string }, i: number) => ({
                    "@type": "ListItem",
                    "position": i + 1,
                    "url": `${siteUrl}/show/${s.slug}`,
                    "name": s.title
                  }))
                }
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
                  { "@type": "ListItem", "position": 2, "name": category.name, "item": canonicalUrl }
                ]
              }
            ]
          };
        }
      }
    } else if (path === "/free-episodes") {
      // Free episodes page
      title = `Free Episodes | ফ্রি এপিসোড - ${siteTitle}`;
      description = `Watch free Bengali TV serial episodes online. Download Star Jalsha, Zee Bangla, Colors Bangla serials for free.`;

      const { data: freeEpisodes } = await supabase
        .from("episodes")
        .select("id, title, episode_number, air_date, show_id")
        .eq("is_free", true)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(50);

      const showIds = [...new Set(freeEpisodes?.map(ep => ep.show_id) || [])];
      const { data: episodeShows } = await supabase
        .from("shows")
        .select("id, title, slug")
        .in("id", showIds)
        .eq("is_active", true);
      
      const showMap = new Map(episodeShows?.map(s => [s.id, s]) || []);

      bodyContent = `
        <nav aria-label="Breadcrumb">
          <ol itemscope itemtype="https://schema.org/BreadcrumbList">
            <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
              <a itemprop="item" href="${siteUrl}"><span itemprop="name">Home</span></a>
              <meta itemprop="position" content="1" />
            </li>
            <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
              <span itemprop="name">Free Episodes</span>
              <meta itemprop="position" content="2" />
            </li>
          </ol>
        </nav>
        <h1>Free Episodes | ফ্রি এপিসোড</h1>
        <ul itemscope itemtype="https://schema.org/ItemList">
          ${(freeEpisodes || []).map((ep, i) => {
            const show = showMap.get(ep.show_id);
            if (!show) return "";
            return `
              <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                <a itemprop="url" href="${siteUrl}/watch/${show.slug}/${ep.air_date || `episode-${ep.episode_number}`}">
                  <span itemprop="name">${show.title} - ${ep.title}</span>
                </a>
                <meta itemprop="position" content="${i + 1}" />
              </li>
            `;
          }).join("")}
        </ul>
      `;

      jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "CollectionPage",
            "name": "Free Episodes",
            "description": description,
            "url": canonicalUrl
          },
          {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
              { "@type": "ListItem", "position": 2, "name": "Free Episodes", "item": canonicalUrl }
            ]
          }
        ]
      };

    } else {
      // Post page (catch-all for /:slug)
      const postSlug = path.replace(/^\//, "");
      
      if (postSlug && !postSlug.includes("/")) {
        const { data: post } = await supabase
          .from("posts")
          .select("*")
          .eq("slug", postSlug)
          .eq("status", "published")
          .single();

        if (post) {
          // Get category name
          let categoryName = "";
          if (post.category_id) {
            const { data: category } = await supabase
              .from("content_categories")
              .select("name, slug")
              .eq("id", post.category_id)
              .single();
            categoryName = category?.name || "";
          }

          title = post.meta_title || `${post.title} - ${siteTitle}`;
          description = post.meta_description || post.excerpt || `${post.title} - Download and watch on ${siteTitle}`;
          // Extract image: featured_image_url or first <img> from content
          const postImageMatch = (post.content || "").match(/<img[^>]+src=["']([^"']+)["']/i);
          const extractedPostImage = postImageMatch ? postImageMatch[1] : null;
          ogImage = post.featured_image_url || extractedPostImage || ogImage;

          const formattedDate = post.created_at ? new Date(post.created_at).toISOString() : "";
          const updatedDate = post.updated_at ? new Date(post.updated_at).toISOString() : "";

          // Extract text from content for body (strip HTML for clean text)
          const contentText = (post.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().substring(0, 500);

          bodyContent = `
            <nav aria-label="Breadcrumb">
              <ol itemscope itemtype="https://schema.org/BreadcrumbList">
                <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                  <a itemprop="item" href="${siteUrl}"><span itemprop="name">Home</span></a>
                  <meta itemprop="position" content="1" />
                </li>
                ${categoryName ? `
                <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                  <span itemprop="name">${categoryName}</span>
                  <meta itemprop="position" content="2" />
                </li>` : ""}
                <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                  <span itemprop="name">${post.title}</span>
                  <meta itemprop="position" content="${categoryName ? 3 : 2}" />
                </li>
              </ol>
            </nav>
            <article itemscope itemtype="https://schema.org/Article">
              <h1 itemprop="headline">${post.title}</h1>
              ${post.featured_image_url ? `<img itemprop="image" src="${post.featured_image_url}" alt="${post.title}" />` : ""}
              ${post.excerpt ? `<p itemprop="description">${post.excerpt}</p>` : ""}
              <div itemprop="articleBody">
                <p>${contentText}...</p>
              </div>
              <div class="meta">
                ${formattedDate ? `<time itemprop="datePublished" datetime="${formattedDate}">${new Date(post.created_at).toLocaleDateString("en-US")}</time>` : ""}
                ${updatedDate ? `<time itemprop="dateModified" datetime="${updatedDate}"></time>` : ""}
                <span itemprop="author" itemscope itemtype="https://schema.org/Organization">
                  <meta itemprop="name" content="${siteTitle}" />
                </span>
              </div>
              ${post.tags && post.tags.length > 0 ? `
              <div class="tags">
                ${post.tags.map((tag: string) => `<span>${tag}</span>`).join("")}
              </div>` : ""}
            </article>
          `;

          jsonLd = {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Article",
                "@id": `${canonicalUrl}#article`,
                "headline": post.title,
                "description": post.meta_description || post.excerpt || "",
                "image": ogImage || undefined,
                "datePublished": formattedDate,
                "dateModified": updatedDate || formattedDate,
                "author": {
                  "@type": "Organization",
                  "name": siteTitle,
                  "url": siteUrl
                },
                "publisher": {
                  "@type": "Organization",
                  "name": siteTitle,
                  "logo": {
                    "@type": "ImageObject",
                    "url": `${siteUrl}/logo.png`
                  }
                },
                "mainEntityOfPage": {
                  "@type": "WebPage",
                  "@id": canonicalUrl
                },
                "keywords": post.tags ? post.tags.join(", ") : undefined
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
                  ...(categoryName ? [{ "@type": "ListItem", "position": 2, "name": categoryName }] : []),
                  { "@type": "ListItem", "position": categoryName ? 3 : 2, "name": post.title, "item": canonicalUrl }
                ]
              }
            ]
          };
        }
      }
    }

    // Generate pre-rendered HTML
    const html = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">
  
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${siteTitle}">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${ogImage}">
  
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <main>
    ${bodyContent}
  </main>
  <footer>
    <p>&copy; ${new Date().getFullYear()} ${siteTitle}. All Rights Reserved.</p>
  </footer>
</body>
</html>`;

    return new Response(html, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600"
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("SSR Error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
