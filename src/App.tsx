import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import AdManager from "./components/AdManager";
import Index from "./pages/Index";
import CategoryPage from "./pages/CategoryPage";
import SectionPage from "./pages/SectionPage";
import SearchPage from "./pages/SearchPage";
import ShowPage from "./pages/ShowPage";
import PlayerPage from "./pages/PlayerPage";
import FreeEpisodesPage from "./pages/FreeEpisodesPage";
import NotFound from "./pages/NotFound";
import AdminAuth from "./pages/AdminAuth";
import AdminPanel from "./pages/AdminPanel";
import PostPage from "./pages/PostPage";
import PostsPage from "./pages/PostsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AdManager>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/category/section/:slug" element={<CategoryPage />} />
            <Route path="/section/:slug" element={<SectionPage />} />
            <Route path="/free-episodes" element={<FreeEpisodesPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/admin/login" element={<AdminAuth />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/show/:slug" element={<ShowPage />} />
            <Route path="/watch/:showSlug/:episodeSlug" element={<PlayerPage />} />
            <Route path="/post/:slug" element={<PostPage />} />
            <Route path="/posts" element={<PostsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AdManager>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
