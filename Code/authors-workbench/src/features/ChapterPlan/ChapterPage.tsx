import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Clock,
  LayoutGrid,
  List,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Field, Modal, PageHeader, ToolButton } from "../../components/primitives";
import { useWorkbench } from "../../lib/store";
import "./ChapterPage.css";
import type {
  Chapter,
  Character,
  Location,
  StoryEvent,
  StoryScene,
  WritingProject,
} from "../../lib/domain";
import { getStoryStructureOption } from "../story-structure/storyStructureTemplate";
import {
  getActChapterRanges,
  getStoryBeatChapterMappings,
} from "../story-structure/storyChapterMapping";

type ViewMode = "grid" | "list";

// ---------------------------------------------------------------------------
// Shared constants & pure helpers
// ---------------------------------------------------------------------------

const ACT_COLORS = [
  "var(--mustard-soft)",
  "var(--blue-soft)",
  "var(--coral-soft)",
  "var(--sage-soft)",
];
const ACT_TEXT_COLORS = ["#8a6d1f", "var(--blue)", "var(--coral-dark)", "var(--sage)"];

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

const toRoman = (n: number): string => {
  const map: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  for (const [value, symbol] of map) {
    while (n >= value) {
      out += symbol;
      n -= value;
    }
  }
  return out;
};

const fmtPct = (n: number): string => String(Math.round(n * 10) / 10);

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

