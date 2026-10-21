import { beforeEach, describe, expect, it, jest, } from "@jest/globals";
import { fireEvent, render, screen, } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ProfilePage, } from "./ProfilePage";
import type { AuthorProfile, } from "./ProfilePage";

const TEST_PROFILE: AuthorProfile = {
    displayName: "Alice",
    penName: "Avery Blake",
    bio: "Fantasy writer.",
    avatarUrl: null,
};

const EMPTY_PROFILE: AuthorProfile = {
    displayName: "",
    penName: "",
    bio: "",
    avatarUrl: null,
};

const PREVIEW_URL = "blob:profile-photo";

// jsdom does not provide the browser object URL APIs, so mocks simulate avatar previews and URL cleanup.
const createObjectURLMock =
    jest.fn<(file: Blob) => string>(
        () => PREVIEW_URL
    );

const revokeObjectURLMock =
    jest.fn<(url: string) => void>();

// Clears previous call records and reinstalls the object URL mocks before each test to keep tests independent.
beforeEach(() => {
    createObjectURLMock.mockClear();
    revokeObjectURLMock.mockClear();

    Object.defineProperty(
        URL,
        "createObjectURL",
        {
            configurable: true,
            writable: true,
            value: createObjectURLMock,
        }
    );

    Object.defineProperty(
        URL,
        "revokeObjectURL",
        {
            configurable: true,
            writable: true,
            value: revokeObjectURLMock,
        }
    );
});


function renderProfilePage(
    profile: AuthorProfile = TEST_PROFILE
) {
    const onBack = jest.fn<() => void>();
    const onSave = jest.fn<(profile: AuthorProfile) => void>();
    const user = userEvent.setup();
    const view = render(
        <ProfilePage
            profile={profile}
            onBack={onBack}
            onSave={onSave}
        />
    );

    return { ...view, user, onSave, };
}

