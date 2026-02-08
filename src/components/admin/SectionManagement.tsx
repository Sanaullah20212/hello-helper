import { useState } from "react";
import { useContentSections, useShows, useCreateSection, useAddShowToSection, ContentSection, Show } from "@/hooks/useContent";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, LayoutGrid, Image, GripVertical, X, Trash2, Edit } from "lucide-react";

const SectionManagement = () => {
  const { data: sections, isLoading: sectionsLoading } = useContentSections();
  const { data: shows } = useShows();
  const createSection = useCreateSection();
  const addShowToSection = useAddShowToSection();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [addShowDialogOpen, setAddShowDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<ContentSection | null>(null);
  const [editingSection, setEditingSection] = useState<ContentSection | null>(null);
  const [selectedShowId, setSelectedShowId] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    section_type: "poster",
    show_more_link: "",
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      section_type: "poster",
      show_more_link: "",
      is_active: true,
    });
    setEditingSection(null);
  };

  const [editFormData, setEditFormData] = useState({
    title: "",
    show_more_link: "",
    section_type: "poster",
  });

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
      await createSection.mutateAsync(formData);
      toast.success("সেকশন তৈরি হয়েছে!");
      setIsOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "সমস্যা হয়েছে");
    }
  };

  const handleAddShow = async () => {
    if (!selectedSection || !selectedShowId) {
      toast.error("শো সিলেক্ট করুন");
      return;
    }

    try {
      await addShowToSection.mutateAsync({
        sectionId: selectedSection.id,
        showId: selectedShowId,
        displayOrder: (selectedSection.shows?.length || 0) + 1,
      });
      toast.success("শো যোগ করা হয়েছে!");
      setAddShowDialogOpen(false);
      setSelectedShowId("");
    } catch (error: any) {
      toast.error(error.message || "সমস্যা হয়েছে");
    }
  };

  const handleRemoveShowFromSection = async (sectionId: string, showId: string) => {
    try {
      const { error } = await supabase
        .from("section_shows")
        .delete()
        .eq("section_id", sectionId)
        .eq("show_id", showId);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["content-sections"] });
      toast.success("শো সরানো হয়েছে!");
    } catch (error: any) {
      toast.error(error.message || "সমস্যা হয়েছে");
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("আপনি কি নিশ্চিত এই সেকশন মুছে ফেলতে চান?")) return;

    try {
      // First delete related section_shows
      await supabase.from("section_shows").delete().eq("section_id", sectionId);
      
      // Then delete the section
      const { error } = await supabase.from("content_sections").delete().eq("id", sectionId);
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["content-sections"] });
      toast.success("সেকশন মুছে ফেলা হয়েছে!");
    } catch (error: any) {
      toast.error(error.message || "মুছতে সমস্যা হয়েছে");
    }
  };

  const openEditDialog = (section: ContentSection) => {
    setEditingSection(section);
    setEditFormData({
      title: section.title,
      show_more_link: section.show_more_link || "",
      section_type: section.section_type,
    });
    setIsEditOpen(true);
  };

  const handleUpdateSection = async () => {
    if (!editingSection) return;

    try {
      const { error } = await supabase
        .from("content_sections")
        .update({
          title: editFormData.title,
          show_more_link: editFormData.show_more_link || null,
          section_type: editFormData.section_type,
        })
        .eq("id", editingSection.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["content-sections"] });
      toast.success("সেকশন আপডেট হয়েছে!");
      setIsEditOpen(false);
      setEditingSection(null);
    } catch (error: any) {
      toast.error(error.message || "আপডেট করতে সমস্যা হয়েছে");
    }
  };

  const getAvailableShows = () => {
    if (!selectedSection || !shows) return [];
    const sectionShowIds = selectedSection.shows?.map(s => s.id) || [];
    return shows.filter(show => !sectionShowIds.includes(show.id));
  };

  if (sectionsLoading) {
    return <div className="text-center py-8 text-muted-foreground">লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">সেকশন ম্যানেজমেন্ট</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              নতুন সেকশন
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>নতুন সেকশন তৈরি করুন</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>সেকশন টাইটেল *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setFormData({ ...formData, title, slug: generateSlug(title) });
                  }}
                  placeholder="যেমন: নতুন সিরিয়াল"
                />
              </div>

              <div className="space-y-2">
                <Label>স্লাগ *</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="new-serials"
                />
              </div>

              <div className="space-y-2">
                <Label>সেকশন টাইপ</Label>
                <Select
                  value={formData.section_type}
                  onValueChange={(value) => setFormData({ ...formData, section_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="poster">পোস্টার (2:3 - লম্বা কার্ড)</SelectItem>
                    <SelectItem value="thumbnail">থাম্বনেইল (16:9 - হরাইজন্টাল)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>আরও দেখুন লিংক (ঐচ্ছিক)</Label>
                <Input
                  value={formData.show_more_link}
                  onChange={(e) => setFormData({ ...formData, show_more_link: e.target.value })}
                  placeholder="/category/new"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  বাতিল
                </Button>
                <Button onClick={handleSubmit} disabled={createSection.isPending}>
                  {createSection.isPending ? "তৈরি হচ্ছে..." : "তৈরি করুন"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Add Show Dialog */}
      <Dialog open={addShowDialogOpen} onOpenChange={setAddShowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>"{selectedSection?.title}" এ শো যোগ করুন</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>শো সিলেক্ট করুন</Label>
              <Select value={selectedShowId} onValueChange={setSelectedShowId}>
                <SelectTrigger>
                  <SelectValue placeholder="শো খুঁজুন..." />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[200px]">
                    {getAvailableShows().map((show) => (
                      <SelectItem key={show.id} value={show.id}>
                        {show.title}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
              {getAvailableShows().length === 0 && (
                <p className="text-sm text-muted-foreground">কোনো শো পাওয়া যায়নি বা সব শো ইতিমধ্যে যোগ করা হয়েছে।</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setAddShowDialogOpen(false)}>
                বাতিল
              </Button>
              <Button onClick={handleAddShow} disabled={addShowToSection.isPending || !selectedShowId}>
                {addShowToSection.isPending ? "যোগ হচ্ছে..." : "যোগ করুন"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sections List */}
      {sections && sections.length > 0 ? (
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <LayoutGrid className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-medium">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {section.section_type === "poster" ? "পোস্টার স্টাইল" : "থাম্বনেইল স্টাইল"} • {section.shows?.length || 0} টি শো
                      {section.show_more_link && <span className="text-green-500 ml-2">• More লিংক আছে</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSection(section);
                      setAddShowDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    শো যোগ করুন
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEditDialog(section)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSection(section.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {section.shows && section.shows.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {section.shows.map((show) => (
                    <div
                      key={show.id}
                      className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2"
                    >
                      {show.poster_url || show.thumbnail_url ? (
                        <img
                          src={show.poster_url || show.thumbnail_url || ""}
                          alt={show.title}
                          className="w-8 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-8 h-10 bg-muted rounded flex items-center justify-center">
                          <Image className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="text-sm font-medium">{show.title}</span>
                      <button
                        onClick={() => handleRemoveShowFromSection(section.id, show.id)}
                        className="p-1 hover:bg-destructive/10 rounded"
                      >
                        <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
                  এই সেকশনে কোনো শো নেই। উপরের বাটন দিয়ে শো যোগ করুন।
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
          <LayoutGrid className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>কোনো সেকশন নেই। নতুন সেকশন তৈরি করুন।</p>
        </div>
      )}

      {/* Edit Section Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>সেকশন এডিট করুন</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>সেকশন টাইটেল</Label>
              <Input
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="যেমন: নতুন সিরিয়াল"
              />
            </div>

            <div className="space-y-2">
              <Label>সেকশন টাইপ</Label>
              <Select
                value={editFormData.section_type}
                onValueChange={(value) => setEditFormData({ ...editFormData, section_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poster">পোস্টার (2:3 - লম্বা কার্ড)</SelectItem>
                  <SelectItem value="thumbnail">থাম্বনেইল (16:9 - হরাইজন্টাল)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>আরও দেখুন (More) লিংক</Label>
              <Input
                value={editFormData.show_more_link}
                onChange={(e) => setEditFormData({ ...editFormData, show_more_link: e.target.value })}
                placeholder="/category/zee-bangla"
              />
              <p className="text-xs text-muted-foreground">
                যেমন: /category/zee-bangla বা /free-episodes
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                বাতিল
              </Button>
              <Button onClick={handleUpdateSection}>
                আপডেট করুন
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SectionManagement;
