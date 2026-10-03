import CreateCharacterForm from "./CreateCharacterForm";
import { useWorkbench } from "../../lib/store";
import { useState } from "react";
import { Modal, PageHeader, ToolButton } from "../../components/primitives";
import type { Character, WritingProject } from "../../lib/domain";
import { ChevronRight, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import "./character.css";
import {characterAgeAtYear} from "../../lib/domain";
import type { StoryDate } from "../../lib/domain";


function formatStoryDate(date: StoryDate): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  if (date.month === undefined) {
    return String(date.year);
  }

  const month = months[date.month - 1];

  return date.day === undefined
    ? `${month} ${date.year}`
    : `${date.day} ${month} ${date.year}`;
}

function compareDates(a: StoryDate, b: StoryDate): number {
  return (
    a.year - b.year ||
    (a.month ?? 1) - (b.month ?? 1) ||
    (a.day ?? 1) - (b.day ?? 1)
  );
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function formatBirthday(birthday: Character["birthday"]): string {
  if (!birthday) return "—";

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  if (birthday.month === undefined) {
    return String(birthday.year);
  }

  const month = months[birthday.month - 1];

  return birthday.day === undefined
    ? `${month} ${birthday.year}`
    : `${birthday.day} ${month} ${birthday.year}`;
}

function getAgeToday(birthday: Character["birthday"]): string {
  if (!birthday) return "—";

  // A complete date is needed to calculate an exact age.
  if (birthday.month === undefined || birthday.day === undefined) {
    return "Full date needed";
  }

  const today = new Date();
  let age = today.getFullYear() - birthday.year;

  const birthdayHasPassed =
    today.getMonth() + 1 > birthday.month ||
    (today.getMonth() + 1 === birthday.month &&
      today.getDate() >= birthday.day);

  if (!birthdayHasPassed) age -= 1;

  return age < 0 ? "Not yet born" : String(age);
}


export function CharactersPage({
  project,
  onBack,
}: {
  project: WritingProject;
  onBack: () => void;
}) {
  const { addCharacter, updateCharacter, removeCharacter } = useWorkbench();
  const characters = project.characters ?? [];

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] =
    useState<string | null>(null);

  // Keeping the editing ID separate prevents another character's form
  // from opening if the selected character is removed.
  const [editingCharacterId, setEditingCharacterId] =
    useState<string | null>(null);

  const selectedCharacter =
    characters.find((character) => character.id === selectedCharacterId) ??
    characters[0];

  const characterEvents = selectedCharacter
  ? (project.events ?? [])
      .filter((event) =>
        event.characterIds?.includes(selectedCharacter.id)
      )
      .sort((a, b) => compareDates(a.eventDate, b.eventDate))
  : [];


  const editingCharacter = characters.find(
    (character) => character.id === editingCharacterId
  );
  function handleDelete(character: Character) {
    if (!window.confirm(`Delete "${character.name}"?`)) return;

    removeCharacter(project.id, character.id);

    if (selectedCharacterId === character.id) {
      setSelectedCharacterId(null);
    }

    if (editingCharacterId === character.id) {
      setEditingCharacterId(null);
    }
  }

  return (
    <div className="page-stack core-page characters-page">
      <button
        type="button"
        className="text-link back-link"
        onClick={onBack}
      >
        Back
      </button>

      <div className="characters-page-heading">
        <PageHeader
          eyebrow="AUTHOR’S WORKBENCH"
          title="Characters"
          count={`${characters.length} saved ${
            characters.length === 1 ? "profile" : "profiles"
          }`}
        />

        <button
          type="button"
          className="toolbar-button primary-button characters-add-button"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus size={18} />
          Add character
        </button>
      </div>

      {characters.length > 0 && selectedCharacter ? (
        <div className="characters-layout">
          {/* Left: character selection */}
          <nav
            className="characters-sidebar"
            aria-label="Character profiles"
          >
            {characters.map((character, index) => {
              const isSelected =
                character.id === selectedCharacter.id;

              return (
                <button
                  key={character.id}
                  type="button"
                  className={`character-list-item ${
                    isSelected ? "is-selected" : ""
                  }`}
                  aria-current={isSelected ? "true" : undefined}
                  onClick={() => setSelectedCharacterId(character.id)}
                >
                  <span
                    className={`character-avatar character-avatar-${
                      index % 3
                    }`}
                    aria-hidden="true"
                  >
                    {getInitials(character.name)}
                  </span>

                  <span className="character-list-copy">
                    <strong>{character.name}</strong>
                    <RoleTags value={character.role} />
                  </span>

                  <ChevronRight
                    size={18}
                    className="character-list-chevron"
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </nav>
          
          {/* Right: selected character */}
          <section
            className="character-detail-panel"
            aria-labelledby="character-detail-name"
          >
            <div className="character-detail-header">
              <span
                className={`character-avatar character-avatar-large
                  character-avatar-${
                    characters.findIndex(
                      (character) =>
                        character.id === selectedCharacter.id
                    ) % 3
                  }`}
                aria-hidden="true"
              >
                {getInitials(selectedCharacter.name)}
              </span>

              <div className="character-detail-heading">
                <p className="character-section-label">
                  <RoleTags value={selectedCharacter.role} />
                </p>
                <h2 id="character-detail-name">
                  {selectedCharacter.name}
                </h2>
              </div>

              <div className="character-detail-actions">
                <button
                  type="button"
                  className="character-outline-button"
                  onClick={() =>
                    setEditingCharacterId(selectedCharacter.id)
                  }
                >
                  <Pencil size={16} />
                  Edit
                </button>

                <button
                  type="button"
                  className="character-icon-button character-delete-button"
                  aria-label={`Delete ${selectedCharacter.name}`}
                  onClick={() => handleDelete(selectedCharacter)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>


            <p className="character-detail-description">
              {selectedCharacter.description || "No description yet."}
            </p>

            <dl className="character-detail-stats">
              <div>
                <dt>Date of birth</dt>
                <dd>{formatBirthday(selectedCharacter.birthday)}</dd>
              </div>

              <div>
                <dt>Age today</dt>
                <dd>{getAgeToday(selectedCharacter.birthday)}</dd>
              </div>

              <div>
                <dt>Gender</dt>
                <dd>{selectedCharacter.gender || "—"}</dd>
              </div>

              <div>
                <dt>Roles</dt>
                  <dd>
                    <RoleTags value={selectedCharacter.role} fallback="—" />
                  </dd>
              </div>
            </dl>

            <section className="character-location-section">
              <p className="character-section-label">Location</p>
              <h3>Where {selectedCharacter.name} is in the story</h3>

              {selectedCharacter.location ? (
                <div className="character-current-location">
                  <MapPin size={20} aria-hidden="true" />
                  <span>{selectedCharacter.location}</span>

                  <button
                    type="button"
                    className="character-icon-button"
                    aria-label={`Edit ${selectedCharacter.name}'s location`}
                    onClick={() =>
                      setEditingCharacterId(selectedCharacter.id)
                    }
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              ) : (
                <p className="character-empty-copy">
                  No location recorded. Edit this character to add one.
                </p>
              )}
            </section>
            <section className="character-journey">
            <p className="character-section-label">Story journey</p>
            <h3>Age, places and events in chronological order</h3>

            {characterEvents.length === 0 ? (
              <p className="character-empty-copy">
                No events linked to this character yet.
                Add this character to an event to start their journey.
              </p>
            ) : (
              <ol className="character-journey-list">
                {characterEvents.map((event) => {
                  const location = event.locationId
                    ? (project.locations ?? []).find(
                        (item) => item.id === event.locationId
                      )
                    : undefined;

                  const age = selectedCharacter.birthday
                    ? characterAgeAtYear(
                        selectedCharacter.birthday,
                        event.eventDate
                      )
                    : undefined;

                  const chapters = (event.chapterIds ?? [])
                    .map((id) =>
                      (project.chapters ?? []).find(
                        (chapter) => chapter.id === id
                      )
                    )
                    .filter(
                      (chapter): chapter is NonNullable<typeof chapter> =>
                        chapter !== undefined
                    );

                  return (
                    <li key={event.id} className="character-journey-item">
                      <div className="character-journey-date">
                        <span>{formatStoryDate(event.eventDate)}</span>

                        {age != null && (
                          <small>
                            {age < 0 ? "Before birth" : `Age ${age}`}
                          </small>
                        )}
                      </div>

                      <span
                        className="character-journey-track"
                        aria-hidden="true"
                      />

                      <div className="character-journey-content">
                        <p className="character-journey-kind">Event</p>
                        <h4>{event.title}</h4>

                        {event.description && (
                          <p className="character-journey-description">
                            {event.description}
                          </p>
                        )}

                        {location && (
                          <p className="character-journey-location">
                            <MapPin size={14} aria-hidden="true" />
                            {location.name}
                          </p>
                        )}

                        {chapters.length > 0 && (
                          <p className="character-journey-chapters">
                            {chapters
                              .map((chapter) => chapter.title)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
          </section>
          
        </div>
      ) : (
        <div className="characters-empty-state">
          <h2>No characters yet</h2>
          <p>Add your first character to start building their profile.</p>
        </div>
      )}

      {showCreateForm && (
        <Modal
          title="Create character"
          onClose={() => setShowCreateForm(false)}
        >
          <CreateCharacterForm
            onCancel={() => setShowCreateForm(false)}
            onCreate={(input) => {
              addCharacter(project.id, input);
              setShowCreateForm(false);
            }}
          />
        </Modal>
      )}

      {editingCharacter && (
        <Modal
          title="Edit character"
          onClose={() => setEditingCharacterId(null)}
        >
          <EditCharacterForm
            key={`${project.id}-${editingCharacter.id}`}
            character={editingCharacter}
            onCancel={() => setEditingCharacterId(null)}
            onSave={(patch) => {
              updateCharacter(project.id, editingCharacter.id, patch);
              setEditingCharacterId(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
function RoleTags({
  value,
  fallback = "Character",
}: {
  value: string[] | string | undefined;
  fallback?: string;
}) {
  const roles = Array.isArray(value) ? value : value ? [value] : [];

  return (
    <span className="role-tags">
      {roles.length > 0
        ? roles.map((item) => (
            <span key={item} className="role-tag selected">
              {item}
            </span>
          ))
        : fallback}
    </span>
  );
}
// Form for editing an existing character, with fields for name, birthday, description, and location.
function EditCharacterForm({
  character,
  onCancel,
  onSave,
}: {
  character: Character;
  onCancel: () => void;
  onSave: (patch: Partial<Character>) => void;
}) {
  const [name, setName] = useState(character.name);
  const [location, setLocation] = useState(character.location ?? "");
  const [gender, setGender] = useState(character.gender ?? "");
  const roleOptions = [
    "Protagonist",
    "Antagonist",
    "Love interest",
    "Confidant",
    "Deuteragonists",
    "Tertiary characters",
    "Foils",
];
  const [role, setRole] = useState<string[]>(() => {
  const savedRole = character.role;

  return Array.isArray(savedRole)
    ? savedRole
    : savedRole
      ? [savedRole]
      : [];
});

  function toggleRole(option: string) {
  setRole((previous) =>
    previous.includes(option)
      ? previous.filter((item) => item !== option)
      : [...previous, option]
  );
}
  const [description, setDescription] =
    useState(character.description ?? "");

  const [birthYear, setBirthYear] =
    useState(String(character.birthday?.year ?? ""));
  const [birthMonth, setBirthMonth] =
    useState(String(character.birthday?.month ?? ""));
  const [birthDay, setBirthDay] =
    useState(String(character.birthday?.day ?? ""));

  return (
    <form
      className="workbench-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim()) return;

        onSave({
          name: name.trim(),
          location: location.trim(),
          gender,
          role,
          description: description.trim(),
          birthday: birthYear
            ? {
                year: Number(birthYear),
                month: birthMonth ? Number(birthMonth) : undefined,
                day: birthDay ? Number(birthDay) : undefined,
              }
            : undefined,
        });
      }}
    >
      <div className="form-grid">
        <label className="form-field full">
          <span>Full name</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <label className="form-field">
          <span>Birth year</span>
          <input
            type="number"
            required={Boolean(birthMonth || birthDay)}
            value={birthYear}
            onChange={(event) => setBirthYear(event.target.value)}
          />
        </label>

        <label className="form-field">
          <span>Birth month</span>
          <input
            type="number"
            min={1}
            max={12}
            required={Boolean(birthDay)}
            value={birthMonth}
            onChange={(event) => setBirthMonth(event.target.value)}
          />
        </label>

        <label className="form-field">
          <span>Birth day</span>
          <input
            type="number"
            min={1}
            max={31}
            value={birthDay}
            onChange={(event) => setBirthDay(event.target.value)}
          />
        </label>

        <label className="form-field">
          <span>Location</span>
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
        </label>

        <label className="form-field">
          <span>Gender</span>
          <select
            value={gender}
            onChange={(event) => setGender(event.target.value)}
          >
            <option value="">Select gender</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Other">Other</option>
            <option value="Unknown">Unknown</option>
          </select>
        </label>
        <div className="form-field full">
          <span id="edit-character-roles-label">Character Roles</span>

          <div
            className="role-tags"
            role="group"
            aria-labelledby="edit-character-roles-label"
          >
            {roleOptions.map((option) => {
              const selected = role.includes(option);

              return (
                <button
                  key={option}
                  type="button"
                  className={`role-tag${selected ? " selected" : ""}`}
                  aria-pressed={selected}
                  onClick={() => toggleRole(option)}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <label className="form-field full">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
      </div>

      <div className="character-form-actions">
        <ToolButton type="button" onClick={onCancel}>
          Cancel
        </ToolButton>
        <ToolButton primary type="submit">
          Save changes
        </ToolButton>
      </div>
    </form>
  );
}