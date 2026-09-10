import { useState } from "react";
import { Plus } from "lucide-react";
import { ToolButton } from "./primitives";
import type { StoryDate } from "../lib/domain";

type Props = {
  onCreate: (input: {
    name: string;
    birthday?: StoryDate;
    description?: string;
    location?: string;
  }) => void; 
};

export default function CreateCharacterForm({ onCreate }: Props) {
  const [name, setName] = useState("");

  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
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
      name: name.trim(),
      birthday,
      description: description.trim() || undefined,
      location: location.trim() || undefined,
    });

    setName("");
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
          <span>Character name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Character name"
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

        <label className="form-field full">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Character description"
          />
        </label>

      </div>

      <ToolButton primary type="submit">
        <Plus size={15} /> Create character
      </ToolButton>
    </form>
  );
}