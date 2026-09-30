import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
<<<<<<< HEAD
import { createProject as createProjectRecord, makeChapter, makeCharacter, makeStoryEvent } from "./domain";
import type { Chapter, WritingProject, Character, StoryEvent, StoryDate } from "./domain";
import type { StoryStructureId } from "../features/story-structure/storyStructureTemplate";
=======
import { createProject as createProjectRecord, makeChapter, makeCharacter, makeStoryEvent, makeStoryScene, makeLocation } from "./domain";
import type { Chapter, WritingProject, Character, StoryEvent, StoryScene, StoryDate, Location } from "./domain";
import type { StoryStructureId, StoryStructureTemplate,} from "../features/story-structure/storyStructureTemplate";
>>>>>>> f9f6cdd (feat: Implement story event date, adjusted UI)

//left 
export type WorkbenchView =
  | "projects"
  | "overview"
  | "storyStructure"
  | "chapterPlan"
  | "characters"
  | "locations"
  | "events"
  | "timeline"
  | "settings"
  | "help";

// Shape of things the app can do through useWorkbench().
interface WorkbenchStoreValue {
  projects: WritingProject[];
  // The project currently open, or null when on the projects overview.
  activeProject: WritingProject | null;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  activeView: WorkbenchView;
  setActiveView: (view: WorkbenchView) => void;
  createProject: (input: {
    title: string; targetWordCount: number; averageChapterLength: number;
    storyStructure: StoryStructureId;
  }) => WritingProject;
  deleteProject: (id: string) => void;
  updateProject: (id: string, updater: (project: WritingProject) => WritingProject) => void;
  addChapter: (projectId: string) => void;
  updateChapter: (projectId: string, chapterId: string, patch: Partial<Chapter>) => void;
  removeChapter: (projectId: string, chapterId: string) => void;
  moveChapter: (projectId: string, chapterId: string, direction: -1 | 1) => void; // -1 = up, 1 = down

  // Character operations
  addCharacter: (projectId: string, input: { firstName: string; lastName?: string; middleName?: string; birthday: StoryDate; description?: string; location?: string ; role?: string; gender?: string }) => void;
  updateCharacter: (projectId: string, characterId: string, patch: Partial<Character>) => void;
  removeCharacter: (projectId: string, characterId: string) => void;

  // Story event operations
<<<<<<< HEAD
  addStoryEvent: (projectId: string, input: { chapterIds: string[]; title: string; description?: string; eventDate: StoryDate; location: string; characterIds?: string[];isStoryBeat: boolean;storyBeatId?: string;storyBeatName?: string; }) => void;
  updateStoryEvent: (projectId: string, eventId: string, patch: Partial<StoryEvent>) => void;
  removeStoryEvent: (projectId: string, eventId: string) => void;

=======
  addStoryEvent: (projectId: string, input: { chapterIds: string[]; title: string; description?: string; startDate: StoryDate; endDate: StoryDate; locationId?: string; characterIds?: string[];isStoryBeat: boolean;storyBeatId?: string;storyBeatName?: string; }) => StoryEvent;
  updateStoryEvent: (projectId: string, eventId: string, patch: Partial<StoryEvent>) => void;
  removeStoryEvent: (projectId: string, eventId: string) => void;

  // Story Scene operations
  addStoryScene: (projectId: string, input: { title: string; description?: string; date: StoryDate; eventId?: string; chapterIds: string[]; characterIds?: string[], locationId?: string;}) => StoryScene;

  updateStoryScene: (
    projectId: string,
    sceneId: string,
    patch: Partial<StoryScene>
  ) => void;

  removeStoryScene: (
    projectId: string,
    sceneId: string
  ) => void;
  // Global custom story structure templates
  customStoryStructures: StoryStructureTemplate[];

  // Story structure operations
  addCustomStoryStructure: (
    structure: StoryStructureTemplate
  ) => void;

  updateCustomStoryStructure: (
    structureId: string,
    update: (
      structure: StoryStructureTemplate
    ) => StoryStructureTemplate
  ) => void;

  deleteCustomStoryStructure: (
    structureId: string
  ) => void;

  // Location operations
  addLocation: (
    projectId: string,
    input: { name: string; description?: string }
  ) => Location;

  removeLocation: (
    projectId: string,
    locationId: string
  ) => void;

  updateLocation: (
    projectId: string,
    locationId: string,
    input: { name: string; description?: string }
  ) => void;
>>>>>>> f9f6cdd (feat: Implement story event date, adjusted UI)
}


