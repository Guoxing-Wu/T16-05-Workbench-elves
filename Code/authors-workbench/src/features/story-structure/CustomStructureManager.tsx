import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import type { StoryStructureTemplate } from "./storyStructureTemplate";
import { getStoryBeatCount } from "./storyStructureTemplate";

import { useWorkbench } from "../../lib/store";
import { CustomStructureEditor } from "./CustomStructureEditor";

type CustomStructureManagerProps = {
    structures: StoryStructureTemplate[];
};

export function CustomStructureManager({
    structures,
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

    return (
        <section className="custom-structure-manager">
            {!isEditorOpen && (
                <>
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

                    {structures.length === 0 ? (
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
                    ) : (
                        <div className="custom-structure-list">
                            {structures.map((structure) => (
                                <article
                                    key={structure.id}
                                    className="custom-structure-card"
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
                                                </strong>
                                                {" "}
                                                {structure.acts.length === 1
                                                    ? "act"
                                                    : "acts"}
                                            </span>

                                            <span>
                                                <strong>
                                                    {getStoryBeatCount(
                                                        structure
                                                    )}
                                                </strong>
                                                {" "}
                                                {getStoryBeatCount(
                                                    structure
                                                ) === 1
                                                    ? "beat"
                                                    : "beats"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="custom-structure-actions">
                                        <button
                                            type="button"
                                            className="icon-button edit-icon"
                                            onClick={() =>
                                                handleEdit(
                                                    structure
                                                )
                                            }
                                            aria-label={`Edit ${structure.name}`}
                                            title="Edit structure"
                                        >
                                            <Pencil size={15} />
                                        </button>

                                        <button
                                            type="button"
                                            className="icon-button delete-icon"
                                            onClick={() =>
                                                handleDelete(
                                                    structure
                                                )
                                            }
                                            aria-label={`Delete ${structure.name}`}
                                            title="Delete structure"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </>
            )}

            {isEditorOpen && (
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

/*
 * Small local icon wrapper for the empty state.
 * Keeping this separate avoids introducing another dependency.
 */
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