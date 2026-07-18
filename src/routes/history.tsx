import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { getHistory, deleteHistoryEntry, clearHistory, getImage } from "@/lib/storage";
import { useEffect, useState } from "react";
import { Trash2, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ImageLightbox } from "@/components/ImageLightbox";

interface HistoryEntry {
  id: string;
  originalFileName: string;
  originalFileType: string;
  originalFileSize: number;
  createdAt: string;
  originalUrl?: string;
  processedUrl?: string;
}

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    const createdUrls: string[] = [];
    const load = async () => {
      try {
        const history = await getHistory();
        const mapped: HistoryEntry[] = [];
        for (const h of history) {
          const fullEntry = await getImage(h.id);
          if (!fullEntry) continue;
          const originalUrl = URL.createObjectURL(fullEntry.originalBlob);
          const processedUrl = fullEntry.processedBlob
            ? URL.createObjectURL(fullEntry.processedBlob)
            : undefined;
          createdUrls.push(originalUrl);
          if (processedUrl) createdUrls.push(processedUrl);
          mapped.push({ ...h, originalUrl, processedUrl });
        }
        if (mounted) setEntries(mapped);
      } catch (error) {
        console.error("Could not load browser history", error);
        if (mounted) toast.error("Browser history could not be loaded.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();

    return () => {
      mounted = false;
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleDownload = async (entry: HistoryEntry) => {
    try {
      const fullEntry = await getImage(entry.id);
      if (!fullEntry || !fullEntry.processedBlob) return;
      const url = URL.createObjectURL(fullEntry.processedBlob);
      const a = document.createElement("a");
      a.href = url;
      const baseName = entry.originalFileName.replace(/\.[^.]+$/, "");
      a.download = baseName + "-transparent.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch {
      toast.error("Failed to download image");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this item from history?")) {
      try {
        await deleteHistoryEntry(id);
        setEntries((prev) => {
          const newEntries = prev.filter((e) => e.id !== id);
          const deletedEntry = prev.find((e) => e.id === id);
          if (deletedEntry) {
            if (deletedEntry.originalUrl) URL.revokeObjectURL(deletedEntry.originalUrl);
            if (deletedEntry.processedUrl) URL.revokeObjectURL(deletedEntry.processedUrl);
          }
          return newEntries;
        });
      } catch (error) {
        console.error("Could not delete history entry", error);
        toast.error("This history item could not be deleted.");
      }
    }
  };

  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to clear all history?")) {
      try {
        await clearHistory();
        entries.forEach((e) => {
          if (e.originalUrl) URL.revokeObjectURL(e.originalUrl);
          if (e.processedUrl) URL.revokeObjectURL(e.processedUrl);
        });
        setEntries([]);
      } catch (error) {
        console.error("Could not clear browser history", error);
        toast.error("Browser history could not be cleared.");
      }
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return bytes + " B";
    }
    if (bytes < 1048576) {
      return Math.round(bytes / 1024) + " KB";
    }
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">History</h1>
            <p className="mt-2 text-muted-foreground">Your processed images</p>
          </div>
          {entries.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" /> Clear History
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Loading browser history…
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-8 max-w-md">
              <RefreshCw className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No history yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Process your first image to see it here!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-border/60 bg-card/40 p-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-2">
                    {entry.originalUrl && (
                      <div
                        className="rounded-xl overflow-hidden bg-muted/30 cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setLightboxSrc(entry.originalUrl!);
                          setLightboxAlt("Original");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setLightboxSrc(entry.originalUrl!);
                            setLightboxAlt("Original");
                          }
                        }}
                      >
                        <img
                          src={entry.originalUrl}
                          alt="Original"
                          className="h-32 w-full object-cover pointer-events-auto"
                        />
                      </div>
                    )}
                    {entry.processedUrl && (
                      <div
                        className="rounded-xl overflow-hidden checkerboard cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setLightboxSrc(entry.processedUrl!);
                          setLightboxAlt("Background removed");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setLightboxSrc(entry.processedUrl!);
                            setLightboxAlt("Background removed");
                          }
                        }}
                      >
                        <img
                          src={entry.processedUrl}
                          alt="Processed"
                          className="h-32 w-full object-cover pointer-events-auto"
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium truncate">{entry.originalFileName}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(entry.createdAt)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(entry.originalFileSize)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(entry)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium hover:bg-accent/10"
                    >
                      <Download className="h-4 w-4" /> Download
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="inline-flex items-center justify-center rounded-lg border border-border/70 px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {lightboxSrc && (
          <ImageLightbox
            src={lightboxSrc}
            alt={lightboxAlt}
            isOpen={!!lightboxSrc}
            onClose={() => {
              setLightboxSrc(null);
              setLightboxAlt("");
            }}
          />
        )}
      </div>
    </SiteLayout>
  );
}
