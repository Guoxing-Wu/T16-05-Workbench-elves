import { Bell, Check, Search } from "lucide-react";
import { useWorkbench } from "../lib/store";

// The top bar shown above the main content: project info on the left, actions on the right.
export function TopBar() {
  const { activeProject, activeView } = useWorkbench();

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

      {/* Right: action buttons */}
      <div className="top-bar-actions">
        <button type="button" className="saved-badge">
          <Check size={13} strokeWidth={2.5} />
          <span>Saved</span>
        </button>
        <button type="button" className="top-bar-icon-btn" title="Search">
          <Search size={17} strokeWidth={1.7} />
        </button>
        <button type="button" className="top-bar-icon-btn" title="Notifications">
          <Bell size={17} strokeWidth={1.7} />
        </button>
        <button type="button" className="user-avatar" title="Account">
          <span>Hi</span>
        </button>
      </div>
    </header>
  );
}
