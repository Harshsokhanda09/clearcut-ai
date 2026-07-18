export function Logo({ size = 32, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/LOGO.png"
        alt="ClearCut AI logo"
        width={size}
        height={size}
        className="rounded-lg"
        style={{ width: size, height: size }}
      />
      {withText && (
        <span className="font-display text-lg font-bold tracking-tight">
          ClearCut <span className="text-gradient-brand">AI</span>
        </span>
      )}
    </div>
  );
}
