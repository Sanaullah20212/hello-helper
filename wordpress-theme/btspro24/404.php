<?php get_header(); ?>

<main class="page-404">
    <div class="page-container">
        <div class="error-404">404</div>
        <h1 class="error-title">পেইজ পাওয়া যায়নি</h1>
        <p class="error-text">আপনি যে পেইজটি খুঁজছেন সেটি সরানো হয়েছে বা অস্তিত্বে নেই।</p>
        <a href="<?php echo home_url('/'); ?>" class="btn-primary">
            <?php echo btspro24_icon('home', 'w-5 h-5'); ?>
            হোমে ফিরে যান
        </a>
    </div>
</main>

<?php get_footer(); ?>
