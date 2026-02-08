import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings, useUpdateSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, LogOut, Settings, Crown, Bell, ExternalLink, ImageIcon, Upload, X, Film, LayoutGrid, Play, FileUp, Image, Clock, Megaphone, Folder, BarChart3, FileEdit, FileDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import defaultLogo from "@/assets/logo.png";
import ShowManagement from "@/components/admin/ShowManagement";
import SectionManagement from "@/components/admin/SectionManagement";
import EpisodeManagement from "@/components/admin/EpisodeManagement";
import BulkImport from "@/components/admin/BulkImport";
import SliderManagement from "@/components/admin/SliderManagement";
import AdsManagement from "@/components/admin/AdsManagement";
import CategoryManagement from "@/components/admin/CategoryManagement";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import PostManagement from "@/components/admin/PostManagement";
import WordPressImport from "@/components/admin/WordPressImport";

const AdminPanel = () => {
  const { user, isAdmin, adminChecked, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    premium_banner_text: "",
    premium_banner_button_text: "",
    premium_banner_link: "",
    notice_banner_text: "",
    notice_banner_link_text: "",
    notice_banner_link: "",
    logo_url: "",
    latest_episodes_title: "Latest Free Episodes | ফ্রি এপিসোড",
    latest_episodes_limit: 15,
    latest_episodes_enabled: true,
  });

  useEffect(() => {
    if (!loading && adminChecked && (!user || !isAdmin)) {
      navigate("/admin/login");
    }
  }, [user, isAdmin, adminChecked, loading, navigate]);

  useEffect(() => {
    if (settings) {
      setFormData({
        premium_banner_text: settings.premium_banner_text,
        premium_banner_button_text: settings.premium_banner_button_text,
        premium_banner_link: settings.premium_banner_link,
        notice_banner_text: settings.notice_banner_text,
        notice_banner_link_text: settings.notice_banner_link_text,
        notice_banner_link: settings.notice_banner_link,
        logo_url: settings.logo_url || "",
        latest_episodes_title: settings.latest_episodes_title || "Latest Free Episodes | ফ্রি এপিসোড",
        latest_episodes_limit: settings.latest_episodes_limit || 15,
        latest_episodes_enabled: settings.latest_episodes_enabled ?? true,
      });
    }
  }, [settings]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("শুধুমাত্র ইমেজ ফাইল আপলোড করা যাবে");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("ফাইল সাইজ ২MB এর বেশি হতে পারবে না");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

      setFormData({ ...formData, logo_url: urlData.publicUrl });
      toast.success("লোগো আপলোড হয়েছে!");
    } catch (error: any) {
      toast.error(error.message || "লোগো আপলোড ব্যর্থ হয়েছে");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logo_url: "" });
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(formData);
      toast.success("Settings saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              View Site <ExternalLink className="w-3 h-3" />
            </a>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <Tabs defaultValue="analytics" orientation="vertical" className="flex min-h-[calc(100vh-57px)]">
        {/* Sidebar */}
        <TabsList className="flex flex-col h-auto items-stretch gap-1 rounded-none border-r border-border bg-card p-2 w-[200px] shrink-0 justify-start">
          <TabsTrigger value="analytics" className="justify-start gap-2 px-3 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <BarChart3 className="w-4 h-4" />
            অ্যানালিটিক্স
          </TabsTrigger>
          <TabsTrigger value="content" className="justify-start gap-2 px-3 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Film className="w-4 h-4" />
            শো
          </TabsTrigger>
          <TabsTrigger value="episodes" className="justify-start gap-2 px-3 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Play className="w-4 h-4" />
            এপিসোড
          </TabsTrigger>
          <TabsTrigger value="bulk" className="justify-start gap-2 px-3 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <FileUp className="w-4 h-4" />
            বাল্ক
          </TabsTrigger>
          <TabsTrigger value="posts" className="justify-start gap-2 px-3 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <FileEdit className="w-4 h-4" />
            পোস্ট
          </TabsTrigger>
          <TabsTrigger value="slider" className="justify-start gap-2 px-3 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Image className="w-4 h-4" />
            স্লাইডার
          </TabsTrigger>
          <TabsTrigger value="sections" className="justify-start gap-2 px-3 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <LayoutGrid className="w-4 h-4" />
            সেকশন
          </TabsTrigger>
          <TabsTrigger value="categories" className="justify-start gap-2 px-3 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Folder className="w-4 h-4" />
            ক্যাটাগরি
          </TabsTrigger>
          <TabsTrigger value="ads" className="justify-start gap-2 px-3 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Megaphone className="w-4 h-4" />
            বিজ্ঞাপন
          </TabsTrigger>
          <TabsTrigger value="wp-import" className="justify-start gap-2 px-3 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <FileDown className="w-4 h-4" />
            ইম্পোর্ট
          </TabsTrigger>
          <TabsTrigger value="settings" className="justify-start gap-2 px-3 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Settings className="w-4 h-4" />
            সেটিংস
          </TabsTrigger>
        </TabsList>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="content">
            <ShowManagement />
          </TabsContent>

          <TabsContent value="episodes">
            <EpisodeManagement />
          </TabsContent>

          <TabsContent value="bulk">
            <BulkImport />
          </TabsContent>

          <TabsContent value="posts">
            <PostManagement />
          </TabsContent>


          <TabsContent value="slider">
            <SliderManagement />
          </TabsContent>

          <TabsContent value="sections">
            <SectionManagement />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="ads">
            <AdsManagement />
          </TabsContent>

          <TabsContent value="wp-import">
            <WordPressImport />
          </TabsContent>

          <TabsContent value="settings" className="space-y-8">
            {/* Site Logo Section */}
            <section className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ImageIcon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">সাইট লোগো</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  {/* Logo Preview */}
                  <div className="relative">
                    <div className="w-40 h-16 bg-secondary/50 rounded-lg flex items-center justify-center overflow-hidden border border-border">
                      <img 
                        src={formData.logo_url || defaultLogo} 
                        alt="Site Logo" 
                        className="max-h-12 w-auto object-contain"
                      />
                    </div>
                    {formData.logo_url && (
                      <button
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "আপলোড হচ্ছে..." : "লোগো আপলোড করুন"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, GIF (সর্বোচ্চ ২MB). প্রস্তাবিত সাইজ: 150x40px
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Premium Banner Section */}
            <section className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Crown className="w-5 h-5 text-accent" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Premium Banner</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Banner Text</Label>
                  <Textarea
                    value={formData.premium_banner_text}
                    onChange={(e) => setFormData({ ...formData, premium_banner_text: e.target.value })}
                    placeholder="Enter banner text..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input
                      value={formData.premium_banner_button_text}
                      onChange={(e) => setFormData({ ...formData, premium_banner_button_text: e.target.value })}
                      placeholder="Button text..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Button Link</Label>
                    <Input
                      value={formData.premium_banner_link}
                      onChange={(e) => setFormData({ ...formData, premium_banner_link: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Notice Banner Section */}
            <section className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Notice Banner</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Notice Text</Label>
                  <Textarea
                    value={formData.notice_banner_text}
                    onChange={(e) => setFormData({ ...formData, notice_banner_text: e.target.value })}
                    placeholder="Enter notice text..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Link Text</Label>
                    <Input
                      value={formData.notice_banner_link_text}
                      onChange={(e) => setFormData({ ...formData, notice_banner_link_text: e.target.value })}
                      placeholder="Link text..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Link URL</Label>
                    <Input
                      value={formData.notice_banner_link}
                      onChange={(e) => setFormData({ ...formData, notice_banner_link: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Latest Free Episodes Section */}
            <section className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Clock className="w-5 h-5 text-green-500" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Latest Free Episodes সেকশন</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>সেকশন চালু/বন্ধ</Label>
                    <p className="text-xs text-muted-foreground">হোমপেইজে এই সেকশন দেখাবে কি না</p>
                  </div>
                  <Switch
                    checked={formData.latest_episodes_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, latest_episodes_enabled: checked })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>সেকশন টাইটেল</Label>
                    <Input
                      value={formData.latest_episodes_title}
                      onChange={(e) => setFormData({ ...formData, latest_episodes_title: e.target.value })}
                      placeholder="Latest Free Episodes..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>কতটি এপিসোড দেখাবে</Label>
                    <Input
                      type="number"
                      min={5}
                      max={30}
                      value={formData.latest_episodes_limit}
                      onChange={(e) => setFormData({ ...formData, latest_episodes_limit: parseInt(e.target.value) || 15 })}
                    />
                  </div>
                </div>
              </div>
            </section>
            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={updateSettings.isPending} size="lg">
                <Save className="w-4 h-4 mr-2" />
                {updateSettings.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
