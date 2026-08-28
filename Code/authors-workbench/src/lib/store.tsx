import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createProject as createProjectRecord, makeChapter } from "./domain";
import type { Chapter, WritingProject } from "./domain";

// Shape of things the app can do through useWorkbench().
interface WorkbenchStoreValue {
  projects: WritingProject[];
  // The project currently open, or null when on the projects overview.
  activeProject: WritingProject | null; 
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void; 
  createProject: (input: { title: string; targetWordCount: number }) => WritingProject;
  deleteProject: (id: string) => void;
  updateProject: (id: string, updater: (project: WritingProject) => WritingProject) => void;
  addChapter: (projectId: string) => void;
  updateChapter: (projectId: string, chapterId: string, patch: Partial<Chapter>) => void;
  removeChapter: (projectId: string, chapterId: string) => void;
  moveChapter: (projectId: string, chapterId: string, direction: -1 | 1) => void; // -1 = up, 1 = down
}


const WorkbenchStore = createContext<WorkbenchStoreValue | null>(null);

// Holds all states in memory
export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<WritingProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Get the project matches the active id.
  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  // Creates a project, adds it to the top of the list and opens it immediately.
  const createProject: WorkbenchStoreValue["createProject"] = ({ title, targetWordCount }) => {
    const project = createProjectRecord({ title, targetWordCount });
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

  // Subcomponents will not re-render though this provider did unless the actual state changed.
  const value = useMemo<WorkbenchStoreValue>(
    () => ({
      projects,
      activeProject,
      activeProjectId,
      setActiveProjectId,
      createProject,
      deleteProject,
      updateProject,
      addChapter,
      updateChapter,
      removeChapter,
      moveChapter,
    }),
    [projects, activeProject, activeProjectId]
  );

  return <WorkbenchStore.Provider value={value}>{children}</WorkbenchStore.Provider>;
}

// Throws error early if used outside the provider.
export function useWorkbench() {
  const value = useContext(WorkbenchStore);
  if (!value) throw new Error("useWorkbench must be used inside WorkbenchProvider");
  return value;
}
