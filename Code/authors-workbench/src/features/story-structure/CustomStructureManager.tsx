import { useState } from "react";

import type { StoryStructureTemplate } from "./storyStructureTemplate";

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

    const isEditorOpen =
        editingStructure !== null;

    /*
     * Open the editor in create mode.
     *
     * undefined means there is no existing structure
     * to edit, so CustomStructureEditor will show
     * an empty form.
     */
    const handleCreate = () => {
        setEditingStructure(undefined);
    };

    /*
     * Open the editor with the selected structure.
     *
     * The existing structure is passed to the editor,
     * so its name, description, acts and beats can be
     * loaded into the form.
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
     *
     * If editingStructure exists, we update an existing
     * custom structure.
     *
     * Otherwise, we create a new custom structure.
     */
    const handleSave = (
        structure: StoryStructureTemplate
    ) => {
        if (editingStructure) {
            // Update the existing structure while keeping
            // its original ID.
            updateCustomStoryStructure(
                structure.id,
                () => structure
            );
        } else {
            // No existing structure means this is Create mode.
            addCustomStoryStructure(structure);
        }

        // Close the editor after saving.
        setEditingStructure(null);
    };

    /*
     * Close the editor without saving any changes.
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
                        </div>

                        <button
                            type="button"
                            onClick={handleCreate}
                        >
                            + Create Custom Structure
                        </button>
                    </header>

                    {structures.length === 0 ? (
                        <p>
                            No custom story structures yet.
                        </p>
                    ) : (
                        <div className="custom-structure-list">
                            {structures.map(
                                (structure) => (
                                    <article
                                        key={structure.id}
                                        className="custom-structure-card"
                                    >
                                        <div>
                                            <h3>
                                                {
                                                    structure.name
                                                }
                                            </h3>

                                            <p>
                                                {
                                                    structure.description
                                                }
                                            </p>
                                        </div>

                                        <div className="custom-structure-actions">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleEdit(
                                                        structure
                                                    )
                                                }
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(structure)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </article>
                                )
                            )}
                        </div>
                    )}
                </>
            )}

            {isEditorOpen && (
                <CustomStructureEditor
                    /*
                     * Pass the selected structure when
                     * editing.
                     *
                     * In create mode editingStructure is
                     * undefined, so the editor receives
                     * undefined and starts with an empty form.
                     */
                    structure={
                        editingStructure ??
                        undefined
                    }
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}
        </section>
    );
}