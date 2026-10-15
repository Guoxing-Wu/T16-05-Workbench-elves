import { useRef, useState } from "react";
import { LayoutGrid, List, Plus } from "lucide-react";
import { PageHeader, ToolButton } from "../../components/primitives";
import { useWorkbench } from "../../lib/store";
import "./ChapterPage.css";
import type {
  Chapter,
  Character,
  Location,
  WritingProject,
} from "../../lib/domain";
import { getStoryStructureOption } from "../story-structure/storyStructureTemplate";
import {
  getActChapterRanges,
  getStoryBeatChapterMappings,
} from "../story-structure/storyChapterMapping";
import { ChapterCard, ACT_COLORS } from "./ChapterCard";
import type { EntityDrag } from "./ChapterCard";
import { ChapterEditor } from "./ChapterEditor";

type ViewMode = "grid" | "list";

const ACT_TEXT_COLORS = ["#8a6d1f", "var(--blue)", "var(--coral-dark)", "var(--sage)"];

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

// ---------------------------------------------------------------------------
// ChapterPage — act color band + grid/list views + chapter editor.
// ---------------------------------------------------------------------------

export function ChapterPage({ project }: { project: WritingProject }) {
  const {
    addChapter,
    updateChapter,
    updateProject,
    updateStoryEvent,
    updateStoryScene,
    customStoryStructures,
  } = useWorkbench();
  const [view, setView] = useState<ViewMode>("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const suppressClick = useRef(false);
  // The entity tag currently being dragged, and the card it is hovering over.
  const [entityDrag, setEntityDrag] = useState<EntityDrag | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

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

  // Moves a dragged entity from its source chapter to the target chapter.
  const moveEntityToChapter = (drag: EntityDrag, toChapterId: string) => {
    if (drag.fromChapterId === toChapterId) return;

    if (drag.kind === "char" || drag.kind === "loc") {
      const key = drag.kind === "char" ? "characterIds" : "locationIds";
      const from = chapters.find((c) => c.id === drag.fromChapterId);
      const to = chapters.find((c) => c.id === toChapterId);
      if (!from || !to) return;
      updateChapter(project.id, from.id, {
        [key]: (from[key] ?? []).filter((x) => x !== drag.entityId),
      });
      updateChapter(project.id, to.id, {
        [key]: [...(to[key] ?? []).filter((x) => x !== drag.entityId), drag.entityId],
      });
      return;
    }

    if (drag.kind === "evt") {
      const ev = project.events.find((e) => e.id === drag.entityId);
      if (!ev) return;
      updateStoryEvent(project.id, drag.entityId, {
        chapterIds: ev.chapterIds.map((c) => (c === drag.fromChapterId ? toChapterId : c)),
      });
    } else if (drag.kind === "scene") {
      const sc = project.scenes.find((s) => s.id === drag.entityId);
      if (!sc) return;
      updateStoryScene(project.id, drag.entityId, {
        chapterIds: sc.chapterIds.map((c) => (c === drag.fromChapterId ? toChapterId : c)),
      });
    }
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
                      // Entity tags are dropped onto a target card, chapter reordering
                      // keeps using an insertion index. Both are distinguished by the
                      // custom mime type carried in the drag data.
                      onDragOver={(e) => {
                        const isEntity = e.dataTransfer.types.includes(
                          "application/x-entity",
                        );
                        if (isEntity) {
                          if (entityDrag && entityDrag.fromChapterId !== c.id) {
                            setDropTargetId(c.id);
                            e.preventDefault();
                          }
                          return;
                        }
                        if (c.id === dragId) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const before = e.clientX < rect.left + rect.width / 2;
                        setInsertIndex(before ? cIdx : cIdx + 1);
                        e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (entityDrag) {
                          if (entityDrag.fromChapterId !== c.id) {
                            moveEntityToChapter(entityDrag, c.id);
                          }
                          setEntityDrag(null);
                          setDropTargetId(null);
                          suppressClick.current = true;
                          return;
                        }
                        if (dragId && insertIndex !== null) {
                          const fromIdx = chapters.findIndex((x) => x.id === dragId);
                          const isNoop =
                            insertIndex === fromIdx || insertIndex === fromIdx + 1;
                          if (!isNoop) reorderChapter(dragId, insertIndex);
                        }
                        setDragId(null);
                        setInsertIndex(null);
                      }}
                      dropTarget={dropTargetId === c.id}
                      onEntityDragStart={(d) => setEntityDrag(d)}
                      onEntityDragEnd={() => {
                        setEntityDrag(null);
                        setDropTargetId(null);
                        suppressClick.current = true;
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
