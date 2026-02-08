import { useState, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Download, Maximize, Minimize, Volume2, VolumeX, Play, Pause, RotateCcw, RotateCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import LazyImage from "@/components/ui/LazyImage";
import { getEpisodeThumbnail } from "@/lib/cloudinaryThumbnail";
import defaultEpisodeThumb from "@/assets/default-episode-thumb.jpg";

interface DownloadLink {
  label: string;
  url: string;
  quality?: string;
}

interface Episode {
  id: string;
  title: string;
  episode_number: number | null;
  watch_url: string | null;
  download_links: DownloadLink[] | null;
  air_date?: string | null;
  thumbnail_url?: string | null;
  show_id?: string;
  season_number?: number | null;
  is_free?: boolean;
  is_active?: boolean;
}

interface VideoPlayerProps {
  episode: Episode;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  allEpisodes?: Episode[];
  onSelectEpisode?: (episode: Episode) => void;
  showTitle?: string;
  showThumbnailUrl?: string | null;
  showPosterUrl?: string | null;
}

const VideoPlayer = ({ 
  episode, 
  onClose, 
  onPrev, 
  onNext, 
  allEpisodes = [], 
  onSelectEpisode,
  showTitle = "",
  showThumbnailUrl = null,
  showPosterUrl = null
}: VideoPlayerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Get upcoming episodes (episodes after current one)
  const currentIndex = allEpisodes.findIndex(ep => ep.id === episode.id);
  const upNextEpisodes = allEpisodes.filter((ep, idx) => idx !== currentIndex).slice(0, 5);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          document.exitFullscreen();
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose, isFullscreen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowLeft") {
        skip(-10);
      } else if (e.key === "ArrowRight") {
        skip(10);
      } else if (e.key === "m") {
        setIsMuted(!isMuted);
      } else if (e.key === "f") {
        toggleFullscreen();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handleVolumeChange(Math.min(1, volume + 0.1));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleVolumeChange(Math.max(0, volume - 0.1));
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isMuted]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };
    
    const container = containerRef.current;
    container?.addEventListener("mousemove", handleMouseMove);
    return () => {
      container?.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
        
        // Lock to landscape orientation on mobile
        try {
          const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
          if (orientation?.lock) {
            await orientation.lock('landscape');
          }
        } catch (e) {
          // Orientation lock may not be supported or allowed
          console.log('Orientation lock not supported');
        }
      } else {
        // Exit fullscreen
        await document.exitFullscreen();
        setIsFullscreen(false);
        
        // Unlock orientation
        try {
          const orientation = screen.orientation as ScreenOrientation & { unlock?: () => void };
          if (orientation?.unlock) {
            orientation.unlock();
          }
        } catch (e) {
          console.log('Orientation unlock not supported');
        }
      }
    } catch (e) {
      console.log('Fullscreen error:', e);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsBuffering(false);
    }
  };

  const handleWaiting = () => {
    setIsBuffering(true);
  };

  const handleCanPlay = () => {
    setIsBuffering(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      handleVolumeChange(volume > 0 ? volume : 0.5);
      setIsMuted(false);
    } else {
      setIsMuted(true);
      if (videoRef.current) {
        videoRef.current.volume = 0;
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  };

  // Get the proxy URL for streaming download links
  const getProxyUrl = (url: string): string => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/video-proxy?url=${encodeURIComponent(url)}`;
  };

  // Detect embed type from URL
  const getEmbedUrl = (url: string): { type: "iframe" | "video"; src: string } => {
    // YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("youtu.be")
        ? url.split("youtu.be/")[1]?.split("?")[0]
        : url.split("v=")[1]?.split("&")[0];
      return {
        type: "iframe",
        src: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
      };
    }

    // Vimeo
    if (url.includes("vimeo.com")) {
      const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
      return {
        type: "iframe",
        src: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
      };
    }

    // Dailymotion
    if (url.includes("dailymotion.com") || url.includes("dai.ly")) {
      const videoId = url.includes("dai.ly")
        ? url.split("dai.ly/")[1]
        : url.split("/video/")[1]?.split("_")[0];
      return {
        type: "iframe",
        src: `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`,
      };
    }

    // Google Drive
    if (url.includes("drive.google.com")) {
      const fileId = url.match(/[-\w]{25,}/)?.[0];
      return {
        type: "iframe",
        src: `https://drive.google.com/file/d/${fileId}/preview`,
      };
    }

    // StreamWish, Filemoon, etc. (iframe embed URLs)
    if (url.includes("/e/") || url.includes("/embed/") || url.includes("iframe")) {
      return { type: "iframe", src: url };
    }

    // Direct video file
    if (url.match(/\.(mp4|webm|m3u8|mkv)(\?|$)/i)) {
      return { type: "video", src: url };
    }

    // Download links (like download.aspx) - proxy through our edge function
    if (url.includes("download.aspx") || url.includes("/download/") || url.includes("?file=")) {
      return { type: "video", src: getProxyUrl(url) };
    }

    // Default: try as iframe
    return { type: "iframe", src: url };
  };

  const embed = episode.watch_url ? getEmbedUrl(episode.watch_url) : null;

  return (
    <div className="w-full bg-background">
      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Video Section */}
        <div className="flex-1">
          {/* Video Container */}
          <div 
            ref={containerRef} 
            className={cn(
              "relative bg-black rounded-lg overflow-hidden group",
              isFullscreen && "fixed inset-0 z-50 rounded-none flex items-center justify-center"
            )}
          >
            {embed ? (
              <div className={cn(
                "aspect-video relative w-full",
                isFullscreen && "h-full max-h-screen"
              )}>
                {embed.type === "iframe" ? (
                  <>
                    {/* Loading Spinner for iframe */}
                    {!iframeLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                        <div className="relative flex items-center justify-center">
                          <div className="relative w-20 h-20">
                            <div className="absolute inset-0 rounded-full border-4 border-primary/40 animate-ping" />
                            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary/50 animate-spin" />
                            <div className="absolute inset-2 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                              <Play className="w-8 h-8 text-white/80 ml-1 animate-pulse" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <iframe
                      src={embed.src}
                      className="w-full h-full"
                      allowFullScreen
                      allow="autoplay; encrypted-media; picture-in-picture"
                      loading="lazy"
                      onLoad={() => setIframeLoaded(true)}
                    />
                  </>
                ) : (
                  <>
                    {/* Buffering Spinner for native video */}
                    {isBuffering && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                        <div className="relative flex items-center justify-center">
                          <div className="relative w-20 h-20">
                            <div className="absolute inset-0 rounded-full border-4 border-primary/40 animate-ping" />
                            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary/50 animate-spin" />
                            <div className="absolute inset-2 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                              <Play className="w-8 h-8 text-white/80 ml-1 animate-pulse" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <video
                      ref={videoRef}
                      src={embed.src}
                      className="w-full h-full"
                      autoPlay
                      playsInline
                      muted={isMuted}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onWaiting={handleWaiting}
                      onCanPlay={handleCanPlay}
                      onPlaying={() => setIsBuffering(false)}
                      onClick={togglePlay}
                    />
                    
                    {/* Custom Controls Overlay */}
                    <div className={cn(
                      "absolute inset-0 flex flex-col justify-between transition-opacity duration-300",
                      showControls ? "opacity-100" : "opacity-0"
                    )}>
                      {/* Top gradient */}
                      <div className="h-20 bg-gradient-to-b from-black/60 to-transparent" />
                      
                      {/* Center Controls */}
                      <div className="flex items-center justify-center gap-8">
                        <button
                          onClick={() => skip(-10)}
                          className="p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                        >
                          <RotateCcw className="w-6 h-6" />
                          <span className="sr-only">Skip 10 seconds back</span>
                        </button>
                        
                        <button
                          onClick={togglePlay}
                          className="p-4 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                        >
                          {isPlaying ? (
                            <Pause className="w-10 h-10" />
                          ) : (
                            <Play className="w-10 h-10 ml-1" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => skip(10)}
                          className="p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                        >
                          <RotateCw className="w-6 h-6" />
                          <span className="sr-only">Skip 10 seconds forward</span>
                        </button>
                      </div>
                      
                      {/* Bottom Controls */}
                      <div className="bg-gradient-to-t from-black/90 to-transparent p-3 sm:p-4 space-y-2 sm:space-y-3">
                        {/* Progress Bar - Larger touch target on mobile */}
                        <div className="relative h-6 sm:h-4 flex items-center">
                          <input
                            type="range"
                            min={0}
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            className="w-full h-2 sm:h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer
                              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                              sm:[&::-webkit-slider-thumb]:w-4 sm:[&::-webkit-slider-thumb]:h-4
                              [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                              [&::-webkit-slider-thumb]:shadow-md"
                            style={{
                              background: `linear-gradient(to right, hsl(var(--primary)) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%)`
                            }}
                          />
                        </div>
                        
                        {/* Control Bar */}
                        <div className="flex items-center justify-between text-white">
                          <div className="flex items-center gap-2 sm:gap-4">
                            {/* Volume Control - Hidden on small mobile, shown on tablet+ */}
                            <div 
                              className="relative hidden sm:flex items-center"
                              onMouseEnter={() => setShowVolumeSlider(true)}
                              onMouseLeave={() => setShowVolumeSlider(false)}
                            >
                              <button
                                onClick={toggleMute}
                                className="p-1 hover:text-primary transition-colors"
                              >
                                {isMuted || volume === 0 ? (
                                  <VolumeX className="w-5 h-5" />
                                ) : (
                                  <Volume2 className="w-5 h-5" />
                                )}
                              </button>
                              
                              {/* Volume Slider - Enhanced */}
                              <div className={cn(
                                "flex items-center transition-all duration-300 overflow-hidden",
                                showVolumeSlider ? "w-24 ml-2 opacity-100" : "w-0 ml-0 opacity-0"
                              )}>
                                <div className="relative w-full h-6 flex items-center">
                                  {/* Background track */}
                                  <div className="absolute w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                                    {/* Filled portion with gradient */}
                                    <div 
                                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-150"
                                      style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                                    />
                                  </div>
                                  {/* Custom slider input */}
                                  <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.02}
                                    value={isMuted ? 0 : volume}
                                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                    className="absolute w-full h-6 appearance-none cursor-pointer bg-transparent z-10
                                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                                      [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                                      [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-primary/30
                                      [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {/* Mobile volume button (mute toggle only) */}
                            <button
                              onClick={toggleMute}
                              className="p-1 sm:hidden hover:text-primary transition-colors"
                            >
                              {isMuted || volume === 0 ? (
                                <VolumeX className="w-5 h-5" />
                              ) : (
                                <Volume2 className="w-5 h-5" />
                              )}
                            </button>
                            
                            <span className="text-xs sm:text-sm font-medium">
                              {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button className="p-1 hover:text-primary transition-colors">
                              <Settings className="w-5 h-5" />
                            </button>
                            <button
                              onClick={toggleFullscreen}
                              className="p-1 hover:text-primary transition-colors"
                            >
                              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center text-white/60">
                <div className="text-center">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No video link available</p>
                </div>
              </div>
            )}
          </div>

          {/* Episode Info */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {episode.episode_number ? `EP${episode.episode_number}: ` : ""}{episode.title}
                </h1>
                {showTitle && (
                  <p className="text-sm text-muted-foreground">{showTitle}</p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Navigation & Download */}
            <div className="flex items-center gap-3 flex-wrap">
              {onPrev && (
                <Button variant="outline" size="sm" onClick={onPrev}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
              )}
              {onNext && (
                <Button variant="outline" size="sm" onClick={onNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
              
              {/* Download Links */}
              {episode.download_links && episode.download_links.length > 0 && (
                <div className="flex gap-2 ml-auto">
                  {episode.download_links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                        link.quality === "HD"
                          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          : link.quality === "Medium"
                          ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                          : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                      )}
                    >
                      <Download className="w-4 h-4" />
                      {link.label || link.quality || "Download"}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Up Next Sidebar */}
        {upNextEpisodes.length > 0 && (
          <div className="lg:w-80 xl:w-96 space-y-3">
            <h3 className="text-lg font-semibold text-primary">Up Next</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {upNextEpisodes.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => onSelectEpisode?.(ep)}
                  className={cn(
                    "w-full flex gap-3 p-2 rounded-lg transition-colors text-left",
                    ep.id === episode.id 
                      ? "bg-primary/20 border border-primary/50" 
                      : "bg-card hover:bg-muted"
                  )}
                >
                  {/* Thumbnail with Lazy Loading - Smart fallback with Cloudinary */}
                  <div className="w-24 h-14 flex-shrink-0 bg-muted rounded overflow-hidden">
                    <LazyImage 
                      src={getEpisodeThumbnail(ep.thumbnail_url, ep.watch_url, showThumbnailUrl, showPosterUrl, defaultEpisodeThumb)} 
                      alt={ep.title}
                      fallbackSrc={defaultEpisodeThumb}
                      className="w-full h-full object-cover"
                      wrapperClassName="w-full h-full"
                    />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">
                      {formatDate(ep.air_date)}
                    </p>
                    <p className="font-medium text-foreground line-clamp-2 text-sm">
                      {ep.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                        E{ep.episode_number}
                      </span>
                      <span className="text-xs text-muted-foreground">23m</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
