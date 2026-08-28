import { useState } from "react";
import type { FormEvent } from "react";
import { ChevronRight, FolderOpen, Plus, Trash2 } from "lucide-react";
import { EmptyState, Field, Modal, PageHeader, ToolButton } from "./primitives";
import { useWorkbench } from "../lib/store";
import { wordsWritten } from "../lib/domain";

// "New project" modal that needs a title and target word count for creating a new project. 
function ProjectForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { createProject } = useWorkbench();
  const [title, setTitle] = useState("");
  // default number of words for a draft
  const [targetWordCount, setTargetWordCount] = useState(80000);
  const canCreate = title.trim().length > 0 && targetWordCount > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canCreate) return;
    createProject({ title: title.trim(), targetWordCount });
    // closes the modal after creating
    onCreated(); 
  };

  return (
    <Modal title="New project" onClose={onClose}>
      <form className="workbench-form" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Project title" full>
            <input value={title} onChange={(event) => setTitle(event.target.value)} required autoFocus />
          </Field>
          <Field label="Target word count" full>
            <input
              type="number"
              min={1}
              value={targetWordCount}
              onChange={(event) => setTargetWordCount(Number(event.target.value))}
              required
            />
          </Field>
        </div>
        <div className="modal-actions">
          <ToolButton onClick={onClose}>Cancel</ToolButton>
          <ToolButton primary type="submit" disabled={!canCreate}>
            <Plus size={15} /> Create
          </ToolButton>
        </div>
      </form>
    </Modal>
  );
}

// The projects overview shows every project as a card.
export function ProjectsPage({ onOpen }: { onOpen: (id: string) => void }) {
  const { projects, deleteProject } = useWorkbench();
  const [creating, setCreating] = useState(false);

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
              <article key={project.id} className="project-card">
                <div className="project-card-icon">
                  <FolderOpen size={22} />
                </div>
                <span>WRITING PROJECT</span>
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
                  <button
                    className="icon-button delete-icon"
                    onClick={() => remove(project.id, project.title)}
                    aria-label={`Delete ${project.title}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </footer>
              </article>
            );
          })}
        </section>
      )}

      {creating && (
        <ProjectForm onClose={() => setCreating(false)} onCreated={() => setCreating(false)} />
      )}
    </div>
  );
}
