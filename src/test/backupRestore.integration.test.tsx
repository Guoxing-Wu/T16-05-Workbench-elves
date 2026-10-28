// End to end: real WorkbenchProvider + real (fake-indexeddb) database.
// Checks that restoring a backup actually changes what is stored in IndexedDB.
import "./indexedDbSetup";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, render, screen, waitFor } from "@testing-library/react";
import { WorkbenchProvider, useWorkbench } from "../lib/store";
import { createBackup, parseBackup, serializeBackup } from "../lib/backup";
import { getAll, writeChanges } from "../lib/db";
import { buildCustomStructure, buildProject } from "./fixtures";
import type { WritingProject } from "../lib/domain";
import type { StoryStructureTemplate } from "../features/story-structure/storyStructureTemplate";

type Store = ReturnType<typeof useWorkbench>;
let store: Store;

// Gives the test access to the live store.
function Probe() {
  store = useWorkbench();
  return <div data-testid="count">{store.projects.length}</div>;
}

const storedIds = async () => ({
  projects: (await getAll<WritingProject>("projects")).map((p) => p.id).sort(),
  structures: (await getAll<StoryStructureTemplate>("customStructures")).map((s) => s.id).sort(),
});

async function renderWorkbench() {
  render(
    <WorkbenchProvider>
      <Probe />
    </WorkbenchProvider>
  );
  // Wait until the initial read from IndexedDB is finished.
  await waitFor(() => expect(store.persistenceStatus).toBe("ready"));
}

const SAVE_TIMEOUT = { timeout: 3000 }; // the store saves after a 400 ms debounce

beforeEach(async () => {
  const p = await getAll<WritingProject>("projects");
  const s = await getAll<StoryStructureTemplate>("customStructures");
  await writeChanges("projects", [], p.map((x) => x.id));
  await writeChanges("customStructures", [], s.map((x) => x.id));
  jest.spyOn(console, "error").mockImplementation(() => {});
});

describe("backup restore → IndexedDB", () => {
  it("loads saved projects from the database on start-up", async () => {
    await writeChanges("projects", [buildProject({ id: "saved" })], []);
    await renderWorkbench();
    expect(store.projects.map((p) => p.id)).toEqual(["saved"]);
  });

  it("starts empty with an empty database", async () => {
    await renderWorkbench();
    expect(store.projects).toEqual([]);
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("merge: adds the backup's records and keeps the existing ones in the database", async () => {
    await writeChanges("projects", [buildProject({ id: "existing", createdAt: 1 })], []);
    await renderWorkbench();

    const backup = createBackup([buildProject({ id: "incoming", createdAt: 2 })], [buildCustomStructure()]);
    act(() => store.importBackup(backup, "merge"));

    await waitFor(async () => {
      expect(await storedIds()).toEqual({ projects: ["existing", "incoming"], structures: ["custom-1"] });
    }, SAVE_TIMEOUT);
  });

  it("merge: the backup's version wins when ids match", async () => {
    await writeChanges("projects", [buildProject({ id: "p1", title: "Local title" })], []);
    await renderWorkbench();

    act(() => store.importBackup(createBackup([buildProject({ id: "p1", title: "Backup title" })], []), "merge"));

    await waitFor(async () => {
      const [saved] = await getAll<WritingProject>("projects");
      expect(saved.title).toBe("Backup title");
    }, SAVE_TIMEOUT);
  });

  it("replace: removes records that are not in the backup from the database", async () => {
    await writeChanges("projects", [buildProject({ id: "old-1" }), buildProject({ id: "old-2" })], []);
    await writeChanges("customStructures", [buildCustomStructure({ id: "old-structure" })], []);
    await renderWorkbench();

    act(() => store.importBackup(createBackup([buildProject({ id: "new" })], [buildCustomStructure()]), "replace"));

    await waitFor(async () => {
      expect(await storedIds()).toEqual({ projects: ["new"], structures: ["custom-1"] });
    }, SAVE_TIMEOUT);
  });

  it("replace: returns to the projects list and closes the open project", async () => {
    await writeChanges("projects", [buildProject({ id: "open-me" })], []);
    await renderWorkbench();
    act(() => store.setActiveProjectId("open-me"));
    expect(store.activeProject?.id).toBe("open-me");

    act(() => store.importBackup(createBackup([], []), "replace"));

    expect(store.activeProject).toBeNull();
    expect(store.activeView).toBe("projects");
  });

  it("replace with an empty backup empties the database", async () => {
    await writeChanges("projects", [buildProject({ id: "gone" })], []);
    await renderWorkbench();

    act(() => store.importBackup(createBackup([], []), "replace"));

    await waitFor(async () => expect(await storedIds()).toEqual({ projects: [], structures: [] }), SAVE_TIMEOUT);
  });

  it("orders projects newest first after a restore", async () => {
    await renderWorkbench();
    const backup = createBackup(
      [buildProject({ id: "a", createdAt: 1 }), buildProject({ id: "c", createdAt: 3 }), buildProject({ id: "b", createdAt: 2 })],
      []
    );
    act(() => store.importBackup(backup, "replace"));
    expect(store.projects.map((p) => p.id)).toEqual(["c", "b", "a"]);
  });

  it("full cycle: export from one workbench, restore into an empty one", async () => {
    await writeChanges("projects", [buildProject({ id: "story", title: "A Good Story" })], []);
    await writeChanges("customStructures", [buildCustomStructure()], []);
    await renderWorkbench();

    // "Download" the backup as text, as the app would write the file...
    const fileText = serializeBackup(createBackup(store.projects, store.customStoryStructures));

    // ...wipe the database (browser data cleared)...
    await writeChanges("projects", [], ["story"]);
    await writeChanges("customStructures", [], ["custom-1"]);

    // ...and restore from the file text.
    act(() => store.importBackup(parseBackup(fileText), "replace"));

    await waitFor(async () => {
      expect(await storedIds()).toEqual({ projects: ["story"], structures: ["custom-1"] });
    }, SAVE_TIMEOUT);
    expect((await getAll<WritingProject>("projects"))[0].title).toBe("A Good Story");
  });
});
