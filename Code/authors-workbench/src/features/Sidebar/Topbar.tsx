import { Check } from "lucide-react";
import { useWorkbench } from "../../lib/store";
import "./Sidebar.css";
import type { AuthorProfile } from "../../components/ProfilePage";

interface TopBarProps {
  profile: AuthorProfile;
}

// The top bar shown above the main content: project info on the left, actions on the right.
export function TopBar({ profile, }: TopBarProps) {
  const { activeProject, setActiveView, } = useWorkbench();

  // Title shows the open project's name, or a default when no project is open.
  const title = activeProject ? activeProject.title : "Hi, there!";
  const subtitle = activeProject
    ? "Ready to write something wonderful today?"
    : "Manage your writing projects and track your progress.";

  const displayInitial = profile.displayName.trim().charAt(0).toUpperCase() || "A";

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

        {/* Opens the author profile page directly from the account avatar */}
        <button
          type="button"
          className="user-avatar"
          title="Open profile"
          aria-label="Open profile"
          onClick={() => {
            setActiveView("profile");
          }}
        >

          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" />
          ) : (
            <span>{displayInitial}</span>
          )}
        </button>
      </div>
    </header>
  );
}
