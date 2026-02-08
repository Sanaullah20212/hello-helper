import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Plus,
  Save,
  Trash2,
  ArrowLeft,
  FileText,
  Search,
  Loader2,
  Calendar,
  Eye,
  Edit3,
  Globe,
  FileEdit,
} from "lucide-react";
import WordPressEditor from "./WordPressEditor";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image_url: string;
  category_id: string | null;
  status: string;
  meta_title: string;
  meta_description: string;
  tags: string[];
  view_count: number;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const PostManagement = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    featured_image_url: "",
    category_id: "",
    status: "draft",
    meta_title: "",
    meta_description: "",
    tags: "",
  });

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      toast.error("পোস্ট লোড করতে ব্যর্থ");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("content_categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Category fetch error:", error);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [fetchPosts, fetchCategories]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      featured_image_url: "",
      category_id: "",
      status: "draft",
      meta_title: "",
      meta_description: "",
      tags: "",
    });
    setEditingPost(null);
    setIsCreating(false);
  };

  const startEditing = (post: Post) => {
    setEditingPost(post);
    setIsCreating(false);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content || "",
      excerpt: post.excerpt || "",
      featured_image_url: post.featured_image_url || "",
      category_id: post.category_id || "",
      status: post.status,
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
      tags: (post.tags || []).join(", "),
    });
  };

  const startCreating = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("পোস্টের টাইটেল দিন");
      return;
    }
    if (!formData.slug.trim()) {
      toast.error("পোস্টের স্লাগ দিন");
      return;
    }

    setSaving(true);
    try {
      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const postData = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt,
        featured_image_url: formData.featured_image_url,
        category_id: formData.category_id || null,
        status: formData.status,
        meta_title: formData.meta_title,
        meta_description: formData.meta_description,
        tags: tagsArray,
      };

      if (editingPost) {
        const { error } = await supabase
          .from("posts")
          .update(postData)
          .eq("id", editingPost.id);
        if (error) throw error;
        toast.success("পোস্ট আপডেট হয়েছে!");
      } else {
        const { error } = await supabase.from("posts").insert(postData);
        if (error) throw error;
        toast.success("নতুন পোস্ট তৈরি হয়েছে!");
      }

      resetForm();
      fetchPosts();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "পোস্ট সেভ করতে ব্যর্থ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("এই পোস্ট মুছে ফেলতে চান?")) return;

    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
      toast.success("পোস্ট মুছে ফেলা হয়েছে");
      if (editingPost?.id === postId) resetForm();
      fetchPosts();
    } catch (error: any) {
      toast.error("পোস্ট মুছতে ব্যর্থ");
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || post.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    draft: posts.filter((p) => p.status === "draft").length,
    trash: posts.filter((p) => p.status === "trash").length,
  };

  // Editor view
  if (isCreating || editingPost) {
    return (
      <div className="space-y-6">
        {/* Editor Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              পোস্ট লিস্ট
            </Button>
            <h2 className="text-lg font-semibold">
              {editingPost ? "পোস্ট সম্পাদনা" : "নতুন পোস্ট"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">ড্রাফট</SelectItem>
                <SelectItem value="published">পাবলিশড</SelectItem>
                <SelectItem value="trash">ট্র্যাশ</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {formData.status === "published" ? "পাবলিশ করুন" : "সেভ করুন"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Title */}
            <Input
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="পোস্টের শিরোনাম লিখুন"
              className="text-xl font-bold h-14 border-border"
            />

            {/* Slug */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="w-3.5 h-3.5" />
              <span>Permalink:</span>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="h-7 text-xs max-w-xs"
              />
            </div>

            {/* WordPress Editor */}
            <WordPressEditor
              content={formData.content}
              onChange={(html) => setFormData({ ...formData, content: html })}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Category */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">ক্যাটাগরি</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.category_id || "none"}
                  onValueChange={(v) => setFormData({ ...formData, category_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ক্যাটাগরি সিলেক্ট করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">কোনো ক্যাটাগরি নেই</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">ফিচার্ড ইমেজ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {formData.featured_image_url && (
                  <div className="rounded-lg overflow-hidden border border-border">
                    <img
                      src={formData.featured_image_url}
                      alt="Featured"
                      className="w-full h-40 object-cover"
                    />
                  </div>
                )}
                <Input
                  value={formData.featured_image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, featured_image_url: e.target.value })
                  }
                  placeholder="ইমেজ URL দিন"
                />
              </CardContent>
            </Card>

            {/* Excerpt */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">সারসংক্ষেপ (Excerpt)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="পোস্টের সংক্ষিপ্ত বিবরণ..."
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">ট্যাগ</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="কমা দিয়ে আলাদা করুন"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  যেমন: bangla, serial, movie
                </p>
              </CardContent>
            </Card>

            {/* SEO */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">SEO সেটিংস</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Meta Title</Label>
                  <Input
                    value={formData.meta_title}
                    onChange={(e) =>
                      setFormData({ ...formData, meta_title: e.target.value })
                    }
                    placeholder="SEO Title"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Meta Description</Label>
                  <Textarea
                    value={formData.meta_description}
                    onChange={(e) =>
                      setFormData({ ...formData, meta_description: e.target.value })
                    }
                    placeholder="SEO Description"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Post List view
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileEdit className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>WordPress পোস্ট ম্যানেজমেন্ট</CardTitle>
                <p className="text-sm text-muted-foreground">
                  পোস্ট তৈরি, সম্পাদনা ও প্রকাশ করুন
                </p>
              </div>
            </div>
            <Button onClick={startCreating}>
              <Plus className="w-4 h-4 mr-2" />
              নতুন পোস্ট
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          {(["all", "published", "draft", "trash"] as const).map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterStatus(status)}
            >
              {status === "all" && "সব"}
              {status === "published" && "পাবলিশড"}
              {status === "draft" && "ড্রাফট"}
              {status === "trash" && "ট্র্যাশ"}
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {statusCounts[status]}
              </Badge>
            </Button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="পোস্ট খুঁজুন..."
            className="pl-9 w-64"
          />
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>কোনো পোস্ট নেই</p>
            <Button variant="link" onClick={startCreating} className="mt-2">
              নতুন পোস্ট তৈরি করুন
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredPosts.map((post) => (
            <Card
              key={post.id}
              className="hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => startEditing(post)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  {post.featured_image_url ? (
                    <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0 border border-border">
                      <img
                        src={post.featured_image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{post.title}</h3>
                      <Badge
                        variant={
                          post.status === "published"
                            ? "default"
                            : post.status === "draft"
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-[10px] flex-shrink-0"
                      >
                        {post.status === "published" && "পাবলিশড"}
                        {post.status === "draft" && "ড্রাফট"}
                        {post.status === "trash" && "ট্র্যাশ"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.created_at).toLocaleDateString("bn-BD")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.view_count} ভিউ
                      </span>
                      {post.slug && (
                        <span className="truncate max-w-[200px]">/{post.slug}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(post);
                      }}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(post.id);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostManagement;
