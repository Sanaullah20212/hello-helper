<?php
/**
 * BTSPRO24 Theme Functions
 */

// Theme Setup
function btspro24_setup() {
    // Add title tag support
    add_theme_support('title-tag');
    
    // Add featured image support
    add_theme_support('post-thumbnails');
    
    // Custom image sizes
    add_image_size('movie-card', 400, 600, true);
    add_image_size('movie-poster', 600, 900, true);
    
    // Register navigation menus
    register_nav_menus(array(
        'primary' => __('Primary Menu', 'btspro24'),
    ));
    
    // HTML5 support
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
    ));
}
add_action('after_setup_theme', 'btspro24_setup');

// Enqueue styles and scripts
function btspro24_scripts() {
    // Google Fonts
    wp_enqueue_style(
        'btspro24-fonts',
        'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap',
        array(),
        null
    );
    
    // Main stylesheet with cache busting
    wp_enqueue_style('btspro24-style', get_stylesheet_uri(), array(), filemtime(get_stylesheet_directory() . '/style.css'));
}
add_action('wp_enqueue_scripts', 'btspro24_scripts');

// Custom excerpt length
function btspro24_excerpt_length($length) {
    return 20;
}
add_filter('excerpt_length', 'btspro24_excerpt_length');

// Remove excerpt [...] and add nothing
function btspro24_excerpt_more($more) {
    return '...';
}
add_filter('excerpt_more', 'btspro24_excerpt_more');

// Get first image from post content
function btspro24_get_first_image($content) {
    preg_match('/<img[^>]+src="([^"]+)"[^>]*>/i', $content, $matches);
    if (isset($matches[1])) {
        $src = $matches[1];
        // Skip emojis and icons
        if (strpos($src, 'emoji') === false && strpos($src, 's.w.org') === false) {
            return $src;
        }
    }
    return false;
}

// Get poster image (first image or featured)
function btspro24_get_poster($post_id = null) {
    if (!$post_id) {
        $post_id = get_the_ID();
    }
    
    // Try featured image first
    if (has_post_thumbnail($post_id)) {
        return get_the_post_thumbnail_url($post_id, 'movie-poster');
    }
    
    // Try first image in content
    $post = get_post($post_id);
    $first_image = btspro24_get_first_image($post->post_content);
    if ($first_image) {
        return $first_image;
    }
    
    // Default placeholder
    return 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop';
}

// Get all images from post content
function btspro24_get_content_images($content) {
    preg_match_all('/<img[^>]+src="([^"]+)"[^>]*>/i', $content, $matches);
    $images = array();
    
    if (isset($matches[1])) {
        foreach ($matches[1] as $src) {
            // Skip emojis, icons, and tiny images
            if (strpos($src, 'emoji') === false && strpos($src, 's.w.org') === false && strpos($src, 'icon') === false) {
                $images[] = $src;
            }
        }
    }
    
    return $images;
}

// Extract download links from content
function btspro24_get_download_links($content) {
    preg_match_all('/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/is', $content, $matches, PREG_SET_ORDER);
    $links = array();
    
    foreach ($matches as $match) {
        $url = $match[1];
        $inner_html = $match[2];
        $label = trim(strip_tags($inner_html));
        
        if (empty($label)) continue;
        
        if (strpos($url, 'download') !== false || 
            strpos($url, 'cloud') !== false || 
            strpos($url, 'xspeed') !== false || 
            strpos($url, 'gdrive') !== false ||
            strpos($url, 'urlpro') !== false ||
            strpos($url, 'terabox') !== false ||
            strpos($url, 'high') !== false ||
            stripos($label, 'download') !== false || 
            stripos($label, 'link') !== false ||
            stripos($label, 'speed') !== false ||
            stripos($label, 'quality') !== false) {
            $links[] = array(
                'url' => $url,
                'label' => $label
            );
        }
    }
    
    return $links;
}

