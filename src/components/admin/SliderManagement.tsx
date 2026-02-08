import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, GripVertical, Image as ImageIcon, Upload, ExternalLink } from "lucide-react";
import { useShows } from "@/hooks/useContent";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  link_text: string | null;
  display_order: number;
  is_active: boolean;
  show_id: string | null;
}

const SliderManagement = () => {
  const queryClient = useQueryClient();
  const { data: shows } = useShows();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    link_url: "",
    link_text: "দেখুন",
    show_id: "",
    is_active: true,
  });

  // Fetch slides
  const { data: slides, isLoading } = useQuery({
    queryKey: ["hero-slides-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as HeroSlide[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const slideData = {
        title: data.title,
        subtitle: data.subtitle || null,
        image_url: data.image_url,
        link_url: data.link_url || null,
        link_text: data.link_text || "দেখুন",
        show_id: data.show_id || null,
        is_active: data.is_active,
        display_order: slides?.length || 0,
      };

      if (data.id) {
        const { error } = await supabase
          .from("hero_slides")
          .update(slideData)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("hero_slides")
          .insert(slideData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-slides-admin"] });
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast.success(editingSlide ? "স্লাইড আপডেট হয়েছে" : "স্লাইড যোগ হয়েছে");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hero_slides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-slides-admin"] });
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast.success("স্লাইড মুছে ফেলা হয়েছে");
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("hero_slides")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-slides-admin"] });
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("শুধুমাত্র ইমেজ ফাইল আপলোড করা যাবে");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("ফাইল সাইজ ৫MB এর বেশি হতে পারবে না");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `slide-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("content-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("content-images")
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: urlData.publicUrl });
      toast.success("ইমেজ আপলোড হয়েছে");
    } catch (error: any) {
      toast.error(error.message || "আপলোড ব্যর্থ হয়েছে");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle || "",
      image_url: slide.image_url,
      link_url: slide.link_url || "",
      link_text: slide.link_text || "দেখুন",
      show_id: slide.show_id || "",
      is_active: slide.is_active,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      image_url: "",
      link_url: "",
      link_text: "দেখুন",
      show_id: "",
      is_active: true,
    });
    setEditingSlide(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.image_url) {
      toast.error("টাইটেল এবং ইমেজ আবশ্যক");
      return;
    }
    saveMutation.mutate({
      ...formData,
      id: editingSlide?.id,
    });
  };

  // Auto-fill from show
  const handleShowSelect = (showId: string) => {
    if (showId === "none") {
      setFormData({ ...formData, show_id: "" });
      return;
    }
    const show = shows?.find((s) => s.id === showId);
    if (show) {
      setFormData({
        ...formData,
        show_id: showId,
        title: formData.title || show.title,
        image_url: formData.image_url || show.thumbnail_url || show.poster_url || "",
        link_url: `/show/${show.slug}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">হিরো স্লাইডার</h2>
          <p className="text-sm text-muted-foreground">হোমপেইজের স্লাইডার ম্যানেজ করুন</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              স্লাইড যোগ করুন
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSlide ? "স্লাইড এডিট করুন" : "নতুন স্লাইড"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pb-2">
              {/* Show Selection */}
              <div className="space-y-2">
                <Label>শো থেকে লিংক করুন (অপশনাল)</Label>
                <Select value={formData.show_id || "none"} onValueChange={handleShowSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="শো সিলেক্ট করুন..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">কোনো শো নয়</SelectItem>
                    {shows?.map((show) => (
                      <SelectItem key={show.id} value={show.id}>
                        {show.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>টাইটেল *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="স্লাইড টাইটেল"
                />
              </div>

              {/* Subtitle */}
              <div className="space-y-2">
                <Label>সাবটাইটেল</Label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="ছোট বর্ণনা"
                />
              </div>

              {/* Image */}
              <div className="space-y-2">
                <Label>ইমেজ URL *</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                    className="flex-1"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                {formData.image_url && (
                  <div className="mt-2 aspect-video max-w-[200px] rounded overflow-hidden bg-muted">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Link */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>লিংক URL</Label>
                  <Input
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="/show/slug"
                  />
                </div>
                <div className="space-y-2">
                  <Label>বাটন টেক্সট</Label>
                  <Input
                    value={formData.link_text}
                    onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                    placeholder="দেখুন"
                  />
                </div>
              </div>

              {/* Active */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <Label>একটিভ</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  বাতিল
                </Button>
                <Button type="submit" disabled={saveMutation.isPending} className="flex-1">
                  {saveMutation.isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Slides Table */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">লোড হচ্ছে...</div>
      ) : slides?.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground mb-4">কোনো স্লাইড নেই</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            প্রথম স্লাইড যোগ করুন
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead className="w-24">ইমেজ</TableHead>
                <TableHead>টাইটেল</TableHead>
                <TableHead>লিংক</TableHead>
                <TableHead className="w-20">স্ট্যাটাস</TableHead>
                <TableHead className="w-24 text-right">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slides?.map((slide, index) => (
                <TableRow key={slide.id}>
                  <TableCell className="text-muted-foreground">
                    <GripVertical className="w-4 h-4" />
                  </TableCell>
                  <TableCell>
                    <div className="w-20 h-12 rounded overflow-hidden bg-muted">
                      <img
                        src={slide.image_url}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{slide.title}</p>
                      {slide.subtitle && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{slide.subtitle}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {slide.link_url && (
                      <span className="text-sm text-primary flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {slide.link_url}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={slide.is_active}
                      onCheckedChange={(checked) =>
                        toggleActiveMutation.mutate({ id: slide.id, is_active: checked })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(slide)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("মুছে ফেলতে চান?")) {
                            deleteMutation.mutate(slide.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default SliderManagement;
