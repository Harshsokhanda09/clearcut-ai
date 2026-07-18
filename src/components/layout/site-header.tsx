import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const NAV = [
  { to: "/features", label: "Features" },
  { to: "/history", label: "History" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center">
          <Logo size={32} />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to}>
              {({ isActive }) => (
                <span
                  className={`text-sm transition-colors duration-300 ${
                    isActive
                      ? "text-gradient-brand font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n.label}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <button
          className="rounded-lg p-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background/95 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)}>
                {({ isActive }) => (
                  <span
                    className={`block rounded-md px-3 py-2 text-sm transition-colors duration-300 ${
                      isActive
                        ? "text-gradient-brand font-semibold bg-accent/10"
                        : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                    }`}
                  >
                    {n.label}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
