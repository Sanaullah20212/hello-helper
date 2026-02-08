/**
 * Transform raw WordPress post content into structured sections
 * matching the btspro24 WordPress theme (new version).
 *
 * Returns: { poster, synopsis, screenshots, downloadSections, extraHtml }
 */

const cloudDownloadIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dl-icon"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m8 17 4 4 4-4"></path></svg>`;

const zapIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="zap-icon"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>`;

interface DownloadLink {
  url: string;
  label: string;
}

interface DownloadSection {
  title: string;
  badgeClass: string;
  links: DownloadLink[];
}

interface ParsedContent {
  poster: string | null;
  synopsis: string;
  screenshots: string[];
  downloadSections: DownloadSection[];
  extraHtml: string;
}

/** Get all images from content (skip emojis) */
function getContentImages(html: string): string[] {
  const images: string[] = [];
  const regex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const src = match[1];
    if (!src.includes("emoji") && !src.includes("s.w.org") && !src.includes("icon")) {
      images.push(src);
    }
  }
  return images;
}

/** Extract download links from HTML fragment */
function extractDownloadLinks(html: string): DownloadLink[] {
  const links: DownloadLink[] = [];
  const regex = /<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gis;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    const label = match[2].replace(/<[^>]*>/g, "").trim();
    if (!label) continue;

    const urlL = url.toLowerCase();
    const labelL = label.toLowerCase();
    if (
      urlL.includes("download") || urlL.includes("cloud") ||
      urlL.includes("xspeed") || urlL.includes("gdrive") ||
      urlL.includes("urlpro") || urlL.includes("terabox") ||
      urlL.includes("high") || urlL.includes("btspro24") ||
      labelL.includes("download") || labelL.includes("link") ||
      labelL.includes("speed") || labelL.includes("quality") ||
      labelL.includes("ডাউনলোড") || labelL.includes("লিংক")
    ) {
      links.push({ url, label });
    }
  }
  return links;
}

/** Get badge class based on section title */
function getBadgeClass(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("hd") || lower.includes("1080") || lower.includes("high")) return "badge-hd";
  if (lower.includes("medium") || lower.includes("720")) return "badge-medium";
  if (lower.includes("low") || lower.includes("480") || lower.includes("240") || lower.includes("convert")) return "badge-low";
  return "";
}

/** Group links by URL quality patterns */
function groupByUrlQuality(links: DownloadLink[]): DownloadSection[] {
  const grouped: Record<string, DownloadLink[]> = { hd: [], medium: [], low: [] };

  for (const link of links) {
    const url = link.url.toLowerCase();
    if (url.includes("/hd/") || url.includes("/hd%20") || url.includes("%2fhd")) {
      grouped.hd.push(link);
    } else if (url.includes("/medium/") || url.includes("/medium%20") || url.includes("%2fmedium")) {
      grouped.medium.push(link);
    } else if (url.includes("/low/") || url.includes("/low%20") || url.includes("%2flow")) {
      grouped.low.push(link);
    } else {
      grouped.hd.push(link);
    }
  }

  const sections: DownloadSection[] = [];
  if (grouped.hd.length) sections.push({ title: "-HD Quality-", badgeClass: "badge-hd", links: grouped.hd });
  if (grouped.medium.length) sections.push({ title: "-Medium Quality-", badgeClass: "badge-medium", links: grouped.medium });
  if (grouped.low.length) sections.push({ title: "-Low Quality-", badgeClass: "badge-low", links: grouped.low });
  return sections;
}

/** Extract quality-based sections from content */
function extractQualitySections(content: string): DownloadSection[] {
  const sections: DownloadSection[] = [];
  const markers: { title: string; start: number; end: number }[] = [];

  // Quality markers: -HD Quality-, -Low Quality-, etc.
  const qualityRegex = /<p[^>]*>\s*-?\s*((?:HD|Low|Medium|High)\s*Quality)\s*-?\s*<\/p>/gi;
  let m;
  while ((m = qualityRegex.exec(content)) !== null) {
    markers.push({
      title: `-${m[1].trim()}-`,
      start: m.index + m[0].length,
      end: m.index,
    });
  }

  // Standalone quality markers
  if (!markers.length) {
    const standaloneRegex = /-\s*((?:HD|Low|Medium|High)\s*Quality)\s*-/gi;
    while ((m = standaloneRegex.exec(content)) !== null) {
      markers.push({
        title: `-${m[1].trim()}-`,
        start: m.index + m[0].length,
        end: m.index,
      });
    }
  }

  if (!markers.length) return sections;

  markers.sort((a, b) => a.end - b.end);

  for (let i = 0; i < markers.length; i++) {
    const startPos = markers[i].start;
    const endPos = i + 1 < markers.length ? markers[i + 1].end : content.length;
    const sectionContent = content.slice(startPos, endPos);
    const sectionLinks = extractDownloadLinks(sectionContent);

    if (sectionLinks.length) {
      sections.push({
        title: markers[i].title,
        badgeClass: getBadgeClass(markers[i].title),
        links: sectionLinks,
      });
    }
  }

  return sections;
}

