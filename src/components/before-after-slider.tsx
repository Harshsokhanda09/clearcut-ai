import { useCallback, useEffect, useRef, useState } from "react";

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  alt = "",
  className = "",
}: {
  beforeSrc: string;
  afterSrc: string;
  alt?: string;
  className?: string;
}) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return;
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    updateFromClientX(e.clientX);
  };
  const stopDragging = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    const cancel = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointerup", cancel);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointerup", cancel);
      window.removeEventListener("pointercancel", cancel);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`relative w-full select-none overflow-hidden rounded-2xl border border-border/60 checkerboard touch-none ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      role="slider"
      aria-label="Before and after comparison"
      aria-valuenow={Math.round(pos)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
        if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
      }}
    >
      <img
        src={afterSrc}
        alt={alt}
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
      />
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img
          src={beforeSrc}
          alt={alt}
          draggable={false}
          className="absolute inset-0 h-full w-full object-contain"
        />
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-gradient-brand shadow-glow"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-brand p-2 shadow-glow">
          <div className="h-3 w-3 rounded-full bg-background" />
        </div>
      </div>
    </div>
  );
}