function ChapterCard({
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
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
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
      }${insertBefore ? " insert-before" : ""}${insertAfter ? " insert-after" : ""}`}
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
                >
                  {c.name.slice(0, 2).toUpperCase()}
                </span>
              ))}
              {sortedChars.length > 3 && (
                <span className="card-av more">+{sortedChars.length - 3}</span>
              )}
            </span>
          )}
          {locs.map((l) => (
            <span className="card-loc" key={l.id}>
              {l.name}
            </span>
          ))}
          {evts.map((e) => (
            <span className="card-evt" key={e.id}>
              {e.title}
            </span>
          ))}
          {scenes.map((s) => (
            <span className="card-evt" key={s.id}>
              {s.title}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// ChapterEditor — right-side editing panel: chapter title + chapter notes
// ---------------------------------------------------------------------------

function ChapterEditor({
  project,
  chapter,
  onChange,
  onClose,
}: {
  project: WritingProject;
  chapter: Chapter;
  onChange: (patch: Partial<Chapter>) => void;
  onClose: () => void;
}) {
  const {
    addCharacter,
    addLocation,
    addStoryEvent,
    addStoryScene,
    updateStoryScene,
    removeChapter,
    updateStoryEvent,
  } = useWorkbench();

  const chapterId = chapter.id;
  const myChars = new Set(chapter.characterIds ?? []);
  const myLocs = new Set(chapter.locationIds ?? []);
  const myEvents = project.events.filter((e) => e.chapterIds.includes(chapterId));
  const myScenes = project.scenes.filter((s) => s.chapterIds.includes(chapterId));

  const [openMenu, setOpenMenu] = useState<null | "char" | "loc" | "evt">(null);
  const [createKind, setCreateKind] = useState<null | "character" | "location" | "event">(null);
  const [createType, setCreateType] = useState<null | "scene" | "event">("scene");
  const [nameDraft, setNameDraft] = useState("");

  const toggleCharacter = (id: string) => {
    const next = myChars.has(id)
      ? (chapter.characterIds ?? []).filter((x) => x !== id)
      : [...(chapter.characterIds ?? []), id];
    onChange({ characterIds: next });
  };

  const toggleLocation = (id: string) => {
    const next = myLocs.has(id)
      ? (chapter.locationIds ?? []).filter((x) => x !== id)
      : [...(chapter.locationIds ?? []), id];
    onChange({ locationIds: next });
  };

  const toggleEvent = (eventId: string) => {
    const ev = project.events.find((e) => e.id === eventId);
    if (!ev) return;
    const has = ev.chapterIds.includes(chapterId);
    updateStoryEvent(project.id, eventId, {
      chapterIds: has
        ? ev.chapterIds.filter((c) => c !== chapterId)
        : [...ev.chapterIds, chapterId],
    });
  };

  const toggleScene = (sceneId: string) => {
    const sc = project.scenes.find((s) => s.id === sceneId);
    if (!sc) return;
    const has = sc.chapterIds.includes(chapterId);
    updateStoryScene(project.id, sceneId, {
      chapterIds: has
        ? sc.chapterIds.filter((c) => c !== chapterId)
        : [...sc.chapterIds, chapterId],
    });
  };

  const newCharacter = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const [first, ...rest] = trimmed.split(/\s+/);
    const c = addCharacter(project.id, {
      firstName: first,
      lastName: rest.join(" "),
      birthday: { year: 0 },
    });
    onChange({ characterIds: [...(chapter.characterIds ?? []), c.id] });
  };

  const newLocation = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const loc = addLocation(project.id, { name: trimmed });
    onChange({ locationIds: [...(chapter.locationIds ?? []), loc.id] });
  };

  const newEvent = (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    addStoryEvent(project.id, {
      title: trimmed,
      chapterIds: [chapterId],
      startDate: { year: 0 },
      endDate: { year: 0 },
      isStoryBeat: false,
    });
  };

  const newScene = (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    addStoryScene(project.id, {
      title: trimmed,
      chapterIds: [chapterId],
      date: { year: 0 },
    });
  };

  const openCreate = (kind: "character" | "location" | "event") => {
    setNameDraft("");
    setCreateKind(kind);
    if (kind === "event") setCreateType("scene");
  };

  const submitCreate = () => {
    if (createKind === "character") newCharacter(nameDraft);
    else if (createKind === "location") newLocation(nameDraft);
    else if (createKind === "event") {
      if (createType === "scene") newScene(nameDraft);
      else newEvent(nameDraft);
    }
    setCreateKind(null);
  };

  const renderAddMenu = (
    kind: "char" | "loc" | "evt",
    options: React.ReactNode
  ) => (
    <div
      className="add-wrap"
      tabIndex={-1}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setOpenMenu(null);
        }
      }}
    >
      <button
        type="button"
        className="chip-add"
        onClick={() => setOpenMenu(openMenu === kind ? null : kind)}
      >
        + Add
      </button>
      {openMenu === kind && <div className="add-menu">{options}</div>}
    </div>
  );

  return (
    <aside className="chapter-plan-editor">
      <header>
        <h2>Chapter {chapter.order + 1}</h2>
        <span className="head-actions">
          <button
            type="button"
            className="icon-button delete-icon"
            onClick={() => removeChapter(project.id, chapter.id)}
            title="Delete chapter"
          >
            <Trash2 size={16} />
          </button>
          <button type="button" className="icon-button" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </span>
      </header>
      <p className="chapter-plan-editor-meta">
        {chapter.targetWordCount
          ? `${chapter.targetWordCount.toLocaleString()} words`
          : "No word target yet"}
      </p>

      <Field label="Chapter title" full>
        <input value={chapter.title} onChange={(e) => onChange({ title: e.target.value })} />
      </Field>

      <Field label="Characters" full>
        <div className="chip-row" onClick={(e) => e.preventDefault()}>
          {project.characters
            .filter((c) => myChars.has(c.id))
            .map((c) => (
              <span className="chip chip-char" key={c.id}>
                <span className="chip-avatar">{c.name.slice(0, 2).toUpperCase()}</span>
                <span className="chip-label">{c.name}</span>
                <span className="chip-x" onClick={() => toggleCharacter(c.id)}>
                  &times;
                </span>
              </span>
            ))}
          {renderAddMenu(
            "char",
            <>
              {project.characters
                .filter((c) => !myChars.has(c.id))
                .map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    className="add-opt"
                    onClick={() => {
                      toggleCharacter(c.id);
                      setOpenMenu(null);
                    }}
                  >
                    <span className="chip-avatar">{c.name.slice(0, 2).toUpperCase()}</span>
                    {c.name}
                  </button>
                ))}
              <div className="add-sep" />
              <button
                type="button"
                className="add-opt create"
                onClick={() => {
                  openCreate("character");
                  setOpenMenu(null);
                }}
              >
                + Create new character...
              </button>
            </>
          )}
        </div>
      </Field>

      <Field label="Locations" full>
        <div className="chip-row" onClick={(e) => e.preventDefault()}>
          {project.locations
            .filter((l) => myLocs.has(l.id))
            .map((l) => (
              <span className="chip chip-loc" key={l.id}>
                <span className="chip-label">{l.name}</span>
                <span className="chip-x" onClick={() => toggleLocation(l.id)}>
                  &times;
                </span>
              </span>
            ))}
          {renderAddMenu(
            "loc",
            <>
              {project.locations
                .filter((l) => !myLocs.has(l.id))
                .map((l) => (
                  <button
                    type="button"
                    key={l.id}
                    className="add-opt"
                    onClick={() => {
                      toggleLocation(l.id);
                      setOpenMenu(null);
                    }}
                  >
                    {l.name}
                  </button>
                ))}
              <div className="add-sep" />
              <button
                type="button"
                className="add-opt create"
                onClick={() => {
                  openCreate("location");
                  setOpenMenu(null);
                }}
              >
                + Create new location...
              </button>
            </>
          )}
        </div>
      </Field>

      <Field label="Events" full>
        <div className="chip-row" onClick={(e) => e.preventDefault()}>
          {myEvents.map((ev) => (
            <span className="chip chip-evt" key={ev.id}>
              <span className="chip-label">{ev.title}</span>
              <span className="chip-x" onClick={() => toggleEvent(ev.id)}>
                &times;
              </span>
            </span>
          ))}
          {myScenes.map((sc) => (
            <span className="chip chip-evt" key={sc.id}>
              <span className="chip-label">{sc.title}</span>
              <span className="chip-x" onClick={() => toggleScene(sc.id)}>
                &times;
              </span>
            </span>
          ))}
          {renderAddMenu(
            "evt",
            <>
              {project.events
                .filter((e) => !e.chapterIds.includes(chapterId))
                .map((e) => (
                  <button
                    type="button"
                    key={e.id}
                    className="add-opt"
                    onClick={() => {
                      toggleEvent(e.id);
                      setOpenMenu(null);
                    }}
                  >
                    {e.title}
                  </button>
                ))}
              {project.scenes
                .filter((s) => !s.chapterIds.includes(chapterId))
                .map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    className="add-opt"
                    onClick={() => {
                      toggleScene(s.id);
                      setOpenMenu(null);
                    }}
                  >
                    {s.title}
                  </button>
                ))}
              <div className="add-sep" />
              <button
                type="button"
                className="add-opt create"
                onClick={() => {
                  openCreate("event");
                  setOpenMenu(null);
                }}
              >
                + Create new event...
              </button>
            </>
          )}
        </div>
      </Field>

      <Field label="Chapter notes" full>
        <textarea
          value={chapter.notes ?? ""}
          placeholder="Write a summary, scene list, questions or notes here..."
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </Field>

      {createKind &&
        createPortal(
          <Modal
            title={
              createKind === "character"
                ? "New character"
                : createKind === "location"
                  ? "New location"
                  : createType === "scene"
                    ? "New scene"
                    : "New event"
            }
            onClose={() => setCreateKind(null)}
          >
            <div className="modal-body">
              {createKind === "event" && (
                <div className="create-type-toggle">
                  <button
                    type="button"
                    className={createType === "scene" ? "active" : ""}
                    onClick={() => setCreateType("scene")}
                  >
                    <Clock size={13} /> Scene
                  </button>
                  <button
                    type="button"
                    className={createType === "event" ? "active" : ""}
                    onClick={() => setCreateType("event")}
                  >
                    <CalendarDays size={13} /> Continuous Event
                  </button>
                </div>
              )}
              <label className="modal-field-label">
                {createKind === "event" ? "Title" : "Name"}
              </label>
              <input
                autoFocus
                className="modal-input"
                value={nameDraft}
                placeholder={
                  createKind === "character"
                    ? "Character name"
                    : createKind === "location"
                      ? "Location name"
                      : createType === "scene"
                        ? "Scene title"
                        : "Event title"
                }
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitCreate();
                }}
              />
              <div className="modal-actions">
                <ToolButton onClick={() => setCreateKind(null)}>Cancel</ToolButton>
                <ToolButton primary onClick={submitCreate}>
                  Create
                </ToolButton>
              </div>
            </div>
          </Modal>,
          document.body,
        )}
    </aside>
  );
}

// ---------------------------------------------------------------------------
// ChapterPage — act color band + grid/list views + chapter editor.
// ---------------------------------------------------------------------------

export function ChapterPage({ project }: { project: WritingProject }) {
  const { addChapter, updateChapter, updateProject, customStoryStructures } = useWorkbench();
  const [view, setView] = useState<ViewMode>("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const suppressClick = useRef(false);

  const chapters = project.chapters || [];
  const template = getStoryStructureOption(project.storyStructure, customStoryStructures);
  const selected = chapters.find((c) => c.id === selectedId) ?? null;

  // ---- Act ranges ----------------------------------------------------------

  const actRanges = getActChapterRanges(template.acts, chapters.length);
  const actIndexFor = (order: number): number => {
    const num = order + 1;
    return actRanges.findIndex((range) => num >= range.start && num <= range.end) + 1;
  };

  // ---- Beat assignment -----------------------------------------------------
  // Pick one beat per chapter: prefer a beat not shown yet, else the first match.

  const beatMappings = getStoryBeatChapterMappings(template, chapters.length);
  const beatNamesFor = (order: number): string[] => {
    const num = order + 1;
    return beatMappings
      .filter((b) => num >= b.chapterRange.start && num <= b.chapterRange.end)
      .map((b) => b.storyBeatName);
  };
  const usedBeatNames = new Set<string>();
  const beatByChapter = new Map<string, string>();
  for (const c of chapters) {
    const names = beatNamesFor(c.order);
    const chosen = names.find((name) => !usedBeatNames.has(name)) ?? names[0];
    if (chosen) {
      usedBeatNames.add(chosen);
      beatByChapter.set(c.id, chosen);
    }
  }

  // ---- Reorder -------------------------------------------------------------

  const reorderChapter = (fromId: string, toIndex: number) => {
    updateProject(project.id, (p) => {
      const list = [...p.chapters];
      const from = list.findIndex((c) => c.id === fromId);
      if (from === -1 || toIndex < 0 || toIndex > list.length) return p;
      const [moved] = list.splice(from, 1);
      // When moving a chapter toward the end, the array shrank by one, so the
      // destination slot shifts left by one.
      list.splice(from < toIndex ? toIndex - 1 : toIndex, 0, moved);
      return { ...p, chapters: list.map((c, i) => ({ ...c, order: i })) };
    });
  };

  // ---- Resolve linked entities for a chapter card --------------------------

  const cardEntities = (c: Chapter) => {
    const evs = (project.events || []).filter((e) => e.chapterIds.includes(c.id));
    const scenes = (project.scenes || []).filter((s) => s.chapterIds.includes(c.id));

    // Characters: chapter's own + those from its linked events and scenes
    const directChars = (project.characters || []).filter((x) =>
      (c.characterIds ?? []).includes(x.id),
    );
    const evChars = evs
      .flatMap((e) =>
        (e.characterIds ?? []).map((id) =>
          (project.characters || []).find((x) => x.id === id),
        ),
      )
      .filter((x): x is Character => Boolean(x));
    const sceneChars = scenes
      .flatMap((s) =>
        (s.characterIds ?? []).map((id) =>
          (project.characters || []).find((x) => x.id === id),
        ),
      )
      .filter((x): x is Character => Boolean(x));
    const mergedChars = [...directChars, ...evChars, ...sceneChars].filter(
      (x, i, arr) => arr.findIndex((y) => y.id === x.id) === i,
    );

    // Locations: chapter's own + those from its linked events and scenes
    const directLocs = (project.locations || []).filter((x) =>
      (c.locationIds ?? []).includes(x.id),
    );
    const evLocs = evs
      .map((e) =>
        e.locationId ? (project.locations || []).find((l) => l.id === e.locationId) : undefined,
      )
      .filter((x): x is Location => Boolean(x));
    const sceneLocs = scenes
      .map((s) =>
        s.locationId ? (project.locations || []).find((l) => l.id === s.locationId) : undefined,
      )
      .filter((x): x is Location => Boolean(x));
    const mergedLocs = [...directLocs, ...evLocs, ...sceneLocs].filter(
      (x, i, arr) => arr.findIndex((y) => y.id === x.id) === i,
    );

    return { evs, scenes, mergedChars, mergedLocs };
  };

  return (
    <div className="page-stack core-page">
      <PageHeader
        eyebrow="MANUSCRIPT"
        title="Chapter Plan"
        count={`${chapters.length} projected chapters · ${template.name}`}
      >
        <ToolButton primary onClick={() => addChapter(project.id)}>
          <Plus size={15} /> Add chapter
        </ToolButton>
      </PageHeader>

      {chapters.length === 0 ? (
        <p className="muted-copy">No chapters yet. Add a chapter to start planning.</p>
      ) : (
        <div className="chapter-plan-layout">
          <div className="chapter-plan-main">
            <div className="act-band">
              {template.acts.map((act, index) => (
                <div
                  key={act.id}
                  className="act-band-segment"
                  style={{
                    flexGrow: act.endPercent - act.startPercent,
                    background: ACT_COLORS[index % ACT_COLORS.length],
                    color: ACT_TEXT_COLORS[index % ACT_TEXT_COLORS.length],
                  }}
                >
                  <strong>Act {toRoman(index + 1)}</strong>
                  <span>
                    {fmtPct(act.startPercent)}–{fmtPct(act.endPercent)}%
                  </span>
                </div>
              ))}
            </div>

            {view === "grid" ? (
              <div className="chapter-grid" onDragOver={(e) => e.preventDefault()}>
                {chapters.map((c, cIdx) => {
                  const { evs, scenes, mergedChars, mergedLocs } = cardEntities(c);
                  return (
                    <ChapterCard
                      key={c.id}
                      chapter={c}
                      actIndex={actIndexFor(c.order)}
                      beatName={beatByChapter.get(c.id)}
                      chars={mergedChars}
                      locs={mergedLocs}
                      evts={evs}
                      scenes={scenes}
                      selected={selectedId === c.id}
                      onClick={() => {
                        if (suppressClick.current) {
                          suppressClick.current = false;
                          return;
                        }
                        setSelectedId(c.id);
                      }}
                      dragging={dragId === c.id}
                      insertBefore={insertIndex === cIdx}
                      insertAfter={
                        insertIndex === cIdx + 1 && cIdx === chapters.length - 1
                      }
                      onDragStart={(e) => {
                        setDragId(c.id);
                        suppressClick.current = true;
                        e.dataTransfer.setData("text/plain", c.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => {
                        suppressClick.current = false;
                        setDragId(null);
                        setInsertIndex(null);
                      }}
                      onDragOver={(e) => {
                        if (c.id === dragId) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const before = e.clientX < rect.left + rect.width / 2;
                        setInsertIndex(before ? cIdx : cIdx + 1);
                        e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragId && insertIndex !== null) {
                          const fromIdx = chapters.findIndex((x) => x.id === dragId);
                          const isNoop =
                            insertIndex === fromIdx || insertIndex === fromIdx + 1;
                          if (!isNoop) reorderChapter(dragId, insertIndex);
                        }
                        setDragId(null);
                        setInsertIndex(null);
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="chapter-list">
                {chapters.map((c) => {
                  const ai = actIndexFor(c.order);
                  const aiColor =
                    ai > 0 ? ACT_COLORS[(ai - 1) % ACT_COLORS.length] : undefined;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`chapter-plan-row${ai > 0 ? " act-bar" : ""}${
                        selectedId === c.id ? " selected" : ""
                      }`}
                      style={aiColor ? { borderLeftColor: aiColor } : undefined}
                      onClick={() => setSelectedId(c.id)}
                    >
                      <span className="chapter-plan-row-num">CHAPTER {c.order + 1}</span>
                      <strong>{c.title}</strong>
                      <span className="chapter-plan-row-status">
                        {c.targetWordCount
                          ? `${c.targetWordCount.toLocaleString()} words`
                          : "no target"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="chapter-plan-side">
            <div className="view-toggle">
              <button
                type="button"
                className={view === "grid" ? "active" : ""}
                onClick={() => setView("grid")}
                title="Grid view"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                className={view === "list" ? "active" : ""}
                onClick={() => setView("list")}
                title="List view"
              >
                <List size={15} />
              </button>
            </div>
            {selected && (
              <ChapterEditor
                project={project}
                chapter={selected}
                onChange={(patch) => updateChapter(project.id, selected.id, patch)}
                onClose={() => setSelectedId(null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
