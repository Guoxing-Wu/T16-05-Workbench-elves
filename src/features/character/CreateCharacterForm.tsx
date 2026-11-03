import { useState } from "react";
import type { FormEvent } from "react";
import { Plus } from "lucide-react";
import { Field, ToolButton } from "../../components/primitives";
import type { StoryDate, WritingProject } from "../../lib/domain";
import { useWorkbench } from "../../lib/store";
import { isValidBirthday } from "../../test/characterBirthday";

type Props = {
  project: WritingProject;
  onCancel: () => void;
  onCreate: (input: {
    firstName: string;
    middleName?: string;
    lastName?: string;
    birthday: StoryDate;
    description?: string;
    location?: string;
    role?: string[];
    gender?: string;
  }) => void;
};

const roleOptions = [
  "Protagonist",
  "Antagonist",
  "Love interest",
  "Confidant",
  "Deuteragonists",
  "Tertiary characters",
  "Foils",
];

const LOCATION_NEW = "**new**";

// Form for creating a character and selecting or creating a project location.
export default function CreateCharacterForm({
  project,
  onCancel,
  onCreate,
}: Props) {
  const { addLocation } = useWorkbench();
  const locations = project.locations ?? [];

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<string[]>([]);
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [description, setDescription] = useState("");
  const [locationId, setLocationId] = useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [locationError, setLocationError] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!firstName.trim() || !birthYear) return;

    const year = Number(birthYear);
    if (!Number.isInteger(year)) return;

    const birthday: StoryDate = {
      year,
      month: birthMonth ? Number(birthMonth) : undefined,
      day: birthDay ? Number(birthDay) : undefined,
    };

    if (!isValidBirthday(birthday)) return;

    // Validate the character before making any change to the location list.
    let finalLocation: string | undefined;

    if (locationId === LOCATION_NEW) {
      const name = newLocationName.trim();

      if (!name) {
        setLocationError("Please enter a location name.");
        return;
      }

      const existing = locations.find(
        (location) => location.name.trim().toLowerCase() === name.toLowerCase()
      );

      try {
        const location = existing ?? addLocation(project.id, { name });
        finalLocation = location.name;
      } catch {
        setLocationError("Could not create the location. Please try again.");
        return;
      }
    } else if (locationId) {
      const location = locations.find((item) => item.id === locationId);

      if (!location) {
        setLocationError("This location is no longer available. Please select another.");
        return;
      }

      finalLocation = location.name;
    }

    setLocationError("");
    onCreate({
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      middleName: middleName.trim() || undefined,
      role,
      gender: gender.trim() || undefined,
      birthday,
      description: description.trim() || undefined,
      location: finalLocation,
    });

    setFirstName("");
    setMiddleName("");
    setLastName("");
    setRole([]);
    setGender("");
    setBirthYear("");
    setBirthMonth("");
    setBirthDay("");
    setDescription("");
    setLocationId("");
    setNewLocationName("");
    setLocationError("");
  };

  function toggleRole(option: string) {
    setRole((previous) =>
      previous.includes(option)
        ? previous.filter((item) => item !== option)
        : [...previous, option]
    );
  }

  return (
    <form className="workbench-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="form-field">
          <span>First name</span>
          <input
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="First name"
          />
        </label>

        <label className="form-field">
          <span>Middle name</span>
          <input
            value={middleName}
            onChange={(event) => setMiddleName(event.target.value)}
            placeholder="Middle name (optional)"
          />
        </label>

        <label className="form-field">
          <span>Last name</span>
          <input
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Last name"
          />
        </label>

        <label className="form-field">
          <span>Birth year</span>
          <input
            required
            type="number"
            value={birthYear}
            onChange={(event) => setBirthYear(event.target.value)}
            placeholder="Year"
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
            placeholder="Month"
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
            placeholder="Day"
          />
        </label>

        <Field label="Location" full>
          <select
            aria-label="Character location"
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

            {locationId &&
              locationId !== LOCATION_NEW &&
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
          <select value={gender} onChange={(event) => setGender(event.target.value)}>
            <option value="">Select gender</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Other">Other</option>
            <option value="Unknown">Unknown</option>
          </select>
        </label>
        <div className="form-field full">
          <span>Character Role (multiple)</span>
          <div className="role-tags">
            {roleOptions.map((option) => {
              const selected = role.includes(option);

              return (
                <button
                  key={option}
                  type="button"
                  className={`role-tag${selected ? " selected" : ""}`}
                  aria-pressed={selected}
                  disabled={!selected && role.length >= 2}
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
            placeholder="Character description"
          />
        </label>
      </div>

      <div className="character-form-actions">
        <ToolButton type="button" onClick={onCancel}>
          Cancel
        </ToolButton>
        <ToolButton primary type="submit">
          <Plus size={15} /> Save character
        </ToolButton>
      </div>
    </form>
  );
}
