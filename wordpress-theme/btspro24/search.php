<?php get_header(); ?>

<!-- Search Header -->
<section class="premium-banner" style="padding: 1.5rem 0;">
    <div class="page-container">
        <div class="premium-content">
            <h1 class="premium-text" style="margin-bottom: 0;">
                Search Results for: "<?php echo get_search_query(); ?>"
            </h1>
        </div>
    </div>
</section>

<!-- Movie Grid -->
<section class="movie-grid">
    <div class="page-container">
        <div class="section-header">
            <?php echo btspro24_icon('search', 'w-5 h-5'); ?>
            <h2 class="section-title">Search Results</h2>
            <span class="section-count">(<?php echo $wp_query->found_posts; ?> টি)</span>
        </div>
        
        <?php if (have_posts()) : ?>
            <div class="movies-wrapper">
                <?php while (have_posts()) : the_post(); ?>
                    <a href="<?php the_permalink(); ?>" class="movie-card">
                        <img src="<?php echo btspro24_get_poster(); ?>" alt="<?php the_title_attribute(); ?>" loading="lazy">
                        <div class="movie-card-overlay">
                            <?php 
                            $categories = get_the_category();
                            if (!empty($categories)) : 
                            ?>
                                <span class="movie-card-category"><?php echo esc_html($categories[0]->name); ?></span>
                            <?php endif; ?>
                            
                            <div class="movie-play-btn">
                                <?php echo btspro24_icon('play'); ?>
                            </div>
                            
                            <h3 class="movie-card-title"><?php the_title(); ?></h3>
                            <div class="movie-card-date">
                                <?php echo btspro24_icon('calendar'); ?>
                                <span><?php echo get_the_date('Y'); ?></span>
                            </div>
                        </div>
                    </a>
                <?php endwhile; ?>
            </div>
            
            <?php btspro24_pagination(); ?>
            
        <?php else : ?>
            <div class="empty-state">
                <?php echo btspro24_icon('film', 'w-12 h-12'); ?>
                <p>কোনো কন্টেন্ট পাওয়া যায়নি। অন্য কিছু খুঁজুন।</p>
            </div>
        <?php endif; ?>
    </div>
</section>

<?php get_footer(); ?>