// Extract quality sections like "-HD Quality-" or "-Low Quality-"
function btspro24_get_quality_sections($content) {
    $sections = array();
    $markers = array();
    
    // Pattern 1: Quality markers in <p> tags
    preg_match_all('/<p[^>]*>\s*-?\s*((?:HD|Low|Medium|High)\s*Quality)\s*-?\s*<\/p>/i', $content, $p_matches, PREG_OFFSET_CAPTURE);
    
    if (!empty($p_matches[0])) {
        foreach ($p_matches[0] as $index => $match) {
            $title = trim($p_matches[1][$index][0]);
            $markers[] = array(
                'title' => '-' . $title . '-',
                'start' => $match[1] + strlen($match[0]),
                'end' => $match[1]
            );
        }
    }
    
    // Pattern 2: Standalone quality markers (not in tags)
    if (empty($markers)) {
        preg_match_all('/-\s*((?:HD|Low|Medium|High)\s*Quality)\s*-/i', $content, $standalone_matches, PREG_OFFSET_CAPTURE);
        
        if (!empty($standalone_matches[0])) {
            foreach ($standalone_matches[0] as $index => $match) {
                $title = trim($standalone_matches[1][$index][0]);
                $markers[] = array(
                    'title' => '-' . $title . '-',
                    'start' => $match[1] + strlen($match[0]),
                    'end' => $match[1]
                );
            }
        }
    }
    
    if (empty($markers)) {
        return $sections;
    }
    
    // Sort by position
    usort($markers, function($a, $b) {
        return $a['end'] - $b['end'];
    });
    
    foreach ($markers as $idx => $marker) {
        $start_pos = $marker['start'];
        $end_pos = isset($markers[$idx + 1]) ? $markers[$idx + 1]['end'] : strlen($content);
        
        $section_content = substr($content, $start_pos, $end_pos - $start_pos);
        $section_links = btspro24_get_download_links($section_content);
        
        if (!empty($section_links)) {
            $sections[] = array(
                'title' => $marker['title'],
                'links' => $section_links
            );
        }
    }
    
    return $sections;
}

// Group links by quality detected from URL patterns (HD, Medium, Low folders)
function btspro24_group_links_by_url_quality($links) {
    $grouped = array(
        'hd' => array(),
        'medium' => array(),
        'low' => array()
    );
    
    foreach ($links as $link) {
        $url = strtolower($link['url']);
        if (strpos($url, '/hd/') !== false || strpos($url, '/hd%20') !== false || strpos($url, '%2fhd') !== false) {
            $grouped['hd'][] = $link;
        } elseif (strpos($url, '/medium/') !== false || strpos($url, '/medium%20') !== false || strpos($url, '%2fmedium') !== false) {
            $grouped['medium'][] = $link;
        } elseif (strpos($url, '/low/') !== false || strpos($url, '/low%20') !== false || strpos($url, '%2flow') !== false) {
            $grouped['low'][] = $link;
        } else {
            // Links without quality marker go to HD by default
            $grouped['hd'][] = $link;
        }
    }
    
    $sections = array();
    if (!empty($grouped['hd'])) {
        $sections[] = array('title' => '-HD Quality-', 'links' => $grouped['hd']);
    }
    if (!empty($grouped['medium'])) {
        $sections[] = array('title' => '-Medium Quality-', 'links' => $grouped['medium']);
    }
    if (!empty($grouped['low'])) {
        $sections[] = array('title' => '-Low Quality-', 'links' => $grouped['low']);
    }
    
    return $sections;
}

