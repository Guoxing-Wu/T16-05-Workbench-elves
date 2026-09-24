import { MapPin, Plus } from "lucide-react";
import { PageHeader, ToolButton } from "../../components/primitives";
import { characterAgeAtYear } from "../../lib/domain";
import type { StoryDate, WritingProject } from "../../lib/domain";
import "./TimelinePage.css";

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
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function TimelinePage(
  {
  project,
  onManageEvents,
  onBack,
}: {
  project: WritingProject;
  onManageEvents: () => void;
  onBack: () => void;
}) {
  const events = [...(project.events ?? [])].sort((a, b) =>
    compareDates(a.eventDate, b.eventDate)
  );
 
  const firstEvent = events[0];
  const lastEvent = events[events.length - 1];

  const summary =
    firstEvent && lastEvent
      ? `${formatStoryDate(firstEvent.eventDate)} – ${formatStoryDate(
          lastEvent.eventDate
        )} · ${events.length} ${events.length === 1 ? "event" : "events"}`
      : "No dated events yet";

  return (
    <div className="page-stack core-page chronological-page">
      <button
        className="text-link back-link"
        onClick={onBack}
      ></button>

      <PageHeader
        eyebrow="AUTHOR’S WORKBENCH"
        title="Timeline"
        count={summary}
      >
        <ToolButton primary onClick={onManageEvents}>
          <Plus size={18} />
          Manage events
        </ToolButton>
      </PageHeader>

      {events.length === 0 ? (
        <p className="muted-copy">
          Add a story event to start your timeline.
        </p>
      ) : (
        <ol className="chronological-timeline">
          {events.map((event, index) => {
            const side = index % 2 === 0 ? "left" : "right";

            const chapters = (event.chapterIds ?? [])
              .map((id) => project.chapters.find((c) => c.id === id))
              .filter(
                (chapter): chapter is NonNullable<typeof chapter> =>
                  chapter !== undefined
              );

            const characters = (event.characterIds ?? [])
              .map((id) => project.characters.find((c) => c.id === id))
              .filter(
                (character): character is NonNullable<typeof character> =>
                  character !== undefined
              );
            const locations = (event.locationId ? [event.locationId] : [])
              .map((id) => project.locations.find((l) => l.id === id))
              .filter(
                (location): location is NonNullable<typeof location> =>
                  location !== undefined
              );

            return (
              <li
                key={event.id}
                className={`chronological-item chronological-item--${side}`}
              >
                <div className="chronological-date">
                  <strong>{event.eventDate.year}</strong>
                  <span>{formatStoryDate(event.eventDate)}</span>
                </div>

                <span className="chronological-dot" aria-hidden="true" />

                <article className="chronological-card">
                  {chapters.length > 0 && (
                    <p className="chronological-tag">
                      {chapters.map((chapter) => chapter.title).join(" · ")}
                    </p>
                  )}

                  <h2>{event.title}</h2>

                  {event.description && (
                    <p className="chronological-description">
                      {event.description}
                    </p>
                  )}

                  {locations.length > 0 && (
                    <p className="chronological-location">
                      <MapPin size={14} />
                      {locations.map((location) => location.name).join(" · ")}
                    </p>
                  )}

                  {characters.length > 0 && (
                    <ul className="chronological-characters">
                      {characters.map((character, characterIndex) => {
                        const age = character.birthday
                          ? characterAgeAtYear(
                              character.birthday,
                              event.eventDate
                            )
                          : undefined;

                        const details = [
                          age != null ? `Age ${age}` : undefined,
                          character.location || undefined,
                        ]
                          .filter(Boolean)
                          .join(" · ");

                        return (
                          <li
                            key={character.id}
                            className="chronological-character"
                          >
                            <span
                              className={`chronological-avatar avatar-tone-${
                                characterIndex % 3
                              }`}
                              aria-hidden="true"
                            >
                              {getInitials(character.name)}
                            </span>

                            <div>
                              <strong>{character.name}</strong>
                              {details && <p>{details}</p>}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
