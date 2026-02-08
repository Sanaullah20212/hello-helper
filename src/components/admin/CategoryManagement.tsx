import { useState, useRef } from "react";
import { useContentCategories } from "@/hooks/useContent";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Upload, X, Image as ImageIcon } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";

interface CategoryFormData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
}

const initialFormData: CategoryFormData = {
  name: "",
  slug: "",
  description: "",
  image_url: "",
  display_order: 0,
  is_active: true,
};

const CategoryManagement = () => {
  const { data: categories, isLoading } = useContentCategories();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch sections for dropdown
  const { data: sections } = useQuery({
    queryKey: ["content-sections-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_sections")
        .select("id, title, slug")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: formData.id ? formData.slug : generateSlug(name),
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("শুধুমাত্র ইমেজ ফাইল আপলোড করা যাবে");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("ফাইল সাইজ ২MB এর বেশি হতে পারবে না");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `categories/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("content-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("content-images")
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: urlData.publicUrl });
      toast.success("ইমেজ আপলোড হয়েছে!");
    } catch (error: any) {
      toast.error(error.message || "ইমেজ আপলোড ব্যর্থ হয়েছে");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("ক্যাটাগরি নাম দিন");
      return;
    }

    setSaving(true);
    try {
      if (formData.id) {
        // Update
        const { error } = await supabase
          .from("content_categories")
          .update({
            name: formData.name,
            slug: formData.slug,
            description: formData.description || null,
            image_url: formData.image_url || null,
            display_order: formData.display_order,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", formData.id);

        if (error) throw error;
        toast.success("ক্যাটাগরি আপডেট হয়েছে!");
      } else {
        // Create
        const { error } = await supabase.from("content_categories").insert({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          image_url: formData.image_url || null,
          display_order: formData.display_order,
          is_active: formData.is_active,
        });

        if (error) throw error;
        toast.success("নতুন ক্যাটাগরি তৈরি হয়েছে!");
      }

      queryClient.invalidateQueries({ queryKey: ["content-categories"] });
      setDialogOpen(false);
      setFormData(initialFormData);
    } catch (error: any) {
      toast.error(error.message || "সেভ ব্যর্থ হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: any) => {
    setFormData({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image_url: category.image_url || "",
      display_order: category.display_order || 0,
      is_active: category.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই ক্যাটাগরি ডিলিট করতে চান?")) return;

    try {
      const { error } = await supabase
        .from("content_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("ক্যাটাগরি ডিলিট হয়েছে!");
      queryClient.invalidateQueries({ queryKey: ["content-categories"] });
    } catch (error: any) {
      toast.error(error.message || "ডিলিট ব্যর্থ হয়েছে");
    }
  };

  const handleAddNew = () => {
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          লোড হচ্ছে...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          ক্যাটাগরি ম্যানেজমেন্ট
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              নতুন ক্যাটাগরি
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {formData.id ? "ক্যাটাগরি এডিট করুন" : "নতুন ক্যাটাগরি"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>ক্যাটাগরি ইমেজ/লোগো</Label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-2 border-border overflow-hidden">
                      {formData.image_url ? (
                        <img
                          src={formData.image_url}
                          alt="Category"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {formData.image_url && (
                      <button
                        onClick={() => setFormData({ ...formData, image_url: "" })}
                        className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div>
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
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "আপলোড হচ্ছে..." : "আপলোড"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                     সম্পূর্ণ লোগো দেখা যাবে, কাটবে না
                    </p>
                  </div>
                </div>
              </div>

              {/* Or URL input */}
              <div className="space-y-2">
                <Label>অথবা ইমেজ URL দিন</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="space-y-2">
                <Label>ক্যাটাগরি নাম *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="যেমন: Star Jalsha"
                />
              </div>

              <div className="space-y-2">
                <Label>Slug (সেকশন থেকে সিলেক্ট করুন অথবা নিজে লিখুন)</Label>
                <Select
                  value={formData.slug.startsWith("section/") ? formData.slug : "custom"}
                  onValueChange={(value) => {
                    if (value !== "custom") {
                      setFormData({ ...formData, slug: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="সেকশন সিলেক্ট করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">কাস্টম স্লাগ</SelectItem>
                    {sections?.map((section) => (
                      <SelectItem key={section.id} value={`section/${section.slug}`}>
                        section/{section.slug} ({section.title})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!formData.slug.startsWith("section/") && (
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="star-jalsha"
                    className="mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  বাতিল
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {categories && categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="relative group bg-secondary/30 rounded-xl p-4 text-center hover:bg-secondary/50 transition-colors"
              >
                {/* Category Image */}
                <div className="w-16 h-16 mx-auto rounded-full overflow-hidden mb-3">
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Category Name */}
                <p className="text-sm font-medium truncate">{category.name}</p>
                <p className="text-xs text-muted-foreground">{category.slug}</p>

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>কোনো ক্যাটাগরি নেই</p>
            <p className="text-sm">উপরের বাটনে ক্লিক করে নতুন ক্যাটাগরি যোগ করুন</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryManagement;
