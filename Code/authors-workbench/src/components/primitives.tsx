import { X } from "lucide-react";
import type { ReactNode } from "react";

/* Reusable building blocks shared by ProjectsPage and ProjectDetailPage */


// A page's title block with a slot on the right for action buttons (e.g. "New project" button).
export function PageHeader({
  title,
  count,
  children,
}: {
  eyebrow?: string;
  title: string;
  count?: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {count && <p>{count}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  );
}

// Standard toolbar button with extra CSS classes layered on top of the base `toolbar-button` class.
export function ToolButton({
  children,
  primary,
  danger,
  type = "button",
  onClick,
  disabled,
}: {
  children: ReactNode;
  primary?: boolean;
  danger?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`${primary ? "primary-button " : ""}${danger ? "danger-outline-button " : ""}toolbar-button`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// Square icon-only button (move up/down, delete, close).
export function IconButton({
  onClick,
  title,
  children,
  danger,
  disabled,
}: {
  onClick?: () => void;
  title: string;
  children: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`icon-button ${danger ? "delete-icon" : ""}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  );
}



// Centered modal dialog with a backdrop. Clicking the backdrop itself can closes it. 
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section className={`workbench-modal ${wide ? "wide" : ""}`}>
        <header>
          <h2>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

// Labeled field wrapper includes text on top, the input passed in, and an optional small hint line underneath.
export function Field({
  label,
  hint,
  children,
  full = false,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`form-field ${full ? "full" : ""}`}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

// Placeholder shown when a list has nothing in it yet (e.g. no projects created). 
export function EmptyState({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{copy}</p>
      {action}
    </div>
  );
}
