import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { CircleCheck, Download, FileJson, TriangleAlert, Upload } from "lucide-react";
import { Modal, ToolButton } from "../../components/primitives";
import { useWorkbench } from "../../lib/store";
import {
  BackupError,
  createBackup,
  downloadBackup,
  parseBackup,
  projectsWithMissingStructure,
  mergeById,
} from "../../lib/backup";
import type { BackupFile, ImportMode } from "../../lib/backup";
import "./backup.css";

// A backup file that was read successfully and is waiting for the user to confirm.
interface StagedBackup {
  fileName: string;
  backup: BackupFile;
}

interface Message {
  kind: "error" | "success";
  text: string;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// "Backup & Restore" dialog: download everything as JSON, or restore from a JSON file.
export function BackupModal({ onClose }: { onClose: () => void }) {
  const { projects, customStoryStructures, importBackup } = useWorkbench();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<StagedBackup | null>(null);
  const [mode, setMode] = useState<ImportMode>("merge");
  // In "replace" mode, offer to download the current data first as a safety net.
  const [saveCurrentFirst, setSaveCurrentFirst] = useState(true);
  const [message, setMessage] = useState<Message | null>(null);

  const hasData = projects.length > 0 || customStoryStructures.length > 0;

  /* ---------- Export ---------- */

  const handleExport = () => {
    downloadBackup(createBackup(projects, customStoryStructures));
    setMessage({
      kind: "success",
      text: `Backup downloaded: ${plural(projects.length, "project")} and ${plural(
        customStoryStructures.length,
        "custom structure"
      )}.`,
    });
  };

  // read and check the file
  const handleFileChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Clear the input so choosing the same file again still fires onChange.
    event.target.value = "";
    if (!file) return;

    setMessage(null);
    setStaged(null);

    try {
      const backup = parseBackup(await file.text());
      setStaged({ fileName: file.name, backup });
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof BackupError ? error.message : "The file could not be read.",
      });
    }
  };

  // the user confirms
  const handleRestore = () => {
    if (!staged) return;
    const { projects: incomingProjects, customStructures: incomingStructures } = staged.backup.data;

    if (mode === "replace") {
      const ok = window.confirm(
        "Replace everything?\n\nAll current projects and custom story structures will be " +
          "removed and replaced by the contents of this backup. This cannot be undone."
      );
      if (!ok) return;
      // Safety net: keep a copy of what is about to be replaced.
      if (saveCurrentFirst && hasData) {
        downloadBackup(createBackup(projects, customStoryStructures));
      }
    }

    importBackup(staged.backup, mode);
    setMessage({
      kind: "success",
      text:
        mode === "replace"
          ? `Restored ${plural(incomingProjects.length, "project")} and ${plural(
              incomingStructures.length,
              "custom structure"
            )}. Your previous data was replaced.`
          : `Merged ${plural(incomingProjects.length, "project")} and ${plural(
              incomingStructures.length,
              "custom structure"
            )} into your workbench.`,
    });
    setStaged(null);
  };

  // Preview numbers for the staged backup
  let preview: {
    incomingProjects: number;
    incomingStructures: number;
    overwritten: number;
    removed: number;
    missingStructure: number;
  } | null = null;

  if (staged) {
    const incoming = staged.backup.data;
    const existingIds = new Set(projects.map((p) => p.id));
    const incomingIds = new Set(incoming.projects.map((p) => p.id));
    // Custom structures that will exist after the import.
    const structuresAfter =
      mode === "replace"
        ? incoming.customStructures
        : mergeById(customStoryStructures, incoming.customStructures);
    // Projects that will exist after the import.
    const projectsAfter =
      mode === "replace" ? incoming.projects : mergeById(projects, incoming.projects);

    preview = {
      incomingProjects: incoming.projects.length,
      incomingStructures: incoming.customStructures.length,
      overwritten: incoming.projects.filter((p) => existingIds.has(p.id)).length,
      removed: projects.filter((p) => !incomingIds.has(p.id)).length,
      missingStructure: projectsWithMissingStructure(projectsAfter, structuresAfter).length,
    };
  }

  const exportedAt = staged ? new Date(staged.backup.exportedAt) : null;
  const exportedAtLabel =
    exportedAt && !Number.isNaN(exportedAt.getTime()) ? exportedAt.toLocaleString() : "unknown date";

  return (
    <Modal title="Backup & Restore" onClose={onClose}>
      {/* ----- Export ----- */}
      <section className="backup-section">
        <h3>Back up your data</h3>
        <p>
          Download all your work ({plural(projects.length, "project")} and{" "}
          {plural(customStoryStructures.length, "custom structure")}) as a single JSON file. Keep it
          somewhere safe — browser data can be lost if you clear your site data.
        </p>
        <ToolButton primary onClick={handleExport} disabled={!hasData}>
          <Download size={15} /> Download backup
        </ToolButton>
      </section>

      {/* ----- Import ----- */}
      <section className="backup-section">
        <h3>Restore from a backup</h3>
        <p>Choose a backup file (.json) that was downloaded from this app.</p>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="backup-file-input"
          onChange={handleFileChosen}
        />
        <ToolButton onClick={() => fileInputRef.current?.click()}>
          <Upload size={15} /> Choose backup file…
        </ToolButton>

        {staged && preview && (
          <div className="backup-preview">
            <div className="backup-preview-file">
              <FileJson size={16} />
              <div>
                <strong>{staged.fileName}</strong>
                <span>Exported {exportedAtLabel}</span>
              </div>
            </div>

            <p className="backup-preview-counts">
              Contains <strong>{plural(preview.incomingProjects, "project")}</strong> and{" "}
              <strong>{plural(preview.incomingStructures, "custom structure")}</strong>.
            </p>

            <div className="backup-modes" role="radiogroup" aria-label="Restore mode">
              <label className={`backup-mode ${mode === "merge" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="backup-mode"
                  checked={mode === "merge"}
                  onChange={() => setMode("merge")}
                />
                <div>
                  <strong>Merge with current data</strong>
                  <span>
                    Adds the backup's projects. {plural(preview.overwritten, "project")} with the same
                    id will be overwritten by the backup's version; nothing else is deleted.
                  </span>
                </div>
              </label>

              <label className={`backup-mode ${mode === "replace" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="backup-mode"
                  checked={mode === "replace"}
                  onChange={() => setMode("replace")}
                />
                <div>
                  <strong>Replace everything</strong>
                  <span>
                    Your current data becomes exactly what is in the backup.{" "}
                    {preview.removed > 0
                      ? `${plural(preview.removed, "current project")} not in the backup will be deleted.`
                      : "No current project will be lost."}
                  </span>
                </div>
              </label>
            </div>

            {mode === "replace" && hasData && (
              <label className="backup-check">
                <input
                  type="checkbox"
                  checked={saveCurrentFirst}
                  onChange={(event) => setSaveCurrentFirst(event.target.checked)}
                />
                Download a backup of my current data first
              </label>
            )}

            {preview.missingStructure > 0 && (
              <p className="backup-note">
                <TriangleAlert size={14} />
                {plural(preview.missingStructure, "project")} use a custom story structure that is not
                available. They will show the Three-Act structure instead.
              </p>
            )}

            <div className="backup-preview-actions">
              <ToolButton onClick={() => setStaged(null)}>Cancel</ToolButton>
              <ToolButton primary={mode === "merge"} danger={mode === "replace"} onClick={handleRestore}>
                {mode === "replace" ? "Replace & restore" : "Merge & restore"}
              </ToolButton>
            </div>
          </div>
        )}
      </section>

      {message && (
        <div className={`backup-message ${message.kind}`} role={message.kind === "error" ? "alert" : "status"}>
          {message.kind === "error" ? <TriangleAlert size={15} /> : <CircleCheck size={15} />}
          <span>{message.text}</span>
        </div>
      )}
    </Modal>
  );
}
