import { useState } from "react";
import { LayoutGrid, List, Plus, X } from "lucide-react";
import { Field, PageHeader, ToolButton } from "./primitives";
import { useWorkbench } from "../lib/store";
import type { Chapter, WritingProject } from "../lib/domain";
import { getStoryStructureOption } from "../features/story-structure/storyStructureTemplate";

type ViewMode = "grid" | "list";

//remove later
const ACT_TABS = [
  { id: "all", label: "All" },
  { id: "act1", label: "Act I" },
  { id: "act2", label: "Act II" },
  { id: "act3", label: "Act III" },
];

function ChapterCard({
  chapter,
  selected,
  onClick,
}: {
  chapter: Chapter;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`chapter-plan-card ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <span className="chapter-plan-card-num">CH. {chapter.order + 1}</span>
      <strong>{chapter.title}</strong>
      <span className="chapter-plan-card-meta">
        {chapter.targetWordCount
          ? `${chapter.targetWordCount.toLocaleString()} words`
          : "No target set"}
      </span>
    </button>
  );
}

// Right-side editing panel: chapter title + chapter notes
function ChapterEditor({
  chapter,
  onChange,
  onClose,
}: {
  chapter: Chapter;
  onChange: (patch: Partial<Chapter>) => void;
  onClose: () => void;
}) {
  return (
    <aside className="chapter-plan-editor">
      <header>
        <h2>Chapter {chapter.order + 1}</h2>
        <button type="button" className="icon-button" onClick={onClose} title="Close">
          <X size={16} />
        </button>
      </header>
      <p className="chapter-plan-editor-meta">
        {chapter.targetWordCount
          ? `1–${chapter.targetWordCount.toLocaleString()}`
          : "No word target yet"}
      </p>

      <Field label="Chapter title" full>
        <input
          value={chapter.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </Field>

      <Field label="Chapter notes" full>
        <textarea
          value={chapter.notes ?? ""}
          placeholder="Write a summary, scene list, questions or notes here..."
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </Field>
    </aside>
  );
}

// Chapter Plan page: grid/list views + Act tabs (no filtering yet) + chapter editor.
export function ChapterPage({ project }: { project: WritingProject }) {
  const { addChapter, updateChapter } = useWorkbench();
  const [view, setView] = useState<ViewMode>("grid");
  const [actTab, setActTab] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const chapters = project.chapters || [];
  const structureName = getStoryStructureOption(project.storyStructure).name;
  const selected = chapters.find((c) => c.id === selectedId) ?? null;

  // TODO: filter chapters by actTab once story-structure provides the act mapping.
  const filtered = chapters;

  return (
    <div className="page-stack core-page">
      <PageHeader
        eyebrow="MANUSCRIPT"
        title="Chapter Plan"
        count={`${chapters.length} projected chapters · ${structureName}`}
      >
        <ToolButton primary onClick={() => addChapter(project.id)}>
          <Plus size={15} /> Add chapter
        </ToolButton>
      </PageHeader>

      <div className="chapter-plan-toolbar">
        <div className="act-tabs">
          {ACT_TABS.map((act) => (
            <button
              key={act.id}
              type="button"
              className={`act-tab ${actTab === act.id ? "active" : ""}`}
              onClick={() => setActTab(act.id)}
            >
              {act.label}
            </button>
          ))}
        </div>
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
      </div>

      {chapters.length === 0 ? (
        <p className="muted-copy">No chapters yet. Add a chapter to start planning.</p>
      ) : (
        <div className="chapter-plan-layout">
          <div className="chapter-plan-main">
            {view === "grid" ? (
              <div className="chapter-grid">
                {filtered.map((c) => (
                  <ChapterCard
                    key={c.id}
                    chapter={c}
                    selected={selectedId === c.id}
                    onClick={() => setSelectedId(c.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="chapter-list">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="chapter-plan-row"
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
                ))}
              </div>
            )}
          </div>

          {selected && (
            <ChapterEditor
              chapter={selected}
              onChange={(patch) => updateChapter(project.id, selected.id, patch)}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