// Extract download sections using post-section-title class or --- separator
function btspro24_get_download_sections($content) {
    $sections = array();
    
    // Pattern 1: Look for <div class="post-section-title download">Title</div> structure
    preg_match_all('/<div[^>]*class="[^"]*post-section-title[^"]*"[^>]*>(.*?)<\/div>/is', $content, $title_matches, PREG_OFFSET_CAPTURE);
    
    if (!empty($title_matches[0])) {
        foreach ($title_matches[0] as $index => $match) {
            $title = trim(strip_tags($title_matches[1][$index][0]));
            $start_pos = $match[1] + strlen($match[0]);
            
            // Find end position (next section title or --- separator or end of content)
            $end_pos = strlen($content);
            if (isset($title_matches[0][$index + 1])) {
                $end_pos = $title_matches[0][$index + 1][1];
            }
            
            // Also check for --- separator
            $separator_pos = strpos($content, '---', $start_pos);
            if ($separator_pos !== false && $separator_pos < $end_pos) {
                $end_pos = $separator_pos;
            }
            
            $section_content = substr($content, $start_pos, $end_pos - $start_pos);
            $section_links = btspro24_extract_dbtn_links($section_content);
            
            if (!empty($section_links)) {
                $sections[] = array(
                    'title' => $title,
                    'links' => $section_links
                );
            }
        }
        
        if (!empty($sections)) {
            return $sections;
        }
    }
    
    // Pattern 2: Split by --- separator and look for any structure
    $parts = preg_split('/\s*---\s*/', $content);
    if (count($parts) > 1) {
        foreach ($parts as $part) {
            // Try to find a title in this part
            $title = '';
            
            // Look for post-section-title
            if (preg_match('/<div[^>]*class="[^"]*post-section-title[^"]*"[^>]*>(.*?)<\/div>/is', $part, $title_match)) {
                $title = trim(strip_tags($title_match[1]));
            }
            
            if (empty($title)) continue;
            
            $section_links = btspro24_extract_dbtn_links($part);
            if (!empty($section_links)) {
                $sections[] = array(
                    'title' => $title,
                    'links' => $section_links
                );
            }
        }
        
        if (!empty($sections)) {
            return $sections;
        }
    }
    
    // Fallback: Get all Dbtn links without sections
    $all_links = btspro24_extract_dbtn_links($content);
    if (empty($all_links)) {
        $all_links = btspro24_get_download_links($content);
    }
    
    return $sections;
}

// Extract Dbtn links with their classes
function btspro24_extract_dbtn_links($content) {
    $links = array();
    
    // Match <a> tags with Dbtn class
    preg_match_all('/<a[^>]*class="([^"]*Dbtn[^"]*)"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/is', $content, $matches, PREG_SET_ORDER);
    
    foreach ($matches as $match) {
        $classes = $match[1];
        $url = $match[2];
        $inner = trim(strip_tags($match[3]));
        
        // Determine button type from class
        $btn_type = 'hd'; // default
        if (strpos($classes, 'watch') !== false) {
            $btn_type = 'watch';
        } elseif (strpos($classes, 'hevc') !== false) {
            $btn_type = 'hevc';
        } elseif (strpos($classes, 'sd') !== false) {
            $btn_type = 'sd';
        } elseif (strpos($classes, 'sub') !== false) {
            $btn_type = 'sub';
        }
        
        $links[] = array(
            'url' => $url,
            'label' => $inner,
            'type' => $btn_type
        );
    }
    
    return $links;
}

// SVG Icons
function btspro24_icon($name, $class = '') {
    $icons = array(
        'search' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>',
        'menu' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>',
        'home' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
        'film' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M7 3v18"></path><path d="M3 7.5h4"></path><path d="M3 12h18"></path><path d="M3 16.5h4"></path><path d="M17 3v18"></path><path d="M17 7.5h4"></path><path d="M17 16.5h4"></path></svg>',
        'tv' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>',
        'play' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>',
        'calendar' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>',
        'clock' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
        'folder' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path></svg>',
        'user' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
        'download' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>',
        'cloud-download' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m8 17 4 4 4-4"></path></svg>',
        'zap' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>',
        'arrow-left' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>',
        'chevron-left' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><path d="m15 18-6-6 6-6"></path></svg>',
        'chevron-right' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><path d="m9 18 6-6-6-6"></path></svg>',
        'external-link' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>',
        'heart' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>',
        'sparkles' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>',
        'crown' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path><path d="M5 21h14"></path></svg>',
        'alert-circle' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>',
        'arrow-right' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>',
        'image' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>',
        'file-text' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . esc_attr($class) . '"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>',
    );
    
    return isset($icons[$name]) ? $icons[$name] : '';
}

