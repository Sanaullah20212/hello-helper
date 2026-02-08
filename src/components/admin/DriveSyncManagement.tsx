import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  FolderOpen, 
  FileVideo, 
  RefreshCw, 
  Download, 
  Check, 
  X, 
  Loader2,
  HardDrive,
  Calendar,
  ChevronRight
} from "lucide-react";

interface DriveFolder {
  id: string;
  name: string;
  modifiedTime: string;
}

interface DriveFile {
  fileId: string;
  fileName: string;
  fileSize: string;
  modifiedTime: string;
  showName: string | null;
  airDate: string | null;
  episodeNumber: number | null;
  title: string;
  selected?: boolean;
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

const DriveSyncManagement = () => {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<DriveFolder | null>(null);
  const [isFree, setIsFree] = useState(true);
  const [replaceDuplicates, setReplaceDuplicates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Fetch folders from drive
  const fetchFolders = useCallback(async () => {
    setLoading(true);
    setFolders([]);
    setFiles([]);
    setSelectedFolder(null);
    setImportResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("লগইন করুন");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "list-folders" }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch folders");
      }

      const data = await response.json();
      setFolders(data.folders || []);
      
      if (data.folders?.length === 0) {
        toast.info("কোন folder পাওয়া যায়নি");
      } else {
        toast.success(`${data.folders.length}টি folder পাওয়া গেছে`);
      }
    } catch (error: any) {
      console.error("Fetch folders error:", error);
      toast.error(error.message || "Folder লোড করতে ব্যর্থ");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch files from a specific folder
  const fetchFiles = useCallback(async (folder: DriveFolder) => {
    setLoadingFiles(true);
    setFiles([]);
    setSelectedFolder(folder);
    setImportResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("লগইন করুন");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "list-files", folderId: folder.id, folderName: folder.name }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch files");
      }

      const data = await response.json();
      const filesWithSelection = (data.files || []).map((f: DriveFile) => ({
        ...f,
        selected: true,
      }));
      setFiles(filesWithSelection);

      if (filesWithSelection.length === 0) {
        toast.info("এই folder এ কোন video file নেই");
      } else {
        toast.success(`${filesWithSelection.length}টি video file পাওয়া গেছে`);
      }
    } catch (error: any) {
      console.error("Fetch files error:", error);
      toast.error(error.message || "File লোড করতে ব্যর্থ");
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  // Toggle file selection
  const toggleFileSelection = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.fileId === fileId ? { ...f, selected: !f.selected } : f
      )
    );
  };

  // Select/Deselect all files
  const toggleSelectAll = () => {
    const allSelected = files.every((f) => f.selected);
    setFiles((prev) => prev.map((f) => ({ ...f, selected: !allSelected })));
  };

  // Import selected files
  const importFiles = async () => {
    const selectedFiles = files.filter((f) => f.selected);
    if (selectedFiles.length === 0) {
      toast.error("কমপক্ষে ১টি file সিলেক্ট করুন");
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("লগইন করুন");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "import",
            folderId: selectedFolder?.id,
            files: selectedFiles,
            isFree,
            replaceDuplicates,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Import failed");
      }

      const result: ImportResult = await response.json();
      setImportResult(result);

      if (result.created > 0 || result.updated > 0) {
        toast.success(
          `Import সম্পন্ন: ${result.created} নতুন, ${result.updated} আপডেট`
        );
      } else if (result.skipped > 0) {
        toast.info(`${result.skipped}টি episode আগে থেকে আছে`);
      }

      if (result.errors.length > 0) {
        console.error("Import errors:", result.errors);
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "Import ব্যর্থ হয়েছে");
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = files.filter((f) => f.selected).length;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <HardDrive className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <CardTitle>Google Drive Auto-Sync</CardTitle>
                <CardDescription>
                  সরাসরি Drive থেকে episode import করুন
                </CardDescription>
              </div>
            </div>
            <Button onClick={fetchFolders} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Folders লোড করুন
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Folders List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Folders ({folders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {folders.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {loading ? "লোড হচ্ছে..." : "উপরে 'Folders লোড করুন' ক্লিক করুন"}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => fetchFiles(folder)}
                      disabled={loadingFiles}
                      className={`w-full p-3 text-left hover:bg-muted/50 transition-colors flex items-center justify-between ${
                        selectedFolder?.id === folder.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate font-medium">{folder.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Files List */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileVideo className="w-4 h-4" />
                Files {selectedFolder && `- ${selectedFolder.name}`}
                {files.length > 0 && (
                  <Badge variant="secondary">
                    {selectedCount}/{files.length} selected
                  </Badge>
                )}
              </CardTitle>
              {files.length > 0 && (
                <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                  {files.every((f) => f.selected) ? "Deselect All" : "Select All"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {loadingFiles ? (
                <div className="p-4 text-center text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Files লোড হচ্ছে...
                </div>
              ) : files.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {selectedFolder
                    ? "এই folder এ কোন video file নেই"
                    : "বাম দিক থেকে একটি folder সিলেক্ট করুন"}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {files.map((file) => (
                    <label
                      key={file.fileId}
                      className="flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={file.selected}
                        onCheckedChange={() => toggleFileSelection(file.fileId)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.fileName}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {file.showName && (
                            <Badge variant="outline" className="text-xs">
                              {file.showName}
                            </Badge>
                          )}
                          {file.airDate && (
                            <Badge variant="secondary" className="text-xs">
                              {file.airDate}
                            </Badge>
                          )}
                          {file.episodeNumber && (
                            <Badge variant="secondary" className="text-xs">
                              Ep {file.episodeNumber}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Import Options */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  id="is-free"
                  checked={isFree}
                  onCheckedChange={setIsFree}
                />
                <Label htmlFor="is-free">
                  {isFree ? "Free Episodes" : "Premium Episodes"}
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="replace-duplicates"
                  checked={replaceDuplicates}
                  onCheckedChange={setReplaceDuplicates}
                />
                <Label htmlFor="replace-duplicates">
                  Duplicate থাকলে Replace করুন
                </Label>
              </div>

              <div className="flex-1" />

              <Button
                onClick={importFiles}
                disabled={importing || selectedCount === 0}
                size="lg"
              >
                {importing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {importing
                  ? "Importing..."
                  : `Import ${selectedCount} Episode${selectedCount > 1 ? "s" : ""}`}
              </Button>
            </div>

            {/* Import Results */}
            {importResult && (
              <div className="mt-4 p-4 rounded-lg bg-muted">
                <h4 className="font-medium mb-2">Import Result:</h4>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-500">
                    <Check className="w-4 h-4" />
                    {importResult.created} নতুন তৈরি
                  </span>
                  <span className="flex items-center gap-1 text-blue-500">
                    <RefreshCw className="w-4 h-4" />
                    {importResult.updated} আপডেট
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <X className="w-4 h-4" />
                    {importResult.skipped} স্কিপ
                  </span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 text-sm text-destructive">
                    <p className="font-medium">Errors:</p>
                    <ul className="list-disc list-inside">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>...and {importResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DriveSyncManagement;
