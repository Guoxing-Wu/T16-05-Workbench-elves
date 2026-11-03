// React hooks for managing editable profile data, syncing the latest profile,  and accessing the hidden avatar file input.
import { useEffect, useRef, useState } from "react";
// Typescript event types used for avatar file selection and profile form submission.
import type { ChangeEvent, SubmitEvent } from "react";
import { ArrowLeft, Trash2, Upload, } from "lucide-react";

export interface AuthorProfile {
    displayName: string;
    penName: string;
    bio: string;
    avatarUrl: string | null; /* Stores the avatar preview URL, or null when no avatar is available. */
    avatarDataUrl?: string | null;
}

// Defines the data and callbacks received by the Profile page from its parent.
interface ProfilePageProps {
    profile: AuthorProfile;
    onBack: () => void;
    onSave: (profile: AuthorProfile) => void;
}

// Returns the uppercase first character of the display name as default avatar 
function getDisplayInitial(displayName: string) {
    const trimmedName = displayName.trim();

    return trimmedName
        ? trimmedName.charAt(0).toUpperCase()
        : "A";
}

const MAX_AVATAR_SIZE_BYTES =
    10 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

export function ProfilePage({
    profile,
    onBack,
    onSave,
}: ProfilePageProps) {
    /* Stores the editable profile draft, form status message, and avatar error */
    const [draft, setDraft] = useState<AuthorProfile>(profile);
    const [savedMessage, setSavedMessage] = useState("");
    const [avatarError, setAvatarError] = useState("");
    /* Once the user clicks the Change Photo button, it can open the file picker through the hidden file input */
    const avatarInputRef = useRef<HTMLInputElement>(null);

    /* Resets current editting draft when the profile provided by its parent component is updated */
    useEffect(() => {
        setDraft(profile);
    }, [profile]);


    const displayInitial = getDisplayInitial(draft.displayName);

    const handleAvatarChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        // Clears the previous error when the user selects a new photo.
        setAvatarError("");

        if (!file) {
            return;
        }

        if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
            setAvatarError(
                "Please choose a JPG, PNG or WebP image."
            );

            event.target.value = "";
            return;
        }

        if (file.size > MAX_AVATAR_SIZE_BYTES) {
            setAvatarError(
                "The image must be 10 MB or smaller."
            );

            event.target.value = "";
            return;
        }

        const previewUrl =
            URL.createObjectURL(file);

        // Store a persistent image representation alongside the temporary preview URL.
        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result === "string") {
                setDraft((current) => ({
                    ...current,
                    avatarDataUrl: reader.result as string,
                }));
            }
        };

        reader.readAsDataURL(file);

        setDraft((current) => ({
            ...current, /* Keeps the existing Profile fields while the next line updates only avatarUrl. */
            avatarUrl: previewUrl,
        }));

        setSavedMessage("");

    };

    const handleRemoveAvatar = () => {
        if (draft.avatarUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(draft.avatarUrl); /* Release the temporary URL used for the local avatar preview */
        }

        // Removes the current avatar so the UI falls back to the default avatar initial.
        setDraft((current) => ({
            ...current,
            avatarUrl: null,
            avatarDataUrl: null,
        }));

        // Clears the current file selection, user can select the image again.
        if (avatarInputRef.current) {
            avatarInputRef.current.value = "";
        }

        setAvatarError("");
        setSavedMessage("");
    };

    // Checks and organises the Profile draft, then passes the updated data to the parent component.
    const handleSave = (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedDisplayName = draft.displayName.trim();

        if (!trimmedDisplayName) {
            setSavedMessage("Display name is required.");
            return;
        }

        const updatedProfile: AuthorProfile = {
            ...draft,
            displayName: trimmedDisplayName,
            penName: draft.penName.trim(),
            bio: draft.bio.trim(),
        };

        onSave(updatedProfile);
        setDraft(updatedProfile);
        setSavedMessage("Profile saved");
    };

    const handleCancel = () => {
        setDraft(profile);
        setSavedMessage("");
    };

    return (
        <div className="profile-page">
            <button
                type="button"
                className="text-link back-link"
                onClick={onBack}
            >
                <ArrowLeft size={15} />
                Back to workspace
            </button>

            <header className="profile-page-header">
                <h1>Profile</h1>
            </header>

            <section className="profile-card">
                <div className="profile-summary">
                    <div className="profile-avatar-preview">
                        {/* Show profile photo when available; otherwise show the user's initial */}
                        {draft.avatarUrl ? (
                            <img src={draft.avatarUrl} alt="" />
                        ) : (
                            <span>{displayInitial}</span>
                        )}
                    </div>

                    <div className="profile-summary-text">
                        <h2>{draft.displayName || "Unnamed author"}</h2>
                        <p>
                            Writing as{" "}
                            {draft.penName.trim() ||
                                draft.displayName.trim() ||
                                "Unnamed author"}
                        </p>
                    </div>
                    <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        aria-label="Choose profile photo"
                        onChange={handleAvatarChange}
                        hidden
                    />

                    <div className="profile-avatar-actions">
                        <button
                            type="button"
                            className="toolbar-button"
                            onClick={() => {
                                avatarInputRef.current?.click();
                            }}
                        >
                            <Upload size={14} />
                            Change photo
                        </button>

                        {draft.avatarUrl && (
                            <button
                                type="button"
                                className="toolbar-button"
                                onClick={handleRemoveAvatar}
                            >
                                <Trash2 size={14} />
                                Remove
                            </button>
                        )}

                        <small>
                            JPG, PNG or WebP · maximum 10 MB
                        </small>
                    </div>

                    {avatarError && (<p role="alert">{avatarError}</p>)}
                </div>

                <form className="profile-form" onSubmit={handleSave}>
                    <div className="profile-form-grid">
                        <label className="profile-field">
                            <span>Display name</span>

                            <input
                                type="text"
                                value={draft.displayName}
                                required
                                onChange={(event) => {
                                    setDraft((current) => ({
                                        ...current,
                                        displayName: event.target.value,
                                    }));
                                    setSavedMessage("");
                                }}
                            />

                        </label>

                        <label className="profile-field">
                            <span>
                                Pen name{" "}
                                <span className="profile-field-optional">
                                    (optional)
                                </span>
                            </span>

                            <input
                                type="text"
                                value={draft.penName}
                                onChange={(event) => {
                                    setDraft((current) => ({
                                        ...current,
                                        penName: event.target.value,
                                    }));
                                    setSavedMessage("");
                                }}
                            />
                        </label>

                        <label className="profile-field profile-field-wide">
                            <span>
                                Short bio{" "}
                                <span className="profile-field-optional">
                                    (optional)
                                </span>
                            </span>

                            <textarea
                                value={draft.bio}
                                maxLength={160}
                                rows={4}
                                onChange={(event) => {
                                    setDraft((current) => ({
                                        ...current,
                                        bio: event.target.value,
                                    }));
                                    setSavedMessage("");
                                }}
                            />

                            <small>{draft.bio.length}/160 characters</small>
                        </label>
                    </div>

                    <div className="profile-form-actions">
                        <span role="status">{savedMessage}</span>

                        <button
                            type="button"
                            className="toolbar-button"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="toolbar-button primary-button"
                        >
                            Save profile
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
