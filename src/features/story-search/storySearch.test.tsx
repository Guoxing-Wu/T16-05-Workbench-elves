import "../../test/indexedDbSetup";
import { expect, it, jest } from "@jest/globals";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../App";
import { writeChanges } from "../../lib/db";
import { buildProject } from "../../test/fixtures";
import { interpretQuestion } from "./appearances";

it("counts linked chapters and places once, then opens the requested editor or location", async () => {
  const project = buildProject();
  project.characters[0].name = "林夏";
  project.chapters[0].locationIds = ["l1"];
  project.scenes[0].chapterIds.push("ch1", "missing-chapter");
  project.scenes[0].locationId = "l1";
  project.events[0].characterIds = ["c1", "c2"];
  project.events[0].locationId = "l1";
  await writeChanges("projects", [project], []);

  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole("button", { name: "Start writing" }));
  await user.click(await screen.findByRole("button", { name: "Open project" }));
  await user.click(screen.getByRole("button", { name: "AI Story Search" }));

  const panel = within(screen.getByRole("region", { name: "AI Story Search" }));
  const question = panel.getByRole("textbox", { name: "Ask where a character appears" });
  await user.type(question, "林夏在哪几个章节出现了？");
  await user.click(panel.getByRole("button", { name: "Ask" }));

  expect(await panel.findByText(/appears in 3 chapters and 1 location/)).toBeVisible();
  expect(screen.getByRole("complementary", { name: "Chapter editor: Chapter 1" })).toHaveFocus();
  await user.click(panel.getByRole("button", { name: "3. Chapter 3" }));
  expect(screen.getByRole("complementary", { name: "Chapter editor: Chapter 3" })).toHaveFocus();

  await user.clear(question);
  await user.type(question, "该角色出现在哪些地点？");
  await user.click(panel.getByRole("button", { name: "Ask" }));
  const location = await screen.findByRole("article", { name: "Harbour" });
  expect(location).toHaveFocus();
  expect(within(location).getByText("Hide location histories")).toBeVisible();
});

it("uses a supported browser model to resolve a character alias and discards the session", async () => {
  const destroy = jest.fn();
  const prompt = jest.fn(async () => '{"index":1,"preferLocations":true}');
  Object.defineProperty(globalThis, "LanguageModel", {
    configurable: true,
    value: {
      availability: async () => "available",
      create: async () => ({ prompt, destroy }),
    },
  });

  try {
    await expect(interpretQuestion("Where does the sailor appear?", buildProject().characters, ""))
      .resolves.toEqual({ characterId: "c2", preferLocations: true });
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(destroy).toHaveBeenCalledTimes(1);
  } finally {
    Reflect.deleteProperty(globalThis, "LanguageModel");
  }
});
