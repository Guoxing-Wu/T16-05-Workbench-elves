import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import type {
    StoryStructureId,
    StoryStructureTemplate,
} from "./storyStructureTemplate";
import { getStoryBeatCount } from "./storyStructureTemplate";

import { useWorkbench } from "../../lib/store";
import { CustomStructureEditor } from "./CustomStructureEditor";

type CustomStructureManagerProps = {
    structures: StoryStructureTemplate[];

    // Used by the project view.
    compact?: boolean;

    // When provided, custom structures can also be selected
    // for the current project.
    selectedStructureId?: StoryStructureId;
    onSelect?: (structureId: StoryStructureId) => void;
};

export function CustomStructureManager({
    structures,
    compact = false,
    selectedStructureId,
    onSelect,
}: CustomStructureManagerProps) {
    const {
        addCustomStoryStructure,
        updateCustomStoryStructure,
        deleteCustomStoryStructure,
    } = useWorkbench();

    /*
     * editingStructure controls which mode the editor is in:
     *
     * null       -> no editor is open
     * undefined  -> creating a new structure
     * structure  -> editing an existing structure
     */
    const [editingStructure, setEditingStructure] =
        useState<
            StoryStructureTemplate | null | undefined
        >(null);

    const isEditorOpen = editingStructure !== null;

    /*
     * Open the editor in create mode.
     */
    const handleCreate = () => {
        setEditingStructure(undefined);
    };

    /*
     * Open the editor with the selected structure.
     */
    const handleEdit = (
        structure: StoryStructureTemplate
    ) => {
        setEditingStructure(structure);
    };

    /*
     * Delete a custom structure after confirmation.
     */
    const handleDelete = (
        structure: StoryStructureTemplate
    ) => {
        const confirmed = window.confirm(
            `Delete "${structure.name}"?`
        );

        if (!confirmed) {
            return;
        }

        deleteCustomStoryStructure(structure.id);
    };

    /*
     * Save the structure returned by the editor.
     */
    const handleSave = (
        structure: StoryStructureTemplate
    ) => {
        if (editingStructure) {
            updateCustomStoryStructure(
                structure.id,
                () => structure
            );
        } else {
            addCustomStoryStructure(structure);
        }

        setEditingStructure(null);
    };

    /*
     * Close the editor without saving.
     */
    const handleCancel = () => {
        setEditingStructure(null);
    };

    /*
     * When compact mode is used inside a project,
     * show the editor without the larger library header.
     */
    if (compact && isEditorOpen) {
        return (
            <section className="custom-structure-manager compact">
                <CustomStructureEditor
                    structure={
                        editingStructure ?? undefined
                    }
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            </section>
        );
    }

    return (
        <section
            className={
                compact
                    ? "custom-structure-manager compact"
                    : "custom-structure-manager"
            }
        >
            {!isEditorOpen && (
                <>
                    {!compact && (
                        <header className="custom-structure-manager-header">
                            <div>
                                <span className="story-template-eyebrow">
                                    CUSTOM STRUCTURES
                                </span>

                                <h2>Your Story Structures</h2>

                                <p>
                                    Reusable frameworks available across
                                    your projects.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="toolbar-button primary-button"
                                onClick={handleCreate}
                            >
                                <Plus size={15} />
                                Create Structure
                            </button>
                        </header>
                    )}

                    {compact && (
                        <div className="custom-structure-compact-toolbar">
                            <span>
                                Reusable structures available across
                                your projects.
                            </span>

                            <button
                                type="button"
                                className="toolbar-button primary-button"
                                onClick={handleCreate}
                            >
                                <Plus size={14} />
                                Create Structure
                            </button>
                        </div>
                    )}

                    {structures.length === 0 ? (
                        compact ? (
                            <div className="custom-structure-compact-empty">
                                <p>
                                    No custom story structures yet.
                                </p>
                            </div>
                        ) : (
                            <div className="custom-structure-manager-empty">
                                <div className="custom-structure-manager-empty-icon">
                                    <LibraryIcon />
                                </div>

                                <h3>No custom structures yet</h3>

                                <p>
                                    Create your first custom story structure
                                    to define your own acts and story beats.
                                </p>

                                <button
                                    type="button"
                                    className="toolbar-button primary-button"
                                    onClick={handleCreate}
                                >
                                    <Plus size={14} />
                                    Create Your First Structure
                                </button>
                            </div>
                        )
                    ) : (
                        <div
                            className={
                                compact
                                    ? "custom-structure-list compact"
                                    : "custom-structure-list"
                            }
                        >
                            {structures.map((structure) => {
                                const isSelected =
                                    structure.id ===
                                    selectedStructureId;

                                return (
                                    <article
                                        key={structure.id}
                                        className={
                                            isSelected
                                                ? "custom-structure-card compact is-selected"
                                                : "custom-structure-card compact"
                                        }
                                        onClick={() => onSelect?.(structure.id)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault();
                                                onSelect?.(structure.id);
                                            }
                                        }}
                                    >
                                        <div className="custom-structure-card-main">
                                            <span className="custom-structure-card-eyebrow">
                                                CUSTOM STRUCTURE
                                            </span>

                                            <h3>
                                                {structure.name}
                                            </h3>

                                            <p>
                                                {structure.description ||
                                                    "No description provided."}
                                            </p>

                                            <div className="custom-structure-card-stats">
                                                <span>
                                                    <strong>
                                                        {structure.acts.length}
                                                    </strong>{" "}
                                                    {structure.acts.length === 1
                                                        ? "act"
                                                        : "acts"}
                                                </span>

                                                <span>
                                                    <strong>
                                                        {getStoryBeatCount(structure)}
                                                    </strong>{" "}
                                                    {getStoryBeatCount(structure) === 1
                                                        ? "beat"
                                                        : "beats"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="custom-structure-actions">
                                            <button
                                                type="button"
                                                className="icon-button edit-icon"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleEdit(structure);
                                                }}
                                                aria-label={`Edit ${structure.name}`}
                                                title="Edit structure"
                                            >
                                                <Pencil size={15} />
                                            </button>

                                            <button
                                                type="button"
                                                className="icon-button delete-icon"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleDelete(structure);
                                                }}
                                                aria-label={`Delete ${structure.name}`}
                                                title="Delete structure"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {!compact && isEditorOpen && (
                <CustomStructureEditor
                    structure={
                        editingStructure ?? undefined
                    }
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}
        </section>
    );
}

function LibraryIcon() {
    return (
        <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z" />
            <path d="M4 5.5v15" />
            <path d="M8 7h8" />
            <path d="M8 11h8" />
        </svg>
    );
}