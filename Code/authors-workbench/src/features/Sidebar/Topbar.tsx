import { Check, Download, LoaderCircle, RotateCw, TriangleAlert } from "lucide-react";
import { useWorkbench } from "../../lib/store";
import type { SaveStatus } from "../../lib/store";
import type { AuthorProfile } from "../../components/ProfilePage";
import "./Sidebar.css";

interface TopBarProps {
  profile: AuthorProfile;
}

// Keep display text separate from the persistence logic.
const SAVE_STATUS_DETAILS: Record<
  SaveStatus,
  { label: string; description: string }
> = {
  loading: {
    label: "Loading…",
    description: "Loading your saved plans from this browser.",
  },
  saving: {
    label: "Saving…",
    description: "Saving your latest plan changes in this browser.",
  },
  saved: {
    label: "Saved locally",
    description:
      "All submitted plan changes are saved in this browser. " +
      "Export a backup to keep a separate copy.",
  },
  error: {
    label: "Save failed",
    description:
      "Your latest plan changes could not be saved. " +
      "Retry or export a backup before leaving.",
  },
};



// The top bar shown above the main content: project info on the left, actions on the right.
export function TopBar({ profile, }: TopBarProps) {
  const { activeProject, setActiveView, saveStatus, retrySave, exportBackup, } = useWorkbench();

  // Title shows the open project's name, or a default when no project is open.
  const title = activeProject ? activeProject.title : "Hi, there!";
  const subtitle = activeProject
    ? "Ready to write something wonderful today?"
    : "Manage your writing projects and track your progress.";

  const displayInitial = profile.displayName.trim().charAt(0).toUpperCase() || "A";
  const statusDetails = SAVE_STATUS_DETAILS[saveStatus];
  const isBusy = saveStatus === "loading" || saveStatus === "saving";

  const StatusIcon =
    saveStatus === "saved"
      ? Check
      : saveStatus === "error"
        ? TriangleAlert
        : LoaderCircle;

  return (
    <>
      <header className="top-bar">
        {/* Left: project info */}
        <div className="top-bar-info">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        {/* Right: save status and account */}
        <div className="top-bar-actions">
          {/* Display database results without introducing a manual Save action. */}
          <span
            className={`saved-badge saved-badge--${saveStatus}`}
            role="status"
            title={statusDetails.description}
          >
            <StatusIcon
              size={13}
              strokeWidth={2}
              aria-hidden="true"
              className={isBusy ? "save-status-spinner" : undefined}
            />
            <span>{statusDetails.label}</span>
          </span>

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

      {/* Keep recovery actions visible while a local write has failed. */}
      {saveStatus === "error" && (
        <div className="save-error-banner" role="alert">
          <TriangleAlert size={18} aria-hidden="true" />

          <div className="save-error-copy">
            <strong>Your latest changes haven't been saved.</strong>
          </div>

          <div className="save-error-actions">
            <button
              type="button"
              className="toolbar-button"
              onClick={() => {
                void retrySave();
              }}
            >
              <RotateCw size={14} aria-hidden="true" />
              Retry
            </button>

            <button
              type="button"
              className="toolbar-button"
              onClick={exportBackup}
            >
              <Download size={14} aria-hidden="true" />
              Export backup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
