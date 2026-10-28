import { useMemo, useState } from "react";
import {
  BookOpen,
  Calendar,
  FileText,
  MapPin,
  User,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useWorkbench } from "../../lib/store";
import type { WorkbenchView } from "../../lib/store";
import "./Sidebar.css";


// The sticky note at the top: a personal signature that can be edited by double-clicking.
function SignatureNote() {
  const [signature, setSignature] = useState(
    "Stories are like secret drawers — full of things we forgot we knew."
  );
  const [author, setAuthor] = useState("from Imbi's notebook");
  const [editing, setEditing] = useState<"signature" | "author" | null>(null);

  return (
    <div className="sticky-note">
      <span className="sticky-note-tape" />
      {editing === "signature" ? (
        <textarea
          className="sticky-note-edit"
          value={signature}
          autoFocus
          onChange={(e) => setSignature(e.target.value)}
          onBlur={() => setEditing(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              setEditing(null);
            }
          }}
        />
      ) : (
        <p className="sticky-note-text" onDoubleClick={() => setEditing("signature")}>
          {signature}
        </p>
      )}
      {editing === "author" ? (
        <input
          className="sticky-note-author-edit"
          value={author}
          autoFocus
          onChange={(e) => setAuthor(e.target.value)}
          onBlur={() => setEditing(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setEditing(null);
          }}
        />
      ) : (
        <p className="sticky-note-author" onDoubleClick={() => setEditing("author")}>
          — {author}
        </p>
      )}
    </div>
  );
}
type RecentItem = {
  kind: string;
  id: string;
  label: string;
  subtitle: string;
  view: WorkbenchView;
  icon: LucideIcon;
  editedAt: number;
};

// Human-friendly relative time, e.g. "2h ago".
function timeAgo(ts: number, now: number): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return d === 1 ? "yesterday" : `${d} days ago`;
  return new Date(ts).toLocaleDateString();
}

// The recently edited list: top four in the sidebar card, everything in the "view all" drawer.
function RecentlyViewed() {
  const { activeProject, setActiveView } = useWorkbench();
  // Whether the "view all" right drawer is open.
  const [viewAllOpen, setViewAllOpen] = useState(false);

  // Full, sorted list of everything edited recently in the active project.
  const allItems = useMemo<RecentItem[]>(() => {
    if (!activeProject) return [];
    // Items created before the timestamp existed fall back to the project's creation time.
    const baseline = activeProject.createdAt || 0;

    const recent: RecentItem[] = [];
    const push = (
      kind: string, id: string, view: WorkbenchView, icon: LucideIcon,
      label: string, subtitle: string, editedAt?: number
    ) => recent.push({ kind, id, label, subtitle, view, icon, editedAt: editedAt ?? baseline });

    (activeProject.chapters || []).forEach((c) =>
      push("chapter", c.id, "chapterPlan", BookOpen, c.title || `Chapter ${c.order + 1}`, "Chapter", c.updatedAt));
    (activeProject.characters || []).forEach((c) =>
      push("character", c.id, "characters", User, c.name, "Character profile", c.updatedAt));
    (activeProject.locations || []).forEach((l) =>
      push("location", l.id, "locations", MapPin, l.name, "Location", l.updatedAt));
    (activeProject.events || []).forEach((e) =>
      push("event", e.id, "events", Calendar, e.title, "Story event", e.updatedAt));
    (activeProject.scenes || []).forEach((s) =>
      push("scene", s.id, "events", FileText, s.title, "Scene", s.updatedAt));

    return recent.sort((a, b) => b.editedAt - a.editedAt);
  }, [activeProject]);

  // The compact card shows only the top four.
  const items = allItems.slice(0, 4);

  return (
    <>
      <section className="right-panel-section">
        <div className="right-panel-header">
          <h3>RECENTLY EDITED</h3>
          <span>{items.length} items</span>
        </div>

        {items.length === 0 ? (
          <p className="recent-empty">
            {activeProject ? "Nothing edited yet." : "Open a project to see recent edits."}
          </p>
        ) : (
          <div className="recent-list">
            {items.map((item, i) => (
              <button
                key={`${item.kind}-${item.id}`}
                type="button"
                className="recent-item"
                onClick={() => setActiveView(item.view)}
                title={`Open ${item.label}`}
              >
                <div className={`recent-item-icon color-${i % 4}`}>
                  <item.icon size={15} strokeWidth={1.8} />
                </div>
                <div className="recent-item-info">
                  <strong>{item.label}</strong>
                  <span>{item.subtitle}</span>
                </div>
                <span className="recent-item-time">{timeAgo(item.editedAt, Date.now())}</span>
              </button>
            ))}
          </div>
        )}

        <button type="button" className="view-all-link" onClick={() => setViewAllOpen(true)}>
          View all <span>→</span>
        </button>
      </section>

      {/* "View all" right drawer */}
      {viewAllOpen && (
        <>
          <div className="recent-drawer-scrim" onClick={() => setViewAllOpen(false)} />
          <aside className="recent-drawer" role="dialog" aria-modal="true" aria-label="All recently edited">
            <div className="recent-drawer-head">
              <h3>RECENTLY EDITED</h3>
              <span>{allItems.length} items</span>
              <button
                type="button"
                className="recent-drawer-close"
                aria-label="Close"
                onClick={() => setViewAllOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="recent-drawer-list">
              {allItems.map((item, i) => (
                <button
                  key={`${item.kind}-${item.id}`}
                  type="button"
                  className="recent-item"
                  onClick={() => {
                    setActiveView(item.view);
                    setViewAllOpen(false);
                  }}
                  title={`Open ${item.label}`}
                >
                  <div className={`recent-item-icon color-${i % 4}`}>
                    <item.icon size={15} strokeWidth={1.8} />
                  </div>
                  <div className="recent-item-info">
                    <strong>{item.label}</strong>
                    <span>{item.subtitle}</span>
                  </div>
                  <span className="recent-item-time">{timeAgo(item.editedAt, Date.now())}</span>
                </button>
              ))}
            </div>
          </aside>
        </>
      )}
    </>
  );
}

// The right sidebar: signature note, recently viewed, and daily inspiration.
export function RightSidebar() {
  return (
    <aside className="right-sidebar">
      <SignatureNote />
      <RecentlyViewed />
    </aside>
  );
}
