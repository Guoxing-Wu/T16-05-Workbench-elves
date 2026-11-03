import { useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Clock, Trash2, X } from "lucide-react";
import { Field, Modal, ToolButton } from "../../components/primitives";
import { useWorkbench } from "../../lib/store";
import "./ChapterPage.css";
import type { Chapter, WritingProject } from "../../lib/domain";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// ChapterEditor — right-side editing panel: chapter title + chapter notes
// ---------------------------------------------------------------------------

export function ChapterEditor({
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
    options: ReactNode
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

      <Field label="Actual words written" full>
        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={chapter.actualWordCount ?? 0}
          onChange={(e) => {
            const value = e.target.value === "" ? 0 : Number(e.target.value);
            onChange({ actualWordCount: Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0 });
          }}
          aria-label="Actual words written for this chapter"
        />
        <small className="muted-copy">Enter the number of words written in your manuscript for this chapter. This updates the Overview progress.</small>
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
            <span className="chip chip-scene" key={sc.id}>
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