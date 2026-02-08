<footer class="site-footer">
    <div class="page-container">
        <div class="footer-main">
            <a href="<?php echo home_url('/'); ?>" class="footer-logo">
                <img src="<?php echo esc_url(btspro24_get_option('site_logo', get_template_directory_uri() . '/assets/logo.png')); ?>" alt="<?php bloginfo('name'); ?>">
            </a>
            <p class="footer-description">
                বাংলা মুভি, সিরিয়াল এবং টিভি শো ডাউনলোড করার জন্য সেরা ওয়েবসাইট।
            </p>
        </div>
        
        <div class="footer-copyright">
            <p class="copyright-text">
                © <?php echo date('Y'); ?> <?php bloginfo('name'); ?>. Made with 
                <span class="copyright-heart"><?php echo btspro24_icon('heart', 'w-4 h-4'); ?></span>
                সর্বস্বত্ব সংরক্ষিত।
            </p>
        </div>
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
