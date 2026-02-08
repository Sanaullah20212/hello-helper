import { useState, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Upload, CheckCircle2, AlertCircle, Loader2, FileUp, FolderPlus,
  Trash2, FileText, Tag, Image as ImageIcon
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WPCategory {
  name: string;
  slug: string;
  description: string;
  selected: boolean;
  existingId?: string;
}

interface WPPost {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  date: string;
  status: string;
  categories: string[];
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  selected: boolean;
}

// Parse WordPress WXR XML
function parseWXR(xmlString: string): { categories: WPCategory[]; posts: WPPost[] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "text/xml");

  // Check for parse errors
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error("Invalid XML file. Please upload a valid WordPress export file.");
  }

  const categories: WPCategory[] = [];
  const posts: WPPost[] = [];

  // Extract categories from wp:category elements
  const wpCategories = doc.querySelectorAll("channel > *");
  wpCategories.forEach((node) => {
    if (node.nodeName === "wp:category") {
      const name = node.querySelector("cat_name")?.textContent ||
        getWPCData(node, "wp:cat_name") || "";
      const slug = node.querySelector("category_nicename")?.textContent ||
        getWPCData(node, "wp:category_nicename") || "";
      if (name) {
        categories.push({
          name: decodeHTMLEntities(name),
          slug: slug || slugify(name),
          description: "",
          selected: true,
        });
      }
    }
  });

  // Extract posts from item elements
  const items = doc.querySelectorAll("item");
  items.forEach((item) => {
    const postType = getWPText(item, "wp:post_type");
    if (postType !== "post") return; // Only import posts

    const status = getWPText(item, "wp:status");
    const title = item.querySelector("title")?.textContent || "";
    const contentEncoded = getCDataContent(item, "content:encoded") || "";
    const excerptEncoded = getCDataContent(item, "excerpt:encoded") || "";
    const slug = getWPText(item, "wp:post_name") || slugify(title);
    const pubDate = item.querySelector("pubDate")?.textContent || "";

    // Extract categories assigned to the post
    const postCategories: string[] = [];
    const postTags: string[] = [];
    item.querySelectorAll("category").forEach((cat) => {
      const domain = cat.getAttribute("domain");
      const text = cat.textContent || "";
      if (domain === "category") postCategories.push(text);
      else if (domain === "post_tag") postTags.push(text);
    });

    // Extract featured image from wp:postmeta or content
    let featuredImage = "";
    // Try to find attachment URL in post meta
    const metaNodes = item.querySelectorAll("*");
    metaNodes.forEach((meta) => {
      if (meta.nodeName === "wp:postmeta") {
        const key = getWPText(meta, "wp:meta_key");
        if (key === "_thumbnail_url" || key === "_wp_attached_file") {
          featuredImage = getWPText(meta, "wp:meta_value") || "";
        }
      }
    });

    // Fallback: extract first image from content
    if (!featuredImage) {
      const imgMatch = contentEncoded.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) featuredImage = imgMatch[1];
    }

    posts.push({
      title: decodeHTMLEntities(title),
      slug: decodeURIComponent(slug),
      content: contentEncoded,
      excerpt: excerptEncoded,
      featuredImage,
      date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      status: status === "publish" ? "published" : "draft",
      categories: postCategories,
      tags: postTags,
      metaTitle: "",
      metaDescription: excerptEncoded.slice(0, 160),
      selected: true,
    });
  });

  return { categories, posts };
}

// Helper functions for XML parsing
function getWPText(parent: Element, tagName: string): string {
  const parts = tagName.split(":");
  const nodes = parent.childNodes;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.nodeName === tagName) {
      return node.textContent || "";
    }
  }
  return "";
}

function getWPCData(parent: Element, tagName: string): string {
  const nodes = parent.childNodes;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.nodeName === tagName) {
      // Get CDATA content
      for (let j = 0; j < node.childNodes.length; j++) {
        if (node.childNodes[j].nodeType === 4) { // CDATA_SECTION_NODE
          return node.childNodes[j].nodeValue || "";
        }
      }
      return node.textContent || "";
    }
  }
  return "";
}

