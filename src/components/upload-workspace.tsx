import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X, Download, RefreshCw, Loader2, AlertCircle, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { validateImageFile, readImageDimensions } from "@/lib/bg-removal";
import { BeforeAfterSlider } from "@/components/before-after-slider";
import { ImageLightbox } from "@/components/ImageLightbox";
import {
  saveHistoryEntry,
  saveCurrentResult,
  getCurrentResult,
  clearCurrentResult,
  cleanupExpiredHistory,
} from "@/lib/storage";

type Status = "idle" | "validating" | "processing" | "completed" | "failed";

export function UploadWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);
  const [processingMs, setProcessingMs] = useState<number | null>(null);
  const [isDragging, setDragging] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState<string>("");

  // Refs to track latest originalUrl and processedUrl for cleanup on unmount
  const latestOriginalUrlRef = useRef<string | null>(null);
  const latestProcessedUrlRef = useRef<string | null>(null);
  const operationIdRef = useRef(0);
  const processingAbortRef = useRef<AbortController | null>(null);

  // Update refs whenever originalUrl or processedUrl changes
  useEffect(() => {
    latestOriginalUrlRef.current = originalUrl;
  }, [originalUrl]);
  useEffect(() => {
    latestProcessedUrlRef.current = processedUrl;
  }, [processedUrl]);

  // Helper to check if URL is a blob URL
  const isBlobUrl = useCallback((url: string | null) => url?.startsWith("blob:") ?? false, []);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        try {
          await cleanupExpiredHistory();
        } catch (cleanupError) {
          console.warn("Could not clean up expired browser history", cleanupError);
        }
        const current = await getCurrentResult();
        if (!current || !isMounted) return;

        const restoredFile = new File([current.originalBlob], current.originalFileName, {
          type: current.originalFileType,
        });
        const restoredOriginalUrl = URL.createObjectURL(current.originalBlob);
        const restoredProcessedUrl = current.processedBlob
          ? URL.createObjectURL(current.processedBlob)
          : null;

        if (!isMounted) {
          URL.revokeObjectURL(restoredOriginalUrl);
          if (restoredProcessedUrl) URL.revokeObjectURL(restoredProcessedUrl);
          return;
        }

        setFile(restoredFile);
        setOriginalUrl(restoredOriginalUrl);
        setProcessedUrl(restoredProcessedUrl);
        setDims(
          current.width && current.height ? { width: current.width, height: current.height } : null,
        );
        setProcessingMs(current.processingMs ?? null);
        setStatus(restoredProcessedUrl ? "completed" : "idle");
      } catch (restoreError) {
        console.warn("Could not restore the current image", restoreError);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Cleanup only on component unmount - revoke all tracked blob URLs
  useEffect(() => {
    return () => {
      operationIdRef.current += 1;
      processingAbortRef.current?.abort();
      if (latestOriginalUrlRef.current && isBlobUrl(latestOriginalUrlRef.current)) {
        URL.revokeObjectURL(latestOriginalUrlRef.current);
      }
      if (latestProcessedUrlRef.current && isBlobUrl(latestProcessedUrlRef.current)) {
        URL.revokeObjectURL(latestProcessedUrlRef.current);
      }
    };
  }, [isBlobUrl]);

  const handleFile = useCallback(
    async (f: File) => {
      const selectionId = ++operationIdRef.current;
      processingAbortRef.current?.abort();
      processingAbortRef.current = null;
      const fallbackStatus: Status = processedUrl ? "completed" : file ? "idle" : "failed";
      setError(null);
      setStatus("validating");
      const err = await validateImageFile(f);
      if (selectionId !== operationIdRef.current) return;
      if (err) {
        setError(err.message);
        setStatus(fallbackStatus);
        toast.error(err.message);
        return;
      }
      const d = await readImageDimensions(f);
      if (selectionId !== operationIdRef.current) return;

      if (originalUrl && isBlobUrl(originalUrl)) URL.revokeObjectURL(originalUrl);
      if (processedUrl && isBlobUrl(processedUrl)) URL.revokeObjectURL(processedUrl);

      setDims(d);
      setFile(f);
      setOriginalUrl(URL.createObjectURL(f));
      setProcessedUrl(null);
      setProgress(0);
      setProcessingMs(null);
      setStatus("idle");

      try {
        await saveCurrentResult({
          originalBlob: f,
          originalFileName: f.name,
          originalFileType: f.type,
          originalFileSize: f.size,
          width: d.width,
          height: d.height,
          status: "idle",
        });
      } catch (storageError) {
        console.warn("Could not persist the selected image", storageError);
      }
    },
    [file, originalUrl, processedUrl, isBlobUrl],
  );

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              handleFile(file);
            }
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFile]);

  const onFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    event.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const reset = () => {
    operationIdRef.current += 1;
    processingAbortRef.current?.abort();
    processingAbortRef.current = null;
    if (originalUrl && isBlobUrl(originalUrl)) URL.revokeObjectURL(originalUrl);
    if (processedUrl && isBlobUrl(processedUrl)) URL.revokeObjectURL(processedUrl);
    setFile(null);
    setOriginalUrl(null);
    setProcessedUrl(null);
    setDims(null);
    setStatus("idle");
    setProgress(0);
    setError(null);
    setProcessingMs(null);
    void clearCurrentResult().catch((storageError) => {
      console.warn("Could not clear the current image", storageError);
    });
  };

  const handleUploadAnother = () => {
    // Reset input value to allow selecting same file again
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  };

  const process = async () => {
    if (!file || status === "processing") return;
    const fileToProcess = file;
    const operationId = ++operationIdRef.current;
    const controller = new AbortController();
    processingAbortRef.current?.abort();
    processingAbortRef.current = controller;
    setStatus("processing");
    setProgress(0);
    setError(null);
    let simTimer: number | null = null;
    let timedOut = false;
    const timeoutTimer = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 100_000);

    try {
      const startedAt = performance.now();

      let currentProgress = 0;
      simTimer = window.setInterval(() => {
        if (operationId !== operationIdRef.current) return;
        const elapsed = performance.now() - startedAt;
        const simulated = 0.95 * (1 - Math.exp(-elapsed / 12000));
        if (simulated > currentProgress) {
          currentProgress = simulated;
          setProgress(currentProgress);
        }
      }, 120);

      const response = await fetch("/api/remove-background", {
        method: "POST",
        body: fileToProcess,
        headers: {
          "Content-Type": fileToProcess.type,
        },
        signal: controller.signal,
      });

      if (simTimer) {
        clearInterval(simTimer);
        simTimer = null;
      }

      const responseText = await response.text();
      let data: { imageUrl?: unknown; error?: unknown };
      try {
        data = JSON.parse(responseText) as { imageUrl?: unknown; error?: unknown };
      } catch {
        throw new Error("The image processor returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "The image processor could not process this image.",
        );
      }

      if (typeof data.imageUrl !== "string") {
        throw new Error("The image processor did not return the processed image.");
      }
      const processedImageUrl = new URL(data.imageUrl);
      if (processedImageUrl.protocol !== "https:") {
        throw new Error("The image processor returned an unsafe image URL.");
      }

      const processedResponse = await fetch(processedImageUrl, { signal: controller.signal });
      if (!processedResponse.ok) {
        throw new Error("The processed image could not be downloaded.");
      }
      const processedContentType = processedResponse.headers.get("content-type") ?? "";
      if (!processedContentType.toLowerCase().startsWith("image/")) {
        throw new Error("The processor returned a file that is not an image.");
      }
      const processedBlob = await processedResponse.blob();
      if (processedBlob.size === 0 || processedBlob.size > 25 * 1024 * 1024) {
        throw new Error("The processed image has an invalid size.");
      }
      if (operationId !== operationIdRef.current) return;

      const localProcessedUrl = URL.createObjectURL(processedBlob);
      if (processedUrl && isBlobUrl(processedUrl)) URL.revokeObjectURL(processedUrl);
      setProgress(1);
      setProcessedUrl(localProcessedUrl);
      const finalProcessingMs = Math.round(performance.now() - startedAt);
      setProcessingMs(finalProcessingMs);
      setStatus("completed");

      try {
        await saveCurrentResult({
          originalBlob: fileToProcess,
          processedBlob,
          originalFileName: fileToProcess.name,
          originalFileType: fileToProcess.type,
          originalFileSize: fileToProcess.size,
          width: dims?.width,
          height: dims?.height,
          processingMs: finalProcessingMs,
          status: "completed",
        });
      } catch (storageError) {
        console.warn("Could not persist the current result", storageError);
      }

      try {
        await saveHistoryEntry({
          id: crypto.randomUUID(),
          originalBlob: fileToProcess,
          processedBlob,
          originalFileName: fileToProcess.name,
          originalFileType: fileToProcess.type,
          originalFileSize: fileToProcess.size,
          createdAt: new Date().toISOString(),
        });
      } catch (historyError) {
        console.warn("Could not save this result to browser history", historyError);
        toast.warning("The result is ready, but browser history could not be saved.");
      }
    } catch (e) {
      if (operationId !== operationIdRef.current) return;
      console.error(e);
      setError(
        timedOut
          ? "Processing took too long. Please try again."
          : e instanceof Error
            ? e.message
            : "Processing failed. Please try again.",
      );
      setStatus("failed");
    } finally {
      window.clearTimeout(timeoutTimer);
      if (simTimer) {
        clearInterval(simTimer);
      }
      if (processingAbortRef.current === controller) {
        processingAbortRef.current = null;
      }
    }
  };

  const download = async () => {
    if (!processedUrl) return;
    try {
      // Fetch the processed image as a Blob
      const response = await fetch(processedUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch image for download");
      }
      const blob = await response.blob();

      // Create temporary object URL
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = (file?.name.replace(/\.[^.]+$/, "") ?? "clearcut") + "-transparent.png";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch (e) {
      console.error(e);
      toast.error("Failed to download image. Please try again.");
    }
  };

  return (
    <>
      {/* Always render the file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={onFiles}
      />

      {status === "completed" && originalUrl && processedUrl ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <figure className="rounded-2xl border border-border/60 bg-card/40 p-3">
              <figcaption className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span>Original</span>
              </figcaption>
              <div
                className="flex h-[40vh] items-center justify-center overflow-hidden rounded-xl bg-muted/30 cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (originalUrl) {
                    setLightboxSrc(originalUrl);
                    setLightboxAlt("Original");
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (originalUrl) {
                      setLightboxSrc(originalUrl);
                      setLightboxAlt("Original");
                    }
                  }
                }}
              >
                <img
                  src={originalUrl}
                  alt="Original"
                  className="max-h-full max-w-full object-contain cursor-pointer pointer-events-auto"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (originalUrl) {
                      setLightboxSrc(originalUrl);
                      setLightboxAlt("Original");
                    }
                  }}
                />
              </div>
            </figure>
            <figure className="rounded-2xl border border-border/60 bg-card/40 p-3">
              <figcaption className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span>Background removed</span>
              </figcaption>
              <div
                className="flex h-[40vh] items-center justify-center overflow-hidden rounded-xl checkerboard cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (processedUrl) {
                    setLightboxSrc(processedUrl);
                    setLightboxAlt("Background removed");
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (processedUrl) {
                      setLightboxSrc(processedUrl);
                      setLightboxAlt("Background removed");
                    }
                  }
                }}
              >
                <img
                  src={processedUrl}
                  alt="Background removed"
                  className="max-h-full max-w-full object-contain cursor-pointer pointer-events-auto"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (processedUrl) {
                      setLightboxSrc(processedUrl);
                      setLightboxAlt("Background removed");
                    }
                  }}
                />
              </div>
            </figure>
          </div>
          <details className="rounded-2xl border border-border/60 bg-card/40">
            <summary className="cursor-pointer px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              Compare with slider
            </summary>
            <div className="p-3">
              <BeforeAfterSlider
                beforeSrc={originalUrl}
                afterSrc={processedUrl}
                alt="Result"
                className="aspect-video"
              />
            </div>
          </details>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 p-3">
            <div className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">
                Done in {(processingMs! / 1000).toFixed(1)}s
              </span>
              {" · "}Saved in this browser for up to 7 days.
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleUploadAnother();
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-4 py-2 text-sm font-medium hover:bg-accent/10"
              >
                <RefreshCw className="h-4 w-4" /> Upload another
              </button>
              <button
                type="button"
                onClick={download}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow-sm"
              >
                <Download className="h-4 w-4" /> Download PNG
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`relative rounded-3xl border-2 border-dashed p-8 transition-all ${
              isDragging
                ? "border-primary bg-primary/5 shadow-glow"
                : "border-border/70 bg-card/40 hover:border-border"
            }`}
          >
            {!originalUrl ? (
              <div
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-4 py-10 text-center cursor-pointer"
              >
                <div className="rounded-2xl bg-gradient-brand p-4 shadow-glow">
                  <Upload className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-semibold">Drag & drop your image</div>
                  <div>
                    <span className="text-sm text-muted-foreground">or </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        inputRef.current?.click();
                      }}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      browse files
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    JPG, PNG, WEBP • Max 10MB • Up to 5000×5000px
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <img
                  src={originalUrl}
                  alt="Selected"
                  className="h-24 w-24 rounded-xl object-cover checkerboard"
                />
                <div className="min-w-0">
                  <div className="truncate font-medium">{file?.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {(file!.size / 1024).toFixed(0)} KB
                    {dims ? ` · ${dims.width} × ${dims.height}px` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                >
                  <X className="h-4 w-4" /> Remove
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
              <div>
                <div className="font-medium text-destructive">Couldn't process this image</div>
                <div className="mt-1 text-muted-foreground">{error}</div>
              </div>
            </div>
          )}

          {status === "processing" && (
            <div className="rounded-xl border border-border/60 bg-card/60 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Removing background… {Math.round(progress * 100)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-brand transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          )}

          {originalUrl && status !== "processing" && status !== "validating" && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                Securely processed through our server; browser history stays on this device.
              </div>
              <button
                type="button"
                onClick={process}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-sm transition-transform hover:scale-[1.02]"
              >
                <ImageIcon className="h-4 w-4" /> Remove background
              </button>
            </div>
          )}
        </div>
      )}

      {/* Always render lightbox */}
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
    </>
  );
}
