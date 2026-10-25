import type { DragEvent } from "react";
import "./ChapterPage.css";
import type {
  Chapter,
  Character,
  Location,
  StoryEvent,
  StoryScene,
} from "../../lib/domain";

// Payload carried while an entity tag is dragged between chapter cards.
type EntityDragKind = "char" | "loc" | "evt" | "scene";

export interface EntityDrag {
  kind: EntityDragKind;
  entityId: string;
  fromChapterId: string;
}

// Shared constants & pure helpers
export const ACT_COLORS = [
  "var(--mustard-soft)",
  "var(--blue-soft)",
  "var(--coral-soft)",
  "var(--sage-soft)",
];

const AVATAR_COLORS = ["#bd615d", "#55748a", "#4e5944", "#a68a5b", "#8a6b8a", "#5b8a8a"];

// Priority ordering for character avatars: protagonists first, then by narrative significance.
const ROLE_PRIORITY: Record<string, number> = {
  Protagonist: 0,
  Deuteragonists: 1,
  Antagonist: 2,
  "Love interest": 3,
  Confidant: 4,
  Foils: 5,
  "Tertiary characters": 6,
};

const avatarColor = (name: string): string => {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const rolePriority = (c: Character): number => {
  const roles = c.role ?? [];
  if (roles.length === 0) return 7; // unmarked characters sort last
  return Math.min(...roles.map((role) => ROLE_PRIORITY[role] ?? 7));
};

// ---------------------------------------------------------------------------
// ChapterCard
// ---------------------------------------------------------------------------

export function ChapterCard({
  chapter,
  actIndex,
  beatName,
  chars,
  locs,
  evts,
  scenes,
  selected,
  onClick,
  dragging,
  insertBefore,
  insertAfter,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  dropTarget,
  onEntityDragStart,
  onEntityDragEnd,
}: {
  chapter: Chapter;
  actIndex: number;
  beatName?: string;
  chars: Character[];
  locs: Location[];
  evts: StoryEvent[];
  scenes: StoryScene[];
  selected: boolean;
  onClick: () => void;
  dragging?: boolean;
  insertBefore?: boolean;
  insertAfter?: boolean;
  onDragStart: (e: DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  dropTarget?: boolean;
  onEntityDragStart: (d: EntityDrag) => void;
  onEntityDragEnd: () => void;
}) {
  const actColor =
    actIndex > 0 ? ACT_COLORS[(actIndex - 1) % ACT_COLORS.length] : undefined;
  const hasEnts =
    chars.length > 0 || locs.length > 0 || evts.length > 0 || scenes.length > 0;
  const sortedChars = [...chars].sort((a, b) => rolePriority(a) - rolePriority(b));

  return (
    <button
      type="button"
      draggable
      className={`chapter-plan-card${actIndex > 0 ? " act-bar" : ""} ${selected ? "selected" : ""}${
        dragging ? " dragging" : ""
      }${insertBefore ? " insert-before" : ""}${insertAfter ? " insert-after" : ""}${
        dropTarget ? " drop-target" : ""
      }`}
      style={actColor ? { borderLeftColor: actColor } : undefined}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <span className="chapter-plan-card-num">CH. {chapter.order + 1}</span>
      <strong>{chapter.title}</strong>
      <span className="chapter-plan-card-meta">
        {chapter.targetWordCount
          ? `${chapter.targetWordCount.toLocaleString()} words`
          : "No target set"}
      </span>
      {beatName && <span className="chapter-plan-card-beat">{beatName}</span>}
      {chapter.notes && chapter.notes.trim() !== "" && (
        <span className="chapter-plan-card-notes">{chapter.notes}</span>
      )}
      {hasEnts && (
        <span className="card-ents">
          {chars.length > 0 && (
            <span className="card-avatars">
              {sortedChars.slice(0, 3).map((c) => (
                <span
                  className="card-av"
                  style={{ background: avatarColor(c.name) }}
                  key={c.id}
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    const payload: EntityDrag = {
                      kind: "char",
                      entityId: c.id,
                      fromChapterId: chapter.id,
                    };
                    e.dataTransfer.setData(
                      "application/x-entity",
                      JSON.stringify(payload)
                    );
                    onEntityDragStart(payload);
                  }}
                  onDragEnd={onEntityDragEnd}
                >
                  {c.name.slice(0, 2).toUpperCase()}
                </span>
              ))}
              {/* The "+N" badge is not draggable; it does not stand for one entity. */}
              {sortedChars.length > 3 && (
                <span className="card-av more">+{sortedChars.length - 3}</span>
              )}
            </span>
          )}
          {locs.map((l) => (
            <span
              className="card-loc"
              key={l.id}
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                const payload: EntityDrag = {
                  kind: "loc",
                  entityId: l.id,
                  fromChapterId: chapter.id,
                };
                e.dataTransfer.setData("application/x-entity", JSON.stringify(payload));
                onEntityDragStart(payload);
              }}
              onDragEnd={onEntityDragEnd}
            >
              {l.name}
            </span>
          ))}
          {evts.map((e) => (
            <span
              className="card-evt"
              key={e.id}
              draggable
              onDragStart={(ev) => {
                ev.stopPropagation();
                const payload: EntityDrag = {
                  kind: "evt",
                  entityId: e.id,
                  fromChapterId: chapter.id,
                };
                ev.dataTransfer.setData("application/x-entity", JSON.stringify(payload));
                onEntityDragStart(payload);
              }}
              onDragEnd={onEntityDragEnd}
            >
              {e.title}
            </span>
          ))}
          {scenes.map((s) => (
            <span
              className="card-scene"
              key={s.id}
              draggable
              onDragStart={(ev) => {
                ev.stopPropagation();
                const payload: EntityDrag = {
                  kind: "scene",
                  entityId: s.id,
                  fromChapterId: chapter.id,
                };
                ev.dataTransfer.setData("application/x-entity", JSON.stringify(payload));
                onEntityDragStart(payload);
              }}
              onDragEnd={onEntityDragEnd}
            >
              {s.title}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}
