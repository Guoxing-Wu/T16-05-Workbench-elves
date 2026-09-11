import { useState } from "react";
import { Plus } from "lucide-react";
import { ToolButton } from "./primitives";
import type { StoryDate } from "../lib/domain";
// Form for creating a new character, with fields for name, birthday, description, and location.
type Props = {
  onCancel: () => void;
  onCreate: (input: {
    firstName: string;
    middleName?: string;
    lastName?: string;
    birthday?: StoryDate;
    description?: string;
    location?: string;
    role?: string;
    gender?: string;
  }) => void; 
};
// Form for creating a new character, with fields for name, birthday, description, and location.
export default function CreateCharacterForm({ onCancel,  onCreate }: Props) {
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
 // Handle form submission: validate input, construct character object, call onCreate, and reset form fields.
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!firstName.trim()) {
      return;
    }

    let birthday: StoryDate | undefined;

    if (birthYear) {
      birthday = {
        year: Number(birthYear),
        month: birthMonth ? Number(birthMonth) : undefined,
        day: birthDay ? Number(birthDay) : undefined,
      };
    }

    onCreate({
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      middleName: middleName.trim() || undefined,
      role: role.trim() || undefined,
      gender: gender.trim() || undefined,
      birthday,
      description: description.trim() || undefined,
      location: location.trim() || undefined,
    });

    setFirstName("");
    setMiddleName("");
    setLastName("");
    setRole("");
    setGender("");
    setBirthYear("");
    setBirthMonth("");
    setBirthDay("");
    setDescription("");
    setLocation("");
  };
  
  return (
    <form
      className="settings-card workbench-form"
      onSubmit={handleSubmit}
    >
      <div className="form-grid">

        <label className="form-field">
          <span>First name</span>
          <input
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

        <label className="form-field">
          <span>Location</span>
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Location"
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
            placeholder="Protagonist, antagonist, sibling..."
          />
        </label>
        
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