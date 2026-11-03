import {useState } from "react";
import type { CSSProperties } from "react";
import { ChevronDown, ChevronRight, MapPin } from "lucide-react";
import { characterAgeAtYear } from "../../lib/domain";


import type {
  Character,
  StoryDate,
  StoryEvent,
  StoryScene,
  WritingProject,
} from "../../lib/domain";
import "./CharacterTimeline.css";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const EVENT_COLORS = [
  "#947B68",
  "#82718F",
  "#76896B",
  "#648C96",
  "#AC7D80",
];
const CHAPTER_COLORS = [
  "#648C96",
  "#AB8B70",
  "#8C7A98",
  "#7F9575",
  "#B47F83",
];

type TimelineNode =
  | {
    kind: "event-start";
    date: StoryDate;
    event: StoryEvent;
  }
  | {
    kind: "event-end";
    date: StoryDate;
    event: StoryEvent;
  }
  | {
    kind: "scene";
    date: StoryDate;
    scene: StoryScene;
  };

type EventRange = {
  event: StoryEvent;
  startIndex: number;
  endIndex: number;
  lane: number;
  color: string;
};

type TimelineStyle = CSSProperties & {
  "--event-color"?: string;
  "--axis-width"?: string;
};

function formatStoryDate(date: StoryDate): string {
  if (date.month === undefined) return String(date.year);

  const month = MONTHS[date.month - 1];

  return date.day === undefined
    ? `${month} ${date.year}`
    : `${date.day} ${month} ${date.year}`;
}
function formatSceneDate(date: StoryDate): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  if (date.month === undefined) {
    return "Date unspecified";
  }

  const month = months[date.month - 1];

  return date.day === undefined
    ? month
    : `${date.day} ${month}`;
}

function compareDates(a: StoryDate, b: StoryDate): number {
  return (
    a.year - b.year ||
    (a.month ?? 0) - (b.month ?? 0) ||
    (a.day ?? 0) - (b.day ?? 0)
  );
}

function nodeTime(node: TimelineNode): string {
  if (node.kind === "event-start") return "";
  if (node.kind === "event-end") return "99:99";
  return node.scene.time || "24:00";
}