const WorkbenchStore = createContext<WorkbenchStoreValue | null>(null);

// Holds all states in memory
export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<WritingProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<WorkbenchView>("projects");

  // Get the project matches the active id.
  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  // Creates a project, adds it to the top of the list and opens it immediately.
  const createProject: WorkbenchStoreValue["createProject"] = ({
    title,
    targetWordCount,
    averageChapterLength,
    storyStructure,
  }) => {
    const project = createProjectRecord({ title, targetWordCount, averageChapterLength, storyStructure });
    setProjects((list) => [project, ...list]);
    setActiveProjectId(project.id);
    return project;
  };


  // Removes a project, go back to the projects overview if the project was opening.
  const deleteProject = (id: string) => {
    setProjects((list) => list.filter((p) => p.id !== id));
    setActiveProjectId((current) => (current === id ? null : current));
  };

  // Find the project by id, update it and set date of update.
  const updateProject: WorkbenchStoreValue["updateProject"] = (id, updater) => {
    setProjects((list) =>
      list.map((p) => (p.id === id ? { ...updater(p), updatedAt: Date.now() } : p))
    );
  };

  // Appends a new blank chapter to the end of the manuscript.
  const addChapter = (projectId: string) => {
    updateProject(projectId, (project) => {
      const chapters = project.chapters || [];
      return { ...project, chapters: [...chapters, makeChapter(chapters.length, chapters.length + 1)] };
    });
  };

  // Patches one chapter's fields.
  const updateChapter = (projectId: string, chapterId: string, patch: Partial<Chapter>) => {
    updateProject(projectId, (project) => ({
      ...project,
      chapters: (project.chapters || []).map((c) => (c.id === chapterId ? { ...c, ...patch } : c)),
    }));
  };

  // Deletes a chapter and reorder the rest.
  const removeChapter = (projectId: string, chapterId: string) => {
    updateProject(projectId, (project) => ({
      ...project,
      chapters: (project.chapters || [])
        .filter((c) => c.id !== chapterId)
        .map((c, i) => ({ ...c, order: i })),
    }));
  };

  // Swaps a chapter with its neighbour if it is not beyond the end of the list.
  const moveChapter = (projectId: string, chapterId: string, direction: -1 | 1) => {
    updateProject(projectId, (project) => {
      const chapters = project.chapters || [];
      const idx = chapters.findIndex((c) => c.id === chapterId);
      const target = idx + direction;
      if (idx === -1 || target < 0 || target >= chapters.length) return project;
      const next = [...chapters];
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...project, chapters: next.map((c, i) => ({ ...c, order: i })) };
    });
  };
  // Adds a new character to the project.
  const addCharacter: WorkbenchStoreValue["addCharacter"] = (projectId, input) => {
    updateProject(projectId, (project) => ({
      ...project,
      characters: [...(project.characters || []), makeCharacter(input)],
    }));
  };

  // Patches one character's fields.
  const updateCharacter: WorkbenchStoreValue["updateCharacter"] = (projectId, characterId, patch) => {
    updateProject(projectId, (project) => ({
      ...project,
      characters: (project.characters || []).map((c) => (c.id === characterId ? { ...c, ...patch } : c)),
    }));
  };

  // Removes a character from the project.
  const removeCharacter: WorkbenchStoreValue["removeCharacter"] = (projectId, characterId) => {
    updateProject(projectId, (project) => ({
      ...project,
      characters: (project.characters || []).filter((c) => c.id !== characterId),
    }));
  };

  // Adds a new story event to the project.
  const addStoryEvent: WorkbenchStoreValue["addStoryEvent"] = (projectId, input) => {
    updateProject(projectId, (project) => ({
      ...project,
      events: [...(project.events || []), makeStoryEvent(input)],
    }));
  };

  // Patches one story event's fields.
  const updateStoryEvent: WorkbenchStoreValue["updateStoryEvent"] = (projectId, eventId, patch) => {
    updateProject(projectId, (project) => ({
      ...project,
      events: (project.events || []).map((e) => (e.id === eventId ? { ...e, ...patch } : e)),
    }));
  };

  // Removes a story event from the project.
  const removeStoryEvent: WorkbenchStoreValue["removeStoryEvent"] = (projectId, eventId) => {
    updateProject(projectId, (project) => ({
      ...project,
      events: (project.events || []).filter((e) => e.id !== eventId),
    }));
  };

<<<<<<< HEAD
  // Subcomponents will not re-render though this provider did unless the actual state changed.