describe("ProfilePage", () => {
    it("renders the current author profile", () => {
        const { container } = renderProfilePage();

        expect(
            screen.getByLabelText("Display name")
        ).toHaveValue("Alice");

        expect(
            screen.getByLabelText(/Pen name/i)
        ).toHaveValue("Avery Blake");

        expect(
            screen.getByLabelText(/Short bio/i)
        ).toHaveValue("Fantasy writer.");

        expect(
            screen.getByText("Writing as Avery Blake")
        ).toBeInTheDocument();

        const avatarInitial =
            container.querySelector(
                ".profile-avatar-preview span"
            );

        expect(avatarInitial?.textContent).toBe("A");
    });

    it("does not save a blank display name", async () => {
        const { user, onSave, } = renderProfilePage(EMPTY_PROFILE);

        await user.type(
            screen.getByLabelText("Display name"),
            "   "
        );

        await user.click(
            screen.getByRole("button", {
                name: "Save profile",
            })
        );

        expect(onSave).not.toHaveBeenCalled();
        expect(
            screen.getByRole("status")
        ).toHaveTextContent(
            "Display name is required."
        );
    });

    it("trims and saves the updated profile", async () => {
        const { user, onSave, } = renderProfilePage(EMPTY_PROFILE);
        const displayNameInput = screen.getByLabelText("Display name");
        const penNameInput = screen.getByLabelText(/Pen name/i);
        const bioInput = screen.getByLabelText(/Short bio/i);

        await user.type(displayNameInput, "  Alex  ");
        await user.type(penNameInput, "  A. Writer  ");
        await user.type(bioInput, "  New bio.  ");
        await user.click(
            screen.getByRole("button", {
                name: "Save profile",
            })
        );

        expect(onSave).toHaveBeenCalledTimes(1);
        expect(onSave).toHaveBeenCalledWith({
            displayName: "Alex",
            penName: "A. Writer",
            bio: "New bio.",
            avatarUrl: null,
        });

        expect(
            screen.getByRole("status")
        ).toHaveTextContent("Profile saved");
    });

    it("restores the saved profile when Cancel is clicked", async () => {
        const { user, onSave, } = renderProfilePage();
        const displayNameInput = screen.getByLabelText("Display name");
        const penNameInput = screen.getByLabelText(/Pen name/i);
        const bioInput = screen.getByLabelText(/Short bio/i);

        await user.clear(displayNameInput);
        await user.type(displayNameInput, "Alex");

        await user.clear(penNameInput);
        await user.type(penNameInput, "A. Writer");

        await user.clear(bioInput);
        await user.type(bioInput, "New bio.");

        await user.click(
            screen.getByRole("button", {
                name: "Cancel",
            })
        );

        expect(displayNameInput).toHaveValue("Alice");
        expect(penNameInput).toHaveValue("Avery Blake");
        expect(bioInput).toHaveValue("Fantasy writer.");
        expect(onSave).not.toHaveBeenCalled();
    });

    it("previews and saves a valid profile photo", async () => {
        const {
            container,
            user,
            onSave,
        } = renderProfilePage();

        const file = new File(
            ["image data"],
            "avatar.png",
            {
                type: "image/png",
            }
        );

        const fileInput =
            screen.getByLabelText(
                "Choose profile photo"
            );

        const fileInputClickSpy =
            jest.spyOn(fileInput, "click");

        await user.click(
            screen.getByRole("button", {
                name: "Change photo",
            })
        );

        expect(
            fileInputClickSpy
        ).toHaveBeenCalledTimes(1);

        fireEvent.change(fileInput, {
            target: {
                files: [file],
            },
        });

        expect(
            createObjectURLMock
        ).toHaveBeenCalledWith(file);

        const previewImage =
            container.querySelector<HTMLImageElement>(
                ".profile-avatar-preview img"
            );

        expect(
            previewImage?.getAttribute("src")
        ).toBe(PREVIEW_URL);

        expect(
            screen.getByRole("button", {
                name: "Remove",
            })
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", {
                name: "Save profile",
            })
        );

        expect(onSave).toHaveBeenCalledWith({
            ...TEST_PROFILE,
            avatarUrl: PREVIEW_URL,
        });
    });

    it("rejects an unsupported file type", () => {
        renderProfilePage();

        const file = new File(
            ["document data"],
            "profile.pdf",
            {
                type: "application/pdf",
            }
        );

        const fileInput =
            screen.getByLabelText(
                "Choose profile photo"
            );

        fireEvent.change(fileInput, {
            target: {
                files: [file],
            },
        });

        expect(
            screen.getByRole("alert")
        ).toHaveTextContent(
            "Please choose a JPG, PNG or WebP image."
        );

        expect(
            createObjectURLMock
        ).not.toHaveBeenCalled();
    });

    it("rejects an image larger than 10 MB", () => {
        renderProfilePage();

        const oversizedImage = new File(
            [
                new Uint8Array(
                    10 * 1024 * 1024 + 1
                ),
            ],
            "large-image.png",
            {
                type: "image/png",
            }
        );

        const fileInput =
            screen.getByLabelText(
                "Choose profile photo"
            );

        fireEvent.change(fileInput, {
            target: {
                files: [oversizedImage],
            },
        });

        expect(
            screen.getByRole("alert")
        ).toHaveTextContent(
            "The image must be 10 MB or smaller."
        );

        expect(
            createObjectURLMock
        ).not.toHaveBeenCalled();
    });

    it("removes the profile photo and restores the initial", async () => {
        const profileWithPhoto: AuthorProfile = {
            ...TEST_PROFILE,
            avatarUrl: "blob:existing-photo",
        };

        const {
            container,
            user,
            onSave,
        } = renderProfilePage(
            profileWithPhoto
        );

        await user.click(
            screen.getByRole("button", {
                name: "Remove",
            })
        );

        expect(
            revokeObjectURLMock
        ).toHaveBeenCalledWith(
            "blob:existing-photo"
        );

        expect(
            container.querySelector(
                ".profile-avatar-preview img"
            )
        ).not.toBeInTheDocument();

        const avatarInitial =
            container.querySelector(
                ".profile-avatar-preview span"
            );

        expect(avatarInitial?.textContent).toBe("A");

        expect(
            screen.queryByRole("button", {
                name: "Remove",
            })
        ).not.toBeInTheDocument();

        await user.click(
            screen.getByRole("button", {
                name: "Save profile",
            })
        );

        expect(onSave).toHaveBeenCalledWith({
            ...TEST_PROFILE,
            avatarUrl: null,
        });
    });
});