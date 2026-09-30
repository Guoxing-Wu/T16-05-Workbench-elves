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

import type {
  StoryDate,
  StoryEvent,
  WritingProject,
} from "../lib/domain";

import {
  characterAgeAtYear,
  formatStoryDate,
} from "../lib/domain";

import { getStoryBeatChapterMappings } from "../features/story-structure/storyChapterMapping";

import { getStoryStructureOption } from "../features/story-structure/storyStructureTemplate";

// Parses a "YYYY-MM-DD" input value into a StoryDate.
function parseStoryDateInput(value: string): StoryDate {
  const [yearStr, monthStr, dayStr] = value.split("-");

  const year = Number(yearStr) || 0;
  const month = monthStr ? Number(monthStr) : undefined;
  const day = dayStr ? Number(dayStr) : undefined;

  return { year, month, day };
}

// Converts a StoryDate back into a "YYYY-MM-DD" string for the date input.
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

// Compare two StoryDate values chronologically.
function compareStoryDates(a: StoryDate, b: StoryDate): number {
  if (a.year !== b.year) {
    return a.year - b.year;
  }

  if ((a.month ?? 0) !== (b.month ?? 0)) {
    return (a.month ?? 0) - (b.month ?? 0);
  }

  return (a.day ?? 0) - (b.day ?? 0);
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
  // Resolve stored chapter IDs and character IDs to the current project entities.
  const linkedChapter = (event.chapterIds || [])
    .map((id) => project.chapters.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const affectedCharacters = (event.characterIds || [])
    .map((id) => project.characters.find((c) => c.id === id))
    .filter(
      (c): c is NonNullable<typeof c> & { birthday: StoryDate } =>
        c !== undefined && c.birthday !== undefined
    );
  
  const locationName = event.locationId
  ? project.locations.find(
      (location) => location.id === event.locationId
    )?.name
  : undefined;

  // Story beat events use a coral accent; regular events use blue.
  const accent = event.isStoryBeat ? "coral" : "blue";

  return (
    <div className={`event-card accent-${accent}`}>
      <div className="event-year">
        <span>DATE</span>

        <strong>
          {formatStoryDate(event.startDate)}
        </strong>

        <small>
          → {formatStoryDate(event.endDate)}
        </small>
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
          <p className="event-description">
            {event.description}
          </p>
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
                    event.startDate
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
  chapterBeatNames,
}: {
  chapters: WritingProject["chapters"];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  availableChapterOrders?: number[];
  chapterBeatNames?: Record<number, string[]>;
}) {
  const [open, setOpen] = useState(false);

  const availableChapters = availableChapterOrders
    ? chapters.filter((chapter) =>
        availableChapterOrders.includes(chapter.order)
      )
    : chapters;

  const toggleChapter = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((chapterId) => chapterId !== id)
        : [...selectedIds, id]
    );
  };

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
                  <span>
                    {chapter.title}

                    {chapterBeatNames?.[chapter.order]?.length
                      ? ` · ${chapterBeatNames[chapter.order].join(" / ")}`
                      : ""}
                  </span>

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
    startDate: StoryDate;
    endDate: StoryDate;
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
  const [description, setDescription] = useState(
    initial?.description ?? ""
  );

  const [startDateInput, setStartDateInput] = useState(
    initial ? storyDateToInputValue(initial.startDate) : ""
  );

  const [endDateInput, setEndDateInput] = useState(
    initial ? storyDateToInputValue(initial.endDate) : ""
  );

  const [locationId, setLocationId] = useState(
    initial?.locationId ?? ""
  );

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

  const chapterBeatNames: Record<number, string[]> = {};

  storyBeatMappings.forEach((mapping) => {
    for (
      let order = mapping.chapterRange.start;
      order <= mapping.chapterRange.end;
      order++
    ) {
      if (!chapterBeatNames[order]) {
        chapterBeatNames[order] = [];
      }

      chapterBeatNames[order].push(mapping.storyBeatName);
    }
  });

  const toggleCharacter = (id: string) => {
    setCharacterIds((list) =>
      list.includes(id)
        ? list.filter((c) => c !== id)
        : [...list, id]
    );
  };

  const handleSave = () => {
    if (!title.trim() || !startDateInput || !endDateInput) {
      return;
    }

    const startDate = parseStoryDateInput(startDateInput);
    const endDate = parseStoryDateInput(endDateInput);

    if (compareStoryDates(startDate, endDate) > 0) {
      window.alert("End date cannot be earlier than start date.");
      return;
    }

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
      startDate,
      endDate,
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

          <Field label="Start date">
            <input
              type="date"
              value={startDateInput}
              onChange={(e) =>
                setStartDateInput(e.target.value)
              }
            />
          </Field>

          <Field label="End date">
            <input
              type="date"
              value={endDateInput}
              onChange={(e) =>
                setEndDateInput(e.target.value)
              }
            />
          </Field>
        </div>

        <Field label="Location" full>
          <select
            value={locationId}
            onChange={(e) => {
              setLocationId(e.target.value);

              if (e.target.value !== LOCATION_NEW) {
                setNewLocationName("");
              }
            }}
          >
            <option value="">No location</option>

            {project.locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}

            <option value={LOCATION_NEW}>
              + Create new location
            </option>
          </select>

          {locationId === LOCATION_NEW && (
            <input
              value={newLocationName}
              onChange={(e) =>
                setNewLocationName(e.target.value)
              }
              placeholder="New location name"
            />
          )}
        </Field>

        <Field label="Description" full>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <Field label="Story Beat" full>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={isStoryBeat}
              onChange={(e) =>
                setIsStoryBeat(e.target.checked)
              }
            />

            <span>This event is a Story Beat</span>
          </label>
        </Field>

        <Field label="Linked chapters" full>
          <ChapterMultiSelect
            chapters={project.chapters}
            selectedIds={chapterIds}
            onChange={setChapterIds}
            availableChapterOrders={
              isStoryBeat
                ? storyBeatChapterOrders
                : undefined
            }
            chapterBeatNames={
              isStoryBeat
                ? chapterBeatNames
                : undefined
            }
          />
        </Field>

        <Field label="Characters affected" full>
          <div className="character-checkbox-list">
            {project.characters.map((character) => (
              <label
                key={character.id}
                className="character-checkbox"
              >
                <input
                  type="checkbox"
                  checked={characterIds.includes(character.id)}
                  onChange={() =>
                    toggleCharacter(character.id)
                  }
                />

                {character.name}
              </label>
            ))}

            {project.characters.length === 0 && (
              <p className="muted-copy">
                No characters yet.
              </p>
            )}
          </div>
        </Field>

        <div className="modal-actions">
          <ToolButton onClick={onClose}>
            Cancel
          </ToolButton>

          <ToolButton primary onClick={handleSave}>
            Save event
          </ToolButton>
        </div>
      </div>
    </Modal>
  );
}

// The Events page: lists all story events for the active project,
// sorted by their start date.
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
    (a, b) =>
      compareStoryDates(a.startDate, b.startDate)
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
          <p className="muted-copy">
            No events yet.
          </p>
        )}
      </div>

      {modalState && (
        <EventFormModal
          project={project}
          initial={
            modalState === "create"
              ? undefined
              : modalState
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