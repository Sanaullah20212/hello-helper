import { Search, X, Menu, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: settings, isLoading } = useSiteSettings();
  
  const logoUrl = settings?.logo_url;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/category/star-jalsha", label: "TV Shows" },
    { href: "/category/bangla-dabbed-movie", label: "Movies" },
    { href: "/category/zee-bangla", label: "Web Series" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <header className="bg-[#0f0617] sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="shrink-0 h-8 md:h-9 flex items-center">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Bengalitvserial24" 
                className="h-8 md:h-9 w-auto"
              />
            ) : (
              <span className="text-lg font-bold text-white">Bengalitvserial24</span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-purple-400 border-b-2 border-purple-400"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-[200px] sm:max-w-sm lg:max-w-md">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for Movies, Shows, Channels etc."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 rounded-full bg-[#1a1025] border border-gray-600/50 focus:border-purple-500 focus:outline-none transition-all text-sm text-white placeholder:text-gray-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* Right Side Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {/* Login Button */}
            <button className="px-4 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 rounded transition-colors">
              LOGIN
            </button>

            {/* Buy Plan Button */}
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#0f0617] bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 rounded transition-all">
              <ShoppingCart className="w-4 h-4" />
              BUY PLAN
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden mt-4 pt-4 border-t border-white/10 animate-slide-up">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive(link.href)
                      ? "text-purple-400 bg-purple-500/10"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Mobile Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                <button className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 rounded transition-colors">
                  LOGIN
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#0f0617] bg-gradient-to-r from-amber-400 to-amber-500 rounded transition-all">
                  <ShoppingCart className="w-4 h-4" />
                  BUY PLAN
                </button>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
