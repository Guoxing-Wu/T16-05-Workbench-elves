import { Check } from "lucide-react";
import { useWorkbench } from "../lib/store";

// The top bar shown above the main content: project info on the left, actions on the right.
export function TopBar() {
  const { activeProject } = useWorkbench();

  // Title shows the open project's name, or a default when no project is open.
  const title = activeProject ? activeProject.title : "Hi, there!";
  const subtitle = activeProject
    ? "Ready to write something wonderful today?"
    : "Manage your writing projects and track your progress.";

  return (
    <header className="top-bar">
      {/* Left: project info */}
      <div className="top-bar-info">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      {/* Right: save status and account */}
      <div className="top-bar-actions">
        <button type="button" className="saved-badge">
          <Check size={13} strokeWidth={2.5} />
          <span>Saved</span>
        </button>

        <button type="button" className="user-avatar" title="Account">
          <span>Hi</span>
        </button>
      </div>
    </header>
  );
}