/** Extract synopsis (text paragraphs without download links/images) */
function extractSynopsis(content: string): string {
  let clean = content;
  // Remove quality markers
  clean = clean.replace(/<p[^>]*>\s*-?\s*(?:HD|Low|Medium|High)\s*Quality\s*-?\s*<\/p>/gi, "");
  // Remove download links
  clean = clean.replace(/<a[^>]*(?:download|cloud|xspeed|gdrive|urlpro|terabox|high|btspro24)[^>]*>.*?<\/a>/gis, "");
  // Remove images
  clean = clean.replace(/<img[^>]*>/gi, "");
  // Remove download h2 headers
  clean = clean.replace(/<h2[^>]*>.*?(?:download|link).*?<\/h2>/gis, "");

  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>(.*?)<\/p>/gis;
  let pm;
  while ((pm = pRegex.exec(clean)) !== null) {
    const text = pm[1].replace(/<[^>]*>/g, "").trim();
    if (text.length > 10 && !/^-?\s*(HD|Low|Medium|High)\s*Quality\s*-?$/i.test(text)) {
      paragraphs.push(`<p>${pm[1]}</p>`);
    }
  }

  return paragraphs.join("\n");
}

/** Main parse function */
export function parsePostContent(html: string): ParsedContent {
  if (!html) {
    return { poster: null, synopsis: "", screenshots: [], downloadSections: [], extraHtml: "" };
  }

  const images = getContentImages(html);
  const poster = images.length > 0 ? images[0] : null;
  const screenshots = images.slice(1);
  const synopsis = extractSynopsis(html);

  // Try quality sections first
  let downloadSections = extractQualitySections(html);

  // Fallback: h2-based sections
  if (!downloadSections.length) {
    const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
    const h2Matches: { title: string; index: number; length: number }[] = [];
    let h2m;
    while ((h2m = h2Regex.exec(html)) !== null) {
      const title = h2m[1].replace(/<[^>]*>/g, "").trim();
      if (title.toLowerCase().includes("download") || title.toLowerCase().includes("link")) {
        h2Matches.push({ title, index: h2m.index, length: h2m[0].length });
      }
    }

    if (h2Matches.length) {
      for (let i = 0; i < h2Matches.length; i++) {
        const start = h2Matches[i].index + h2Matches[i].length;
        const end = i + 1 < h2Matches.length ? h2Matches[i + 1].index : html.length;
        const sectionLinks = extractDownloadLinks(html.slice(start, end));
        if (sectionLinks.length) {
          downloadSections.push({
            title: h2Matches[i].title,
            badgeClass: getBadgeClass(h2Matches[i].title),
            links: sectionLinks,
          });
        }
      }
    }
  }

  // Final fallback: group all links by URL quality
  if (!downloadSections.length) {
    const allLinks = extractDownloadLinks(html);
    if (allLinks.length) {
      downloadSections = groupByUrlQuality(allLinks);
    }
  }

  return { poster, synopsis, screenshots, downloadSections, extraHtml: "" };
}

/** Render download sections as HTML string */
export function renderDownloadSections(sections: DownloadSection[]): string {
  if (!sections.length) return "";

  return sections.map((section) => {
    const linksHtml = section.links.map((link) =>
      `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="download-link">${cloudDownloadIcon}<span>${link.label}</span></a>`
    ).join("\n");

    return `<div class="download-section">
  <div class="download-header">
    <div class="download-badge ${section.badgeClass}">
      ${zapIcon}
      ${section.title}
      ${zapIcon}
    </div>
  </div>
  <div class="download-links">
    ${linksHtml}
  </div>
</div>`;
  }).join("\n");
}

/** Legacy: Transform raw content to styled HTML (backward compat) */
export const transformPostContent = (html: string): string => {
  if (!html) return "";
  const parsed = parsePostContent(html);
  return renderDownloadSections(parsed.downloadSections);
};
