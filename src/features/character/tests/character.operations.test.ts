/**
 * @jest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { createElement } from "react";
import type { PropsWithChildren } from "react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";

import { makeCharacter } from "../../../lib/domain";
import type { Character, WritingProject } from "../../../lib/domain";
import { getAll } from "../../../lib/db";
import { WorkbenchProvider, useWorkbench } from "../../../lib/store";

// Keep the real provider, character factory and character operations.
// Replace persistence and backup dependencies so these tests do not need IndexedDB.
jest.mock("../../../lib/db", () => ({
  STORES: { projects: "projects", customStructures: "customStructures" },
  getAll: jest.fn(),
}));

jest.mock("../../../lib/useCollectionSync", () => ({
  useCollectionSync: () => ({
    status: "saved",
    retry: async () => {},
  }),
}));

jest.mock("../../../lib/backup", () => ({
  mergeById: jest.fn(),
  createBackup: jest.fn(),
  downloadBackup: jest.fn(),
}));

const NOW = 1_800_000_000_000;
const EARLIER = NOW - 60_000;
const PROJECT_A = "project-a";
const PROJECT_B = "project-b";
const ALICE_ID = "alice-id";
const BOB_ID = "bob-id";
const mockedGetAll = jest.mocked(getAll);

type Workbench = ReturnType<typeof useWorkbench>;
type StoreResult = { current: Workbench };

// Minimal persisted fixtures: only the fields read by this provider/test scope.
// These fixtures do not validate the complete project schema or import format.
type SavedProjectFixture = Pick<
  WritingProject,
  "id" | "title" | "createdAt" | "updatedAt" | "characters"
>;

function savedCharacter(id: string, firstName: string): Character {
  return {
    ...makeCharacter({
      firstName,
      birthday: { year: 1998, month: 5, day: 10 },
      description: "Original description",
      location: "Melbourne",
      role: ["Protagonist"],
      gender: "Female",
    }),
    id,
    updatedAt: EARLIER,
  };
}

function savedProject(
  id: string,
  title: string,
  characters: Character[]
): SavedProjectFixture {
  return { id, title, createdAt: EARLIER, updatedAt: EARLIER, characters };
}

function Wrapper({ children }: PropsWithChildren) {
  return createElement(WorkbenchProvider, { children });
}

async function setupStore() {
  const hook = renderHook(() => useWorkbench(), { wrapper: Wrapper });
  // Wait for initial database loading before making changes. Otherwise the
  // provider's initial load could overwrite a change made too early in a test.
  await waitFor(() => {
    expect(hook.result.current.persistenceStatus).toBe("ready");
  });
  return hook;
}

function projectIn(result: StoreResult, projectId = PROJECT_A) {
  const project = result.current.projects.find((item) => item.id === projectId);
  if (!project) throw new Error(`Missing test project: ${projectId}`);
  return project;
}

function charactersIn(result: StoreResult, projectId = PROJECT_A): Character[] {
  return projectIn(result, projectId).characters ?? [];
}

beforeEach(() => {
  jest.spyOn(Date, "now").mockReturnValue(NOW);
  mockedGetAll.mockReset();
  // WorkbenchProvider reads projects first, then custom structures.
  mockedGetAll.mockResolvedValueOnce([
    savedProject(PROJECT_A, "First story", [
      savedCharacter(ALICE_ID, "Alice"),
      savedCharacter(BOB_ID, "Bob"),
    ]),
    savedProject(PROJECT_B, "Second story", [savedCharacter("cara-id", "Cara")]),
  ]);
  mockedGetAll.mockResolvedValueOnce([]);
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

describe("makeCharacter", () => {
  test("builds a trimmed full name and preserves supplied character details", () => {
    const character = makeCharacter({
      firstName: " Alice ",
      middleName: " Mei ",
      lastName: " Smith ",
      birthday: { year: 1998, month: 5, day: 10 },
      description: "Main character",
      location: "Melbourne",
      role: ["Protagonist", "Narrator"],
      gender: "Female",
    });

    expect(character).toEqual({
      id: expect.any(String),
      name: "Alice Mei Smith",
      birthday: { year: 1998, month: 5, day: 10 },
      description: "Main character",
      location: "Melbourne",
      role: ["Protagonist", "Narrator"],
      gender: "Female",
      updatedAt: NOW,
    });
  });

  test("supports a first name without middle or last names", () => {
    expect(makeCharacter({ firstName: "Alice", birthday: { year: 1998 } }).name)
      .toBe("Alice");
  });

  test("omits blank name parts without leaving extra spaces", () => {
    const character = makeCharacter({
      firstName: " Alice ",
      middleName: "   ",
      lastName: " Smith ",
      birthday: { year: 1998 },
    });
    expect(character.name).toBe("Alice Smith");
  });

  test("uses empty defaults for omitted optional details", () => {
    const character = makeCharacter({ firstName: "Alice", birthday: { year: 1998 } });
    expect(character).toMatchObject({
      description: "",
      location: "",
      role: [],
      gender: "",
    });
  });

  test("preserves a required birth year without inventing a month or day", () => {
    const character = makeCharacter({ firstName: "Alice", birthday: { year: 1998 } });
    expect(character.birthday).toEqual({ year: 1998 });
    expect(character.birthday.month).toBeUndefined();
    expect(character.birthday.day).toBeUndefined();
  });

  test("gives separately created characters distinct non-empty IDs", () => {
    const input = { firstName: "Alice", birthday: { year: 1998 } };
    const first = makeCharacter(input);
    const second = makeCharacter(input);
    expect(first.id.trim()).not.toBe("");
    expect(second.id.trim()).not.toBe("");
    expect(first.id).not.toBe(second.id);
  });
});

describe("Workbench character operations", () => {
  test("adds the returned character to the selected project and preserves other data", async () => {
    const { result } = await setupStore();
    const existing = [...charactersIn(result)];
    const otherProjectBefore = JSON.stringify(projectIn(result, PROJECT_B));

    const input = {
      firstName: " Dana ",
      lastName: " Lee ",
      birthday: { year: 2000 },
      description: "A new character",
    };
    let returned: Character | undefined;
    act(() => { returned = result.current.addCharacter(PROJECT_A, input); });

    const characters = charactersIn(result);
    expect(characters).toHaveLength(existing.length + 1);
    expect(characters.slice(0, existing.length)).toEqual(existing);
    expect(characters[characters.length - 1]).toBe(returned);
    expect(returned).toMatchObject({
      name: "Dana Lee",
      birthday: { year: 2000 },
      description: "A new character",
    });
    expect(JSON.stringify(projectIn(result, PROJECT_B))).toBe(otherProjectBefore);
  });

  test("keeps both characters when two additions happen in the same React update", async () => {
    const { result } = await setupStore();
    const existingIds = charactersIn(result).map((item) => item.id);
    const added: Character[] = [];
    act(() => {
      added.push(result.current.addCharacter(PROJECT_A, {
        firstName: "Dana", birthday: { year: 2000 },
      }));
      added.push(result.current.addCharacter(PROJECT_A, {
        firstName: "Eli", birthday: { year: 2001 },
      }));
    });
    expect(charactersIn(result).map((item) => item.id)).toEqual([
      ...existingIds, ...added.map((item) => item.id),
    ]);
    expect(added[0].id).not.toBe(added[1].id);
  });

  test("edits only the selected character, preserves omitted fields and refreshes its timestamp", async () => {
    const { result } = await setupStore();
    const [aliceBefore, bobBefore] = charactersIn(result);
    const otherProjectBefore = JSON.stringify(projectIn(result, PROJECT_B));

    act(() => {
      result.current.updateCharacter(PROJECT_A, ALICE_ID, {
        name: "Alice Rivers",
        birthday: { year: 1999, month: 6, day: 12 },
        location: "Sydney",
      });
    });

    expect(charactersIn(result)).toEqual([
      {
        ...aliceBefore,
        name: "Alice Rivers",
        birthday: { year: 1999, month: 6, day: 12 },
        location: "Sydney",
        updatedAt: NOW,
      },
      bobBefore,
    ]);
    expect(aliceBefore.name).toBe("Alice");
    expect(aliceBefore.updatedAt).toBe(EARLIER);
    expect(JSON.stringify(projectIn(result, PROJECT_B))).toBe(otherProjectBefore);
  });

  test("allows optional text and selected roles to be cleared", async () => {
    const { result } = await setupStore();
    act(() => {
      result.current.updateCharacter(PROJECT_A, ALICE_ID, {
        description: "", location: "", gender: "", role: [],
      });
    });
    expect(charactersIn(result)[0]).toMatchObject({
      id: ALICE_ID,
      birthday: { year: 1998, month: 5, day: 10 },
      description: "", location: "", gender: "", role: [],
    });
  });

  test("does not change character records when editing an unknown character ID", async () => {
    const { result } = await setupStore();
    const before = [...charactersIn(result)];
    act(() => {
      result.current.updateCharacter(PROJECT_A, "missing-character", { name: "Nobody" });
    });
    expect(charactersIn(result)).toEqual(before);
    // The implementation still updates the project's own updatedAt timestamp.
  });

  test("removes only the selected character and leaves other projects unchanged", async () => {
    const { result } = await setupStore();
    const before = charactersIn(result);
    const bobBefore = before.find((item) => item.id === BOB_ID);
    const otherProjectBefore = JSON.stringify(projectIn(result, PROJECT_B));

    act(() => { result.current.removeCharacter(PROJECT_A, ALICE_ID); });

    expect(charactersIn(result)).toEqual([bobBefore]);
    expect(before.map((item) => item.id)).toEqual([ALICE_ID, BOB_ID]);
    expect(JSON.stringify(projectIn(result, PROJECT_B))).toBe(otherProjectBefore);
  });

  test("leaves an empty list after all characters are removed", async () => {
    const { result } = await setupStore();
    act(() => {
      result.current.removeCharacter(PROJECT_A, ALICE_ID);
      result.current.removeCharacter(PROJECT_A, BOB_ID);
    });
    expect(charactersIn(result)).toEqual([]);
    expect(charactersIn(result, PROJECT_B)).toHaveLength(1);
  });

  test("does not change character records when deleting an unknown character ID", async () => {
    const { result } = await setupStore();
    const before = [...charactersIn(result)];
    act(() => { result.current.removeCharacter(PROJECT_A, "missing-character"); });
    expect(charactersIn(result)).toEqual(before);
  });
});
