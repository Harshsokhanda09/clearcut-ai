import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Clock3,
  CreditCard,
  Gauge,
  History,
  ImageIcon,
  KeyRound,
  LayoutDashboard,
  Menu,
  Settings,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { getHistory, getImage, type HistoryItem } from "@/lib/storage";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — ClearCut AI" }],
  }),
  component: DashboardPage,
});

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Upload", icon: Upload, to: "/remove-background" },
  { label: "History", icon: History, to: "/history" },
  { label: "Billing", icon: CreditCard, to: "/pricing" },
  { label: "API Keys", icon: KeyRound, to: "/api" },
  { label: "Settings", icon: Settings, to: "/about" },
] as const;

function DashboardPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [plan, setPlan] = useState<"pro" | "credits" | null>(null);

  useEffect(() => {
    let active = true;
    const objectUrls: string[] = [];
    void (async () => {
      try {
        const entitlementResponse = await fetch("/api/entitlement", {
          headers: { Accept: "application/json" },
        });
        const entitlement = (await entitlementResponse.json()) as {
          active?: boolean;
          productId?: "pro" | "credits";
        };
        if (!entitlementResponse.ok || !entitlement.active || !entitlement.productId) {
          await navigate({ to: "/pricing", replace: true });
          return;
        }
        if (!active) return;
        setPlan(entitlement.productId);

        const items = await getHistory();
        if (!active) return;
        setHistory(items);
        const previewPairs = await Promise.all(
          items.slice(0, 5).map(async (item) => {
            const image = await getImage(item.id);
            const blob = image?.processedBlob ?? image?.originalBlob;
            if (!blob) return [item.id, ""] as const;
            const url = URL.createObjectURL(blob);
            objectUrls.push(url);
            return [item.id, url] as const;
          }),
        );
        if (active) setPreviews(Object.fromEntries(previewPairs));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [navigate]);

  const thisMonth = useMemo(() => {
    const now = new Date();
    return history.filter((item) => {
      const date = new Date(item.createdAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
  }, [history]);

  const remaining = plan === "pro" ? Math.max(0, 500 - thisMonth) : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex h-16 items-center border-b border-border/60 bg-background/90 px-4 backdrop-blur lg:pl-64">
        <button
          type="button"
          className="mr-3 rounded-lg p-2 lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle dashboard navigation"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link
          to="/remove-background"
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow-sm"
        >
          <Upload className="h-4 w-4" /> <span className="hidden sm:inline">New upload</span>
        </Link>
      </header>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border/60 bg-background transition-transform lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link to="/" className="flex h-16 items-center border-b border-border/60 px-5">
          <Logo size={34} />
        </Link>
        <nav className="space-y-1 p-3">
          {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
            <Link
              key={label}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                to === "/dashboard"
                  ? "bg-brand-blue/15 text-brand-cyan"
                  : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto m-3 rounded-2xl border border-brand-violet/30 bg-card/70 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-brand-cyan" />
            {plan === "pro" ? "Pro Plan" : "Credit Pack"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {remaining === null ? "Credits active" : `${remaining} removals remaining`}
          </p>
        </div>
      </aside>

      {menuOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-label="Close dashboard navigation"
        />
      )}

      <main className="p-4 sm:p-6 lg:ml-64 lg:p-8">
        {loading ? (
          <div className="py-24 text-center text-sm text-muted-foreground">Loading dashboard…</div>
        ) : (
          <div className="mx-auto max-w-7xl space-y-8">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={ImageIcon} label="Images Processed" value={history.length} />
              <MetricCard
                icon={Gauge}
                label={plan === "pro" ? "Removals Remaining" : "Credit Pack"}
                value={remaining ?? "Active"}
              />
              <MetricCard icon={BarChart3} label="This Month" value={thisMonth} />
              <MetricCard icon={Clock3} label="History Window" value="7 days" />
            </section>

            <section>
              <h2 className="mb-4 text-lg font-semibold">Quick actions</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <ActionCard to="/remove-background" icon={Upload} title="Upload Image">
                  Remove the background from a new image
                </ActionCard>
                <ActionCard to="/history" icon={History} title="View History">
                  Access your recent processed images
                </ActionCard>
                <ActionCard to="/api" icon={KeyRound} title="API Access">
                  Explore API integration options
                </ActionCard>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent images</h2>
                <Link to="/history" className="text-sm text-brand-cyan hover:underline">
                  View all
                </Link>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/40">
                {history.length === 0 ? (
                  <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No processed images yet.
                  </div>
                ) : (
                  history.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border/50 px-4 py-3 last:border-0 sm:grid-cols-[minmax(0,1fr)_160px_100px]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-lg bg-muted">
                          {previews[item.id] ? (
                            <img
                              src={previews[item.id]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="m-3 h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="truncate text-sm font-medium">
                          {item.originalFileName}
                        </span>
                      </div>
                      <span className="hidden text-sm text-muted-foreground sm:block">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      <span className="rounded-full bg-success/10 px-2.5 py-1 text-center text-xs text-success">
                        Completed
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ImageIcon;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-5">
      <Icon className="h-5 w-5 text-brand-cyan" />
      <div className="mt-5 text-2xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function ActionCard({
  to,
  icon: Icon,
  title,
  children,
}: {
  to: "/remove-background" | "/history" | "/api";
  icon: typeof Upload;
  title: string;
  children: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-border/60 bg-card/50 p-5 transition hover:border-brand-cyan/40 hover:bg-card/80"
    >
      <Icon className="h-6 w-6 text-brand-cyan" />
      <h3 className="mt-5 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </Link>
  );
}
