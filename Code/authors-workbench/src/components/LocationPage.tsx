import { useState } from "react";
import { ChevronDown, ChevronRight, MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Field, Modal, PageHeader, ToolButton } from "./primitives";
import { useWorkbench } from "../lib/store";
import type { Chapter, Location, StoryEvent, WritingProject } from "../lib/domain";

// English month abbreviations, matching the design mock ("10 Jan 1992").
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Formats a StoryDate as "10 Jan 1992" (day/month omitted when not recorded).
function formatDisplayDate(date: StoryEvent["startDate"]): string {
  const day = date.day ? `${date.day} ` : "";
  const month = date.month ? `${MONTHS[date.month - 1]} ` : "";
  return `${day}${month}${date.year}`;
}

// One history line: date + event title + character names.
function EventHistoryRow({ event, project }: { event: StoryEvent; project: WritingProject }) {
  const names = (event.characterIds || [])
    .map((id) => project.characters.find((c) => c.id === id)?.name)
    .filter(Boolean)
    .join(", ");
  return (
    <div className="location-history-row">
      <span className="location-history-date">{formatDisplayDate(event.startDate)}</span>
      <div>
        <strong>{event.title}</strong>
        {names && <p>{names}</p>}
      </div>
    </div>
  );
}

// A single location card with its linked events and a collapsible history.
function LocationCard({
  location,
  project,
  defaultOpen,
}: {
  location: Location;
  project: WritingProject;
  defaultOpen: boolean;
}) {
  const { removeLocation, updateLocation } = useWorkbench();
  const [open, setOpen] = useState(defaultOpen);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(location.name);
  const [editDescription, setEditDescription] = useState(location.description ?? "");

  // Events that explicitly link to this location.
  const events = (project.events || [])
  .filter((e) => e.locationId === location.id)
  .sort((a, b) => {
    const da = a.startDate;
    const db = b.startDate;
    return (
      da.year - db.year ||
      (da.month ?? 0) - (db.month ?? 0) ||
      (da.day ?? 0) - (db.day ?? 0)
    );
  });

  const characterNames = Array.from(
    new Set(
      events
        .flatMap((e) => e.characterIds || [])
        .map((id) => project.characters.find((c) => c.id === id)?.name)
        .filter((n): n is string => Boolean(n))
    )
  );

  // Group history by chapter: a chapter appears here either when it is
  // referenced by this location's events, or when it links this location
  // directly (even with no linked events). Groups are sorted by order;
  // events without any chapter go into a trailing "No chapter" group.
  const historyChapterIds = Array.from(
    new Set([
      ...events.flatMap((e) => e.chapterIds || []),
      ...project.chapters
        .filter((c) => (c.locationIds || []).includes(location.id))
        .map((c) => c.id),
    ])
  );
  const historyChapters = historyChapterIds
    .map((id) => project.chapters.find((c) => c.id === id))
    .filter((c): c is Chapter => Boolean(c))
    .sort((a, b) => a.order - b.order);
  const unassignedEvents = events.filter((e) => (e.chapterIds || []).length === 0);

  const handleDelete = () => {
    if (!window.confirm(`Delete location "${location.name}"? Linked events will lose their location.`)) return;
    removeLocation(project.id, location.id);
  };

  const handleEditSave = () => {
    if (!editName.trim()) return;
    updateLocation(project.id, location.id, { name: editName.trim(), description: editDescription });
    setEditing(false);
  };

  return (
    <article className="location-card">
      <div className="location-card-head">
        <div className="location-head-main">
          <span className="location-eyebrow">LOCATION</span>
          <h3 className="location-name">{location.name}</h3>
        </div>
        <div className="location-card-icon">
          <MapPin size={20} />
        </div>
      </div>

      {location.description && (
        <p className="location-description">{location.description}</p>
      )}

      <div className="location-stats">
        <span><strong>{historyChapters.length}</strong> {historyChapters.length === 1 ? "chapter" : "chapters"}</span>
        <span><strong>{events.length}</strong> {events.length === 1 ? "event" : "events"}</span>
        <span><strong>{characterNames.length}</strong> {characterNames.length === 1 ? "character" : "characters"}</span>
      </div>

      {characterNames.length > 0 && (
        <div className="location-people">
          <Users size={12} />
          {characterNames.join(", ")}
        </div>
      )}

      <button
        type="button"
        className="location-expand-link"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Hide location histories" : "Open location histories"}
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {open && (
        <div className="location-history">
          {events.length === 0 && historyChapters.length === 0 && (
            <p className="muted-copy">No related events yet.</p>
          )}
          {historyChapters.map((chapter) => {
            const chapterEvents = events.filter((e) => (e.chapterIds || []).includes(chapter.id));
            return (
              <section key={chapter.id} className="location-history-group">
                <div className="location-history-group-head">
                  <span className="group-num">Chapter {chapter.order + 1}</span>
                  <span className="group-title">{chapter.title || `Chapter ${chapter.order + 1}`}</span>
                </div>
                {chapterEvents.map((event) => (
                  <EventHistoryRow key={event.id} event={event} project={project} />
                ))}
              </section>
            );
          })}
          {unassignedEvents.length > 0 && (
            <section className="location-history-group no-chapter">
              <div className="location-history-group-head">
                <span className="group-num">No chapter</span>
                <span className="group-title">Events outside any chapter</span>
              </div>
              {unassignedEvents.map((event) => (
                <EventHistoryRow key={event.id} event={event} project={project} />
              ))}
            </section>
          )}
        </div>
      )}

      <div className="location-card-actions">
        <button
          type="button"
          className="edit-location-button"
          aria-label={`Edit ${location.name}`}
          onClick={() => {
            setEditName(location.name);
            setEditDescription(location.description ?? "");
            setEditing(true);
          }}
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          className="delete-location-button"
          aria-label={`Delete ${location.name}`}
          onClick={handleDelete}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {editing && (
        <Modal title="Edit location" onClose={() => setEditing(false)}>
          <div className="workbench-form">
            <Field label="Location name" full>
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Carlton House"
              />
            </Field>
            <Field label="Description" full>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="What makes this place matter to the story?"
              />
            </Field>
            <div className="modal-actions">
              <ToolButton onClick={() => setEditing(false)}>Cancel</ToolButton>
              <ToolButton primary onClick={handleEditSave}>Save changes</ToolButton>
            </div>
          </div>
        </Modal>
      )}
    </article>
  );
}

