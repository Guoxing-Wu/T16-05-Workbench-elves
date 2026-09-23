import CreateCharacterForm from "./CreateCharacterForm";
import { useWorkbench } from "../../lib/store";
import {useState } from "react";
import { Modal, PageHeader, ToolButton } from "../../components/primitives";
import type { Character, WritingProject } from "../../lib/domain";
import { ChevronRight, Trash2 } from "lucide-react";




// Page showing the list of characters in a project, with a form to add new ones.
export function CharactersPage({
  project,
  onBack,
}: {
  project: WritingProject;
  onBack: () => void;
}) {
  const { addCharacter, updateCharacter, removeCharacter } = useWorkbench();
  const characters = project.characters || [];
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const selectedCharacter = characters.find(
  (character) => character.id === selectedCharacterId
);
  return (
    <div className="page-stack core-page">
      <button
        className="text-link back-link"
        onClick={onBack}
      >
        Back
      </button>

      <PageHeader
        eyebrow="STORY"
        title="Characters"
        count={`${characters.length} characters`}
      />

      <div className="character-list">
        {characters.map((character) => (
           
          <div key={character.id} className="settings-card character-card">
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
            <div className="character-card-actions">
              <button
                  type="button"
                  className="view-character-link"
                  onClick={() => {
                    setSelectedCharacterId(character.id);
                    setIsEditing(false);
                  }}
                >
                  View character <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  className="delete-character-button"
                  aria-label={`Delete ${character.name}`}
                  onClick={() => {
                    if (!window.confirm(`Delete "${character.name}"?`)) return;
                    removeCharacter(project.id, character.id);
                  }}
                >
                  <Trash2 size={15} />
                </button>

                
              </div>
             
          </div>
        ))}

        {characters.length === 0 && (
          <p className="muted-copy">No characters yet.</p>
        )}
      </div>

      {/* Create character action */}
      <div className="create-character-action">
        <button
          className="toolbar-button primary-button"
          onClick={() => setShowCreateForm(true)}
        >
          + Add new character
        </button>
      </div>

      {/* Pop-up Window*/}
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
      {/* Pop-up Window for viewing/editing a character */}
      {selectedCharacter && (
      <Modal
        title={isEditing ? "Edit character" : selectedCharacter.name}
        onClose={() => {
          setSelectedCharacterId(null);
          setIsEditing(false);
        }}
      >
        {isEditing ? (
          <EditCharacterForm
            key={selectedCharacter.id}
            character={selectedCharacter}
            onCancel={() => setIsEditing(false)}
            onSave={(patch) => {
              updateCharacter(project.id, selectedCharacter.id, patch);
              setIsEditing(false);
            }}
          />
        ) : (
          <div className="workbench-form">
            
            {selectedCharacter.birthday && (
              <p>
                Birthday:{" "}
                {[
                  selectedCharacter.birthday.year,
                  selectedCharacter.birthday.month,
                  selectedCharacter.birthday.day,
                ]
                  .filter((value) => value !== undefined)
                  .join("-")}
              </p>
            )}
          
            <p>Location: {selectedCharacter.location || "—"}</p>
            <p>Gender: {selectedCharacter.gender || "—"}</p>
            <p>Role: {selectedCharacter.role || "—"}</p>
            <p>Description: {selectedCharacter.description || "—"}</p>

            <div className="character-form-actions">

                   
              <ToolButton primary onClick={() => setIsEditing(true)}>
                Edit character
              </ToolButton>
            </div>
          </div>
        )}
      </Modal>
    )}
    </div>
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
  const [role, setRole] = useState(character.role ?? "");
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
          role: role.trim(),
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

        <label className="form-field">
          <span>Role</span>
          <input
            value={role}
            onChange={(event) => setRole(event.target.value)}
          />
        </label>

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