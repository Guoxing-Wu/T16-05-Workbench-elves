import React, { useState } from "react";
import { PenLine, Plus, Trash2, ArrowLeft, ArrowUp, ArrowDown } from "lucide-react";
import { INK, PANEL, HAIRLINE, BRASS, PAPER, PAPER_DIM, sans, serif, mono } from "./lib/tokens";
import { makeProject, makeChapter } from "./lib/model";
import {
  IconButton, PrimaryButton, GhostButton, Field, TextInput, EmptyState, StatCard, Modal,
} from "./components/atoms";


function NewProject({ onCreate, onClose }) {
  const [title, setTitle] = useState("");
  const [targetWordCount, setTargetWordCount] = useState(80000);
  const canCreate = title.trim().length > 0 && targetWordCount > 0;
  return (
    <Modal onClose={onClose} width={420}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <span style={{ fontFamily: serif, fontSize: 19, color: PAPER }}>New project</span>
        <Field label="Title">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="" autoFocus />
        </Field>
        <Field label="Target word count">
          <TextInput type="number" value={targetWordCount} onChange={(e) => setTargetWordCount(Number(e.target.value))} />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton disabled={!canCreate} onClick={() => onCreate({ title: title.trim(), targetWordCount })}>Create</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

function ChapterRow({ chapter, onChange, onRemove, onMove, isFirst, isLast }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: PANEL, border: `1px solid ${HAIRLINE}`, borderRadius: 9, padding: "9px 12px" }}>
      <span style={{ fontFamily: mono, fontSize: 11, color: PAPER_DIM, width: 22 }}>#{chapter.order + 1}</span>
      <input
        value={chapter.title} onChange={(e) => onChange({ ...chapter, title: e.target.value })}
        style={{ background: "transparent", border: "none", outline: "none", color: PAPER, fontFamily: sans, fontSize: 13.5, flex: 1, minWidth: 0 }}
      />
      <Field label="Target">
        <TextInput
          type="number" style={{ width: 90, padding: "5px 8px", fontSize: 12 }}
          value={chapter.targetWordCount} onChange={(e) => onChange({ ...chapter, targetWordCount: Number(e.target.value) })}
        />
      </Field>
      <Field label="Written">
        <TextInput
          type="number" style={{ width: 90, padding: "5px 8px", fontSize: 12 }}
          value={chapter.actualWordCount} onChange={(e) => onChange({ ...chapter, actualWordCount: Number(e.target.value) })}
        />
      </Field>
      <div style={{ display: "flex", gap: 3 }}>
        <IconButton title="Move up" onClick={() => onMove(-1)} disabled={isFirst}><ArrowUp size={13} /></IconButton>
        <IconButton title="Move down" onClick={() => onMove(1)} disabled={isLast}><ArrowDown size={13} /></IconButton>
        <IconButton title="Delete chapter" danger onClick={onRemove}><Trash2 size={13} /></IconButton>
      </div>
    </div>
  );
}

