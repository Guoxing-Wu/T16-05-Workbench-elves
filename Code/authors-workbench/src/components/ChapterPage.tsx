import { useState } from "react";
import { createPortal } from "react-dom";
import { LayoutGrid, List, Plus, Trash2, X } from "lucide-react";
import { Field, Modal, PageHeader, ToolButton } from "./primitives";
import { useWorkbench } from "../lib/store";
import type { Chapter, Character, Location, StoryEvent, WritingProject } from "../lib/domain";
import { getStoryStructureOption } from "../features/story-structure/storyStructureTemplate";
import { getActChapterRanges, getStoryBeatChapterMappings } from "../features/story-structure/storyChapterMapping";

type ViewMode = "grid" | "list";

const toRoman = (n: number): string => {
  const map: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [v, s] of map) { while (n >= v) { out += s; n -= v; } }
  return out;
};
const ACT_COLORS = ["var(--mustard-soft)", "var(--blue-soft)", "var(--coral-soft)", "var(--sage-soft)"];
const ACT_TEXT_COLORS = ["#8a6d1f", "var(--blue)", "var(--coral-dark)", "var(--sage)"];
const fmtPct = (n: number) => String(Math.round(n * 10) / 10);
const AVATAR_COLORS = ["#bd615d", "#55748a", "#7a8a6b", "#a68a5b", "#8a6b8a", "#5b8a8a"]; const avatarColor = (name: string) => {   let h = 0;   for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;   return AVATAR_COLORS[h % AVATAR_COLORS.length]; };

