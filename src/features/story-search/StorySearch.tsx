import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { ToolButton } from "../../components/primitives";
import type { WritingProject } from "../../lib/domain";
import { getAppearances, interpretQuestion } from "./appearances";
import type { AppearanceTarget } from "./appearances";
import "./storySearch.css";

export function StorySearch({ project, onNavigate }: {
  project: WritingProject;
  onNavigate: (target: AppearanceTarget) => void;
}) {
  const [question, setQuestion] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [autoOpen, setAutoOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const current = useRef(project);
  useEffect(() => { current.current = project; }, [project]);
  const request = useRef(0);
  useEffect(() => () => { request.current += 1; }, []);

  const character = project.characters.find(({ id }) => id === selectedId);
  const report = character ? getAppearances(project, character.id) : undefined;

  async function search() {
    if (busy || !question.trim()) return;
    const id = ++request.current;
    setBusy(true);
    setMessage("");
    const match = await interpretQuestion(question.trim(), project.characters, selectedId);
    if (id !== request.current) return;
    setBusy(false);

    const latest = current.current;
    if (!match || !latest.characters.some(({ id }) => id === match.characterId)) {
      setSelectedId("");
      setMessage("Enter a unique character name or choose one from the list.");
      return;
    }

    setSelectedId(match.characterId);
    if (autoOpen) {
      const { chapters, locations } = getAppearances(latest, match.characterId);
      const chapter: AppearanceTarget | undefined = chapters[0] && { view: "chapterPlan", id: chapters[0].id };
      const location: AppearanceTarget | undefined = locations[0] && { view: "locations", id: locations[0].id };
      const target = match.preferLocations ? location ?? chapter : chapter ?? location;
      if (target) onNavigate(target);
    }
  }

  return (
    <section id="story-search" className="story-search" aria-labelledby="story-search-title">
      <h2 id="story-search-title"><Sparkles size={17} aria-hidden="true" /> AI Story Search</h2>
      {project.characters.length === 0 ? (
        <p>Add a character to look up their appearances.</p>
      ) : (
        <>
          <form onSubmit={(event) => { event.preventDefault(); void search(); }}>
            <label htmlFor="appearance-question">Ask where a character appears</label>
            <div className="story-search-question">
              <input id="appearance-question" value={question} disabled={busy}
                placeholder="Which chapters does Lin Xia appear in?"
                onChange={(event) => setQuestion(event.target.value)} />
              <ToolButton primary type="submit" disabled={busy || !question.trim()}>
                {busy ? "Searching…" : "Ask"}
              </ToolButton>
            </div>
            <div className="story-search-options">
              <label>
                Character
                <select value={character?.id ?? ""} disabled={busy} onChange={(event) => {
                  setSelectedId(event.target.value);
                  setMessage("");
                }}>
                  <option value="">Choose a character</option>
                  {project.characters.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
                </select>
              </label>
              <label>
                <input type="checkbox" checked={autoOpen} disabled={busy}
                  onChange={(event) => setAutoOpen(event.target.checked)} />
                Open the first match after asking
              </label>
            </div>
          </form>
          {message && <p role="status">{message}</p>}
          {report && character && (
            <div className="story-search-results">
              <p role="status">
                <strong>{character.name}</strong> appears in {report.chapters.length} {report.chapters.length === 1 ? "chapter" : "chapters"} and {report.locations.length} {report.locations.length === 1 ? "location" : "locations"}.
              </p>
              {report.chapters.length > 0 && (
                <div>
                  <h3>Chapters</h3>
                  <ul>{report.chapters.map(({ id, order, title }) => (
                    <li key={id}><ToolButton onClick={() => onNavigate({ view: "chapterPlan", id })}>
                      {order + 1}. {title}
                    </ToolButton></li>
                  ))}</ul>
                </div>
              )}
              {report.locations.length > 0 && (
                <div>
                  <h3>Locations</h3>
                  <ul>{report.locations.map(({ id, name }) => (
                    <li key={id}><ToolButton onClick={() => onNavigate({ view: "locations", id })}>
                      {name}
                    </ToolButton></li>
                  ))}</ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
