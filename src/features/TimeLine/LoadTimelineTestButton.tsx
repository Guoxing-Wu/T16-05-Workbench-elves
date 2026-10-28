import { ToolButton } from "../../components/primitives";
import { useWorkbench } from "../../lib/store";
import {
  makeCharacter,
  makeLocation,
  makeStoryEvent,
  makeStoryScene,
} from "../../lib/domain";
import type { WritingProject } from "../../lib/domain";

export function LoadTimelineTestButton({
  storyStructure,
}: {
  storyStructure: WritingProject["storyStructure"];
}) {
  const {
    createProject,
    updateProject,
    setActiveView,
  } = useWorkbench();

  function loadTestProject() {
    // Creates a separate project with two generated chapters.
    const project = createProject({
      title: "Timeline Test Project",
      targetWordCount: 6000,
      averageChapterLength: 3000,
      storyStructure,
    });

    const chapterOne = project.chapters[0];
    const chapterTwo = project.chapters[1];

    const mara = makeCharacter({
      firstName: "Mara",
      birthday: { year: 1869, month: 5, day: 10 },
      description: "Main character",
    });

    const harbor = makeLocation({
      name: "Harbor",
      description: "The city harbor",
    });

    const storm = makeStoryEvent({
      title: "The Storm",
      description: "A storm closes the harbor.",
      startDate: { year: 1893, month: 3, day: 14 },
      endDate: { year: 1893, month: 3, day: 16 },
      chapterIds: [chapterOne.id],
      characterIds: [mara.id],
      locationId: harbor.id,
      isStoryBeat: false,
    });

    const investigation = makeStoryEvent({
      title: "The Investigation",
      description: "Mara investigates the missing charts.",
      startDate: { year: 1893, month: 3, day: 15 },
      endDate: { year: 1893, month: 3, day: 22 },
      chapterIds: [chapterOne.id, chapterTwo.id],
      characterIds: [mara.id],
      isStoryBeat: false,
    });

    const sameDayEvent = makeStoryEvent({
      title: "The Meeting",
      description: "A meeting that starts and ends on the same day.",
      startDate: { year: 1893, month: 3, day: 20 },
      endDate: { year: 1893, month: 3, day: 20 },
      chapterIds: [chapterTwo.id],
      isStoryBeat: false,
    });

    const dawn = {
      ...makeStoryScene({
        title: "The Harbor at Dawn",
        description: "Mara discovers her father's unfinished chart.",
        date: { year: 1893, month: 3, day: 14 },
        chapterIds: [chapterOne.id],
        eventId: storm.id,
        characterIds: [mara.id],
        locationId: harbor.id,
      }),
      time: "06:00",
    };

    const letter = {
      ...makeStoryScene({
        title: "A Letter Unsent",
        description: "A letter reveals a clue during both events.",
        date: { year: 1893, month: 3, day: 15 },
        chapterIds: [chapterOne.id],
        eventId: storm.id,
      }),
      time: "21:00",
    };

    const mapRoom = {
      ...makeStoryScene({
        title: "The Map Room",
        description: "Mara searches the restricted charts.",
        date: { year: 1893, month: 3, day: 20 },
        chapterIds: [chapterTwo.id],
        eventId: investigation.id,
        characterIds: [mara.id],
      }),
      time: "10:00",
    };

    const noTime = makeStoryScene({
      title: "An Undated Hour",
      description: "This scene has a date but no selected time.",
      date: { year: 1893, month: 3, day: 20 },
      chapterIds: [chapterTwo.id],
    });

    const aprilScene = {
      ...makeStoryScene({
        title: "A New Beginning",
        description: "A scene outside all event ranges.",
        date: { year: 1893, month: 4, day: 2 },
        chapterIds: [chapterTwo.id],
      }),
      time: "08:30",
    };

    // All records are built before updating state.
    // Existing projects are preserved.
    updateProject(project.id, (current) => ({
      ...current,
      chapters: current.chapters.map((chapter, index) => ({
        ...chapter,
        title: index === 0 ? "Chapter One" : "Chapter Two",
      })),
      characters: [mara],
      locations: [harbor],
      events: [storm, investigation, sameDayEvent],

      // Intentionally unsorted to check Timeline's sorting.
      scenes: [aprilScene, noTime, letter, mapRoom, dawn],
    }));

    setActiveView("timeline");
  }

  return (
    <ToolButton onClick={loadTestProject}>
      Load test project
    </ToolButton>
  );
}