function nodeKey(node: TimelineNode): string {
  return node.kind === "scene"
    ? `scene:${node.scene.id}`
    : `${node.kind}:${node.event.id}`;
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

// Shared metadata for both event details and scene cards.
function EntryMetadata({
  entry,
  date,
  project,
  character,
}: {
  entry: StoryEvent | StoryScene;
  date: StoryDate;
  project: WritingProject;
  character: Character;
}) {
  const chapters = project.chapters.filter((chapter) =>
    (entry.chapterIds ?? []).includes(chapter.id)
  );

  const characters = (entry.characterIds ?? []).includes(character.id)
    ? [character]
    : [];

  const location = project.locations.find(
    (place) => place.id === entry.locationId
  );

  return (
    <>
      {chapters.length > 0 && (
        <p className="tl-chapters">
          {chapters.map((chapter) => chapter.title).join(" · ")}
        </p>
      )}

      {location && (
        <p className="tl-location">
          <MapPin size={13} aria-hidden="true" />
          {location.name}
        </p>
      )}

      {characters.length > 0 && (
        <ul className="tl-characters">
          {characters.map((character) => {
            const age = character.birthday
              ? characterAgeAtYear(character.birthday, date)
              : undefined;

            return (
              <li key={character.id}>
                <span className="tl-avatar" aria-hidden="true">
                  {getInitials(character.name)}
                </span>

                <span>
                  {character.name}
                  {age != null && age >= 0 ? ` · Age ${age}` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export function CharacterTimeline({
  project,
  character,
}: {
  project: WritingProject;
  character: Character;
}) {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const events = (project.events ?? []).filter((event) =>
    event.characterIds?.includes(character.id)
  );
  const scenes = (project.scenes ?? []).filter((scene) =>
    scene.characterIds?.includes(character.id)
  );

  function toggleEvent(id: string) {
    setExpandedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  // Build nodes INSIDE the component, where project is available.
  const nodes: TimelineNode[] = [
    ...events.flatMap(
      (event): TimelineNode[] => [
        {
          kind: "event-start",
          date: event.startDate,
          event,
        },
        {
          kind: "event-end",
          date: event.endDate,
          event,
        },
      ]
    ),

    ...scenes.map(
      (scene): TimelineNode => ({
        kind: "scene",
        date: scene.date,
        scene,
      })
    ),
  ];

  nodes.sort(
    (a, b) =>
      compareDates(a.date, b.date) ||
      nodeTime(a).localeCompare(nodeTime(b)) ||
      nodeKey(a).localeCompare(nodeKey(b))
  );

  // Give each event a stable color based on its ID.
  const eventColors = new Map(
    [...(project.events ?? [])]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((event, index) => [
        event.id,
        EVENT_COLORS[index % EVENT_COLORS.length],
      ])
  );

  const ranges: EventRange[] = events
    .map((event) => ({
      event,
      startIndex: nodes.findIndex(
        (node) =>
          node.kind === "event-start" &&
          node.event.id === event.id
      ),
      endIndex: nodes.findIndex(
        (node) =>
          node.kind === "event-end" &&
          node.event.id === event.id
      ),
      lane: 0,
      color: eventColors.get(event.id) ?? EVENT_COLORS[0],
    }))
    .filter(
      (range) =>
        range.startIndex >= 0 &&
        range.endIndex >= range.startIndex
    )
    .sort(
      (a, b) =>
        a.startIndex - b.startIndex ||
        a.event.id.localeCompare(b.event.id)
    );

  // Reuse a lane only when its previous event has ended.
  const laneEnds: number[] = [];

  for (const range of ranges) {
    let lane = laneEnds.findIndex(
      (endIndex) => endIndex < range.startIndex
    );

    if (lane === -1) lane = laneEnds.length;

    laneEnds[lane] = range.endIndex;
    range.lane = lane;
  }

  const axisWidth = Math.max(44, laneEnds.length * 14 + 28);

  const timelineStyle: TimelineStyle = {
    "--axis-width": `${axisWidth}px`,
  };

  function getSceneColor(scene: StoryScene): string {
    const chapter = [...project.chapters]
      .sort((a, b) => a.order - b.order)
      .find((chapter) => (scene.chapterIds ?? []).includes(chapter.id));

    return chapter
      ? CHAPTER_COLORS[
      ((chapter.order % CHAPTER_COLORS.length) +
        CHAPTER_COLORS.length) %
      CHAPTER_COLORS.length
      ]
      : "#648C96";
  }

  return (
    <div className="character-timeline">
      {nodes.length === 0 ? (
        <p className="character-empty-copy">
          No events or scenes linked to {character.name} yet. Add this character
          to an event or scene to start their journey.
        </p>
      ) : (
        <div className="tl-scroll">
          <div className="tl-content" style={timelineStyle}>
            <div className="tl-headings">
              <span>Events</span>
              <span aria-hidden="true" />
              <span>Scenes</span>
            </div>

            <ol className="tl-list">
              {nodes.map((node, index) => {
                const isScene = node.kind === "scene";

                const color = node.kind === "scene"
                  ? getSceneColor(node.scene)
                  : eventColors.get(node.event.id) ?? EVENT_COLORS[0];

                const rowStyle: TimelineStyle = {
                  "--event-color": color,
                };

                const activeRanges = ranges.filter(
                  (range) =>
                    range.startIndex <= index &&
                    range.endIndex >= index
                );

                const endpointRange = isScene
                  ? undefined
                  : ranges.find(
                    (range) => range.event.id === node.event.id
                  );

                const linkedEvent = isScene
                  ? events.find(
                    (event) => event.id === node.scene.eventId
                  )
                  : undefined;

                const expanded =
                  !isScene && expandedIds.includes(node.event.id);

                return (
                  <li
                    key={nodeKey(node)}
                    className={`tl-row tl-row--${node.kind}`}
                    style={rowStyle}
                  >
                    <div className="tl-event-side">
                      {node.kind === "event-start" && (
                        <>
                          <button
                            type="button"
                            className="tl-event-toggle"
                            aria-expanded={expanded}
                            onClick={() => toggleEvent(node.event.id)}
                          >
                            {expanded ? (
                              <ChevronDown size={13} />
                            ) : (
                              <ChevronRight size={13} />
                            )}

                            <span>{node.event.title} start</span>
                          </button>

                          {expanded && (
                            <article className="tl-event-details">
                              <h3>{node.event.title}</h3>

                              <p className="tl-range">
                                {formatStoryDate(node.event.startDate)}
                                {" → "}
                                {formatStoryDate(node.event.endDate)}
                              </p>

                              {node.event.description && (
                                <p className="tl-description">
                                  {node.event.description}
                                </p>
                              )}

                              {node.event.isStoryBeat && (
                                <p className="tl-chapters">
                                  Story beat
                                  {node.event.storyBeatName
                                    ? ` · ${node.event.storyBeatName}`
                                    : ""}
                                </p>
                              )}

                              <EntryMetadata
                                entry={node.event}
                                date={node.date}
                                project={project}
                                character={character}
                              />
                            </article>
                          )}
                        </>
                      )}

                      {node.kind === "event-end" && (
                        <span className="tl-event-end">
                          {node.event.title} end
                        </span>
                      )}
                    </div>

                    <div className="tl-axis" aria-hidden="true">
                      {activeRanges.map((range) => (
                        <span
                          key={range.event.id}
                          className={[
                            "tl-band",
                            range.startIndex === index
                              ? "tl-band--start"
                              : "",
                            range.endIndex === index
                              ? "tl-band--end"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          style={{
                            left: `${8 + range.lane * 14}px`,
                            backgroundColor: range.color,
                          }}
                        />
                      ))}

                      <span
                        className={`tl-dot ${node.kind === "event-end"
                          ? "tl-dot--end"
                          : ""
                          }`}
                        style={{
                          left: isScene
                            ? `${axisWidth - 10}px`
                            : `${13 + (endpointRange?.lane ?? 0) * 14}px`,
                        }}
                      />
                    </div>

                    <div className="tl-scene-side">
                      <div className="tl-date">
                        <strong>
                          {node.kind === "scene"
                            ? formatSceneDate(node.date)
                            : formatStoryDate(node.date)}
                        </strong>
                        {node.kind === "scene" && node.scene.time && (
                          <span>{node.scene.time}</span>
                        )}
                      </div>

                      {node.kind === "scene" && (
                        <article className="tl-scene-card">
                          <span className="tl-scene-label">Scene</span>

                          <h3>{node.scene.title}</h3>

                          {node.scene.description && (
                            <p className="tl-description">
                              {node.scene.description}
                            </p>
                          )}

                          {linkedEvent && (
                            <p className="tl-related">
                              Related event ·{" "}
                              <span
                                style={{
                                  color: eventColors.get(linkedEvent.id),
                                }}
                              >
                                {linkedEvent.title}
                              </span>
                            </p>
                          )}

                          <EntryMetadata
                            entry={node.scene}
                            date={node.date}
                            project={project}
                            character={character}
                          />
                        </article>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}