<?php get_header(); ?>

<!-- Premium Banner -->
<?php if (btspro24_get_option('premium_banner_enabled', true)) : ?>
<section class="premium-banner">
    <div class="page-container">
        <div class="premium-content">
            <div class="premium-badge">
                <?php echo btspro24_icon('sparkles', 'w-4 h-4'); ?>
                স্পেশাল অফার
            </div>
            <h2 class="premium-text">
                <?php echo btspro24_get_option('premium_banner_text', 'স্টার জলসা, জি বাংলা, কালার্স বাংলা, সান বাংলা, এন্টার টেন বাংলার নাটক পেতে'); ?>
            </h2>
            <a href="<?php echo esc_url(btspro24_get_option('premium_banner_link', 'https://panel.btspro24.com/')); ?>" target="_blank" class="btn-accent">
                <?php echo btspro24_icon('crown', 'w-5 h-5'); ?>
                <?php echo btspro24_get_option('premium_banner_button', 'প্রিমিয়াম সাবস্ক্রিপশন নিন'); ?>
                <?php echo btspro24_icon('arrow-right', 'w-4 h-4'); ?>
            </a>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- Category Badges -->
<section class="category-badges">
    <div class="page-container">
        <div class="badges-wrapper">
            <?php
            $categories = get_categories(array(
                'orderby' => 'name',
                'order' => 'ASC',
                'number' => 18,
                'hide_empty' => true,
            ));
            
            foreach ($categories as $category) :
            ?>
                <a href="<?php echo get_category_link($category->term_id); ?>" class="category-badge">
                    <?php echo esc_html($category->name); ?>
                </a>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<!-- Notice Banner -->
<?php if (btspro24_get_option('notice_banner_enabled', true)) : ?>
<section class="notice-banner">
    <div class="page-container">
        <div class="notice-content">
            <div class="notice-badge">
                <?php echo btspro24_icon('alert-circle', 'w-4 h-4'); ?>
                বিজ্ঞপ্তি
            </div>
            <p class="notice-text">
                <?php echo btspro24_get_option('notice_banner_text', 'প্রিয় গ্রাহক, এই সাইট থেকে সিরিয়াল ডাউনলোড করতে সমস্যা হলে নিচের লিংকের ওয়েবসাইট থেকে ডাউনলোড করতে পারবেন'); ?>
            </p>
            <a href="<?php echo esc_url(btspro24_get_option('notice_banner_link', 'https://www.bengalitvserialhd.com/')); ?>" target="_blank" class="notice-link">
                <?php echo btspro24_get_option('notice_banner_link_text', 'BengaliTVSerialHD'); ?>
            <?php echo btspro24_icon('external-link', 'w-4 h-4'); ?>
        </a>
    </div>
</div>
</section>
<?php endif; ?>

<!-- Movie Grid -->
<section class="movie-grid">
    <div class="page-container">
        <div class="section-header">
            <?php echo btspro24_icon('clock', 'w-5 h-5'); ?>
            <h2 class="section-title">Latest Uploads</h2>
            <span class="section-count">(<?php echo wp_count_posts()->publish; ?> টি)</span>
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
                <p>কোনো কন্টেন্ট পাওয়া যায়নি।</p>
            </div>
        <?php endif; ?>
    </div>
</section>

<?php get_footer(); ?>
