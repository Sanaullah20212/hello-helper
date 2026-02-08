<?php get_header(); ?>

<main class="single-post">
    <div class="page-container single-container">
        <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
            
            <article class="post-article-card">
                <!-- Header -->
                <div class="post-header">
                    <h1 class="post-title"><?php the_title(); ?></h1>
                    
                    <div class="post-meta">
                        <span class="post-meta-item">
                            <?php echo btspro24_icon('user', 'w-4 h-4'); ?>
                            <?php the_author(); ?>
                        </span>
                        <span class="post-meta-item">
                            <?php echo btspro24_icon('clock', 'w-4 h-4'); ?>
                            <?php echo human_time_diff(get_the_time('U'), current_time('timestamp')) . ' ago'; ?>
                        </span>
                        <span class="post-meta-item">
                            <?php echo btspro24_icon('eye', 'w-4 h-4'); ?>
                            <?php echo rand(5, 100); ?> Views
                        </span>
                        <span class="post-meta-item">
                            <?php echo btspro24_icon('message-circle', 'w-4 h-4'); ?>
                            No Comments
                        </span>
                        <?php 
                        $categories = get_the_category();
                        if (!empty($categories)) : 
                        ?>
                            <span class="post-meta-item">
                                <?php echo btspro24_icon('folder', 'w-4 h-4'); ?>
                                <a href="<?php echo get_category_link($categories[0]->term_id); ?>">
                                    <?php echo esc_html($categories[0]->name); ?>
                                </a>
                                • Bengalitvserial24.Com
                            </span>
                        <?php endif; ?>
                    </div>
                </div>

                <?php 
                $content = get_the_content();
                $sections = btspro24_get_download_sections($content);
                $all_links = btspro24_extract_dbtn_links($content);
                if (empty($all_links)) {
                    $all_links = btspro24_get_download_links($content);
                }
                ?>

                <!-- Download Sections -->
                <?php 
                if (!empty($sections)) : 
                    foreach ($sections as $section) : 
                ?>
                    <!-- Episode Section Title -->
                    <div class="post-section-title download">
                        <?php echo btspro24_icon('download', 'w-5 h-5'); ?>
                        <?php echo esc_html($section['title']); ?>
                    </div>
                    
                    <!-- Download Links -->
                    <div class="episode-download-links">
                        <?php foreach ($section['links'] as $link) : 
                            $btn_class = isset($link['type']) ? $link['type'] : 'hd';
                        ?>
                            <a href="<?php echo esc_url($link['url']); ?>" target="_blank" rel="noopener noreferrer" class="Dbtn <?php echo esc_attr($btn_class); ?>">
                                <span><?php echo wp_kses_post($link['label']); ?></span>
                            </a>
                        <?php endforeach; ?>
                    </div>
                    
                    <div class="episode-separator">---</div>
                <?php 
                    endforeach;
                elseif (!empty($all_links)) : 
                ?>
                    <div class="post-section-title download">
                        <?php echo btspro24_icon('download', 'w-5 h-5'); ?>
                        ডাউনলোড লিংক
                    </div>
                    <div class="episode-download-links">
                        <?php foreach ($all_links as $link) : 
                            $btn_class = isset($link['type']) ? $link['type'] : 'hd';
                        ?>
                            <a href="<?php echo esc_url($link['url']); ?>" target="_blank" rel="noopener noreferrer" class="Dbtn <?php echo esc_attr($btn_class); ?>">
                                <span><?php echo wp_kses_post($link['label']); ?></span>
                            </a>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </article>

            <!-- Related Posts -->
            <?php
            $categories = get_the_category();
            if (!empty($categories)) :
                $related_posts = new WP_Query(array(
                    'category__in' => array($categories[0]->term_id),
                    'post__not_in' => array(get_the_ID()),
                    'posts_per_page' => 6,
                    'orderby' => 'rand',
                ));
                
                if ($related_posts->have_posts()) :
            ?>
                <div class="related-posts-section">
                    <div class="widget-title"><span>Movies You May Also Like</span></div>
                    
                    <div class="related-grid">
                        <?php while ($related_posts->have_posts()) : $related_posts->the_post(); ?>
                            <a href="<?php the_permalink(); ?>" class="related-post-item">
                                <div class="related-thumb">
                                    <img src="<?php echo btspro24_get_poster(); ?>" alt="<?php the_title_attribute(); ?>" loading="lazy">
                                </div>
                                <div class="related-info">
                                    <h3 class="related-title"><?php the_title(); ?></h3>
                                    <hr>
                                    <div class="related-meta">
                                        <span><?php echo btspro24_icon('clock', 'w-3 h-3'); ?> <?php echo human_time_diff(get_the_time('U'), current_time('timestamp')) . ' ago'; ?></span>
                                    </div>
                                </div>
                            </a>
                        <?php endwhile; ?>
                    </div>
                </div>
            <?php 
                endif;
                wp_reset_postdata();
            endif; 
            ?>

        <?php endwhile; endif; ?>
    </div>
</main>

<?php get_footer(); ?>
