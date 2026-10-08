import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Field, Modal, PageHeader, ToolButton } from "../../components/primitives";
import { useWorkbench } from "../../lib/store";
import type { Chapter, Location, StoryEvent, StoryScene, WritingProject } from "../../lib/domain";
import "./LocationPage.css";

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
      <span className="location-history-date">
        {formatDisplayDate(event.startDate)}
        {event.endDate && event.endDate.year > 0 && ` – ${formatDisplayDate(event.endDate)}`}
      </span>
      <div className="location-history-title">
        <strong title={event.title}>{event.title}</strong>
        {names && <span className="location-history-names" title={names}>{names}</span>}
      </div>
    </div>
  );
}

// One scene line inside a location's history. Nested scenes sit indented
// under their linked continuous event and are tagged "SCENE".
function SceneHistoryRow({
  scene,
  project,
  nested,
}: {
  scene: StoryScene;
  project: WritingProject;
  nested?: boolean;
}) {
  const names = (scene.characterIds || [])
    .map((id) => project.characters.find((c) => c.id === id)?.name)
    .filter(Boolean)
    .join(", ");
  const dateLabel =
    formatDisplayDate(scene.date) + (scene.time ? ` · ${scene.time}` : "");
  return (
    <div
      className={
        nested
          ? "location-history-row nested-scene"
          : "location-history-row scene-row"
      }
    >
      <span className="location-history-date">{dateLabel}</span>
      <div className="location-history-title">
        <strong title={scene.title}>{scene.title}</strong>
        {names && (
          <span className="location-history-names" title={names}>{names}</span>
        )}
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

  // Scenes that explicitly link to this location.
  const scenes = (project.scenes || []).filter((s) => s.locationId === location.id);

  const characterNames = Array.from(
    new Set(
      [...events.flatMap((e) => e.characterIds || []), ...scenes.flatMap((s) => s.characterIds || [])]
        .map((id) => project.characters.find((c) => c.id === id)?.name)
        .filter((n): n is string => Boolean(n))
    )
  );

  // Group history by chapter: a chapter appears here either when it is
  // referenced by this location's events or scenes, or when it links this
  // location directly (even with no linked events). Groups are sorted by
  // order; events/scenes without any chapter go into a trailing "No chapter"
  // group.
  const historyChapterIds = Array.from(
    new Set([
      ...events.flatMap((e) => e.chapterIds || []),
      ...scenes.flatMap((s) => s.chapterIds || []),
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
  const unassignedScenes = scenes.filter((s) => (s.chapterIds || []).length === 0);

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
          <h3 className="location-name" title={location.name}>{location.name}</h3>
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
        <span><strong>{events.length + scenes.length}</strong> {events.length + scenes.length === 1 ? "event" : "events"}</span>
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
          {events.length === 0 && scenes.length === 0 && historyChapters.length === 0 && (
            <p className="muted-copy">No related events yet.</p>
          )}
          {historyChapters.map((chapter) => {
            const chapterEvents = events
              .filter((e) => (e.chapterIds || []).includes(chapter.id))
              .sort((a, b) => {
                const da = a.startDate;
                const db = b.startDate;
                return da.year - db.year || (da.month ?? 0) - (db.month ?? 0) || (da.day ?? 0) - (db.day ?? 0);
              });
            const chapterScenes = scenes
              .filter((s) => (s.chapterIds || []).includes(chapter.id))
              .sort((a, b) => {
                const da = a.date;
                const db = b.date;
                return da.year - db.year || (da.month ?? 0) - (db.month ?? 0) || (da.day ?? 0) - (db.day ?? 0);
              });
            const chapterEventIds = new Set(chapterEvents.map((e) => e.id));
            const nestedScenes = chapterScenes.filter((s) => s.eventId && chapterEventIds.has(s.eventId));
            const standaloneScenes = chapterScenes.filter((s) => !nestedScenes.includes(s));
            return (
              <section key={chapter.id} className="location-history-group">
                <div className="location-history-group-head">
                  <span className="group-num">Chapter {chapter.order + 1}</span>
                  <span className="group-title" title={chapter.title || `Chapter ${chapter.order + 1}`}>{chapter.title || `Chapter ${chapter.order + 1}`}</span>
                </div>
                {chapterEvents.map((event) => (
                  <Fragment key={event.id}>
                    <EventHistoryRow event={event} project={project} />
                    {nestedScenes
                      .filter((s) => s.eventId === event.id)
                      .map((scene) => (
                        <SceneHistoryRow key={scene.id} scene={scene} project={project} nested />
                      ))}
                  </Fragment>
                ))}
                {standaloneScenes.map((scene) => (
                  <SceneHistoryRow key={scene.id} scene={scene} project={project} />
                ))}
              </section>
            );
          })}
          {(unassignedEvents.length > 0 || unassignedScenes.length > 0) && (
            <section className="location-history-group no-chapter">
              <div className="location-history-group-head">
                <span className="group-num">No chapter</span>
                <span className="group-title">Events & scenes outside any chapter</span>
              </div>
              {unassignedEvents.map((event) => (
                <EventHistoryRow key={event.id} event={event} project={project} />
              ))}
              {unassignedScenes.map((scene) => (
                <SceneHistoryRow key={scene.id} scene={scene} project={project} />
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
