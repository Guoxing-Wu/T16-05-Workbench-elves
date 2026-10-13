
import { useEffect, useRef, useState } from "react";
import { MapPin, Pencil, Plus, Trash2, Users,} from "lucide-react";

import {Field, IconButton, Modal, ToolButton,} from "../../components/primitives";

import { useWorkbench } from "../../lib/store";
import { formatStoryDate, characterAgeAtYear } from "../../lib/domain";

import type {
  StoryDate,
  StoryScene,
  WritingProject,
} from "../../lib/domain";

import "./eventAndScene.css";
const CHAPTER_COLORS = [
  "#648C96", 
  "#AB8B70", 
  "#8C7A98", 
  "#7F9575", 
  "#B47F83", 
];

function parseSceneDate(value: string): StoryDate {
  const [year, month, day] = value.split("-").map(Number);

  return {
    year: year || 0,
    month: month || undefined,
    day: day || undefined,
  };
}

function sceneDateToInputValue(date: StoryDate): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${String(date.year).padStart(4, "0")}-${pad(
    date.month ?? 1
  )}-${pad(date.day ?? 1)}`;
}

function compareSceneDates(a: StoryDate, b: StoryDate): number {
  if (a.year !== b.year) {
    return a.year - b.year;
  }

  if ((a.month ?? 0) !== (b.month ?? 0)) {
    return (a.month ?? 0) - (b.month ?? 0);
  }

  return (a.day ?? 0) - (b.day ?? 0);
}

type SelectOption = {
  id: string;
  name: string;
};

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
  const [open, setOpen] = useState(false);

  const multiSelectRef = useRef<HTMLDivElement>(null);

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

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);
  
  const selectedOptions = options.filter((option) =>
    selectedIds.includes(option.id)
  );

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

          <span className="multi-select-arrow">
            {open ? "▴" : "▾"}
          </span>
        </button>

        {selectedOptions.length > 0 && (
          <div className="selected-items">
            {selectedOptions.map((option) => (
              <span className="selected-item" key={option.id}>
              </span>
            ))}
          </div>
        )}

        {open && (
          <div className="multi-select-menu">
            {options.length === 0 ? (
              <p className="muted-copy">Nothing available yet.</p>
            ) : (
              options.map((option) => {
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

function SceneFormModal({
  project,
  initial,
  onClose,
  onSave,
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
}) {
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

  const [chapterIds, setChapterIds] = useState<string[]>(
    initial?.chapterIds ?? []
  );

  const [characterIds, setCharacterIds] = useState<string[]>(
    initial?.characterIds ?? []
  );

  const [locationId, setLocationId] = useState(
    initial?.locationId ?? ""
  );

  const [error, setError] = useState("");

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

    onSave({
      title: title.trim(),
      description: description.trim(),
      date: parseSceneDate(dateInput),
      time: timeInput.trim() || undefined,
      eventId: eventId || undefined,
      chapterIds,
      characterIds,
      locationId: locationId || undefined,
    });

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

        <Field label="Description" full>
          <textarea
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="What happens in this scene?"
          />
        </Field>

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

        <Field label="Location (optional)" full>
          <select
            value={locationId}
            onChange={(event) =>
              setLocationId(event.target.value)
            }
          >
            <option value="">No location</option>

            {project.locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </Field>

        {error && (
          <p className="scene-form-error">{error}</p>
        )}

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
  const chapterNames = (scene.chapterIds ?? [])
    .map(
      (id) =>
        project.chapters.find((chapter) => chapter.id === id)?.title
    )
    .filter((name): name is string => Boolean(name));

const affectedCharacters = (scene.characterIds ?? [])
  .map((id) =>
    project.characters.find((character) => character.id === id)
  )
  .filter(
    (character): character is WritingProject["characters"][number] =>
      Boolean(character)
  );

  const eventName = scene.eventId
    ? project.events.find((event) => event.id === scene.eventId)?.title
    : undefined;

  const locationName = scene.locationId
    ? project.locations.find(
        (location) => location.id === scene.locationId
      )?.name
    : undefined;

  return (
    <div className="scene-card" style={{ borderColor: color }}>
      <div className="event-year">
        <span>DATE</span>
        <strong>{formatStoryDate(scene.date)}</strong>
        {scene.time && <small>· {scene.time}</small>}
      </div>

      <div className="scene-body">

        {chapterNames.length > 0 && (
          <p className="event-tag">
            CHAPTER · {chapterNames.join(", ")}
          </p>
        )}

        {eventName && (
          <p className="event-tag">
            EVENT · {eventName}
          </p>
        )}

        <h3 className="scene-title">{scene.title}</h3>
        {scene.description && (
          <p className="scene-description">
            {scene.description}
          </p>
        )}

      </div>

      <div className="scene-side">
        {affectedCharacters.length > 0 && (
          <span className="scene-meta-item">
            <Users size={12} />
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

        {locationName && (
          <span className="scene-meta-item">
            <MapPin size={12} />
            {locationName}
          </span>
        )}
      </div>
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

export function ScenesSection({
  project,
}: {
  project: WritingProject;
}) {
  const {
    addStoryScene,
    updateStoryScene,
    removeStoryScene,
  } = useWorkbench();

  const [modalState, setModalState] = useState<
    null | "create" | StoryScene
  >(null);

  const scenes = [...(project.scenes ?? [])].sort((a, b) =>
    compareSceneDates(a.date, b.date)
  );

  const handleRemove = (scene: StoryScene) => {
    if (
      window.confirm(
        `Delete the scene "${scene.title}"?`
      )
    ) {
      removeStoryScene(project.id, scene.id);
    }
  };
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

        {scenes.length === 0 && (
          <p className="muted-copy">
            No scenes yet. Create a scene to start planning
            individual moments in your story.
          </p>
        )}
      </div>

      {modalState && (
        <SceneFormModal
          project={project}
          initial={
            modalState === "create"
              ? undefined
              : modalState
          }
          onClose={() => setModalState(null)}
          onSave={(input) => {
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