import { Download, Play, Eye, Zap } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * Transform raw WordPress post content into styled HTML
 * matching the btspro24 WordPress theme.
 *
 * Handles:
 * - Quality section markers (-HD Quality-, -Low Quality-, etc.)
 * - Download links → gradient Dbtn buttons
 * - Dbtn class links preservation
 * - Content cleanup (empty tags, centering)
 */

const downloadIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>`;

/** Detect if a link is a download link */
const isDownloadLink = (url: string, label: string): boolean => {
  const urlLower = url.toLowerCase();
  const labelLower = label.toLowerCase();
  return (
    urlLower.includes("download") ||
    urlLower.includes("cloud") ||
    urlLower.includes("xspeed") ||
    urlLower.includes("gdrive") ||
    urlLower.includes("urlpro") ||
    urlLower.includes("terabox") ||
    urlLower.includes("high") ||
    labelLower.includes("download") ||
    labelLower.includes("link") ||
    labelLower.includes("speed") ||
    labelLower.includes("quality") ||
    labelLower.includes("ডাউনলোড") ||
    labelLower.includes("লিংক")
  );
};

/** Determine download button type from URL/label */
const getButtonType = (url: string, label: string): string => {
  const urlLower = url.toLowerCase();
  const labelLower = label.toLowerCase();

  if (urlLower.includes("watch") || labelLower.includes("watch") || labelLower.includes("online"))
    return "watch";
  if (urlLower.includes("hevc") || labelLower.includes("hevc"))
    return "hevc";
  if (urlLower.includes("/sd/") || labelLower.includes("sd quality") || labelLower.includes("low"))
    return "sd";
  if (urlLower.includes("sub") || labelLower.includes("sub"))
    return "sub";
  return "hd";
};

/** Transform WordPress content to styled HTML */
export const transformPostContent = (html: string): string => {
  if (!html) return "";

  let content = html;

  // 1. Clean up empty <center> and <p> tags
  content = content.replace(/<center>\s*<\/center>/gi, "");
  content = content.replace(/<p>\s*<\/p>/gi, "");

  // 2. Transform quality section markers into styled section titles
  // Patterns: "-HD Quality-", "-Low Quality-", "-Medium Quality-", etc.
  content = content.replace(
    /(?:<p[^>]*>)?\s*-\s*((?:HD|Low|Medium|High|HEVC|SD)\s*Quality)\s*-\s*(?:<\/p>)?/gi,
    (_, quality) => {
      return `<div class="post-section-title download">${downloadIcon}<span>${quality}</span></div>`;
    }
  );

  // Also handle "ডাউনলোড লিংক" style section headers
  content = content.replace(
    /(?:<p[^>]*>)?\s*-\s*(ডাউনলোড লিং[কখ].*?)\s*-\s*(?:<\/p>)?/gi,
    (_, title) => {
      return `<div class="post-section-title download">${downloadIcon}<span>${title}</span></div>`;
    }
  );

  // 3. Transform plain download <a> tags (not already Dbtn class) into styled buttons
  content = content.replace(
    /<a\s+([^>]*?)href="([^"]+)"([^>]*?)>(.*?)<\/a>/gi,
    (match, before, url, after, inner) => {
      // Skip if it already has Dbtn class
      if (before.includes("Dbtn") || after.includes("Dbtn")) return match;
      // Skip if it's in a nav or header context
      if (before.includes("nav") || after.includes("nav")) return match;

      const label = inner.replace(/<[^>]*>/g, "").trim();
      if (!label) return match;

      // Check if it's a download link
      if (isDownloadLink(url, label)) {
        const btnType = getButtonType(url, label);
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="Dbtn ${btnType}"><span>${label}</span></a>`;
      }

      // For premium/subscription links, style differently
      if (
        url.includes("panel.") ||
        label.includes("প্রিমিয়াম") ||
        label.includes("সাবস্ক্রিপশন")
      ) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="Dbtn watch"><span>${label}</span></a>`;
      }

      return match;
    }
  );

  // 4. Wrap consecutive Dbtn links in a download-links container
  // Find sequences of Dbtn links and wrap them
  content = content.replace(
    /(<a[^>]*class="[^"]*Dbtn[^"]*"[^>]*>.*?<\/a>\s*(?:\n|\r|\s)*)+/gi,
    (match) => {
      return `<div class="episode-download-links">${match}</div>`;
    }
  );

  // 5. Remove --- separators and replace with styled separator
  content = content.replace(
    /(?:<p[^>]*>)?\s*---\s*(?:<\/p>)?/gi,
    '<div class="episode-separator"></div>'
  );

  // 6. Clean up nested <center> tags - convert to proper alignment
  content = content.replace(/<center>/gi, '<div style="text-align:center">');
  content = content.replace(/<\/center>/gi, "</div>");

  return content;
};
