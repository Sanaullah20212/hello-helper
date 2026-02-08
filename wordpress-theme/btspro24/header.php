<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header class="site-header">
    <div class="page-container">
        <div class="header-inner">
            <!-- Logo -->
            <a href="<?php echo home_url('/'); ?>" class="site-logo">
                <img src="<?php echo esc_url(btspro24_get_option('site_logo', get_template_directory_uri() . '/assets/logo.png')); ?>" alt="<?php bloginfo('name'); ?>">
            </a>

            <!-- Search Form -->
            <form role="search" method="get" class="search-form" action="<?php echo home_url('/'); ?>">
                <div class="search-wrapper">
                    <input type="search" class="search-input" placeholder="Search movies & series..." value="<?php echo get_search_query(); ?>" name="s">
                    <button type="submit" class="search-btn">
                        <?php echo btspro24_icon('search'); ?>
                    </button>
                </div>
            </form>

        </div>
    </div>
</header>
