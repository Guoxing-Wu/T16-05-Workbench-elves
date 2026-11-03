import { BookOpen, PenLine } from "lucide-react";
import { useWorkbench } from "../lib/store";
import { wordsWritten } from "../lib/domain";
import { FloralBackground } from "./FloralBackground";
import "./home.css";

// Landing page. It shows the project that is currently being written.
export function HomePage({
  onStart,
  onOpen,
}: {
  onStart: () => void; // go to the Projects page
  onOpen: (id: string) => void; // same handler ProjectsPage uses for "Open project"
}) {
  const { projects, activeProjectId } = useWorkbench();
  const active = projects.find((p) => p.id === activeProjectId) ?? null;

  const written = active ? wordsWritten(active) : 0;
  const target = active?.targetWordCount || 0;
  const percent = target > 0 ? Math.min(100, Math.round((written / target) * 100)) : 0;

  return (
    <div className="home">
      <FloralBackground />

      <header className="home-header">
        <div className="home-logo" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B8484A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 4c-8 0-13 4-13 11l-3 5" />
            <path d="M7 15c6 1 11-2 13-11" />
          </svg>
        </div>
        <div className="home-brand">
          <span>AUTHOR'S</span>
          <strong>WORKBENCH</strong>
        </div>
      </header>

      <main className="home-hero">
        <div className="home-copy">
          <p className="home-kicker">A quiet place for long stories</p>
          <h1>
            Plan the story.
            <br />
            Then write it.
          </h1>
          <p className="home-lead">
            Structure, chapters, characters, places and timelines, all in one calm workspace.
          </p>
          <div className="home-actions">
            <button className="home-btn home-btn-primary" onClick={onStart}>
              <PenLine size={18} /> Start writing
            </button>
            {active && (
              <button className="home-btn home-btn-secondary" onClick={() => onOpen(active.id)}>
                <BookOpen size={18} /> Continue writing
              </button>
            )}
          </div>
        </div>

        <div className="home-visual">
          <figure className="home-note">
            <span className="home-tape" />
            <blockquote>Stories are like secret drawers — full of things we forgot we knew.</blockquote>
            <figcaption>— from Imbi's notebook</figcaption>
          </figure>

          {active && (
            <button className="home-current" onClick={() => onOpen(active.id)} aria-label={`Open ${active.title}`}>
              <span className="home-current-label">Currently writing</span>
              <span className="home-current-title">{active.title}</span>
              <span className="home-current-meta">
                {written.toLocaleString()} of {target.toLocaleString()} words written
              </span>
              <span
                className="home-progress"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${percent}%` }} />
              </span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
