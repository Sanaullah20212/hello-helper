import { useState, useEffect } from "react";
import { useSiteSettings, useUpdateSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Code, Globe, Search, Megaphone } from "lucide-react";

const AdsManagement = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();

  const [formData, setFormData] = useState({
    ads_enabled: true,
    ad_code_head: "",
    ad_code_body: "",
    ad_code_in_article: "",
    google_adsense_id: "",
    google_analytics_id: "",
    site_title: "Bengalitvserial24",
    site_description: "The best website to download Bengali serials and TV shows.",
    site_keywords: "Bengalitvserial,Bengalitvserial24,bengalitvserial24.com,bengali tv serial download",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        ads_enabled: settings.ads_enabled ?? true,
        ad_code_head: settings.ad_code_head || "",
        ad_code_body: settings.ad_code_body || "",
        ad_code_in_article: settings.ad_code_in_article || "",
        google_adsense_id: settings.google_adsense_id || "",
        google_analytics_id: settings.google_analytics_id || "",
        site_title: settings.site_title || "BTSPRO24",
        site_description: settings.site_description || "",
        site_keywords: settings.site_keywords || "",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(formData);
      toast({
        title: "সফল!",
        description: "সেটিংস আপডেট হয়েছে।",
      });
    } catch (error) {
      toast({
        title: "ত্রুটি",
        description: "সেটিংস আপডেট করতে সমস্যা হয়েছে।",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="ads" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ads" className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            বিজ্ঞাপন
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            SEO
          </TabsTrigger>
        </TabsList>

        {/* Ads Tab */}
        <TabsContent value="ads" className="space-y-4 mt-4">
          {/* Enable/Disable Ads */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">বিজ্ঞাপন সেটিংস</CardTitle>
              <CardDescription>সাইটে বিজ্ঞাপন দেখানো চালু/বন্ধ করুন</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="ads_enabled">বিজ্ঞাপন সক্রিয়</Label>
                <Switch
                  id="ads_enabled"
                  checked={formData.ads_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, ads_enabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Google IDs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Google সেটিংস
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="google_adsense_id">Google AdSense Publisher ID</Label>
                <Input
                  id="google_adsense_id"
                  placeholder="ca-pub-XXXXXXXXXX"
                  value={formData.google_adsense_id}
                  onChange={(e) => setFormData({ ...formData, google_adsense_id: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">AdSense থেকে পাওয়া Publisher ID দিন</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
                <Input
                  id="google_analytics_id"
                  placeholder="G-XXXXXXXXXX"
                  value={formData.google_analytics_id}
                  onChange={(e) => setFormData({ ...formData, google_analytics_id: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Google Analytics Measurement ID দিন</p>
              </div>
            </CardContent>
          </Card>

          {/* Ad Codes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Code className="w-5 h-5" />
                বিজ্ঞাপন কোড
              </CardTitle>
              <CardDescription>HTML/JavaScript বিজ্ঞাপন কোড পেস্ট করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ad_code_head">Head সেকশন কোড</Label>
                <Textarea
                  id="ad_code_head"
                  placeholder="<script>...</script> বা meta tags"
                  value={formData.ad_code_head}
                  onChange={(e) => setFormData({ ...formData, ad_code_head: e.target.value })}
                  rows={4}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">এই কোড &lt;head&gt; ট্যাগে যোগ হবে</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ad_code_body">Body বিজ্ঞাপন কোড</Label>
                <Textarea
                  id="ad_code_body"
                  placeholder="<ins class='adsbygoogle'...></ins>"
                  value={formData.ad_code_body}
                  onChange={(e) => setFormData({ ...formData, ad_code_body: e.target.value })}
                  rows={4}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">হোমপেইজ এবং প্রধান পেইজে দেখাবে</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ad_code_in_article">আর্টিকেল/কন্টেন্ট বিজ্ঞাপন</Label>
                <Textarea
                  id="ad_code_in_article"
                  placeholder="<ins class='adsbygoogle'...></ins>"
                  value={formData.ad_code_in_article}
                  onChange={(e) => setFormData({ ...formData, ad_code_in_article: e.target.value })}
                  rows={4}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">শো পেইজ এবং প্লেয়ার পেইজে দেখাবে</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SEO সেটিংস</CardTitle>
              <CardDescription>সার্চ ইঞ্জিন অপ্টিমাইজেশন সেটিংস</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site_title">সাইট টাইটেল</Label>
                <Input
                  id="site_title"
                  placeholder="BTSPRO24"
                  value={formData.site_title}
                  onChange={(e) => setFormData({ ...formData, site_title: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">ব্রাউজার ট্যাব এবং সার্চ রেজাল্টে দেখাবে</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_description">সাইট বিবরণ (Meta Description)</Label>
                <Textarea
                  id="site_description"
                  placeholder="বাংলা মুভি, সিরিয়াল এবং টিভি শো..."
                  value={formData.site_description}
                  onChange={(e) => setFormData({ ...formData, site_description: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">১৫০-১৬০ অক্ষরের মধ্যে রাখুন</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_keywords">কীওয়ার্ড (Meta Keywords)</Label>
                <Textarea
                  id="site_keywords"
                  placeholder="bangla movie, bangla serial, download..."
                  value={formData.site_keywords}
                  onChange={(e) => setFormData({ ...formData, site_keywords: e.target.value })}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">কমা দিয়ে আলাদা করুন</p>
              </div>
            </CardContent>
          </Card>

          {/* SEO Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SEO টিপস</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>প্রতিটি শো-এর জন্য ভালো বিবরণ লিখুন</li>
                <li>পোস্টার এবং থাম্বনেইল ইমেজে alt text যোগ করুন</li>
                <li>URL slug গুলো SEO ফ্রেন্ডলি রাখুন</li>
                <li>নিয়মিত নতুন কন্টেন্ট আপডেট করুন</li>
                <li>সাইটম্যাপ সার্চ কনসোলে সাবমিট করুন</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button onClick={handleSave} disabled={updateSettings.isPending} className="w-full">
        {updateSettings.isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}
      </Button>
    </div>
  );
};

export default AdsManagement;
