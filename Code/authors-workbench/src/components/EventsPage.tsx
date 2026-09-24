import { useState } from "react";
import { MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";
import {
  Field,
  IconButton,
  Modal,
  PageHeader,
  ToolButton,
} from "./primitives";
import { useWorkbench } from "../lib/store";
import { characterAgeAtYear } from "../lib/domain";
import type { StoryDate, StoryEvent, WritingProject } from "../lib/domain";
import { getStoryBeatChapterMappings } from "../features/story-structure/storyChapterMapping";
import { getStoryStructureOption } from "../features/story-structure/storyStructureTemplate";

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

  if (date.month && date.day) {
    return `${year}-${pad(date.month)}-${pad(date.day)}`;
  }

  if (date.month) {
    return `${year}-${pad(date.month)}-01`;
  }

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
  // Resolve linked chapters.
  const linkedChapter = (event.chapterIds || [])
    .map((id) => project.chapters.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  // Resolve linked characters and keep only characters with birthdays.
  const affectedCharacters = (event.characterIds || [])
    .map((id) => project.characters.find((c) => c.id === id))
    .filter(
      (c): c is NonNullable<typeof c> & { birthday: StoryDate } =>
        c !== undefined && c.birthday !== undefined
    );

  // Resolve the stored location ID to the current location name.
  const locationName = event.locationId
    ? project.locations.find((location) => location.id === event.locationId)
        ?.name
    : undefined;

  const accent = event.isStoryBeat ? "coral" : "blue";

  return (
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

        {event.isStoryBeat && (
          <p className="event-tag">
            STORY BEAT
            {event.storyBeatName ? ` · ${event.storyBeatName}` : ""}
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
                (character) =>
                  `${character.name} (${characterAgeAtYear(
                    character.birthday,
                    event.eventDate
                  )})`
              )
              .join(", ")}
          </span>
        )}

        {locationName && (
          <span className="event-meta-item">
            <MapPin size={12} /> {locationName}
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
  availableChapterOrders,
}: {
  chapters: WritingProject["chapters"];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  availableChapterOrders?: number[];
}) {
  const [open, setOpen] = useState(false);

  // Only the available chapters can be selected.
  const availableChapters = availableChapterOrders
    ? chapters.filter((chapter) =>
        availableChapterOrders.includes(chapter.order)
      )
    : chapters;

  // Add/remove a chapter from the selected list.
  const toggleChapter = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((chapterId) => chapterId !== id)
        : [...selectedIds, id]
    );
  };

  // Keep the selected chapter objects for displaying their titles.
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
          {availableChapters.length === 0 ? (
            <p className="muted-copy">No chapters yet.</p>
          ) : (
            availableChapters.map((chapter) => {
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

// Multi-select dropdown for linking an event to multiple characters.
function CharacterMultiSelect({
  characters,
  selectedIds,
  onChange,
}: {
  characters: WritingProject["characters"];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const toggleCharacter = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((characterId) => characterId !== id)
        : [...selectedIds, id]
    );
  };

  const selectedCharacters = characters.filter((character) =>
    selectedIds.includes(character.id)
  );

  return (
    <div className="multi-select">
      <button
        type="button"
        className="multi-select-trigger"
        onClick={() => setOpen((value) => !value)}
      >
        <span>
          {selectedCharacters.length === 0
            ? "Select characters"
            : selectedCharacters.map((character) => character.name).join(", ")}
        </span>

        <span className="multi-select-arrow">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {selectedCharacters.length > 0 && (
        <div className="selected-items">
          {selectedCharacters.map((character) => (
            <span key={character.id} className="selected-item">
              {character.name}

              <button
                type="button"
                onClick={() => toggleCharacter(character.id)}
                aria-label={`Remove ${character.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="multi-select-menu">
          {characters.length === 0 ? (
            <p className="muted-copy">No characters yet.</p>
          ) : (
            characters.map((character) => {
              const selected = selectedIds.includes(character.id);

              return (
                <button
                  key={character.id}
                  type="button"
                  className={`multi-select-option ${
                    selected ? "selected" : ""
                  }`}
                  onClick={() => toggleCharacter(character.id)}
                >
                  <span>{character.name}</span>

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
  addLocation,
  customStoryStructures,
}: {
  project: WritingProject;
  initial?: StoryEvent;
  onClose: () => void;
  onSave: (input: {
    title: string;
    description: string;
    eventDate: StoryDate;
    locationId?: string;
    chapterIds: string[];
    characterIds: string[];
    isStoryBeat: boolean;
    storyBeatId?: string;
    storyBeatName?: string;
  }) => void;
  addLocation: (
    projectId: string,
    input: { name: string; description?: string }
  ) => import("../lib/domain").Location;
  customStoryStructures: import("../features/story-structure/storyStructureTemplate").StoryStructureTemplate[];
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  const [dateInput, setDateInput] = useState(
    initial ? storyDateToInputValue(initial.eventDate) : ""
  );

  const [locationId, setLocationId] = useState(initial?.locationId ?? "");
  const [newLocationName, setNewLocationName] = useState("");

  const [chapterIds, setChapterIds] = useState<string[]>(
    initial?.chapterIds ?? []
  );

  const [characterIds, setCharacterIds] = useState<string[]>(
    initial?.characterIds ?? []
  );

  const [isStoryBeat, setIsStoryBeat] = useState(
    initial?.isStoryBeat ?? false
  );

  const LOCATION_NEW = "__new__";

  // Resolve the selected story structure, including custom structures.
  const structure = getStoryStructureOption(
    project.storyStructure,
    customStoryStructures
  );

  const storyBeatMappings = getStoryBeatChapterMappings(
    structure,
    project.chapters.length
  );

  const storyBeatChapterOrders = Array.from(
    new Set(
      storyBeatMappings.flatMap((mapping) => {
        const orders: number[] = [];

        for (
          let order = mapping.chapterRange.start;
          order <= mapping.chapterRange.end;
          order++
        ) {
          orders.push(order);
        }

        return orders;
      })
    )
  );

  // Save the event.
  const handleSave = () => {
    if (!title.trim() || !dateInput) return;

    // Resolve the final location ID:
    // reuse an existing location or create a new one.
    let finalLocationId: string | undefined;

    if (locationId === LOCATION_NEW) {
      const name = newLocationName.trim();

      if (name) {
        const created = addLocation(project.id, { name });
        finalLocationId = created.id;
      }
    } else if (locationId) {
      finalLocationId = locationId;
    }

    onSave({
      title: title.trim(),
      description,
      eventDate: parseStoryDateInput(dateInput),
      locationId: finalLocationId,
      chapterIds,
      characterIds,
      isStoryBeat,
    });

    onClose();
  };

  return (
    <Modal
      title={
        initial
          ? "Edit story event"
          : "Create a story event or milestone"
      }
      onClose={onClose}
      wide
    >
      <div className="workbench-form">
        <div className="form-grid">
          <Field label="Event title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>

          <Field label="Story date">
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
            />
          </Field>
        </div>

        {/* Location */}
        <Field label="Location" full>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          >
            <option value="">No location</option>

            {project.locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}

            {initial?.locationId &&
              !project.locations.some(
                (location) => location.id === initial.locationId
              ) && (
                <option value={initial.locationId}>
                  Unknown location
                </option>
              )}

            <option value={LOCATION_NEW}>
              ＋ Create new location…
            </option>
          </select>

          {locationId === LOCATION_NEW && (
            <input
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              placeholder="New location name"
              style={{ marginTop: 8 }}
            />
          )}
        </Field>

        {/* Description */}
        <Field label="Description" full>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        {/* Story Beat */}
        <Field label="Story Beat" full>
          <button
            type="button"
            className={`story-beat-toggle ${
              isStoryBeat ? "active" : ""
            }`}
            onClick={() => setIsStoryBeat((value) => !value)}
          >
            <span className="story-beat-toggle-indicator">
              {isStoryBeat ? "✓" : ""}
            </span>

            <span className="story-beat-toggle-content">
              <strong>
                {isStoryBeat
                  ? "Story Beat"
                  : "Mark as a Story Beat"}
              </strong>

              <span>
                {isStoryBeat
                  ? "This event is part of the story structure."
                  : "Link this event to your story structure."}
              </span>
            </span>
          </button>

          {isStoryBeat && (
            <p className="story-beat-hint">
              Available chapters are based on the selected story
              structure.
            </p>
          )}
        </Field>

        {/* Linked chapters */}
        <Field label="Linked chapters" full>
          <ChapterMultiSelect
            chapters={project.chapters}
            selectedIds={chapterIds}
            onChange={setChapterIds}
            availableChapterOrders={
              isStoryBeat ? storyBeatChapterOrders : undefined
            }
          />
        </Field>

        {/* Characters */}
        <Field label="Characters affected" full>
          <CharacterMultiSelect
            characters={project.characters}
            selectedIds={characterIds}
            onChange={setCharacterIds}
          />
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

// The Events page: lists all story events for the active project,
// sorted by story date.
export function EventsPage({
  project,
}: {
  project: WritingProject;
}) {
  const {
    addStoryEvent,
    updateStoryEvent,
    removeStoryEvent,
    addLocation,
    customStoryStructures,
  } = useWorkbench();

  const [modalState, setModalState] = useState<
    null | "create" | StoryEvent
  >(null);

  const events = [...(project.events || [])].sort(
    (a, b) => a.eventDate.year - b.eventDate.year
  );

  return (
    <div className="page-stack core-page">
      <PageHeader
        eyebrow="MANUSCRIPT"
        title="Story Events"
        count={`${events.length} dated events and milestones`}
      >
        <ToolButton
          primary
          onClick={() => setModalState("create")}
        >
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
            onRemove={() =>
              removeStoryEvent(project.id, event.id)
            }
          />
        ))}

        {events.length === 0 && (
          <p className="muted-copy">No events yet.</p>
        )}
      </div>

      {modalState && (
        <EventFormModal
          project={project}
          initial={
            modalState === "create" ? undefined : modalState
          }
          onClose={() => setModalState(null)}
          addLocation={addLocation}
          customStoryStructures={customStoryStructures}
          onSave={(input) => {
            if (modalState === "create") {
              addStoryEvent(project.id, input);
            } else {
              updateStoryEvent(
                project.id,
                modalState.id,
                input
              );
            }
          }}
        />
      )}
    </div>
  );
}