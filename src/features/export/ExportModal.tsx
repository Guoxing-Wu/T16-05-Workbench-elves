import { useState } from "react";
import { CircleCheck, FileSpreadsheet, TriangleAlert } from "lucide-react";
import { Modal, ToolButton } from "../../components/primitives";
import { useWorkbench } from "../../lib/store";
import { ExportError, exportStructureToExcel } from "../../lib/exportExcel";
import "../backup/backup.css"; // reuses the .backup-section / .backup-message styles

interface Message {
  kind: "error" | "success";
  text: string;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// "Export" dialog: download the open project's story structure as an Excel file.
export function ExportModal({ onClose }: { onClose: () => void }) {
  const { activeProject, customStoryStructures } = useWorkbench();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const handleExport = async () => {
    if (!activeProject) return;
    setBusy(true);
    setMessage(null);
    try {
      const fileName = await exportStructureToExcel(activeProject, customStoryStructures);
      setMessage({ kind: "success", text: `Downloaded ${fileName}` });
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof ExportError ? error.message : "The Excel file could not be created.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Export" onClose={onClose}>
      <section className="backup-section">
        <h3>Story structure (Excel)</h3>
        {activeProject ? (
          <p>
            Export the story structure of <strong>{activeProject.title}</strong> (
            {plural(activeProject.chapters.length, "chapter")}) as an Excel workbook: acts, story
            beats, chapters, word goals and character appearances.
          </p>
        ) : (
          <p>Open a project first. The Excel file is created from the project you have open.</p>
        )}
        <ToolButton primary onClick={handleExport} disabled={!activeProject || busy}>
          <FileSpreadsheet size={15} /> {busy ? "Creating…" : "Download Excel (.xlsx)"}
        </ToolButton>
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