function ChapterCard({
  chapter,
  actIndex,
  beatName,
  chars,
  locs,
  evts,
  selected,
  onClick,
}: {
  chapter: Chapter;
  actIndex: number;
  beatName?: string;
  chars: Character[];
  locs: Location[];
  evts: StoryEvent[];
  selected: boolean;
  onClick: () => void;
}) {
  const actColor = actIndex > 0 ? ACT_COLORS[(actIndex - 1) % ACT_COLORS.length] : undefined;
  const hasEnts = chars.length > 0 || locs.length > 0 || evts.length > 0;
  return (
    <button
      type="button"
      className={`chapter-plan-card${actIndex > 0 ? " act-bar" : ""} ${selected ? "selected" : ""}`}
      style={actColor ? { borderLeftColor: actColor } : undefined}
      onClick={onClick}
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
              {chars.slice(0, 3).map((c) => (
                <span className="card-av" style={{ background: avatarColor(c.name) }} key={c.id}>{c.name.slice(0, 2).toUpperCase()}</span>
              ))}
              {chars.length > 3 && <span className="card-av more">+{chars.length - 3}</span>}
            </span>
          )}
          {locs.map((l) => <span className="card-loc" key={l.id}>{l.name}</span>)}
          {evts.map((e) => <span className="card-evt" key={e.id}>{e.title}</span>)}
        </span>
      )}
    </button>
  );
}
// Right-side editing panel: chapter title + chapter notes
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
  const { addCharacter, addLocation, addStoryEvent, removeChapter, updateStoryEvent } = useWorkbench();

  const chapterId = chapter.id;
  const myChars = new Set(chapter.characterIds ?? []);
  const myLocs = new Set(chapter.locationIds ?? []);
  const myEvents = project.events.filter((e) => e.chapterIds.includes(chapterId));

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
      chapterIds: has ? ev.chapterIds.filter((c) => c !== chapterId) : [...ev.chapterIds, chapterId],
    });
  };
  const [openMenu, setOpenMenu] = useState<null | "char" | "loc" | "evt">(null);   const [createKind, setCreateKind] = useState<null | "character" | "location" | "event">(null);   const [nameDraft, setNameDraft] = useState("");   const openCreate = (kind: "character" | "location" | "event") => {     setNameDraft("");     setCreateKind(kind);   };   const submitCreate = () => {     if (createKind === "character") newCharacter(nameDraft);     else if (createKind === "location") newLocation(nameDraft);     else if (createKind === "event") newEvent(nameDraft);     setCreateKind(null);   };

  const newCharacter = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const [first, ...rest] = trimmed.split(/\s+/);
    const c = addCharacter(project.id, { firstName: first, lastName: rest.join(" "), birthday: { year: 0 } });
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
        <input
          value={chapter.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </Field>

      <Field label="Characters" full>
        <div className="chip-row" onClick={(e) => e.preventDefault()}>
          {project.characters.filter((c) => myChars.has(c.id)).map((c) => (
            <span className="chip chip-char" key={c.id}>
              <span className="chip-avatar">{c.name.slice(0, 2).toUpperCase()}</span>
              {c.name}
              <span className="chip-x" onClick={() => toggleCharacter(c.id)}>&times;</span>
            </span>
          ))}
          <div
            className="add-wrap"
            tabIndex={-1}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpenMenu(null);
            }}
          >
            <button type="button" className="chip-add" onClick={() => setOpenMenu(openMenu === "char" ? null : "char")}>
              + Add
            </button>
            {openMenu === "char" && (
              <div className="add-menu">
                {project.characters.filter((c) => !myChars.has(c.id)).map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    className="add-opt"
                    onClick={() => { toggleCharacter(c.id); setOpenMenu(null); }}
                  >
                    <span className="chip-avatar">{c.name.slice(0, 2).toUpperCase()}</span>
                    {c.name}
                  </button>
                ))}
                <div className="add-sep" />
                <button type="button" className="add-opt create" onClick={() => { openCreate("character"); setOpenMenu(null); }}>
                  + Create new character...
                </button>
              </div>
            )}
          </div>
        </div>
      </Field>

      <Field label="Locations" full>
        <div className="chip-row" onClick={(e) => e.preventDefault()}>
          {project.locations.filter((l) => myLocs.has(l.id)).map((l) => (
            <span className="chip chip-loc" key={l.id}>
              {l.name}
              <span className="chip-x" onClick={() => toggleLocation(l.id)}>&times;</span>
            </span>
          ))}
          <div
            className="add-wrap"
            tabIndex={-1}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpenMenu(null);
            }}
          >
            <button type="button" className="chip-add" onClick={() => setOpenMenu(openMenu === "loc" ? null : "loc")}>
              + Add
            </button>
            {openMenu === "loc" && (
              <div className="add-menu">
                {project.locations.filter((l) => !myLocs.has(l.id)).map((l) => (
                  <button
                    type="button"
                    key={l.id}
                    className="add-opt"
                    onClick={() => { toggleLocation(l.id); setOpenMenu(null); }}
                  >
                    {l.name}
                  </button>
                ))}
                <div className="add-sep" />
                <button type="button" className="add-opt create" onClick={() => { openCreate("location"); setOpenMenu(null); }}>
                  + Create new location...
                </button>
              </div>
            )}
          </div>
        </div>
      </Field>

      <Field label="Events" full>
        <div className="chip-row" onClick={(e) => e.preventDefault()}>
          {myEvents.map((ev) => (
            <span className="chip chip-evt" key={ev.id}>
              {ev.title}
              <span className="chip-x" onClick={() => toggleEvent(ev.id)}>&times;</span>
            </span>
          ))}
          <div
            className="add-wrap"
            tabIndex={-1}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpenMenu(null);
            }}
          >
            <button type="button" className="chip-add" onClick={() => setOpenMenu(openMenu === "evt" ? null : "evt")}>
              + Add
            </button>
            {openMenu === "evt" && (
              <div className="add-menu">
                {project.events.filter((e) => !e.chapterIds.includes(chapterId)).map((e) => (
                  <button
                    type="button"
                    key={e.id}
                    className="add-opt"
                    onClick={() => { toggleEvent(e.id); setOpenMenu(null); }}
                  >
                    {e.title}
                  </button>
                ))}
                <div className="add-sep" />
                <button type="button" className="add-opt create" onClick={() => { openCreate("event"); setOpenMenu(null); }}>
                  + Create new event...
                </button>
              </div>
            )}
          </div>
        </div>
      </Field>

      <Field label="Chapter notes" full>
        <textarea
          value={chapter.notes ?? ""}
          placeholder="Write a summary, scene list, questions or notes here..."
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </Field>

      {createKind && createPortal(
        <Modal
          title={createKind === "character" ? "New character" : createKind === "location" ? "New location" : "New event"}
          onClose={() => setCreateKind(null)}
        >
          <div className="modal-body">
            <input
              autoFocus
              className="modal-input"
              value={nameDraft}
              placeholder={createKind === "character" ? "Character name" : createKind === "location" ? "Location name" : "Event title"}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitCreate(); }}
            />
            <div className="modal-actions">
              <ToolButton onClick={() => setCreateKind(null)}>Cancel</ToolButton>
              <ToolButton primary onClick={submitCreate}>Create</ToolButton>
            </div>
          </div>
        </Modal>,
        document.body
      )}
    </aside>
  );
}
// Chapter Plan page: act color band + grid/list views + chapter editor.
export function ChapterPage({ project }: { project: WritingProject }) {
  const { addChapter, updateChapter } = useWorkbench();
  const [view, setView] = useState<ViewMode>("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const chapters = project.chapters || [];
  const template = getStoryStructureOption(project.storyStructure);
  const selected = chapters.find((c) => c.id === selectedId) ?? null;
  const actRanges = getActChapterRanges(template.acts, chapters.length);
  const actIndexFor = (order: number) => {
    const num = order + 1;
    return actRanges.findIndex((r) => num >= r.start && num <= r.end) + 1;
  };
  const beatMappings = getStoryBeatChapterMappings(template, chapters.length);   const beatNameFor = (order: number) => {     const num = order + 1;     const m = beatMappings.find((b) => num >= b.chapterRange.start && num <= b.chapterRange.end);     return m?.storyBeatName;   };

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
                  <span>{fmtPct(act.startPercent)}–{fmtPct(act.endPercent)}%</span>
                </div>
              ))}
            </div>
            {view === "grid" ? (
              <div className="chapter-grid">
                {chapters.map((c) => (
                  <ChapterCard
                    key={c.id}
                    chapter={c}
                    actIndex={actIndexFor(c.order)}
                    beatName={beatNameFor(c.order)}
                    chars={(project.characters || []).filter((x) => (c.characterIds ?? []).includes(x.id))}
                    locs={(project.locations || []).filter((x) => (c.locationIds ?? []).includes(x.id))}
                    evts={(project.events || []).filter((e) => e.chapterIds.includes(c.id))}
                    selected={selectedId === c.id}
                    onClick={() => setSelectedId(c.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="chapter-list">
                {chapters.map((c) => {
                  const ai = actIndexFor(c.order);
                  const aiColor = ai > 0 ? ACT_COLORS[(ai - 1) % ACT_COLORS.length] : undefined;
                  return (
                  <button
                    key={c.id}
                    type="button"
                    className={`chapter-plan-row${ai > 0 ? " act-bar" : ""}${selectedId === c.id ? " selected" : ""}`}
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
              <button type="button" className={view === "grid" ? "active" : ""} onClick={() => setView("grid")} title="Grid view">
                <LayoutGrid size={15} />
              </button>
              <button type="button" className={view === "list" ? "active" : ""} onClick={() => setView("list")} title="List view">
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
