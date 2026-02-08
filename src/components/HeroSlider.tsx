import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  link_text: string | null;
  display_order: number;
  show_id: string | null;
}

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [previousSlide, setPreviousSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const { data: slides = [] } = useQuery({
    queryKey: ["hero-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as HeroSlide[];
    },
  });

  const changeSlide = useCallback((newIndex: number, dir: 'next' | 'prev') => {
    if (isTransitioning || slides.length === 0) return;
    setDirection(dir);
    setPreviousSlide(currentSlide);
    setIsTransitioning(true);
    setCurrentSlide(newIndex);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning, slides.length, currentSlide]);

  const nextSlide = useCallback(() => {
    if (slides.length === 0) return;
    changeSlide((currentSlide + 1) % slides.length, 'next');
  }, [slides.length, currentSlide, changeSlide]);

  const prevSlide = useCallback(() => {
    if (slides.length === 0) return;
    changeSlide((currentSlide - 1 + slides.length) % slides.length, 'prev');
  }, [slides.length, currentSlide, changeSlide]);

  const goToSlide = (index: number) => {
    const dir = index > currentSlide ? 'next' : 'prev';
    changeSlide(index, dir);
    setIsAutoPlaying(false);
  };

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying || slides.length === 0) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, nextSlide, slides.length]);

  // Resume auto-play
  useEffect(() => {
    if (isAutoPlaying) return;
    const timer = setTimeout(() => setIsAutoPlaying(true), 10000);
    return () => clearTimeout(timer);
  }, [isAutoPlaying, currentSlide]);

  const getSlideIndex = (offset: number) => {
    return (currentSlide + offset + slides.length) % slides.length;
  };

  if (slides.length === 0) {
    return null; // Don't show slider if no slides
  }

  const currentSlideData = slides[currentSlide];
  const prevSlideData = slides[getSlideIndex(-1)];
  const nextSlideData = slides[getSlideIndex(1)];

  return (
    <div className="relative w-full bg-[#0f0617] overflow-hidden py-4 md:py-6">
      <div className="relative max-w-[1600px] mx-auto px-2 sm:px-4">
        {/* Slides Container */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
          {/* Previous Slide (Peek) */}
          {slides.length > 1 && (
            <div 
              className="hidden sm:block relative w-[80px] md:w-[120px] lg:w-[180px] h-[180px] sm:h-[220px] md:h-[280px] lg:h-[350px] flex-shrink-0 cursor-pointer rounded-xl overflow-hidden group/side"
              onClick={() => { prevSlide(); setIsAutoPlaying(false); }}
            >
              <div 
                className="absolute inset-0 transition-all duration-600 ease-out"
                style={{
                  opacity: isTransitioning ? (direction === 'prev' ? 0 : 0.3) : 0.6,
                  transform: isTransitioning 
                    ? (direction === 'prev' ? 'translateX(100%) scale(1.1)' : 'translateX(-30%) scale(0.9)')
                    : 'translateX(0) scale(1)',
                }}
              >
                <img
                  src={prevSlideData?.image_url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/side:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#0f0617] via-black/40 to-black/40 transition-opacity duration-300 group-hover/side:opacity-70" />
              <div className="absolute bottom-4 left-3 right-3 transform transition-all duration-300 translate-y-2 opacity-80 group-hover/side:translate-y-0 group-hover/side:opacity-100">
                <h3 className="text-white text-xs md:text-sm font-medium line-clamp-2">
                  {prevSlideData?.title}
                </h3>
              </div>
            </div>
          )}

          {/* Current Slide (Main) */}
          <div className={`relative ${slides.length > 1 ? 'w-full sm:w-[calc(100%-180px)] md:w-[calc(100%-260px)] lg:w-[calc(100%-380px)]' : 'w-full max-w-5xl'} h-[180px] sm:h-[220px] md:h-[280px] lg:h-[350px] flex-shrink-0 rounded-xl overflow-hidden shadow-2xl shadow-black/50`}>
            {/* Previous Image (fading out) */}
            {isTransitioning && (
              <div 
                className="absolute inset-0 z-10"
                style={{
                  animation: direction === 'next' 
                    ? 'slideOutLeft 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards'
                    : 'slideOutRight 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
                }}
              >
                <img
                  src={slides[previousSlide]?.image_url}
                  alt=""
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
            )}

            {/* Current Image (fading in) */}
            <div 
              className="absolute inset-0"
              style={{
                animation: isTransitioning 
                  ? (direction === 'next' 
                      ? 'slideInRight 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards'
                      : 'slideInLeft 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards')
                  : 'none',
              }}
            >
              <img
                src={currentSlideData?.image_url}
                alt={currentSlideData?.title}
                fetchPriority="high"
                loading="eager"
                decoding="sync"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
                className="w-full h-full object-cover"
                style={{
                  animation: !isTransitioning ? 'slowZoom 8s ease-out forwards' : 'none',
                }}
              />
            </div>
            
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
            
            {/* Content */}
            <div 
              className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6 lg:p-8 z-20"
              style={{
                animation: isTransitioning 
                  ? 'contentFadeIn 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards'
                  : 'none',
              }}
            >
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight line-clamp-2 mb-1 sm:mb-2 drop-shadow-lg">
                {currentSlideData?.title}
              </h2>
              {currentSlideData?.subtitle && (
                <p className="text-sm sm:text-base text-white/80 mb-2 sm:mb-3 line-clamp-1">
                  {currentSlideData.subtitle}
                </p>
              )}
              
              {currentSlideData?.link_url && (
                <Link
                  to={currentSlideData.link_url}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 bg-white/15 backdrop-blur-md border border-white/30 rounded-lg text-white text-xs sm:text-sm font-medium hover:bg-white/30 hover:scale-105 hover:shadow-lg transition-all duration-300"
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 fill-white" />
                  {currentSlideData.link_text || "Watch Now"}
                </Link>
              )}
            </div>

            {/* Navigation Arrows - Mobile only */}
            {slides.length > 1 && (
              <>
                <button
                  onClick={() => { prevSlide(); setIsAutoPlaying(false); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 hover:scale-110 transition-all duration-300 sm:hidden active:scale-95 z-30"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => { nextSlide(); setIsAutoPlaying(false); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 hover:scale-110 transition-all duration-300 sm:hidden active:scale-95 z-30"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Progress bar */}
            {slides.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
                <div 
                  key={currentSlide}
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full"
                  style={{
                    animation: isAutoPlaying ? 'progressBar 5s linear forwards' : 'none',
                    width: isAutoPlaying ? '100%' : '0%',
                  }}
                />
              </div>
            )}
          </div>

          {/* Next Slide (Peek) */}
          {slides.length > 1 && (
            <div 
              className="hidden sm:block relative w-[80px] md:w-[120px] lg:w-[180px] h-[180px] sm:h-[220px] md:h-[280px] lg:h-[350px] flex-shrink-0 cursor-pointer rounded-xl overflow-hidden group/side"
              onClick={() => { nextSlide(); setIsAutoPlaying(false); }}
            >
              <div 
                className="absolute inset-0 transition-all duration-600 ease-out"
                style={{
                  opacity: isTransitioning ? (direction === 'next' ? 0 : 0.3) : 0.6,
                  transform: isTransitioning 
                    ? (direction === 'next' ? 'translateX(-100%) scale(1.1)' : 'translateX(30%) scale(0.9)')
                    : 'translateX(0) scale(1)',
                }}
              >
                <img
                  src={nextSlideData?.image_url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/side:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-l from-[#0f0617] via-black/40 to-black/40 transition-opacity duration-300 group-hover/side:opacity-70" />
              <div className="absolute bottom-4 left-3 right-3 transform transition-all duration-300 translate-y-2 opacity-80 group-hover/side:translate-y-0 group-hover/side:opacity-100">
                <h3 className="text-white text-xs md:text-sm font-medium line-clamp-2">
                  {nextSlideData?.title}
                </h3>
              </div>
            </div>
          )}
        </div>

        {/* Dots Indicator */}
        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-500 ease-out rounded-full ${
                  index === currentSlide
                    ? "w-6 sm:w-8 h-2 bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30"
                    : "w-2 h-2 bg-white/30 hover:bg-white/50 hover:scale-125"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slowZoom {
          from { transform: scale(1); }
          to { transform: scale(1.08); }
        }
        
        @keyframes progressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
        
        @keyframes slideInRight {
          from { 
            transform: translateX(30%) scale(0.9);
            opacity: 0;
          }
          to { 
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes slideInLeft {
          from { 
            transform: translateX(-30%) scale(0.9);
            opacity: 0;
          }
          to { 
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes slideOutLeft {
          from { 
            transform: translateX(0) scale(1);
            opacity: 1;
          }
          to { 
            transform: translateX(-30%) scale(0.9);
            opacity: 0;
          }
        }
        
        @keyframes slideOutRight {
          from { 
            transform: translateX(0) scale(1);
            opacity: 1;
          }
          to { 
            transform: translateX(30%) scale(0.9);
            opacity: 0;
          }
        }
        
        @keyframes contentFadeIn {
          0% {
            transform: translateY(30px);
            opacity: 0;
          }
          50% {
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default HeroSlider;