// Extract synopsis/description from post content
function btspro24_get_synopsis($content) {
    // Remove download links and quality markers
    $clean_content = $content;
    
    // Remove quality markers
    $clean_content = preg_replace('/<p[^>]*>\s*-?\s*(?:HD|Low|Medium|High)\s*Quality\s*-?\s*<\/p>/i', '', $clean_content);
    
    // Remove download links
    $clean_content = preg_replace('/<a[^>]*(?:download|cloud|xspeed|gdrive|urlpro|terabox|high)[^>]*>.*?<\/a>/is', '', $clean_content);
    
    // Remove images
    $clean_content = preg_replace('/<img[^>]*>/i', '', $clean_content);
    
    // Remove h2 headers that contain download/link
    $clean_content = preg_replace('/<h2[^>]*>.*?(?:download|link).*?<\/h2>/is', '', $clean_content);
    
    // Get remaining text paragraphs
    preg_match_all('/<p[^>]*>(.*?)<\/p>/is', $clean_content, $matches);
    
    $synopsis_parts = array();
    foreach ($matches[1] as $paragraph) {
        $text = trim(strip_tags($paragraph));
        // Only include substantial text (not just whitespace or single characters)
        if (strlen($text) > 10 && !preg_match('/^-?\s*(HD|Low|Medium|High)\s*Quality\s*-?$/i', $text)) {
            $synopsis_parts[] = '<p>' . $paragraph . '</p>';
        }
    }
    
    return implode("\n", $synopsis_parts);
}

// Custom pagination
function btspro24_pagination($query = null) {
    global $wp_query;
    $query = $query ? $query : $wp_query;
    
    $total_pages = $query->max_num_pages;
    if ($total_pages <= 1) return;
    
    $current_page = max(1, get_query_var('paged'));
    
    echo '<div class="pagination">';
    
    // Previous button
    if ($current_page > 1) {
        echo '<a href="' . get_pagenum_link($current_page - 1) . '" class="pagination-btn pagination-btn-prev">';
        echo btspro24_icon('chevron-left');
        echo 'Previous</a>';
    }
    
    // Page numbers
    echo '<div class="pagination-numbers">';
    for ($i = 1; $i <= min(5, $total_pages); $i++) {
        if ($total_pages <= 5) {
            $page_num = $i;
        } elseif ($current_page <= 3) {
            $page_num = $i;
        } elseif ($current_page >= $total_pages - 2) {
            $page_num = $total_pages - 5 + $i;
        } else {
            $page_num = $current_page - 3 + $i;
        }
        
        $active_class = ($page_num == $current_page) ? ' active' : '';
        echo '<a href="' . get_pagenum_link($page_num) . '" class="page-number' . $active_class . '">' . $page_num . '</a>';
    }
    echo '</div>';
    
    // Next button
    if ($current_page < $total_pages) {
        echo '<a href="' . get_pagenum_link($current_page + 1) . '" class="pagination-btn pagination-btn-next">Next';
        echo btspro24_icon('chevron-right');
        echo '</a>';
    }
    
    echo '</div>';
}

