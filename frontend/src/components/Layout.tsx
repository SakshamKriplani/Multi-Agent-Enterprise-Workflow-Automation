import { Boxes, GitBranch, LayoutDashboard, Menu, MonitorPlay, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router";

import { useHealth } from "../hooks/useHealth";
import { cn } from "../lib/utils";
import { ModeBadge } from "./ModeBadge";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/workflow", label: "Workflow Explorer", icon: GitBranch, end: false },
  { to: "/monitor", label: "Execution Monitor", icon: MonitorPlay, end: false },
  { to: "/architecture", label: "Architecture", icon: Boxes, end: false },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-0.5 px-3">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              isActive ? "bg-accent-soft font-medium text-accent" : "text-fg hover:bg-bg",
            )
          }
        >
          <Icon size={16} aria-hidden /> {label}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-5 py-4">
      <img src="/favicon.svg" alt="" className="h-6 w-6" />
      <div className="leading-tight">
        <div className="text-sm font-semibold">AI Orchestrator</div>
        <div className="text-xs text-muted">Procurement demo</div>
      </div>
    </div>
  );
}

function Footer() {
  const { data: health, error } = useHealth();
  return (
    <div className="space-y-2 px-5 py-4 text-xs text-muted">
      {health && <ModeBadge mode={health.execution_mode} model={health.llm_model} />}
      {error && <div className="text-danger">Backend unreachable</div>}
      <div>All data is synthetic. No real purchases.</div>
    </div>
  );
}

export function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-full md:pl-60">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-surface md:flex">
        <Brand />
        <div className="flex-1">
          <Nav />
        </div>
        <Footer />
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg px-3 md:hidden">
        <Brand />
        <button
          type="button"
          className="rounded-md p-2 hover:bg-surface"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      {open && (
        <div className="fixed inset-x-0 top-[57px] bottom-0 z-10 flex flex-col bg-surface md:hidden">
          <div className="flex-1 pt-2">
            <Nav onNavigate={() => setOpen(false)} />
          </div>
          <Footer />
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}