function getCDataContent(parent: Element, tagName: string): string {
  const nodes = parent.childNodes;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.nodeName === tagName) {
      // Prefer CDATA, fallback to textContent
      for (let j = 0; j < node.childNodes.length; j++) {
        if (node.childNodes[j].nodeType === 4) {
          return node.childNodes[j].nodeValue || "";
        }
      }
      return node.textContent || "";
    }
  }
  return "";
}

function decodeHTMLEntities(text: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const WordPressImport = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedCategories, setParsedCategories] = useState<WPCategory[]>([]);
  const [parsedPosts, setParsedPosts] = useState<WPPost[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState("");
  const [skipExisting, setSkipExisting] = useState(true);
  const [importStep, setImportStep] = useState<"upload" | "preview" | "importing" | "done">("upload");

  // Fetch existing categories
  const { data: existingCategories } = useQuery({
    queryKey: ["content-categories-import"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_categories")
        .select("id, name, slug");
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing post slugs
  const { data: existingPosts } = useQuery({
    queryKey: ["existing-post-slugs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, slug");
      if (error) throw error;
      return data;
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xml")) {
      toast.error("শুধুমাত্র .xml ফাইল আপলোড করুন (WordPress Export)");
      return;
    }

    setIsParsing(true);
    try {
      const text = await file.text();
      const { categories, posts } = parseWXR(text);

      // Mark existing categories
      const catsWithExisting = categories.map((cat) => {
        const existing = existingCategories?.find(
          (ec) => ec.slug === cat.slug || ec.name.toLowerCase() === cat.name.toLowerCase()
        );
        return { ...cat, existingId: existing?.id };
      });

      setParsedCategories(catsWithExisting);
      setParsedPosts(posts);
      setImportStep("preview");

      toast.success(
        `${posts.length}টি পোস্ট এবং ${categories.length}টি ক্যাটাগরি পাওয়া গেছে`
      );
    } catch (err: any) {
      toast.error(err.message || "XML পার্সিং এ সমস্যা হয়েছে");
    } finally {
      setIsParsing(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleCategory = (index: number) => {
    setParsedCategories((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  };

  const togglePost = (index: number) => {
    setParsedPosts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  };

  const toggleAllPosts = (selected: boolean) => {
    setParsedPosts((prev) => prev.map((p) => ({ ...p, selected })));
  };

  const startImport = async () => {
    setImportStep("importing");
    setImportProgress(0);

    try {
      // Step 1: Import categories
      const selectedCats = parsedCategories.filter((c) => c.selected && !c.existingId);
      const categoryMap: Record<string, string> = {};

      // Map existing categories first
      parsedCategories.forEach((cat) => {
        if (cat.existingId) {
          categoryMap[cat.name] = cat.existingId;
        }
      });

      if (selectedCats.length > 0) {
        setImportStatus(`${selectedCats.length}টি নতুন ক্যাটাগরি তৈরি হচ্ছে...`);

        for (let i = 0; i < selectedCats.length; i++) {
          const cat = selectedCats[i];
          const { data, error } = await supabase
            .from("content_categories")
            .insert({
              name: cat.name,
              slug: cat.slug,
              description: cat.description || null,
              is_active: true,
            })
            .select("id")
            .single();

          if (error) {
            console.error("Category import error:", error);
            // Try to find if it exists now
            const { data: existing } = await supabase
              .from("content_categories")
              .select("id")
              .eq("slug", cat.slug)
              .maybeSingle();
            if (existing) {
              categoryMap[cat.name] = existing.id;
            }
          } else if (data) {
            categoryMap[cat.name] = data.id;
          }

          setImportProgress(((i + 1) / selectedCats.length) * 20);
        }
      }

      // Step 2: Import posts
      const selectedPosts = parsedPosts.filter((p) => p.selected);
      const existingSlugs = new Set(existingPosts?.map((p) => p.slug) || []);

      let importedCount = 0;
      let skippedCount = 0;

      setImportStatus(`${selectedPosts.length}টি পোস্ট ইম্পোর্ট হচ্ছে...`);

      // Batch import in chunks of 20
      const BATCH_SIZE = 20;
      for (let i = 0; i < selectedPosts.length; i += BATCH_SIZE) {
        const batch = selectedPosts.slice(i, i + BATCH_SIZE);
        const postsToInsert = [];

        for (const post of batch) {
          // Skip existing if option enabled
          if (skipExisting && existingSlugs.has(post.slug)) {
            skippedCount++;
            continue;
          }

          // Make slug unique if it exists
          let finalSlug = post.slug;
          if (existingSlugs.has(finalSlug)) {
            finalSlug = `${finalSlug}-${Date.now()}`;
          }

          // Find category ID
          const categoryId = post.categories.length > 0
            ? categoryMap[post.categories[0]] || null
            : null;

          postsToInsert.push({
            title: post.title,
            slug: finalSlug,
            content: post.content,
            excerpt: post.excerpt || null,
            featured_image_url: post.featuredImage || null,
            created_at: post.date,
            status: post.status,
            category_id: categoryId,
            tags: post.tags.length > 0 ? post.tags : null,
            meta_title: post.metaTitle || null,
            meta_description: post.metaDescription || null,
          });

          existingSlugs.add(finalSlug);
        }

        if (postsToInsert.length > 0) {
          const { error } = await supabase.from("posts").insert(postsToInsert);
          if (error) {
            console.error("Post import batch error:", error);
            toast.error(`ব্যাচ ইম্পোর্ট এরর: ${error.message}`);
          } else {
            importedCount += postsToInsert.length;
          }
        }

        setImportProgress(20 + ((i + BATCH_SIZE) / selectedPosts.length) * 80);
      }

      setImportProgress(100);
      setImportStatus("ইম্পোর্ট সম্পন্ন!");
      setImportStep("done");

      queryClient.invalidateQueries({ queryKey: ["latest-posts"] });
      queryClient.invalidateQueries({ queryKey: ["content-categories"] });
      queryClient.invalidateQueries({ queryKey: ["existing-post-slugs"] });
      queryClient.invalidateQueries({ queryKey: ["content-categories-import"] });

      toast.success(
        `✅ ${importedCount}টি পোস্ট ইম্পোর্ট হয়েছে${skippedCount > 0 ? `, ${skippedCount}টি স্কিপ হয়েছে` : ""}`
      );
    } catch (err: any) {
      toast.error(err.message || "ইম্পোর্ট এরর");
      setImportStep("preview");
    }
  };

  const resetImport = () => {
    setParsedCategories([]);
    setParsedPosts([]);
    setImportProgress(0);
    setImportStatus("");
    setImportStep("upload");
  };

  const selectedPostCount = parsedPosts.filter((p) => p.selected).length;
  const selectedCatCount = parsedCategories.filter((c) => c.selected && !c.existingId).length;
  const existingCatCount = parsedCategories.filter((c) => c.existingId).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileUp className="w-5 h-5 text-primary" />
          WordPress ইম্পোর্ট
        </h2>
        {importStep !== "upload" && (
          <Button variant="outline" size="sm" onClick={resetImport}>
            নতুন ইম্পোর্ট
          </Button>
        )}
      </div>

      {/* Step 1: Upload */}
      {importStep === "upload" && (
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">WordPress XML ফাইল আপলোড করুন</h3>
            <p className="text-sm text-muted-foreground mt-1">
              WordPress Dashboard → Tools → Export → All Content → Download Export File
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xml"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing}
            size="lg"
          >
            {isParsing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                পার্সিং হচ্ছে...
              </>
            ) : (
              <>
                <FileUp className="w-4 h-4 mr-2" />
                XML ফাইল সিলেক্ট করুন
              </>
            )}
          </Button>
        </div>
      )}

      {/* Step 2: Preview */}
      {importStep === "preview" && (
        <div className="space-y-6">
          {/* Categories Section */}
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-primary" />
                ক্যাটাগরি ({parsedCategories.length}টি)
              </h3>
              <div className="flex gap-2">
                {existingCatCount > 0 && (
                  <Badge variant="secondary">{existingCatCount}টি আগে থেকে আছে</Badge>
                )}
                <Badge variant="default">{selectedCatCount}টি নতুন</Badge>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {parsedCategories.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleCategory(idx)}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors
                      ${cat.existingId
                        ? "bg-muted text-muted-foreground border-border cursor-default"
                        : cat.selected
                          ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                          : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50 line-through"
                      }
                    `}
                    disabled={!!cat.existingId}
                  >
                    {cat.existingId ? (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    ) : cat.selected ? (
                      <FolderPlus className="w-3 h-3" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                    {cat.name}
                    {cat.existingId && <span className="text-xs opacity-60">(আছে)</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Posts Section */}
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                পোস্ট ({parsedPosts.length}টি)
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id="skip-existing"
                    checked={skipExisting}
                    onCheckedChange={setSkipExisting}
                  />
                  <Label htmlFor="skip-existing" className="text-sm cursor-pointer">
                    ডুপ্লিকেট স্কিপ
                  </Label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleAllPosts(true)}
                >
                  সব সিলেক্ট
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleAllPosts(false)}
                >
                  সব ডি-সিলেক্ট
                </Button>
                <Badge>{selectedPostCount}টি সিলেক্টেড</Badge>
              </div>
            </div>

            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">✓</TableHead>
                    <TableHead>টাইটেল</TableHead>
                    <TableHead>ক্যাটাগরি</TableHead>
                    <TableHead>ট্যাগ</TableHead>
                    <TableHead>ইমেজ</TableHead>
                    <TableHead>তারিখ</TableHead>
                    <TableHead>স্ট্যাটাস</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedPosts.map((post, idx) => {
                    const isExisting = existingPosts?.some((ep) => ep.slug === post.slug);
                    return (
                      <TableRow
                        key={idx}
                        className={`${!post.selected ? "opacity-40" : ""} ${isExisting ? "bg-yellow-500/5" : ""}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={post.selected}
                            onCheckedChange={() => togglePost(idx)}
                          />
                        </TableCell>
                        <TableCell className="max-w-[280px]">
                          <div className="font-medium text-sm truncate" title={post.title}>
                            {post.title}
                          </div>
                          <div className="text-xs text-muted-foreground truncate" title={post.slug}>
                            /{post.slug}
                          </div>
                          {isExisting && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-[10px] mt-1">
                              আগে থেকে আছে
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {post.categories.length > 0 ? (
                            <Badge variant="secondary" className="text-xs">
                              {post.categories[0]}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {post.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {post.tags.slice(0, 2).map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-[10px]">
                                  {tag}
                                </Badge>
                              ))}
                              {post.tags.length > 2 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{post.tags.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {post.featuredImage ? (
                            <div className="w-10 h-10 rounded overflow-hidden bg-muted">
                              <img
                                src={post.featuredImage}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(post.date).toLocaleDateString("bn-BD")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={post.status === "published" ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {post.status === "published" ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Import Button */}
          <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{selectedCatCount}</span> নতুন ক্যাটাগরি +{" "}
              <span className="font-medium text-foreground">{selectedPostCount}</span> পোস্ট ইম্পোর্ট হবে
            </div>
            <Button
              onClick={startImport}
              disabled={selectedPostCount === 0}
              size="lg"
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              ইম্পোর্ট শুরু করুন
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Importing */}
      {importStep === "importing" && (
        <div className="border border-border rounded-xl p-8 text-center space-y-4">
          <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
          <h3 className="text-lg font-semibold">{importStatus}</h3>
          <Progress value={importProgress} className="max-w-md mx-auto" />
          <p className="text-sm text-muted-foreground">
            অনুগ্রহ করে পেইজ ক্লোজ করবেন না...
          </p>
        </div>
      )}

      {/* Step 4: Done */}
      {importStep === "done" && (
        <div className="border border-border rounded-xl p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">ইম্পোর্ট সম্পন্ন!</h3>
          <p className="text-sm text-muted-foreground">{importStatus}</p>
          <Button variant="outline" onClick={resetImport}>
            আবার ইম্পোর্ট করুন
          </Button>
        </div>
      )}
    </div>
  );
};

export default WordPressImport;
