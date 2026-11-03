import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

import {
  Field,
  IconButton,
  Modal,
  ToolButton,
} from "../../components/primitives";

import { useWorkbench } from "../../lib/store";
import { formatStoryDate, characterAgeAtYear } from "../../lib/domain";

import type {
  StoryDate,
  StoryScene,
  WritingProject,
} from "../../lib/domain";

import "./eventAndScene.css";

// Defines the color palette used to visually distinguish chapters
// when displaying scenes in the project.
const CHAPTER_COLORS = [
  "#648C96",
  "#AB8B70",
  "#8C7A98",
  "#7F9575",
  "#B47F83",
];

// Converts a date string from an HTML date input into a StoryDate object.
// Missing month or day values are left undefined.
function parseSceneDate(value: string): StoryDate {
  const [year, month, day] = value.split("-").map(Number);

  return {
    year: year || 0,
    month: month || undefined,
    day: day || undefined,
  };
}

// Converts a StoryDate object into the YYYY-MM-DD format
// required by HTML date inputs.
function sceneDateToInputValue(date: StoryDate): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${String(date.year).padStart(4, "0")}-${pad(
    date.month ?? 1
  )}-${pad(date.day ?? 1)}`;
}

// Compares two story dates chronologically by year, month and day.
// Missing month and day values are treated as zero.
function compareSceneDates(a: StoryDate, b: StoryDate): number {
  if (a.year !== b.year) {
    return a.year - b.year;
  }

  if ((a.month ?? 0) !== (b.month ?? 0)) {
    return (a.month ?? 0) - (b.month ?? 0);
  }

  return (a.day ?? 0) - (b.day ?? 0);
}

// Represents an available option in a multi-select dropdown.
type SelectOption = {
  id: string;
  name: string;
};

// Reusable multi-select component for choosing related chapters
// or characters. Supports selecting multiple options and closing
// the dropdown when clicking outside it.
function SceneMultiSelect({
  label,
  placeholder,
  options,
  selectedIds,
  onChange,
}: {
  label: string;
  placeholder: string;
  options: SelectOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  // Controls the visibility of the dropdown menu.
  const [open, setOpen] = useState(false);

  // Tracks the dropdown container to detect outside clicks.
  const multiSelectRef = useRef<HTMLDivElement>(null);

  // Registers a global pointer event listener to close the dropdown
  // when the user clicks outside the multi-select component.
  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (
        multiSelectRef.current &&
        !multiSelectRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);

    // Removes the event listener when the component unmounts
    // to prevent unnecessary listeners and memory leaks.
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  // Retrieves the full option objects corresponding to selected IDs.
  const selectedOptions = options.filter((option) =>
    selectedIds.includes(option.id)
  );

  // Adds an option to the selection or removes it if already selected.
  const toggleOption = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id]
    );
  };

  return (
    <Field label={label} full>
      <div className="multi-select" ref={multiSelectRef}>
        {/* Dropdown trigger displays selected names or a placeholder. */}
        <button
          type="button"
          className="multi-select-trigger"
          onClick={() => setOpen((value) => !value)}
        >
          <span>
            {selectedOptions.length > 0
              ? selectedOptions.map((option) => option.name).join(", ")
              : placeholder}
          </span>

          {/* Indicates whether the dropdown is expanded or collapsed. */}
          <span className="multi-select-arrow">
            {open ? "▴" : "▾"}
          </span>
        </button>

        {/* Displays the selected items below the dropdown trigger. */}
        {selectedOptions.length > 0 && (
          <div className="selected-items">
            {selectedOptions.map((option) => (
              <span className="selected-item" key={option.id}>
              </span>
            ))}
          </div>
        )}

        {/* Renders the available options when the dropdown is open. */}
        {open && (
          <div className="multi-select-menu">
            {options.length === 0 ? (
              <p className="muted-copy">Nothing available yet.</p>
            ) : (
              options.map((option) => {
                // Checks whether the current option is selected.
                const selected = selectedIds.includes(option.id);

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`multi-select-option ${
                      selected ? "selected" : ""
                    }`}
                    onClick={() => toggleOption(option.id)}
                  >
                    <span>{option.name}</span>

                    {/* Displays a checkmark for selected options. */}
                    {selected && (
                      <span className="multi-select-check">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </Field>
  );
}

// Modal form for creating a new scene or editing an existing one.
// Collects scene details and relationships before saving them.
function SceneFormModal({
  project,
  initial,
  onClose,
  onSave,
  addLocation,
}: {
  project: WritingProject;
  initial?: StoryScene;
  onClose: () => void;
  onSave: (input: {
    title: string;
    description: string;
    date: StoryDate;
    time?: string;
    eventId?: string;
    chapterIds: string[];
    characterIds: string[];
    locationId?: string;
  }) => void;
  addLocation: (
    projectId: string,
    input: { name: string; description?: string }
  ) => import("../../lib/domain").Location;
}) {
  // Initializes form fields with existing scene data when editing,
  // or with empty/default values when creating a new scene.
  const [title, setTitle] = useState(initial?.title ?? "");

  const [description, setDescription] = useState(
    initial?.description ?? ""
  );

  const [dateInput, setDateInput] = useState(
    initial ? sceneDateToInputValue(initial.date) : ""
  );

  const [timeInput, setTimeInput] = useState(initial?.time ?? "");

  const [eventId, setEventId] = useState(
    initial?.eventId ?? ""
  );

  // Stores IDs of chapters and characters associated with this scene.
  const [chapterIds, setChapterIds] = useState<string[]>(
    initial?.chapterIds ?? []
  );

  const [characterIds, setCharacterIds] = useState<string[]>(
    initial?.characterIds ?? []
  );

  // Stores the ID of the selected location.
  const [locationId, setLocationId] = useState(
    initial?.locationId ?? ""
  );

  // Stores the name of a new location entered by the user.
  const [newLocationName, setNewLocationName] = useState("");

  // Special value used to identify the "Create new location" option.
  const LOCATION_NEW = "**new**";

  // Displays validation errors when required fields are missing.
  const [error, setError] = useState("");

  // Validates the form, creates a new location if needed,
  // and passes the completed scene data to the parent component.
  const handleSave = () => {
    if (!title.trim()) {
      setError("Please enter a scene title.");
      return;
    }

    if (!dateInput) {
      setError("Please select a scene date.");
      return;
    }

    if (chapterIds.length === 0) {
      setError("Please link the scene to at least one chapter.");
      return;
    }

    // Determines the final location ID based on the user's selection.
    let finalLocationId: string | undefined;

    if (locationId === LOCATION_NEW) {
      const name = newLocationName.trim();

      if (!name) {
        setError("Please enter a location name.");
        return;
      }

      // Creates the new location before linking it to the scene.
      const created = addLocation(project.id, { name });
      finalLocationId = created.id;
    } else if (locationId) {
      finalLocationId = locationId;
    }

    // Sends validated and normalized form data to the parent.
    onSave({
      title: title.trim(),
      description: description.trim(),
      date: parseSceneDate(dateInput),
      time: timeInput.trim() || undefined,
      eventId: eventId || undefined,
      chapterIds,
      characterIds,
      locationId: finalLocationId,
    });

    // Closes the modal after successfully saving the scene.
    onClose();
  };

  return (
    <Modal
      title={initial ? "Edit scene" : "Create a scene"}
      onClose={onClose}
      wide
    >
      <div className="workbench-form">
        <div className="form-grid">
          {/* Basic scene information: title, date and optional time. */}
          <Field label="Scene title">
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setError("");
              }}
              placeholder="e.g. Emma enters the café"
            />
          </Field>

          <Field label="Date">
            <input
              type="date"
              value={dateInput}
              onChange={(event) => {
                setDateInput(event.target.value);
                setError("");
              }}
            />
          </Field>

          {/* Generates time options in 30-minute intervals. */}
          <Field label="Time (optional)">
            <select
              value={timeInput}
              onChange={(event) => setTimeInput(event.target.value)}
            >
              <option value="">No time selected</option>

              {Array.from({ length: 48 }, (_, index) => {
                const hour = String(Math.floor(index / 2)).padStart(2, "0");
                const minute = index % 2 === 0 ? "00" : "30";
                const time = `${hour}:${minute}`;

                return (
                  <option key={time} value={time}>
                    {time}
                  </option>
                );
              })}
            </select>
          </Field>
        </div>

        {/* Allows the user to describe the events of the scene. */}
        <Field label="Description" full>
          <textarea
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="What happens in this scene?"
          />
        </Field>

        {/* Links the scene to an existing story event, if applicable. */}
        <Field label="Related event (optional)" full>
          <select
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
          >
            <option value="">No linked event</option>

            {project.events.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </Field>

        {/* Allows a scene to be associated with one or more chapters. */}
        <SceneMultiSelect
          label="Linked chapters"
          placeholder="Select one or more chapters"
          options={project.chapters.map((chapter) => ({
            id: chapter.id,
            name: chapter.title,
          }))}
          selectedIds={chapterIds}
          onChange={setChapterIds}
        />

        {/* Selects characters who appear in the current scene. */}
        <SceneMultiSelect
          label="Characters"
          placeholder="Select characters in this scene"
          options={project.characters.map((character) => ({
            id: character.id,
            name: character.name,
          }))}
          selectedIds={characterIds}
          onChange={setCharacterIds}
        />

        {/* Allows the scene to be linked to an existing location
            or to a newly created location. */}
        <Field label="Location (optional)" full>
          <select
            value={locationId}
            onChange={(event) => {
              const value = event.target.value;

              setLocationId(value);

              // Clears the new location name when another option is selected.
              if (value !== LOCATION_NEW) {
                setNewLocationName("");
              }

              setError("");
            }}
          >
            <option value="">No location</option>

            {project.locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}

            <option value={LOCATION_NEW}>
              ＋ Create new location…
            </option>
          </select>
        </Field>

        {/* Displays an additional input when creating a new location. */}
        {locationId === LOCATION_NEW && (
          <Field label="New location name" full>
            <input
              value={newLocationName}
              onChange={(event) => {
                setNewLocationName(event.target.value);
                setError("");
              }}
              placeholder="e.g. Emma's apartment"
              autoFocus
            />
          </Field>
        )}

        {/* Shows validation feedback when the form cannot be saved. */}
        {error && (
          <p className="scene-form-error">{error}</p>
        )}

        {/* Form actions for cancelling or saving changes. */}
        <div className="modal-actions">
          <ToolButton onClick={onClose}>
            Cancel
          </ToolButton>

          <ToolButton primary onClick={handleSave}>
            Save scene
          </ToolButton>
        </div>
      </div>
    </Modal>
  );
}

// Displays an individual scene with its date, chapter, event,
// description, characters, location and available actions.
function SceneRow({
  scene,
  color,
  project,
  onEdit,
  onRemove,
}: {
  scene: StoryScene;
  project: WritingProject;
  color: string;
  onEdit: () => void;
  onRemove: () => void;
}) {
  // Resolves linked chapter IDs into chapter titles for display.
  const chapterNames = (scene.chapterIds ?? [])
    .map(
      (id) =>
        project.chapters.find((chapter) => chapter.id === id)?.title
    )
    .filter((name): name is string => Boolean(name));

  // Resolves linked character IDs into character objects.
  const affectedCharacters = (scene.characterIds ?? [])
    .map((id) =>
      project.characters.find((character) => character.id === id)
    )
    .filter(
      (character): character is WritingProject["characters"][number] =>
        Boolean(character)
    );

  // Retrieves the title of the associated event, if one exists.
  const eventName = scene.eventId
    ? project.events.find((event) => event.id === scene.eventId)?.title
    : undefined;

  // Retrieves the name of the associated location, if one exists.
  const locationName = scene.locationId
    ? project.locations.find(
        (location) => location.id === scene.locationId
      )?.name
    : undefined;

  return (
    <div className="scene-card" style={{ borderColor: color }}>
      {/* Displays the scene date and optional time. */}
      <div className="event-year">
        <span>DATE</span>
        <strong>{formatStoryDate(scene.date)}</strong>
        {scene.time && <small>· {scene.time}</small>}
      </div>

      <div className="scene-body">
        {/* Displays the chapters associated with this scene. */}
        {chapterNames.length > 0 && (
          <p className="event-tag">
            CHAPTER · {chapterNames.join(", ")}
          </p>
        )}

        {/* Displays the related story event, if available. */}
        {eventName && (
          <p className="event-tag">
            EVENT · {eventName}
          </p>
        )}

        <h3 className="scene-title">{scene.title}</h3>

        {/* Displays the scene description only when provided. */}
        {scene.description && (
          <p className="scene-description">
            {scene.description}
          </p>
        )}
      </div>

      {/* Displays additional character and location information. */}
      <div className="scene-side">
        {affectedCharacters.length > 0 && (
          <span className="scene-meta-item">
            <Users size={12} />

            {/* Displays each character's age at the time of the scene. */}
            {affectedCharacters
              .map(
                (character) =>
                  `${character.name} (${characterAgeAtYear(
                    character.birthday,
                    scene.date
                  )})`
              )
              .join(", ")}
          </span>
        )}

        {/* Displays the scene location when one has been assigned. */}
        {locationName && (
          <span className="scene-meta-item">
            <MapPin size={12} />
            {locationName}
          </span>
        )}
      </div>

      {/* Provides actions to edit or delete the current scene. */}
      <div className="row-actions">
        <IconButton title="Edit scene" onClick={onEdit}>
          <Pencil size={14} />
        </IconButton>

        <IconButton
          title="Delete scene"
          danger
          onClick={onRemove}
        >
          <Trash2 size={14} />
        </IconButton>
      </div>
    </div>
  );
}

// Main section for managing scenes within the currently selected project.
// Handles scene listing, chronological sorting, and CRUD operations.
export function ScenesSection({
  project,
}: {
  project: WritingProject;
}) {
  // Retrieves scene-related operations from the shared workbench store.
  const {
    addStoryScene,
    updateStoryScene,
    removeStoryScene,
    addLocation,
  } = useWorkbench();

  // Controls whether the modal is closed, creating a scene,
  // or editing an existing scene.
  const [modalState, setModalState] = useState<
    null | "create" | StoryScene
  >(null);

  // Sorts scenes chronologically before rendering them.
  const scenes = [...(project.scenes ?? [])].sort((a, b) =>
    compareSceneDates(a.date, b.date)
  );

  // Confirms deletion before removing a scene from the project.
  const handleRemove = (scene: StoryScene) => {
    if (
      window.confirm(
        `Delete the scene "${scene.title}"?`
      )
    ) {
      removeStoryScene(project.id, scene.id);
    }
  };

  // Assigns a color to each scene based on its earliest linked chapter.
  // Scenes without a linked chapter use the default color.
  function getSceneColor(scene: StoryScene): string {
    const chapters = [...project.chapters].sort(
      (a, b) => a.order - b.order
    );

    const index = chapters.findIndex((chapter) =>
      (scene.chapterIds ?? []).includes(chapter.id)
    );

    return index === -1
      ? "#648C96"
      : CHAPTER_COLORS[index % CHAPTER_COLORS.length];
  }

  return (
    <section className="scenes-section">
      {/* Section heading and action to create a new scene. */}
      <div className="scenes-section-header">
        <div>
          <span className="scenes-eyebrow">MANUSCRIPT</span>
          <h2>Scenes</h2>
          <p>{scenes.length} scenes in this project</p>
        </div>

        <ToolButton
          primary
          onClick={() => setModalState("create")}
        >
          <Plus size={15} />
          Add scene
        </ToolButton>
      </div>

      {/* Renders the chronological list of scenes. */}
      <div className="chapter-list">
        {scenes.map((scene) => (
          <SceneRow
            key={scene.id}
            scene={scene}
            project={project}
            color={getSceneColor(scene)}
            onEdit={() => setModalState(scene)}
            onRemove={() => handleRemove(scene)}
          />
        ))}

        {/* Empty state displayed when the project has no scenes. */}
        {scenes.length === 0 && (
          <p className="muted-copy">
            No scenes yet. Create a scene to start planning
            individual moments in your story.
          </p>
        )}
      </div>

      {/* Displays the form modal when creating or editing a scene. */}
      {modalState && (
        <SceneFormModal
          project={project}
          initial={
            modalState === "create"
              ? undefined
              : modalState
          }
          onClose={() => setModalState(null)}
          addLocation={addLocation}
          onSave={(input) => {
            // Creates a new scene or updates the existing scene
            // depending on the current modal state.
            if (modalState === "create") {
              addStoryScene(project.id, input);
            } else {
              updateStoryScene(
                project.id,
                modalState.id,
                input
              );
            }
          }}
        />
      )}
    </section>
  );
}