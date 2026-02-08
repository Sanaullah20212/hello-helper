import { useState, useRef } from "react";
import { useShows, useCreateShow, useUpdateShow, useDeleteShow, Show, uploadContentImage } from "@/hooks/useContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, Image, Loader2 } from "lucide-react";

const badgeOptions = [
  { value: "none", label: "কোনো ব্যাজ নেই" },
  { value: "new_episode", label: "নতুন এপিসোড" },
  { value: "new", label: "নতুন" },
  { value: "premium", label: "প্রিমিয়াম" },
  { value: "watch_for_free", label: "ফ্রি দেখুন" },
];

const ShowManagement = () => {
  const { data: shows, isLoading } = useShows();
  const createShow = useCreateShow();
  const updateShow = useUpdateShow();
  const deleteShow = useDeleteShow();

  const [isOpen, setIsOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [uploading, setUploading] = useState<"poster" | "thumbnail" | null>(null);

  const posterInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<{
    title: string;
    slug: string;
    description: string;
    poster_url: string;
    thumbnail_url: string;
    badge_type: 'new_episode' | 'watch_for_free' | 'new' | 'premium' | 'none';
    is_active: boolean;
  }>({
    title: "",
    slug: "",
    description: "",
    poster_url: "",
    thumbnail_url: "",
    badge_type: "none",
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      description: "",
      poster_url: "",
      thumbnail_url: "",
      badge_type: "none",
      is_active: true,
    });
    setEditingShow(null);
  };

  const openDialog = (show?: Show) => {
    if (show) {
      setEditingShow(show);
      setFormData({
        title: show.title,
        slug: show.slug,
        description: show.description || "",
        poster_url: show.poster_url || "",
        thumbnail_url: show.thumbnail_url || "",
        badge_type: show.badge_type || "none",
        is_active: show.is_active,
      });
    } else {
      resetForm();
    }
    setIsOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "poster" | "thumbnail") => {
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

    setUploading(type);
    try {
      const url = await uploadContentImage(file, type === "poster" ? "posters" : "thumbnails");
      setFormData(prev => ({
        ...prev,
        [type === "poster" ? "poster_url" : "thumbnail_url"]: url,
      }));
      toast.success(`${type === "poster" ? "পোস্টার" : "থাম্বনেইল"} আপলোড হয়েছে!`);
    } catch (error: any) {
      toast.error(error.message || "আপলোড ব্যর্থ হয়েছে");
    } finally {
      setUploading(null);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.slug) {
      toast.error("টাইটেল এবং স্লাগ দিতে হবে");
      return;
    }

    try {
      if (editingShow) {
        await updateShow.mutateAsync({ id: editingShow.id, ...formData });
        toast.success("শো আপডেট হয়েছে!");
      } else {
        await createShow.mutateAsync(formData);
        toast.success("শো তৈরি হয়েছে!");
      }
      setIsOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "সমস্যা হয়েছে");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত এই শো মুছে ফেলতে চান?")) return;
    try {
      await deleteShow.mutateAsync(id);
      toast.success("শো মুছে ফেলা হয়েছে!");
    } catch (error: any) {
      toast.error(error.message || "মুছতে সমস্যা হয়েছে");
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">শো ম্যানেজমেন্ট</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              নতুন শো
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingShow ? "শো এডিট করুন" : "নতুন শো যোগ করুন"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>টাইটেল *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setFormData({ 
                        ...formData, 
                        title,
                        slug: editingShow ? formData.slug : generateSlug(title),
                      });
                    }}
                    placeholder="শো এর নাম..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>স্লাগ *</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="show-slug"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>বিবরণ</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="শো এর বিবরণ..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Poster */}
                <div className="space-y-2">
                  <Label>পোস্টার (2:3)</Label>
                  <div className="space-y-3">
                    {formData.poster_url ? (
                      <div className="relative w-20 h-28 rounded overflow-hidden border border-border">
                        <img src={formData.poster_url} alt="Poster" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-28 rounded bg-muted flex items-center justify-center border border-border">
                        <Image className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <Input
                      value={formData.poster_url}
                      onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                      placeholder="ইমেজ URL দিন..."
                      className="text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        ref={posterInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "poster")}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => posterInputRef.current?.click()}
                        disabled={uploading === "poster"}
                      >
                        {uploading === "poster" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-1" />
                        )}
                        অথবা আপলোড
                      </Button>
                      {formData.poster_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData({ ...formData, poster_url: "" })}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Thumbnail */}
                <div className="space-y-2">
                  <Label>থাম্বনেইল (16:9)</Label>
                  <div className="space-y-3">
                    {formData.thumbnail_url ? (
                      <div className="relative w-28 h-16 rounded overflow-hidden border border-border">
                        <img src={formData.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-28 h-16 rounded bg-muted flex items-center justify-center border border-border">
                        <Image className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <Input
                      value={formData.thumbnail_url}
                      onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                      placeholder="ইমেজ URL দিন..."
                      className="text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "thumbnail")}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => thumbnailInputRef.current?.click()}
                        disabled={uploading === "thumbnail"}
                      >
                        {uploading === "thumbnail" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-1" />
                        )}
                        অথবা আপলোড
                      </Button>
                      {formData.thumbnail_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData({ ...formData, thumbnail_url: "" })}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ব্যাজ</Label>
                  <Select
                    value={formData.badge_type}
                    onValueChange={(value) => setFormData({ ...formData, badge_type: value as 'new_episode' | 'watch_for_free' | 'new' | 'premium' | 'none' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="ব্যাজ সিলেক্ট করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {badgeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>স্ট্যাটাস</Label>
                  <Select
                    value={formData.is_active ? "active" : "inactive"}
                    onValueChange={(value) => setFormData({ ...formData, is_active: value === "active" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">সক্রিয়</SelectItem>
                      <SelectItem value="inactive">নিষ্ক্রিয়</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  বাতিল
                </Button>
                <Button onClick={handleSubmit} disabled={createShow.isPending || updateShow.isPending}>
                  {createShow.isPending || updateShow.isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {shows && shows.length > 0 ? (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ইমেজ</TableHead>
                <TableHead>টাইটেল</TableHead>
                <TableHead>ব্যাজ</TableHead>
                <TableHead>স্ট্যাটাস</TableHead>
                <TableHead className="text-right">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shows.map((show) => (
                <TableRow key={show.id}>
                  <TableCell>
                    {show.poster_url || show.thumbnail_url ? (
                      <img
                        src={show.poster_url || show.thumbnail_url || ""}
                        alt={show.title}
                        className="w-10 h-14 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                        <Image className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{show.title}</TableCell>
                  <TableCell>
                    {show.badge_type && show.badge_type !== "none" ? (
                      <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary">
                        {badgeOptions.find(b => b.value === show.badge_type)?.label}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded ${show.is_active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>
                      {show.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(show)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(show.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
          <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>কোনো শো নেই। নতুন শো যোগ করুন।</p>
        </div>
      )}
    </div>
  );
};

export default ShowManagement;
