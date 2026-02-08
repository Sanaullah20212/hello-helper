import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShows } from "@/hooks/useContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Play, Link as LinkIcon, Download, Upload, X, ImageIcon } from "lucide-react";

interface DownloadLink {
  label: string;
  url: string;
  quality?: string;
}

interface Episode {
  id: string;
  show_id: string;
  title: string;
  episode_number: number | null;
  season_number: number | null;
  thumbnail_url: string | null;
  watch_url: string | null;
  download_links: DownloadLink[] | null;
  is_free: boolean;
  is_active: boolean;
  air_date: string | null;
  created_at: string;
}

const useEpisodes = (showId?: string) => {
  return useQuery({
    queryKey: ["episodes", showId],
    queryFn: async () => {
      let query = supabase
        .from("episodes")
        .select("*")
        .order("season_number", { ascending: true })
        .order("episode_number", { ascending: true });

      if (showId) {
        query = query.eq("show_id", showId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Episode[];
    },
  });
};

const EpisodeManagement = () => {
  const queryClient = useQueryClient();
  const { data: shows } = useShows();
  const [selectedShowId, setSelectedShowId] = useState<string>("");
  const { data: episodes, isLoading } = useEpisodes(selectedShowId || undefined);

  const [isOpen, setIsOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    show_id: "",
    title: "",
    episode_number: "",
    season_number: "1",
    thumbnail_url: "",
    watch_url: "",
    download_links: [{ label: "", url: "", quality: "HD" }],
    is_free: false,
    is_active: true,
    air_date: "",
  });

  const createEpisode = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("episodes").insert([{
        show_id: data.show_id,
        title: data.title,
        episode_number: data.episode_number ? parseInt(data.episode_number) : null,
        season_number: data.season_number ? parseInt(data.season_number) : 1,
        thumbnail_url: data.thumbnail_url || null,
        watch_url: data.watch_url || null,
        download_links: data.download_links.filter(l => l.url),
        is_free: data.is_free,
        is_active: data.is_active,
        air_date: data.air_date || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
      toast.success("এপিসোড যোগ হয়েছে!");
      setIsOpen(false);
      resetForm();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateEpisode = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & typeof formData) => {
      const { error } = await supabase.from("episodes").update({
        show_id: data.show_id,
        title: data.title,
        episode_number: data.episode_number ? parseInt(data.episode_number) : null,
        season_number: data.season_number ? parseInt(data.season_number) : 1,
        thumbnail_url: data.thumbnail_url || null,
        watch_url: data.watch_url || null,
        download_links: data.download_links.filter(l => l.url),
        is_free: data.is_free,
        is_active: data.is_active,
        air_date: data.air_date || null,
        updated_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
      toast.success("এপিসোড আপডেট হয়েছে!");
      setIsOpen(false);
      resetForm();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteEpisode = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("episodes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
      toast.success("এপিসোড মুছে ফেলা হয়েছে!");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const resetForm = () => {
    setFormData({
      show_id: selectedShowId || "",
      title: "",
      episode_number: "",
      season_number: "1",
      thumbnail_url: "",
      watch_url: "",
      download_links: [{ label: "", url: "", quality: "HD" }],
      is_free: false,
      is_active: true,
      air_date: "",
    });
    setEditingEpisode(null);
  };

  const openDialog = (episode?: Episode) => {
    if (episode) {
      setEditingEpisode(episode);
      setFormData({
        show_id: episode.show_id,
        title: episode.title,
        episode_number: episode.episode_number?.toString() || "",
        season_number: episode.season_number?.toString() || "1",
        thumbnail_url: episode.thumbnail_url || "",
        watch_url: episode.watch_url || "",
        download_links: (episode.download_links?.length 
          ? episode.download_links.map(l => ({ ...l, quality: l.quality || "HD" }))
          : [{ label: "", url: "", quality: "HD" }]) as { label: string; url: string; quality: string }[],
        is_free: episode.is_free,
        is_active: episode.is_active,
        air_date: episode.air_date || "",
      });
    } else {
      resetForm();
    }
    setIsOpen(true);
  };

  const addDownloadLink = () => {
    setFormData({
      ...formData,
      download_links: [...formData.download_links, { label: "", url: "", quality: "HD" }],
    });
  };

  const removeDownloadLink = (index: number) => {
    setFormData({
      ...formData,
      download_links: formData.download_links.filter((_, i) => i !== index),
    });
  };

  const updateDownloadLink = (index: number, field: string, value: string) => {
    const updated = [...formData.download_links];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, download_links: updated });
  };

  const handleSubmit = () => {
    if (!formData.show_id || !formData.title) {
      toast.error("শো এবং টাইটেল দিতে হবে");
      return;
    }

    if (editingEpisode) {
      updateEpisode.mutate({ id: editingEpisode.id, ...formData });
    } else {
      createEpisode.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">এপিসোড ম্যানেজমেন্ট</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={selectedShowId} onValueChange={setSelectedShowId}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="শো সিলেক্ট করুন" />
            </SelectTrigger>
            <SelectContent>
              {shows?.map((show) => (
                <SelectItem key={show.id} value={show.id}>
                  {show.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()} disabled={!selectedShowId && !shows?.length}>
                <Plus className="w-4 h-4 mr-2" />
                নতুন এপিসোড
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEpisode ? "এপিসোড এডিট করুন" : "নতুন এপিসোড যোগ করুন"}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>শো *</Label>
                    <Select
                      value={formData.show_id}
                      onValueChange={(value) => setFormData({ ...formData, show_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="শো সিলেক্ট করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        {shows?.map((show) => (
                          <SelectItem key={show.id} value={show.id}>
                            {show.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>এপিসোড টাইটেল *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="এপিসোড টাইটেল..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>সিজন নম্বর</Label>
                    <Input
                      type="number"
                      value={formData.season_number}
                      onChange={(e) => setFormData({ ...formData, season_number: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>এপিসোড নম্বর</Label>
                    <Input
                      type="number"
                      value={formData.episode_number}
                      onChange={(e) => setFormData({ ...formData, episode_number: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>এয়ার ডেট</Label>
                    <Input
                      type="date"
                      value={formData.air_date}
                      onChange={(e) => setFormData({ ...formData, air_date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Thumbnail Upload/URL */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    থাম্বনেইল
                  </Label>
                  
                  {/* Thumbnail Preview */}
                  {formData.thumbnail_url && (
                    <div className="relative w-32">
                      <img 
                        src={formData.thumbnail_url} 
                        alt="Thumbnail preview" 
                        className="w-32 h-24 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, thumbnail_url: "" })}
                        className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {/* Upload Button */}
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        if (!file.type.startsWith('image/')) {
                          toast.error("শুধুমাত্র ইমেজ ফাইল আপলোড করা যাবে");
                          return;
                        }

                        if (file.size > 2 * 1024 * 1024) {
                          toast.error("ফাইল সাইজ ২MB এর বেশি হতে পারবে না");
                          return;
                        }

                        setUploadingThumbnail(true);
                        try {
                          const fileExt = file.name.split('.').pop();
                          const fileName = `episode-thumb-${Date.now()}.${fileExt}`;

                          const { error: uploadError } = await supabase.storage
                            .from('content-images')
                            .upload(fileName, file, { upsert: true });

                          if (uploadError) throw uploadError;

                          const { data: urlData } = supabase.storage
                            .from('content-images')
                            .getPublicUrl(fileName);

                          setFormData({ ...formData, thumbnail_url: urlData.publicUrl });
                          toast.success("থাম্বনেইল আপলোড হয়েছে!");
                        } catch (error: any) {
                          toast.error(error.message || "আপলোড ব্যর্থ হয়েছে");
                        } finally {
                          setUploadingThumbnail(false);
                          if (thumbnailInputRef.current) {
                            thumbnailInputRef.current.value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => thumbnailInputRef.current?.click()}
                      disabled={uploadingThumbnail}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingThumbnail ? "আপলোড হচ্ছে..." : "আপলোড করুন"}
                    </Button>
                    <span className="text-xs text-muted-foreground self-center">অথবা</span>
                  </div>

                  {/* URL Input */}
                  <Input
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    placeholder="থাম্বনেইল URL দিন (https://...)"
                  />
                  <p className="text-xs text-muted-foreground">
                    থাম্বনেইল না দিলে শো এর poster/thumbnail দেখাবে
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    দেখার লিংক (Watch URL)
                  </Label>
                  <Input
                    value={formData.watch_url}
                    onChange={(e) => setFormData({ ...formData, watch_url: e.target.value })}
                    placeholder="https://..."
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                {/* Download Links */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      ডাউনলোড লিংক
                    </Label>
                    <Button type="button" variant="outline" size="sm" onClick={addDownloadLink}>
                      <Plus className="w-4 h-4 mr-1" />
                      লিংক যোগ করুন
                    </Button>
                  </div>

                  {formData.download_links.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Input
                        value={link.label}
                        onChange={(e) => updateDownloadLink(index, "label", e.target.value)}
                        placeholder="লেবেল (যেমন: 480p)"
                        className="flex-1"
                      />
                      <Select
                        value={link.quality || "HD"}
                        onValueChange={(value) => updateDownloadLink(index, "quality", value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HD">HD</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={link.url}
                        onChange={(e) => updateDownloadLink(index, "url", e.target.value)}
                        placeholder="https://..."
                        className="flex-[2]"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      {formData.download_links.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDownloadLink(index)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ফ্রি/প্রিমিয়াম</Label>
                    <Select
                      value={formData.is_free ? "free" : "premium"}
                      onValueChange={(value) => setFormData({ ...formData, is_free: value === "free" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">ফ্রি</SelectItem>
                        <SelectItem value="premium">প্রিমিয়াম</SelectItem>
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
                  <Button onClick={handleSubmit} disabled={createEpisode.isPending || updateEpisode.isPending}>
                    {createEpisode.isPending || updateEpisode.isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!selectedShowId ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
          <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>একটি শো সিলেক্ট করুন এপিসোড দেখতে।</p>
        </div>
      ) : isLoading ? (
        <div className="text-center py-8 text-muted-foreground">লোড হচ্ছে...</div>
      ) : episodes && episodes.length > 0 ? (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>এপিসোড</TableHead>
                <TableHead>সিজন</TableHead>
                <TableHead>লিংক</TableHead>
                <TableHead>স্ট্যাটাস</TableHead>
                <TableHead className="text-right">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {episodes.map((episode) => (
                <TableRow key={episode.id}>
                  <TableCell className="font-medium">
                    <div>
                      <span className="text-muted-foreground mr-2">
                        {episode.episode_number ? `EP${episode.episode_number}` : "-"}
                      </span>
                      {episode.title}
                    </div>
                  </TableCell>
                  <TableCell>S{episode.season_number || 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {episode.watch_url && (
                        <span className="px-2 py-0.5 text-xs rounded bg-green-500/10 text-green-500 flex items-center gap-1">
                          <Play className="w-3 h-3" /> Watch
                        </span>
                      )}
                      {episode.download_links && episode.download_links.length > 0 && (
                        <span className="px-2 py-0.5 text-xs rounded bg-blue-500/10 text-blue-500 flex items-center gap-1">
                          <Download className="w-3 h-3" /> {episode.download_links.length}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded ${episode.is_active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>
                      {episode.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(episode)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("আপনি কি নিশ্চিত এই এপিসোড মুছে ফেলতে চান?")) {
                            deleteEpisode.mutate(episode.id);
                          }
                        }}
                      >
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
          <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>এই শো এর কোনো এপিসোড নেই। নতুন এপিসোড যোগ করুন।</p>
        </div>
      )}
    </div>
  );
};

export default EpisodeManagement;
