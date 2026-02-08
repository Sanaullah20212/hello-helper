import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { data: settings } = useSiteSettings();
  
  const logoUrl = settings?.logo_url;

  return (
    <footer className="bg-[#0a0312] border-t border-purple-900/30 mt-12">
      <div className="page-container py-8">
        <div className="flex flex-col items-center gap-4">
          {/* Logo */}
          <Link to="/" className="h-8 flex items-center">
            {logoUrl ? (
              <img src={logoUrl} alt="BTSPRO24" className="h-8 w-auto" />
            ) : (
              <span className="text-lg font-bold text-white">BTSPRO24</span>
            )}
          </Link>
          
          {/* Description */}
          <p className="text-purple-300/60 text-sm text-center max-w-md">
            The best website for downloading Bengali movies, serials and TV shows.
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-purple-900/20">
        <div className="page-container py-4">
          <p className="text-purple-300/50 text-sm text-center flex items-center justify-center gap-1">
            © {currentYear} BTSPRO24. Made with 
            <Heart className="w-4 h-4 text-red-500 fill-red-500" /> 
            All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;