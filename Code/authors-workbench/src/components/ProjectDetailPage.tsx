import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react";
import { IconButton, PageHeader, ToolButton } from "./primitives";
import { useWorkbench } from "../lib/store";
import { wordsWritten } from "../lib/domain";
import CreateCharacterForm from "./CreateCharacterForm";
import type { Chapter, WritingProject } from "../lib/domain";


// One editable row in the chapter list: order, editable title, target/actual word count 
// and the move/delete controls.
function ChapterRow({
  chapter,
  onChange,
  onRemove,
  onMove,
  isFirst,
  isLast,
}: {
  chapter: Chapter;
  onChange: (patch: Partial<Chapter>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="chapter-row editable">
      <div className="chapter-number">
        <span>CH.</span>
        {/* make order be 1-based for read */}
        <strong>{chapter.order + 1}</strong>
      </div>

      <input
        className="chapter-title-input"
        value={chapter.title}
        onChange={(event) => onChange({ title: event.target.value })}
        aria-label="Chapter title"
      />

      <label className="chapter-field">
        <span>Target words</span>
        <input
          type="number"
          min={0}
          value={chapter.targetWordCount}
          onChange={(event) => onChange({ targetWordCount: Number(event.target.value) })}
        />
      </label>

      <label className="chapter-field">
        <span>Words written</span>
        <input
          type="number"
          min={0}
          value={chapter.actualWordCount}
          onChange={(event) => onChange({ actualWordCount: Number(event.target.value) })}
        />
      </label>

      <div className="row-actions">
        {/* Up/down buttons disabled at the ends of the list */}
        <IconButton title="Move up" onClick={() => onMove(-1)} disabled={isFirst}>
          <ArrowUp size={14} />
        </IconButton>
        <IconButton title="Move down" onClick={() => onMove(1)} disabled={isLast}>
          <ArrowDown size={14} />
        </IconButton>
        <IconButton title="Delete chapter" danger onClick={onRemove}>
          <Trash2 size={14} />
        </IconButton>
      </div>
    </div>
  );
}

// The detail view for one project: editable project settings up top, 
// a statistics/progress summary, and the full chapter list below it.
export function ProjectDetailPage({ project, onBack }: { project: WritingProject; onBack: () => void }) {
  const { updateProject, addChapter, updateChapter, removeChapter, moveChapter, addCharacter, } = useWorkbench();
  const chapters = project.chapters || [];
  const characters = project.characters || [];
  const written = wordsWritten(project);
  const target = project.targetWordCount || 0;
  // Percentage toward the target capped at 100%.
  const progress = target > 0 ? Math.min(100, Math.round((written / target) * 100)) : 0;

  // Small local helpers
  const setTitle = (title: string) => updateProject(project.id, (p) => ({ ...p, title }));
  const setTargetWordCount = (targetWordCount: number) =>
    updateProject(project.id, (p) => ({ ...p, targetWordCount }));

  return (
    <div className="page-stack core-page">
      <button className="text-link back-link" onClick={onBack}>
        <ArrowLeft size={13} /> Projects
      </button>

      <PageHeader
        eyebrow="WRITING PROJECT"
        title={project.title}
        count={`${chapters.length} chapters · ${written.toLocaleString()} of ${target.toLocaleString()} target words`}
      />

      {/* Project-level settings: title and target word count */}
      <section className="settings-card workbench-form">
        <div className="form-grid">
          <label className="form-field full">
            <span>Project title</span>
            <input value={project.title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="form-field">
            <span>Target word count</span>
            <input
              type="number"
              min={0}
              value={project.targetWordCount}
              onChange={(event) => setTargetWordCount(Number(event.target.value))}
            />
          </label>
        </div>
      </section>

      {/* At-a-glance statistics and progress bar toward the target */}
      <section className="chapter-summary">
        <div>
          <strong>{chapters.length}</strong>
          <span>chapters</span>
        </div>
        <div>
          <strong>{written.toLocaleString()}</strong>
          <span>words written</span>
        </div>
        <div>
          <strong>{target.toLocaleString()}</strong>
          <span>target words</span>
        </div>
        <div className="summary-progress">
          <span>Progress toward target</span>
          <b>{progress}%</b>
          <div className="progress-track compact">
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      <PageHeader eyebrow="MANUSCRIPT" title="Chapters">
        <ToolButton primary onClick={() => addChapter(project.id)}>
          <Plus size={15} /> Add chapter
        </ToolButton>
      </PageHeader>

      <div className="chapter-list">
        {chapters.map((chapter, i) => (
          <ChapterRow
            key={chapter.id}
            chapter={chapter}
            onChange={(patch) => updateChapter(project.id, chapter.id, patch)}
            onRemove={() => removeChapter(project.id, chapter.id)}
            onMove={(dir) => moveChapter(project.id, chapter.id, dir)}
            isFirst={i === 0}
            isLast={i === chapters.length - 1}
          />
        ))}
        {chapters.length === 0 && <p className="muted-copy">No chapters yet.</p>}
      </div>
      <PageHeader
  eyebrow="STORY"
  title="Characters"
  count={`${characters.length} characters`}
/>
<div className="character-list">
  {characters.map((character) => (
    <div key={character.id} className="settings-card">
      <strong>{character.name}</strong>

      {character.birthday && (
        <p>
          Birthday: {character.birthday.year}
          {character.birthday.month
            ? `-${character.birthday.month}`
            : ""}
          {character.birthday.day
            ? `-${character.birthday.day}`
            : ""}
        </p>
      )}

      {character.location && (
        <p>Location: {character.location}</p>
      )}

      {character.description && (
        <p>{character.description}</p>
      )}
    </div>
  ))}

  {characters.length === 0 && (
    <p className="muted-copy">No characters yet.</p>
  )}
</div>

<CreateCharacterForm
  onCreate={(input) =>
    addCharacter(project.id, input)
  }
/>
        
    </div>
    
  );
}