// Theme Customizer
function btspro24_customize_register($wp_customize) {
    // Site Logo Section
    $wp_customize->add_section('btspro24_logo', array(
        'title' => __('Site Logo', 'btspro24'),
        'priority' => 20,
    ));
    
    $wp_customize->add_setting('site_logo', array(
        'default' => get_template_directory_uri() . '/assets/logo.png',
        'sanitize_callback' => 'esc_url_raw',
    ));
    
    $wp_customize->add_control(new WP_Customize_Image_Control($wp_customize, 'site_logo', array(
        'label' => __('Upload Logo', 'btspro24'),
        'description' => __('হেডার এবং ফুটারে দেখানো হবে। প্রস্তাবিত সাইজ: 150x40px', 'btspro24'),
        'section' => 'btspro24_logo',
        'settings' => 'site_logo',
    )));
    
    // Premium Banner Section
    $wp_customize->add_section('btspro24_premium_banner', array(
        'title' => __('Premium Banner', 'btspro24'),
        'priority' => 30,
    ));
    
    // Premium Banner Enabled Toggle
    $wp_customize->add_setting('premium_banner_enabled', array(
        'default' => true,
        'sanitize_callback' => 'rest_sanitize_boolean',
    ));
    
    $wp_customize->add_control('premium_banner_enabled', array(
        'label' => __('Enable Premium Banner', 'btspro24'),
        'section' => 'btspro24_premium_banner',
        'type' => 'checkbox',
    ));
    
    $wp_customize->add_setting('premium_banner_text', array(
        'default' => 'স্টার জলসা, জি বাংলা, কালার্স বাংলা, সান বাংলা, এন্টার টেন বাংলার নাটক পেতে',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    
    $wp_customize->add_control('premium_banner_text', array(
        'label' => __('Banner Text', 'btspro24'),
        'section' => 'btspro24_premium_banner',
        'type' => 'textarea',
    ));
    
    $wp_customize->add_setting('premium_banner_button', array(
        'default' => 'প্রিমিয়াম সাবস্ক্রিপশন নিন',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    
    $wp_customize->add_control('premium_banner_button', array(
        'label' => __('Button Text', 'btspro24'),
        'section' => 'btspro24_premium_banner',
        'type' => 'text',
    ));
    
    $wp_customize->add_setting('premium_banner_link', array(
        'default' => 'https://panel.btspro24.com/',
        'sanitize_callback' => 'esc_url_raw',
    ));
    
    $wp_customize->add_control('premium_banner_link', array(
        'label' => __('Button Link', 'btspro24'),
        'section' => 'btspro24_premium_banner',
        'type' => 'url',
    ));
    
    // Notice Banner Section
    $wp_customize->add_section('btspro24_notice_banner', array(
        'title' => __('Notice Banner', 'btspro24'),
        'priority' => 31,
    ));
    
    // Notice Banner Enabled Toggle
    $wp_customize->add_setting('notice_banner_enabled', array(
        'default' => true,
        'sanitize_callback' => 'rest_sanitize_boolean',
    ));
    
    $wp_customize->add_control('notice_banner_enabled', array(
        'label' => __('Enable Notice Banner', 'btspro24'),
        'section' => 'btspro24_notice_banner',
        'type' => 'checkbox',
    ));
    
    $wp_customize->add_setting('notice_banner_text', array(
        'default' => 'প্রিয় গ্রাহক, এই সাইট থেকে সিরিয়াল ডাউনলোড করতে সমস্যা হলে নিচের লিংকের ওয়েবসাইট থেকে ডাউনলোড করতে পারবেন',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    
    $wp_customize->add_control('notice_banner_text', array(
        'label' => __('Notice Text', 'btspro24'),
        'section' => 'btspro24_notice_banner',
        'type' => 'textarea',
    ));
    
    $wp_customize->add_setting('notice_banner_link_text', array(
        'default' => 'BengaliTVSerialHD',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    
    $wp_customize->add_control('notice_banner_link_text', array(
        'label' => __('Link Text', 'btspro24'),
        'section' => 'btspro24_notice_banner',
        'type' => 'text',
    ));
    
    $wp_customize->add_setting('notice_banner_link', array(
        'default' => 'https://www.bengalitvserialhd.com/',
        'sanitize_callback' => 'esc_url_raw',
    ));
    
    $wp_customize->add_control('notice_banner_link', array(
        'label' => __('Link URL', 'btspro24'),
        'section' => 'btspro24_notice_banner',
        'type' => 'url',
    ));
}
add_action('customize_register', 'btspro24_customize_register');

// Get customizer values with defaults
function btspro24_get_option($key, $default = '') {
    return get_theme_mod($key, $default);
}
