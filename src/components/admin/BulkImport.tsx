import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShows } from "@/hooks/useContent";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, CheckCircle2, AlertCircle, Loader2, FileText, Download, Trash2, Copy, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";

interface ParsedEpisode {
  showName: string;
  date: string;
  episodeNumber: number;
  fileName: string;
  fileSize: string;
  downloadUrl: string;
  matchedShowId: string | null;
  matchedShowTitle: string | null;
  quality: string;
  isFree: boolean;
}

const BulkImport = () => {
  const queryClient = useQueryClient();
  const { data: shows } = useShows();
  const [rawText, setRawText] = useState("");
  const [parsedEpisodes, setParsedEpisodes] = useState<ParsedEpisode[]>([]);
  const [selectedQuality, setSelectedQuality] = useState("HD");
  const [isFreeDefault, setIsFreeDefault] = useState(false);
  const [replaceDuplicates, setReplaceDuplicates] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Fetch existing episodes to check for duplicates
  const { data: existingEpisodes } = useQuery({
    queryKey: ["all-episodes-for-duplicate-check"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("id, show_id, episode_number, air_date");
      if (error) throw error;
      return data;
    },
  });

  // Check if episode already exists and return the existing episode id
  const findDuplicate = (showId: string, episodeNumber: number, airDate: string) => {
    return existingEpisodes?.find(
      (ep) => ep.show_id === showId && ep.episode_number === episodeNumber && ep.air_date === airDate
    );
  };

  const isDuplicate = (showId: string, episodeNumber: number, airDate: string) => {
    return !!findDuplicate(showId, episodeNumber, airDate);
  };

  // Toggle all episodes free/premium
  const toggleAllFree = (isFree: boolean) => {
    setParsedEpisodes(prev => prev.map(ep => ({ ...ep, isFree })));
  };

  // Parse the text input
  const parseInput = () => {
    if (!rawText.trim()) {
      toast.error("টেক্সট পেস্ট করুন");
      return;
    }

    const lines = rawText.trim().split('\n').map(l => l.trim()).filter(Boolean);
    
    // Separate file entries and URLs
    const fileEntries: { showName: string; date: string; episodeNumber: number; fileSize: string; lineIndex: number }[] = [];
    const urls: string[] = [];
    
    lines.forEach((line, idx) => {
      // Check if this line is a file entry (contains .mp4 and has episode info)
      const fileMatch = line.match(/^(.+?)\s+(\d{4}-\d{2}-\d{2})\s+Episode\s+(\d+)\.mp4\s*([\d.]+\s*[MGKBT]+)?/i);
      
      if (fileMatch) {
        fileEntries.push({
          showName: fileMatch[1].trim(),
          date: fileMatch[2],
          episodeNumber: parseInt(fileMatch[3]),
          fileSize: fileMatch[4]?.trim() || "",
          lineIndex: idx,
        });
      } else if (line.startsWith("http")) {
        urls.push(line);
      }
    });

    // Match URLs to file entries
    // Strategy 1: If URLs appear right after each file (interleaved format)
    // Strategy 2: If all files first, then all URLs (grouped format)
    
    const episodes: ParsedEpisode[] = [];
    
    // Check if it's grouped format (all files, then all URLs)
    const isGroupedFormat = fileEntries.length > 0 && urls.length > 0 && 
      fileEntries.every((f, i) => i === 0 || f.lineIndex > fileEntries[i-1].lineIndex) &&
      urls.length === fileEntries.length;
    
    fileEntries.forEach((file, idx) => {
      let downloadUrl = "";
      
      if (isGroupedFormat) {
        // Grouped format: match by index
        downloadUrl = urls[idx] || "";
      } else {
        // Interleaved format: check next line after file
        const nextLine = lines[file.lineIndex + 1];
        if (nextLine && nextLine.startsWith("http")) {
          downloadUrl = nextLine;
        }
      }
      
      // Try to match show
      const matchedShow = shows?.find(s => 
        s.title.toLowerCase() === file.showName.toLowerCase() ||
        s.title.toLowerCase().includes(file.showName.toLowerCase()) ||
        file.showName.toLowerCase().includes(s.title.toLowerCase())
      );
      
      episodes.push({
        showName: file.showName,
        date: file.date,
        episodeNumber: file.episodeNumber,
        fileName: `${file.showName} ${file.date} Episode ${file.episodeNumber}.mp4`,
        fileSize: file.fileSize,
        downloadUrl,
        matchedShowId: matchedShow?.id || null,
        matchedShowTitle: matchedShow?.title || null,
        quality: selectedQuality,
        isFree: isFreeDefault,
      });
    });
    
    if (episodes.length === 0) {
      toast.error("কোনো এপিসোড পার্স করা যায়নি। সঠিক ফরম্যাট দিন।");
      return;
    }
    
    setParsedEpisodes(episodes);
    toast.success(`${episodes.length}টি এপিসোড পার্স করা হয়েছে`);
  };

  // Update show match for an episode
  const updateShowMatch = (index: number, showId: string) => {
    const show = shows?.find(s => s.id === showId);
    setParsedEpisodes(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        matchedShowId: showId,
        matchedShowTitle: show?.title || null,
      };
      return updated;
    });
  };

  // Remove episode from list
  const removeEpisode = (index: number) => {
    setParsedEpisodes(prev => prev.filter((_, i) => i !== index));
  };

  // Import episodes
  const importEpisodes = useMutation({
    mutationFn: async ({ episodes, shouldReplace }: { episodes: ParsedEpisode[]; shouldReplace: boolean }) => {
      const validEpisodes = episodes.filter(e => e.matchedShowId);
      
      if (validEpisodes.length === 0) {
        throw new Error("কোনো ম্যাচড এপিসোড নেই");
      }

      // Separate duplicates and new episodes
      const duplicateEpisodes = validEpisodes.filter(
        ep => isDuplicate(ep.matchedShowId!, ep.episodeNumber, ep.date)
      );
      const newEpisodes = validEpisodes.filter(
        ep => !isDuplicate(ep.matchedShowId!, ep.episodeNumber, ep.date)
      );

      let insertedCount = 0;
      let replacedCount = 0;

      // Insert new episodes
      if (newEpisodes.length > 0) {
        const episodesToInsert = newEpisodes.map(ep => ({
          show_id: ep.matchedShowId!,
          title: `${ep.showName} Episode ${ep.episodeNumber}`,
          episode_number: ep.episodeNumber,
          season_number: 1,
          air_date: ep.date,
          watch_url: ep.downloadUrl || null,
          download_links: ep.downloadUrl ? [{
            label: ep.quality,
            url: ep.downloadUrl,
            quality: ep.quality,
          }] : [],
          is_active: true,
          is_free: ep.isFree,
        }));

        const { error } = await supabase.from("episodes").insert(episodesToInsert);
        if (error) throw error;
        insertedCount = newEpisodes.length;
      }

      // Replace duplicates if option is enabled
      if (shouldReplace && duplicateEpisodes.length > 0) {
        for (const ep of duplicateEpisodes) {
          const existing = findDuplicate(ep.matchedShowId!, ep.episodeNumber, ep.date);
          if (existing) {
            const { error } = await supabase.from("episodes").update({
              title: `${ep.showName} Episode ${ep.episodeNumber}`,
              watch_url: ep.downloadUrl || null,
              download_links: ep.downloadUrl ? [{
                label: ep.quality,
                url: ep.downloadUrl,
                quality: ep.quality,
              }] : [],
              is_free: ep.isFree,
              updated_at: new Date().toISOString(),
            }).eq("id", existing.id);
            if (error) throw error;
            replacedCount++;
          }
        }
      }

      const skippedCount = shouldReplace ? 0 : duplicateEpisodes.length;
      return { inserted: insertedCount, replaced: replacedCount, skipped: skippedCount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
      queryClient.invalidateQueries({ queryKey: ["all-episodes-for-duplicate-check"] });
      
      const messages: string[] = [];
      if (result.inserted > 0) messages.push(`${result.inserted}টি নতুন`);
      if (result.replaced > 0) messages.push(`${result.replaced}টি রিপ্লেস`);
      if (result.skipped > 0) messages.push(`${result.skipped}টি স্কিপ`);
      
      toast.success(`এপিসোড ইমপোর্ট: ${messages.join(", ")}`);
      setParsedEpisodes([]);
      setRawText("");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const matchedCount = parsedEpisodes.filter(e => e.matchedShowId).length;
  const unmatchedCount = parsedEpisodes.length - matchedCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">বাল্ক ইমপোর্ট</h2>
        {parsedEpisodes.length > 0 && (
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              {matchedCount} ম্যাচড
            </Badge>
            {unmatchedCount > 0 && (
              <Badge variant="outline" className="gap-1 text-yellow-500">
                <AlertCircle className="w-3 h-3" />
                {unmatchedCount} আনম্যাচড
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              ফাইল লিস্ট পেস্ট করুন
            </Label>
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`উদাহরণ ফরম্যাট:

Jowar Bhanta 2026-01-24 Episode 121.mp4103.40 MB
https://dash.btspro24.xyz/download.aspx?file=...

Kusum 2026-01-24 Episode 235.mp498.33 MB
https://dash.btspro24.xyz/download.aspx?file=...`}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ডিফল্ট কোয়ালিটি</Label>
              <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HD">HD</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label htmlFor="is-free-toggle" className="cursor-pointer">
                {isFreeDefault ? "ফ্রি" : "প্রিমিয়াম"}
              </Label>
              <Switch
                id="is-free-toggle"
                checked={isFreeDefault}
                onCheckedChange={setIsFreeDefault}
              />
            </div>
            <div className="flex items-center gap-2 p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
              <Checkbox
                id="replace-duplicates"
                checked={replaceDuplicates}
                onCheckedChange={(checked) => setReplaceDuplicates(checked === true)}
              />
              <Label htmlFor="replace-duplicates" className="cursor-pointer text-sm flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                ডুপ্লিকেট রিপ্লেস
              </Label>
            </div>
            <Button onClick={parseInput} className="w-full" disabled={!rawText.trim()}>
              <Upload className="w-4 h-4 mr-2" />
              পার্স করুন
            </Button>
          </div>
        </div>
      </div>

      {/* Parsed Results */}
      {parsedEpisodes.length > 0 && (
        <div className="space-y-4">
          {/* Bulk Actions */}
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">সব এপিসোড:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAllFree(true)}
              className={parsedEpisodes.every(e => e.isFree) ? "bg-green-500/20 border-green-500" : ""}
            >
              ফ্রি করুন
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAllFree(false)}
              className={parsedEpisodes.every(e => !e.isFree) ? "bg-yellow-500/20 border-yellow-500" : ""}
            >
              প্রিমিয়াম করুন
            </Button>
            <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              <span className="px-2 py-1 rounded bg-green-500/10 text-green-500">
                {parsedEpisodes.filter(e => e.isFree).length} ফ্রি
              </span>
              <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-500">
                {parsedEpisodes.filter(e => !e.isFree).length} প্রিমিয়াম
              </span>
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ফাইল নাম</TableHead>
                  <TableHead>এপিসোড</TableHead>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>ম্যাচড শো</TableHead>
                  <TableHead>টাইপ</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedEpisodes.map((episode, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium max-w-[200px] truncate" title={episode.fileName}>
                      {episode.showName}
                    </TableCell>
                    <TableCell>EP{episode.episodeNumber}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {episode.date}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={episode.matchedShowId || ""}
                        onValueChange={(value) => updateShowMatch(index, value)}
                      >
                        <SelectTrigger className={`w-[180px] ${!episode.matchedShowId ? "border-yellow-500" : "border-green-500"}`}>
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
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setParsedEpisodes(prev => {
                            const updated = [...prev];
                            updated[index] = { ...updated[index], isFree: !updated[index].isFree };
                            return updated;
                          });
                        }}
                        className={episode.isFree ? "text-green-500" : "text-yellow-500"}
                      >
                        {episode.isFree ? "ফ্রি" : "প্রিমিয়াম"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      {episode.matchedShowId && isDuplicate(episode.matchedShowId, episode.episodeNumber, episode.date) ? (
                        <Badge variant="outline" className={`gap-1 ${replaceDuplicates ? "text-orange-500 border-orange-500" : "text-red-500 border-red-500"}`}>
                          {replaceDuplicates ? <RefreshCw className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {replaceDuplicates ? "রিপ্লেস হবে" : "ডুপ্লিকেট"}
                        </Badge>
                      ) : episode.downloadUrl ? (
                        <Badge variant="outline" className="gap-1 text-green-500">
                          <Download className="w-3 h-3" />
                          {episode.quality}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          নতুন
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEpisode(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => {
                setParsedEpisodes([]);
                setRawText("");
              }}
            >
              বাতিল করুন
            </Button>
            <Button
              onClick={() => importEpisodes.mutate({ episodes: parsedEpisodes, shouldReplace: replaceDuplicates })}
              disabled={matchedCount === 0 || importEpisodes.isPending}
            >
              {importEpisodes.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ইমপোর্ট হচ্ছে...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {matchedCount}টি এপিসোড ইমপোর্ট করুন
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {parsedEpisodes.length === 0 && (
        <div className="p-6 border border-dashed border-border rounded-lg text-center text-muted-foreground">
          <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium mb-2">ফাইল লিস্ট পেস্ট করুন</p>
          <p className="text-sm">
            ফরম্যাট: <code className="bg-muted px-1 rounded">Show Name YYYY-MM-DD Episode ##.mp4</code>
          </p>
          <p className="text-sm mt-1">
            পরের লাইনে ডাউনলোড লিংক দিন
          </p>
        </div>
      )}
    </div>
  );
};

export default BulkImport;