// The Locations page: manage the project's places and show what happened there.
export function LocationsPage({ project }: { project: WritingProject }) {
  const { addLocation } = useWorkbench();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const locations = project.locations || [];

  const handleCreate = () => {
    if (!name.trim()) return;
    addLocation(project.id, { name: name.trim(), description });
    setName("");
    setDescription("");
    setShowCreate(false);
  };

  return (
    <div className="page-stack core-page">
      <PageHeader
        eyebrow="MANUSCRIPT"
        title="Locations"
        count={`${locations.length} ${locations.length === 1 ? "location has" : "locations have"} been mapped so far`}
      >
        <ToolButton primary onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New location
        </ToolButton>
      </PageHeader>

      {locations.length === 0 ? (
        <p className="muted-copy">
          No locations yet. Create your first location here, then link it to events under Events.
        </p>
      ) : (
        <div className="location-grid">
          {locations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              project={project}
              defaultOpen={false}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Create location" onClose={() => setShowCreate(false)}>
          <div className="workbench-form">
            <Field label="Location name" full>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Carlton House"
              />
            </Field>
            <Field label="Description" full>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What makes this place matter to the story?"
              />
            </Field>
            <div className="modal-actions">
              <ToolButton onClick={() => setShowCreate(false)}>Cancel</ToolButton>
              <ToolButton primary onClick={handleCreate}>Create location</ToolButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
