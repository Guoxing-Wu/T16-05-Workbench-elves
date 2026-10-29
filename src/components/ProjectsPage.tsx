import { useState } from "react";
import type { FormEvent } from "react";
import { ChevronRight, FolderOpen, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { EmptyState, Field, Modal, PageHeader, ToolButton } from "./primitives";
import { useWorkbench } from "../lib/store";
import { makeChapter, wordsWritten } from "../lib/domain";
import type { WritingProject } from "../lib/domain";
import { getProjectedChapterCount } from "../features/story-structure/storyChapterMapping";

import {
  DEFAULT_STORY_STRUCTURE_ID,
  STORY_STRUCTURE_OPTIONS,
} from "../features/story-structure/storyStructureTemplate";

import type { StoryStructureId } from "../features/story-structure/storyStructureTemplate";

// "New project" modal with title, target word count, average chapter length and story structure.
function ProjectForm({
  initial,
  onClose,
  onCreated,
}: {
  initial?: WritingProject;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { createProject, updateProject, customStoryStructures } = useWorkbench();

  const [title, setTitle] = useState(
    initial?.title ?? "Untitled Story"
  );

  const [targetWordCount, setTargetWordCount] = useState<number | "">(
    initial?.targetWordCount ?? ""
  );

  const [averageChapterLength, setAverageChapterLength] = useState<
    number | ""
  >(initial?.averageChapterLength ?? "");

  const [storyStructure, setStoryStructure] =
    useState<StoryStructureId>(
      initial?.storyStructure ?? DEFAULT_STORY_STRUCTURE_ID
    );

  const canCreate =
    title.trim().length > 0 &&
    typeof targetWordCount === "number" &&
    targetWordCount > 0 &&
    typeof averageChapterLength === "number" &&
    averageChapterLength > 0;

  // Estimate how many chapters the plan will have.
  const wordCount =
    typeof targetWordCount === "number" ? targetWordCount : 0;

  const chapterLength =
    typeof averageChapterLength === "number"
      ? averageChapterLength
      : 0;

  const estimatedChapters = getProjectedChapterCount(
    wordCount,
    chapterLength
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (!canCreate) return;

    const input = {
      title: title.trim(),
      targetWordCount:
        typeof targetWordCount === "number"
          ? targetWordCount
          : 0,
      averageChapterLength:
        typeof averageChapterLength === "number"
          ? averageChapterLength
          : 0,
      storyStructure,
    };

    if (initial) {
       // Recalculate the required chapter count based on the updated target words and average chapter length.
      const nextChapterCount = getProjectedChapterCount(
        input.targetWordCount,
        input.averageChapterLength
      );

      const currentChapterCount = initial.chapters?.length ?? 0;

      if (
        nextChapterCount < currentChapterCount &&
        !window.confirm(
          `This change will reduce the plan from ${currentChapterCount} to ${nextChapterCount} chapters. Extra chapters and their chapter links will be removed. Continue?`
        )
      ) {
        return;
      }

      updateProject(initial.id, (project) => {
        const previousChapters = project.chapters ?? [];

        const chapters = Array.from(
          { length: nextChapterCount },
          (_, index) => {
            const existing = previousChapters[index];

            return {
              ...(existing ?? makeChapter(index, index + 1)),
              order: index,
              targetWordCount: input.averageChapterLength,
            };
          }
        );

        const retainedChapterIds = new Set(
          chapters.map((chapter) => chapter.id)
        );

        return {
          ...project,
          title: input.title,
          targetWordCount: input.targetWordCount,
          averageChapterLength: input.averageChapterLength,
          storyStructure: input.storyStructure,
          chapters,

          // Keep event and scene consistent with the updated chapter plan.
          events: (project.events ?? []).map((storyEvent) => ({
            ...storyEvent,
            chapterIds: storyEvent.chapterIds.filter((id) =>
              retainedChapterIds.has(id)
            ),
          })),

          scenes: (project.scenes ?? []).map((scene) => ({
            ...scene,
            chapterIds: scene.chapterIds.filter((id) =>
              retainedChapterIds.has(id)
            ),
          })),
        };
      });
    } else {
      createProject(input);
    }

    onCreated();
  };

  return (
    <Modal
      title={
        initial
          ? "Edit writing project"
          : "Create a writing project"
      }
      onClose={onClose}
    >
      <form className="workbench-form" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Project title" full>
            <input
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Untitled Story"
              required
              autoFocus
            />
          </Field>

          <Field label="Target word count">
            <input
              type="number"
              min={1}
              value={targetWordCount}
              onChange={(event) =>
                setTargetWordCount(
                  event.target.value === ""
                    ? ""
                    : Number(event.target.value)
                )
              }
              placeholder="0"
              required
            />
          </Field>

          <Field label="Average chapter length">
            <input
              type="number"
              min={1}
              value={averageChapterLength}
              onChange={(event) =>
                setAverageChapterLength(
                  event.target.value === ""
                    ? ""
                    : Number(event.target.value)
                )
              }
              placeholder="0"
              required
            />
          </Field>

          <Field label="Story structure" full>
            <select
              value={storyStructure}
              onChange={(event) =>
                setStoryStructure(
                  event.target.value as StoryStructureId
                )
              }
            >
              <optgroup label="Built-in Structures">
                {STORY_STRUCTURE_OPTIONS.map((option) => (
                  <option
                    key={option.id}
                    value={option.id}
                  >
                    {option.name}
                  </option>
                ))}
              </optgroup>

              {customStoryStructures.length > 0 && (
                <optgroup label="Custom Structures">
                  {customStoryStructures.map((structure) => (
                    <option
                      key={structure.id}
                      value={structure.id}
                    >
                      {structure.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </Field>
        </div>

        {/* Dynamic hint: estimated chapter count based on total words and average chapter length */}
        <div className="form-hint">
          <span className="form-hint-icon">📓</span>
          <p>
            This plan will contain approximately{" "}
            <strong>{estimatedChapters} chapters</strong>.
            Act boundaries and story beats are mapped
            automatically.
          </p>
        </div>

        <div className="modal-actions">
          <ToolButton onClick={onClose}>
            Cancel
          </ToolButton>

          <ToolButton
            primary
            type="submit"
            disabled={!canCreate}
          >
            {initial ? (
              <Save size={15} />
            ) : (
              <Plus size={15} />
            )}{" "}
            {initial
              ? "Save changes"
              : "Create project"}
          </ToolButton>
        </div>
      </form>
    </Modal>
  );
}

// The projects overview shows every project as a card.
export function ProjectsPage({ onOpen }: { onOpen: (id: string) => void }) {
  const { projects, deleteProject, activeProjectId } = useWorkbench();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Confirm before delete one project while there is no undo once a project is deleted.
  const remove = (id: string, title: string) => {
    if (window.confirm(`Delete “${title}”? This removes it from this session.`)) deleteProject(id);
  };

  return (
    <div className="page-stack core-page">
      <PageHeader
        title="Projects"
        count={`${projects.length} saved ${projects.length === 1 ? "project" : "projects"}`}
      >
        <ToolButton primary onClick={() => setCreating(true)}>
          <Plus size={15} /> New project
        </ToolButton>
      </PageHeader>

      {/* Empty states and populated states never render at the same time. */}
      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          copy="Create a writing project to start planning chapters and tracking your word count."
          action={
            <ToolButton primary onClick={() => setCreating(true)}>
              <Plus size={15} /> New project
            </ToolButton>
          }
        />
      ) : (
        <section className="project-grid">
          {projects.map((project) => {
            const written = wordsWritten(project);
            return (
              <article key={project.id}
                className={`project-card ${project.id === activeProjectId ? "active" : ""}`}
              >
                <div className="project-card-icon">
                  <FolderOpen size={22} />
                </div>
                <span>{project.id === activeProjectId ? "CURRENT PROJECT" : ""}</span>
                <h2>{project.title}</h2>
                <p>
                  {written.toLocaleString()} of {(project.targetWordCount || 0).toLocaleString()} words written
                </p>
                <div className="project-card-stats">
                  <span>
                    <strong>{(project.targetWordCount || 0).toLocaleString()}</strong> target words
                  </span>
                  <span>
                    <strong>{(project.chapters || []).length}</strong> chapters
                  </span>
                </div>
                <footer>
                  <button className="section-link" onClick={() => onOpen(project.id)}>
                    Open project <ChevronRight size={14} />
                  </button>
                  <div className="project-card-actions">
                    <button
                      className="icon-button edit-icon"
                      onClick={() => setEditingId(project.id)}
                      aria-label={`Edit ${project.title}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button delete-icon"
                      onClick={() => remove(project.id, project.title)}
                      aria-label={`Delete ${project.title}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </footer>
              </article>
            );
          })}
        </section>
      )}

      {creating && (
        <ProjectForm onClose={() => setCreating(false)} onCreated={() => setCreating(false)} />
      )}
      {editingId && (
        <ProjectForm
          initial={projects.find((p) => p.id === editingId) ?? undefined}
          onClose={() => setEditingId(null)}
          onCreated={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
