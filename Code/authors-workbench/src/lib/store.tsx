import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createProject as createProjectRecord, makeChapter, makeCharacter, makeStoryEvent } from "./domain";
import type { Chapter, WritingProject, Character, StoryEvent, StoryDate } from "./domain";
import type { StoryStructureId } from "../features/story-structure/storyStructureTemplate";

//左边导航栏的内容
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
  addCharacter: (projectId: string, input: { name: string; birthday: StoryDate; description?: string; location: string }) => void;
  updateCharacter: (projectId: string, characterId: string, patch: Partial<Character>) => void;
  removeCharacter: (projectId: string, characterId: string) => void;

  // Story event operations
  addStoryEvent: (projectId: string, input: { chapterId: string; title: string; description?: string; eventDate: StoryDate; location: string; characterIds?: string[] }) => void;
  updateStoryEvent: (projectId: string, eventId: string, patch: Partial<StoryEvent>) => void;
  removeStoryEvent: (projectId: string, eventId: string) => void;

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

  // Subcomponents will not re-render though this provider did unless the actual state changed.
  const value = useMemo<WorkbenchStoreValue>(
    () => ({
      projects,
      activeProject,
      activeProjectId,
      setActiveProjectId,
      activeView,
      setActiveView,
      createProject,
      deleteProject,
      updateProject,
      addChapter,
      updateChapter,
      removeChapter,
      moveChapter,
      addCharacter,
      updateCharacter,
      removeCharacter,
      addStoryEvent,
      updateStoryEvent,
      removeStoryEvent,
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