function ProjectDetail({ project, onChange, onBack }) {
  const chapters = project.chapters || [];
  const written = chapters.reduce((sum, c) => sum + (c.actualWordCount || 0), 0);

  const setChapters = (next) => onChange({ ...project, chapters: next, updatedAt: Date.now() });
  const addChapter = () => setChapters([...chapters, makeChapter(chapters.length, chapters.length + 1)]);
  const removeChapter = (id) => setChapters(chapters.filter((c) => c.id !== id).map((c, i) => ({ ...c, order: i })));
  const patchChapter = (id, next) => setChapters(chapters.map((c) => (c.id === id ? next : c)));
  const moveChapter = (id, dir) => {
    const idx = chapters.findIndex((c) => c.id === id);
    const target = idx + dir;
    if (target < 0 || target >= chapters.length) return;
    const next = [...chapters];
    [next[idx], next[target]] = [next[target], next[idx]];
    setChapters(next.map((c, i) => ({ ...c, order: i })));
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 32px", overflowY: "auto" }}>
      <div onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, color: PAPER_DIM, fontFamily: sans, fontSize: 12.5, cursor: "pointer", marginBottom: 14, width: "fit-content" }}>
        <ArrowLeft size={13} /> Projects
      </div>
      <input
        value={project.title}
        onChange={(e) => onChange({ ...project, title: e.target.value, updatedAt: Date.now() })}
        style={{ background: "transparent", border: "none", outline: "none", fontFamily: serif, fontSize: 26, color: PAPER, marginBottom: 6 }}
      />
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
        <Field label="Target word count">
          <TextInput
            type="number" style={{ width: 140 }}
            value={project.targetWordCount}
            onChange={(e) => onChange({ ...project, targetWordCount: Number(e.target.value), updatedAt: Date.now() })}
          />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
        <StatCard label="Chapters" value={chapters.length} />
        <StatCard label="Words written" value={written.toLocaleString()} sub={`of ${(project.targetWordCount || 0).toLocaleString()} target`} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontFamily: serif, fontSize: 16, color: PAPER }}>Chapters</span>
        <GhostButton onClick={addChapter}><Plus size={13} /> Add chapter</GhostButton>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {chapters.map((c, i) => (
          <ChapterRow
            key={c.id} chapter={c}
            onChange={(next) => patchChapter(c.id, next)}
            onRemove={() => removeChapter(c.id)}
            onMove={(dir) => moveChapter(c.id, dir)}
            isFirst={i === 0} isLast={i === chapters.length - 1}
          />
        ))}
        {chapters.length === 0 && <div style={{ color: PAPER_DIM, fontFamily: sans, fontSize: 13 }}>No chapters yet.</div>}
      </div>
    </div>
  );
}

function ProjectsLibrary({ projects, onOpen, onDelete, onCreate }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "26px 32px", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <span style={{ fontFamily: serif, fontSize: 24, color: PAPER }}>Projects</span>
        <PrimaryButton onClick={onCreate}><Plus size={16} /> New project</PrimaryButton>
      </div>
      {projects.length === 0 ? (
        <EmptyState icon={PenLine} title="No projects yet." hint="" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {projects.map((p) => (
            <div
              key={p.id} onClick={() => onOpen(p.id)}
              style={{ display: "flex", alignItems: "center", gap: 14, background: PANEL, border: `1px solid ${HAIRLINE}`, borderRadius: 11, padding: "13px 14px", cursor: "pointer" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: serif, fontSize: 15.5, color: PAPER }}>{p.title}</div>
                <div style={{ fontFamily: mono, fontSize: 11, color: PAPER_DIM, marginTop: 2 }}>
                  {(p.chapters || []).length} chapters · target {p.targetWordCount.toLocaleString()}w
                </div>
              </div>
              <div onClick={(ev) => { ev.stopPropagation(); onDelete(p.id); }}>
                <IconButton title="Delete" danger><Trash2 size={14} /></IconButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const active = projects.find((p) => p.id === activeId) || null;

  const createProject = (data) => {
    const project = makeProject(data);
    setProjects((list) => [project, ...list]);
    setShowNew(false);
    setActiveId(project.id);
  };
  const deleteProject = (id) => {
    setProjects((list) => list.filter((p) => p.id !== id));
    if (activeId === id) setActiveId(null);
  };
  const updateProject = (next) => setProjects((list) => list.map((p) => (p.id === next.id ? next : p)));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: INK, fontFamily: sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: ${PAPER_DIM}; opacity: 0.6; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: ${HAIRLINE}; border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: `1px solid ${HAIRLINE}` }}>
        <PenLine size={20} color={BRASS} strokeWidth={1.8} />
        <span style={{ fontFamily: sans, fontSize: 15, color: PAPER }}></span>
        
      </div>

      {active ? (
        <ProjectDetail project={active} onChange={updateProject} onBack={() => setActiveId(null)} />
      ) : (
        <ProjectsLibrary projects={projects} onOpen={setActiveId} onDelete={deleteProject} onCreate={() => setShowNew(true)} />
      )}

      {showNew && <NewProject onCreate={createProject} onClose={() => setShowNew(false)} />}
    </div>
  );
}
