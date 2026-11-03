import CreateCharacterForm from "./CreateCharacterForm";
import { CharacterTimeline } from "./characterTimeLine";
import { useWorkbench } from "../../lib/store";
import { useCallback, useState } from "react";
import { Field, Modal, PageHeader, ToolButton } from "../../components/primitives";
import type { Character, WritingProject } from "../../lib/domain";
import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import "./character.css";


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
    const [descriptionEditor, setDescriptionEditor] = useState<{
    id: string;
    value: string;
    error?: string;
  } | null>(null);  
   // Keeping the editing ID separate prevents another character's form
  // from opening if the selected character is removed.
  const [editingCharacterId, setEditingCharacterId] =
    useState<string | null>(null);
  const [createLocationOnOpen, setCreateLocationOnOpen] = useState(false);

  function openCharacterEditor(characterId: string, createLocation = false) {
    setCreateLocationOnOpen(createLocation);
    setEditingCharacterId(characterId);
  }
  const selectedCharacter =
    characters.find((character) => character.id === selectedCharacterId) ??
    characters[0];

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
  const focusDescriptionInput = useCallback(
  (input: HTMLTextAreaElement | null) => {
    if (!input) return;

    input.focus();
    const end = input.value.length;
    input.setSelectionRange(end, end);
  },
  []
);

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
          eyebrow="AUTHOR'S WORKBENCH"
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
                    openCharacterEditor(selectedCharacter.id)
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
            </dl>
            <h3 className="character-description-heading">
              Description
            </h3>

            <div className="character-description-box">
              {descriptionEditor?.id === selectedCharacter.id ? (
                <form
                  className="workbench-form"
                  onSubmit={(event) => {
                    event.preventDefault();

                    updateCharacter(project.id, descriptionEditor.id, {
                      description: descriptionEditor.value.trim(),
                    });

                    setDescriptionEditor(null);
                  }}
                >
                  <textarea
                    ref={focusDescriptionInput}
                    rows={5}
                    aria-label={`Description for ${selectedCharacter.name}`}
                    value={descriptionEditor.value}
                    onChange={(event) =>
                      setDescriptionEditor({
                        id: selectedCharacter.id,
                        value: event.target.value,
                      })
                    }
                    style={{ width: "100%", resize: "vertical" }}
                  />

                  <div className="character-form-actions">
                    <ToolButton
                      type="button"
                      onClick={() => setDescriptionEditor(null)}
                    >
                      Cancel
                    </ToolButton>

                    <ToolButton primary type="submit">
                      Save description
                    </ToolButton>
                  </div>
                </form>
              ) : (
                <>
                  <p className="character-detail-description">
                    {selectedCharacter.description || "No description yet."}
                  </p>

                  <button
                    type="button"
                    className="character-icon-button character-description-pencil"
                    aria-label={`Edit ${selectedCharacter.name}'s description`}
                    title="Edit description"
                    onClick={() =>
                      setDescriptionEditor({
                        id: selectedCharacter.id,
                        value: selectedCharacter.description ?? "",
                      })
                    }
                  >
                    <Pencil size={18} aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            
            <section className="character-journey">
              <h3>{selectedCharacter.name}'s story timeline</h3>
              <CharacterTimeline
                key={`${project.id}-${selectedCharacter.id}`}
                project={project}
                character={selectedCharacter}
              />
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
            project={project}
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
            project={project}
            character={editingCharacter}
            createLocationOnOpen={createLocationOnOpen}
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
  project,
  createLocationOnOpen = false,
  onCancel,
  onSave,
}: {
  character: Character;
  project: WritingProject;
  createLocationOnOpen?: boolean;
  onCancel: () => void;
  onSave: (patch: Partial<Character>) => void;
}) {
  const { addLocation } = useWorkbench();
  const locations = project.locations ?? [];
  const LOCATION_NEW = "**new**";
  const LOCATION_CURRENT = "**current**";
  const [name, setName] = useState(character.name);
  const [locationId, setLocationId] = useState(() => {
    if (createLocationOnOpen) return LOCATION_NEW;

    const existing = locations.find(
      (location) => location.name === character.location
    );

    return existing?.id ?? (character.location ? LOCATION_CURRENT : "");
  });
  const [newLocationName, setNewLocationName] = useState("");
  const [locationError, setLocationError] = useState("");
  
  const [gender, setGender] = useState(character.gender ?? "");
  const roleOptions = [
    "Protagonist",
    "Antagonist",
    "Love interest",
    "Confidant",
    "Deuteragonists",
    "Tertiary characters",
    "Foils",
]
;
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

        let finalLocation = "";

        if (locationId === LOCATION_NEW) {
          const locationName = newLocationName.trim();

          if (!locationName) {
            setLocationError("Please enter a location name.");
            return;
          }

          const existing = locations.find(
            (location) =>
              location.name.trim().toLowerCase() === locationName.toLowerCase()
          );

          try {
            const location = existing ?? addLocation(project.id, {
              name: locationName,
            });
            finalLocation = location.name;
          } catch {
            setLocationError("Could not create the location. Please try again.");
            return;
          }
        } else if (locationId === LOCATION_CURRENT) {
          finalLocation = character.location ?? "";
        } else if (locationId) {
          const location = locations.find((item) => item.id === locationId);

          if (!location) {
            setLocationError("This location is no longer available. Please select another.");
            return;
          }

          finalLocation = location.name;
        }

        setLocationError("");
        onSave({
          name: name.trim(),
          location: finalLocation,
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

        <Field label="Location" full>
          <select
            value={locationId}
            onChange={(event) => {
              setLocationId(event.target.value);
              setLocationError("");

              if (event.target.value !== LOCATION_NEW) {
                setNewLocationName("");
              }
            }}
          >
            <option value="">No location</option>

            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}

            {character.location &&
              !locations.some((location) => location.name === character.location) && (
                <option value={LOCATION_CURRENT}>{character.location}</option>
              )}

            {locationId &&
              locationId !== LOCATION_NEW &&
              locationId !== LOCATION_CURRENT &&
              !locations.some((location) => location.id === locationId) && (
                <option value={locationId}>Unknown location</option>
              )}

            <option value={LOCATION_NEW}>＋ Create new location…</option>
          </select>

          {locationId === LOCATION_NEW && (
            <input
              required
              aria-label="New location name"
              value={newLocationName}
              onChange={(event) => {
                setNewLocationName(event.target.value);
                setLocationError("");
              }}
              placeholder="New location name"
              style={{ marginTop: 8 }}
            />
          )}

          {locationError && <p role="alert">{locationError}</p>}
        </Field>

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
