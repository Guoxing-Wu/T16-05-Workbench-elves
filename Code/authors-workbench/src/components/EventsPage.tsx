import { useState } from "react";
import { MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";import { Field, IconButton, Modal, PageHeader, ToolButton } from "./primitives";
import { useWorkbench } from "../lib/store";
import { characterAgeAtYear } from "../lib/domain";
import type { StoryDate, StoryEvent, WritingProject } from "../lib/domain";

// Parses a "YYYY-MM-DD" (or "YYYY-MM", or "YYYY") input value into a StoryDate.
function parseStoryDateInput(value: string): StoryDate {
  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number(yearStr) || 0;
  const month = monthStr ? Number(monthStr) : undefined;
  const day = dayStr ? Number(dayStr) : undefined;
  return { year, month, day };
}

// Converts a StoryDate back into a "YYYY-MM-DD" string for the <input type="date">.
function storyDateToInputValue(date: StoryDate): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = String(date.year).padStart(4, "0");
  if (date.month && date.day) return `${year}-${pad(date.month)}-${pad(date.day)}`;
  if (date.month) return `${year}-${pad(date.month)}-01`;
  return `${year}-01-01`;
}

// One row in the event list.
function EventRow({
  event,
  project,
  onEdit,
  onRemove,
}: {
  event: StoryEvent;
  project: WritingProject;
  onEdit: () => void;
  onRemove: () => void;
}) {

  // Resolve stored chapter IDs and character IDs to the current project entities
  // so the event row can display their names and related information.
  const linkedChapter = (event.chapterIds || [])
  .map((id) => project.chapters.find((c) => c.id === id))
  .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const affectedCharacters = (event.characterIds || [])
    .map((id) => project.characters.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  // Chapter-linked events get a coral accent; standalone beats get blue.
  const accent = linkedChapter.length > 0 ? "coral" : "blue";

  return (
    // UI design for event row
    <div className={`event-card accent-${accent}`}>
      <div className="event-year">
        <span>YEAR</span>
        <strong>{event.eventDate.year}</strong>
      </div>
      

<div className="event-body">
  {linkedChapter.length > 0 && (
    <p className="event-tag">
      CHAPTER · {linkedChapter.map((c) => c.title).join(", ")}
    </p>
  )}

  <h3 className="event-title">{event.title}</h3>

  {event.description && (
    <p className="event-description">{event.description}</p>
  )}
</div>

<div className="event-side">
  {affectedCharacters.length > 0 && (
    <span className="event-meta-item">
      <Users size={12} />
      {affectedCharacters
        .map(
          (c) =>
            `${c.name} (${characterAgeAtYear(
              c.birthday,
              event.eventDate
            )})`
        )
        .join(", ")}
    </span>
  )}

  {event.location && (
    <span className="event-meta-item">
      <MapPin size={12} /> {event.location}
    </span>
  )}
</div>

<div className="row-actions">
  <IconButton title="Edit event" onClick={onEdit}>
    <Pencil size={14} />
  </IconButton>

  <IconButton title="Delete event" danger onClick={onRemove}>
    <Trash2 size={14} />
  </IconButton>
</div>
    </div>
  );
}

// Multi-select dropdown for linking an event to multiple chapters.
function ChapterMultiSelect({
  chapters,
  selectedIds,
  onChange,
}: {
  chapters: WritingProject["chapters"];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  // When selecting a chapter, add the chapter if it is not selected; otherwise remove it.
  const toggleChapter = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((chapterId) => chapterId !== id)
        : [...selectedIds, id]
    );
  };

  // Keep the selected chapter objects for displaying their titles in the trigger.
  const selectedChapters = chapters.filter((chapter) =>
    selectedIds.includes(chapter.id)
  );

  return (
    <div className="multi-select">
      <button
        type="button"
        className="multi-select-trigger"
        onClick={() => setOpen((value) => !value)}
      >
        <span>
          {selectedChapters.length === 0
            ? "Select chapters"
            : selectedChapters.map((chapter) => chapter.title).join(", ")}
        </span>

        <span className="multi-select-arrow">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open && (
        <div className="multi-select-menu">
          {chapters.length === 0 ? (
            <p className="muted-copy">No chapters yet.</p>
          ) : (
            chapters.map((chapter) => {
              const selected = selectedIds.includes(chapter.id);

              return (
                <button
                  key={chapter.id}
                  type="button"
                  className={`multi-select-option ${
                    selected ? "selected" : ""
                  }`}
                  onClick={() => toggleChapter(chapter.id)}
                >
                  <span>{chapter.title}</span>

                  {selected && (
                    <span className="multi-select-check">✓</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// Modal form for creating or editing a story event.
function EventFormModal({
  project,
  initial,
  onClose,
  onSave,
}: {
  project: WritingProject;
  initial?: StoryEvent;
  onClose: () => void;
  onSave: (input: {
    title: string;
    description: string;
    eventDate: StoryDate;
    location: string;
    chapterIds: string[];
    characterIds: string[];
  }) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [dateInput, setDateInput] = useState(
    initial ? storyDateToInputValue(initial.eventDate) : ""
  );
  const [location, setLocation] = useState(initial?.location ?? "");
  const [chapterIds, setChapterIds] = useState<string[]>(initial?.chapterIds ?? []);
  const [characterIds, setCharacterIds] = useState<string[]>(initial?.characterIds ?? []);

  // When selecting a character, add if this character is not selected, otherwise, remove it
  const toggleCharacter = (id: string) => {
    setCharacterIds((list) =>
      list.includes(id)
        ? list.filter((c) => c !== id)
        : [...list, id]
    );
  };

  // The minimum event information required before saving
  const handleSave = () => {
    if (!title.trim() || !dateInput) return;
    onSave({
      title: title.trim(),
      description,
      eventDate: parseStoryDateInput(dateInput),
      location,
      chapterIds,
      characterIds,
    });
    onClose();
  };

  return (
    <Modal title={initial ? "Edit story event" : "Create a story event or milestone"} onClose={onClose} wide>
      <div className="workbench-form">
        <div className="form-grid">
          <Field label="Event title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Story date">
            <input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
          </Field>
        </div>

        <Field label="Location" full>
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
        </Field>

        <Field label="Description" full>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <Field label="Linked chapters" full>
          <ChapterMultiSelect
            chapters={project.chapters}
            selectedIds={chapterIds}
            onChange={setChapterIds}
          />
        </Field>

        <Field label="Characters affected" full>
          <div className="character-checkbox-list">
            {project.characters.map((c) => (
              <label key={c.id} className="character-checkbox">
                <input
                  type="checkbox"
                  checked={characterIds.includes(c.id)}
                  onChange={() => toggleCharacter(c.id)}
                />
                {c.name}
              </label>
            ))}
            {project.characters.length === 0 && <p className="muted-copy">No characters yet.</p>}
          </div>
        </Field>

        <div className="modal-actions">
          <ToolButton onClick={onClose}>Cancel</ToolButton>
          <ToolButton primary onClick={handleSave}>
            Save event
          </ToolButton>
        </div>
      </div>
    </Modal>
  );
}

// The Events page: lists all story events for the active project, sorted by story date.
export function EventsPage({ project }: { project: WritingProject }) {
  const { addStoryEvent, updateStoryEvent, removeStoryEvent } = useWorkbench();
  const [modalState, setModalState] = useState<null | "create" | StoryEvent>(null);

  const events = [...(project.events || [])].sort((a, b) => a.eventDate.year - b.eventDate.year);

  return (
    <div className="page-stack core-page">
      <PageHeader eyebrow="MANUSCRIPT" title="Story Events" count={`${events.length} dated events and milestones`}>
        <ToolButton primary onClick={() => setModalState("create")}>
          <Plus size={15} /> Add event
        </ToolButton>
      </PageHeader>

      <div className="chapter-list">
        {events.map((event) => (
          <EventRow
            key={event.id}
            event={event}
            project={project}
            onEdit={() => setModalState(event)}
            onRemove={() => removeStoryEvent(project.id, event.id)}
          />
        ))}
        {events.length === 0 && <p className="muted-copy">No events yet.</p>}
      </div>

      {modalState && (
        <EventFormModal
          project={project}
          initial={modalState === "create" ? undefined : modalState}
          onClose={() => setModalState(null)}
          onSave={(input) => {
            if (modalState === "create") {
              addStoryEvent(project.id, input);
            } else {
              updateStoryEvent(project.id, modalState.id, input);
            }
          }}
        />
      )}
    </div>
  );
}