=======
  // Add a story Scene
  const addStoryScene: WorkbenchStoreValue["addStoryScene"] = (
    projectId,
    input
  ) => {
    const scene = makeStoryScene(input);

    updateProject(projectId, (project) => ({
      ...project,
      scenes: [...(project.scenes || []), scene],
    }));

    return scene;
  };

  // Update(edit) a story scene
  const updateStoryScene: WorkbenchStoreValue["updateStoryScene"] = (
    projectId,
    sceneId,
    patch
  ) => {
    updateProject(projectId, (project) => ({
      ...project,
      scenes: (project.scenes || []).map((scene) =>
        scene.id === sceneId
          ? { ...scene, ...patch }
          : scene
      ),
    }));
  };

  // Remove a story scene
  const removeStoryScene: WorkbenchStoreValue["removeStoryScene"] = (
    projectId,
    sceneId
  ) => {
    updateProject(projectId, (project) => ({
      ...project,
      scenes: (project.scenes || []).filter(
        (scene) => scene.id !== sceneId
      ),
    }));
  };

  // Create a custom story structure
  const addCustomStoryStructure = (
    structure: StoryStructureTemplate
  ) => {
    setCustomStoryStructures((list) => [
      ...list,
      structure,
    ]);
  };

  // Update a custom story structure
  const updateCustomStoryStructure = (
    structureId: string,
    update: (
      structure: StoryStructureTemplate
    ) => StoryStructureTemplate
  ) => {
    setCustomStoryStructures((list) =>
      list.map((structure) =>
        structure.id === structureId
          ? update(structure)
          : structure
      )
    );
  };

  // Delete a custom Story Structure
  const deleteCustomStoryStructure = (
    structureId: string
  ) => {
    setCustomStoryStructures((list) =>
      list.filter(
        (structure) => structure.id !== structureId
      )
    );
  };

  // Adds a new location to the project and returns it, so callers can
  // immediately link the fresh id to a story event.
  const addLocation: WorkbenchStoreValue["addLocation"] = (
    projectId,
    input
  ) => {
    const location = makeLocation(input);
    updateProject(projectId, (project) => ({
      ...project,
      locations: [...(project.locations || []), location],
    }));
    return location;
  };

  // Removes a location and clears the reference on events that used it.
  const removeLocation: WorkbenchStoreValue["removeLocation"] = (
    projectId,
    locationId
  ) => {
    updateProject(projectId, (project) => ({
      ...project,
      locations: (project.locations || []).filter(
        (l) => l.id !== locationId
      ),
      events: (project.events || []).map((e) =>
        e.locationId === locationId
          ? { ...e, locationId: undefined }
          : e
      ),
    }));
  };

  // Updates the name/description of an existing location.
  const updateLocation: WorkbenchStoreValue["updateLocation"] = (
    projectId,
    locationId,
    input
  ) => {
    updateProject(projectId, (project) => ({
      ...project,
      locations: (project.locations || []).map((l) =>
        l.id === locationId
          ? {
              ...l,
              name: input.name.trim(),
              description: input.description?.trim() || "",
            }
          : l
      ),
    }));
  };
    // Subcomponents will not re-render though this provider did unless the actual state changed.
>>>>>>> f9f6cdd (feat: Implement story event date, adjusted UI)
  const value = useMemo<WorkbenchStoreValue>(
    () => ({
      // Project
      projects,
      activeProject,
      activeProjectId,
      setActiveProjectId,
      // Active View
      activeView,
      setActiveView,
      createProject,
      deleteProject,
      updateProject,
      // Chapter
      addChapter,
      updateChapter,
      removeChapter,
      moveChapter,

      // Character
      addCharacter,
      updateCharacter,
      removeCharacter,
      // Story Events
      addStoryEvent,
      updateStoryEvent,
      removeStoryEvent,
<<<<<<< HEAD
=======

      // Story Scene
      addStoryScene,
      updateStoryScene,
      removeStoryScene,

      // Custom story structures
      customStoryStructures,
      addCustomStoryStructure,
      updateCustomStoryStructure,
      deleteCustomStoryStructure,

      // Locations
      addLocation,
      removeLocation,
      updateLocation,
>>>>>>> f9f6cdd (feat: Implement story event date, adjusted UI)
    }),
    [projects, activeProject, activeProjectId, activeView]
  );

  return <WorkbenchStore.Provider value={value}>{children}</WorkbenchStore.Provider>;
}

// Throws error early if used outside the provider.
export function useWorkbench() {
  const value = useContext(WorkbenchStore);
  if (!value) throw new Error("useWorkbench must be used inside WorkbenchProvider");
  return value;
}
