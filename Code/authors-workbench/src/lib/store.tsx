import { createContext, useContext, useMemo, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { createProject as createProjectRecord, makeChapter, makeCharacter, makeStoryEvent, makeStoryScene, makeLocation } from "./domain";
import type { Chapter, WritingProject, Character, StoryEvent, StoryScene, StoryDate, Location } from "./domain";
import type { StoryStructureId, StoryStructureTemplate, } from "../features/story-structure/storyStructureTemplate";
import { STORES, getAll } from "./db";
import { useCollectionSync } from "./useCollectionSync";
import { mergeById } from "./backup";
import type { BackupFile, ImportMode } from "./backup";

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
  | "profile"
  | "settings"
  | "help";


// "loading"     -> still reading from IndexedDB
// "ready"       -> data loaded, every change is saved automatically
// "unavailable" -> IndexedDB can't be used, the app works but nothing is saved
export type PersistenceStatus = "loading" | "ready" | "unavailable";

// Shape of things the app can do through useWorkbench().
interface WorkbenchStoreValue {
  persistenceStatus: PersistenceStatus;
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
  updateChapter: (projectId: string, chapterId: string, patch: Partial<Chapter>, silent?: boolean) => void;
  removeChapter: (projectId: string, chapterId: string) => void;
  moveChapter: (projectId: string, chapterId: string, direction: -1 | 1) => void; // -1 = up, 1 = down

  // Character operations
  addCharacter: (projectId: string, input: { firstName: string; lastName?: string; middleName?: string; birthday: StoryDate; description?: string; location?: string; role?: string[]; gender?: string }) => Character;
  updateCharacter: (projectId: string, characterId: string, patch: Partial<Character>) => void;
  removeCharacter: (projectId: string, characterId: string) => void;

  // Story event operations
  addStoryEvent: (
    projectId: string,
    input: {
      chapterIds: string[];
      title: string;
      description?: string;
      startDate: StoryDate;
      endDate: StoryDate;
      locationId?: string;
      characterIds?: string[];
      isStoryBeat: boolean;
      storyBeatId?: string;
      storyBeatName?: string;
    }
  ) => StoryEvent;

  updateStoryEvent: (
    projectId: string,
    eventId: string,
    patch: Partial<StoryEvent>,
    silent?: boolean
  ) => void;

  removeStoryEvent: (
    projectId: string,
    eventId: string
  ) => void;

  // Story Scene operations
  addStoryScene: (
    projectId: string,
    input: {
      title: string;
      description?: string;
      date: StoryDate;
      eventId?: string;
      chapterIds: string[];
      characterIds?: string[];
      locationId?: string;
    }
  ) => StoryScene;

  updateStoryScene: (
    projectId: string,
    sceneId: string,
    patch: Partial<StoryScene>,
    silent?: boolean
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

  // Restore data from a (already parsed and validated) backup file.
  importBackup: (backup: BackupFile, mode: ImportMode) => void;
}
const WorkbenchStore = createContext<WorkbenchStoreValue | null>(null);

// Holds all states in memory and mirrors projects + custom structures to IndexedDB.export function WorkbenchProvider({ children }: { children: ReactNode }) {
export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<WritingProject[]>([]);

  const [customStoryStructures, setCustomStoryStructures] = useState<StoryStructureTemplate[]>([]);

  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>("loading");
  // Load everything saved from last time once, when the app starts.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [savedProjects, savedStructures] = await Promise.all([
          getAll<WritingProject>(STORES.projects),
          getAll<StoryStructureTemplate>(STORES.customStructures),
        ]);
        if (cancelled) return;

        // IndexedDB returns records ordered by id.
        setProjects(savedProjects.sort((a, b) => b.createdAt - a.createdAt));
        setCustomStoryStructures(savedStructures.sort((a, b) => a.id.localeCompare(b.id)));
        setPersistenceStatus("ready");
      } catch (error) {
        console.error("[db] Could not open IndexedDB, changes will not be saved:", error);
        if (!cancelled) setPersistenceStatus("unavailable");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-save: write changed records whenever the data changes.
  // Only active once loading has finished successfully.
  const persistenceReady = persistenceStatus === "ready";
  const markPersistenceFailed = () => setPersistenceStatus("unavailable");
  useCollectionSync(STORES.projects, projects, persistenceReady, markPersistenceFailed);
  useCollectionSync(STORES.customStructures, customStoryStructures, persistenceReady, markPersistenceFailed);

  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<WorkbenchView>("projects");

  // Get the project matches the active id.
  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  // Sets the active project and its last opening date 
  // to ensure overview page can show the most recently opened project.
  const setActiveProjectId = (id: string | null) => {
    setActiveProjectIdState(id);
    if (id) {
      setProjects((list) =>
        list.map((p) => (p.id === id ? { ...p, lastOpenedAt: Date.now() } : p))
      );
    }
  };


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
    setActiveProjectIdState((current) => (current === id ? null : current));
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
      const chapters = [...(project.chapters || []), makeChapter((project.chapters || []).length, (project.chapters || []).length + 1)];
      // Evenly split the project total word target across every chapter.
      const perChapter = project.targetWordCount > 0 ? Math.round(project.targetWordCount / chapters.length) : 0;
      return { ...project, chapters: chapters.map((c) => ({ ...c, targetWordCount: perChapter })) };
    });
  };

  // Patches one chapter's fields.
  const updateChapter = (projectId: string, chapterId: string, patch: Partial<Chapter>, silent?: boolean) => {
    updateProject(projectId, (project) => ({
      ...project,
      chapters: (project.chapters || []).map((c) =>
        c.id === chapterId
          ? { ...c, ...patch, ...(silent ? {} : { updatedAt: Date.now() }) }
          : c
      ),
    }));
  };

  // Deletes a chapter and reorder the rest.
  const removeChapter = (projectId: string, chapterId: string) => {
    updateProject(projectId, (project) => {
      const chapters = (project.chapters || []).filter((c) => c.id !== chapterId);
      const perChapter =
        project.targetWordCount > 0 && chapters.length > 0
          ? Math.round(project.targetWordCount / chapters.length)
          : 0;
      return {
        ...project,
        chapters: chapters.map((c, i) => ({ ...c, order: i, targetWordCount: perChapter })),
      };
    });
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
    const character = makeCharacter(input);
    updateProject(projectId, (project) => ({
      ...project,
      characters: [...(project.characters || []), character],
    }));
    return character;
  };

  // Patches one character's fields.
  const updateCharacter: WorkbenchStoreValue["updateCharacter"] = (projectId, characterId, patch) => {
    updateProject(projectId, (project) => ({
      ...project,
      characters: (project.characters || []).map((c) =>
        c.id === characterId ? { ...c, ...patch, updatedAt: Date.now() } : c
      ),
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
    const ev = makeStoryEvent(input);
    updateProject(projectId, (project) => ({
      ...project,
      events: [...(project.events || []), ev],
    }));
    return ev;
  };

  // Patches one story event's fields.
  const updateStoryEvent: WorkbenchStoreValue["updateStoryEvent"] = (projectId, eventId, patch, silent) => {
    updateProject(projectId, (project) => ({
      ...project,
      events: (project.events || []).map((e) =>
        e.id === eventId
          ? { ...e, ...patch, ...(silent ? {} : { updatedAt: Date.now() }) }
          : e
      ),
    }));
  };

  // Removes a story event from the project.
  const removeStoryEvent: WorkbenchStoreValue["removeStoryEvent"] = (projectId, eventId) => {
    updateProject(projectId, (project) => ({
      ...project,
      events: (project.events || []).filter((e) => e.id !== eventId),
    }));
  };

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
    patch,
    silent
  ) => {
    updateProject(projectId, (project) => ({
      ...project,
      scenes: (project.scenes || []).map((scene) =>
        scene.id === sceneId
          ? { ...scene, ...patch, ...(silent ? {} : { updatedAt: Date.now() }) }
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
            updatedAt: Date.now(),
          }
          : l
      ),
    }));
  };

  // Restores a backup with only React state is touched. useCollectionSync notices the
  // change and writes/deletes the matching IndexedDB records on its own.
  const importBackup: WorkbenchStoreValue["importBackup"] = (backup, mode) => {
    const { projects: incomingProjects, customStructures: incomingStructures } = backup.data;

    // Same ordering the app uses when it loads from IndexedDB.
    const newestFirst = (list: WritingProject[]) =>
      [...list].sort((a, b) => b.createdAt - a.createdAt);
    const byId = (list: StoryStructureTemplate[]) =>
      [...list].sort((a, b) => a.id.localeCompare(b.id));

    if (mode === "replace") {
      // The backup becomes the whole workbench. Records that are not in it get deleted.
      setProjects(newestFirst(incomingProjects));
      setCustomStoryStructures(byId(incomingStructures));
      // The open project may no longer exist, so go back to the projects list.
      setActiveProjectIdState(null);
      setActiveView("projects");
      return;
    }

    // The backup's version is prior when there are same ids, and everything else is kept.
    setProjects((list) => newestFirst(mergeById(list, incomingProjects)));
    setCustomStoryStructures((list) => byId(mergeById(list, incomingStructures)));
  };

  const value = useMemo<WorkbenchStoreValue>(
    () => ({
      persistenceStatus,
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

      // Backup
      importBackup,
    }),
    [
      persistenceStatus,
      projects,
      activeProject,
      activeProjectId,
      activeView,
      customStoryStructures,
    ]
  );

  // Wait for the saved data before rendering, otherwise the UI would flash
  // "No projects yet" for a moment even though projects exist.
  if (persistenceStatus === "loading") {
    return <div className="app-loading" role="status">Loading your workbench…</div>;
  }

  return <WorkbenchStore.Provider value={value}>{children}</WorkbenchStore.Provider>;
}

// Throws error early if used outside the provider.
export function useWorkbench() {
  const value = useContext(WorkbenchStore);
  if (!value) throw new Error("useWorkbench must be used inside WorkbenchProvider");
  return value;
}
