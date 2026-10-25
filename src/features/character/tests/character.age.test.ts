import { describe, expect, test } from "@jest/globals";

import { characterAgeAtYear } from "../../../lib/domain";
import type { StoryDate } from "../../../lib/domain";

describe("characterAgeAtYear", () => {
  const birthday: StoryDate = {
    year: 1998,
    month: 5,
    day: 10,
  };

  test.each([
    {
      description: "the day before the birthday",
      reference: { year: 2026, month: 5, day: 9 },
      expectedAge: 27,
    },
    {
      description: "on the birthday",
      reference: { year: 2026, month: 5, day: 10 },
      expectedAge: 28,
    },
    {
      description: "the day after the birthday",
      reference: { year: 2026, month: 5, day: 11 },
      expectedAge: 28,
    },
    {
      description: "in a month before the birth month",
      reference: { year: 2026, month: 4, day: 30 },
      expectedAge: 27,
    },
    {
      description: "in a month after the birth month",
      reference: { year: 2026, month: 6, day: 1 },
      expectedAge: 28,
    },
  ])(
    "returns $expectedAge $description",
    ({ reference, expectedAge }) => {
      expect(
        characterAgeAtYear(birthday, reference)
      ).toBe(expectedAge);
    }
  );

  test("returns a year-based estimate when only years are provided", () => {
    const birth: StoryDate = { year: 1998 };
    const reference: StoryDate = { year: 2026 };

    expect(characterAgeAtYear(birth, reference)).toBe(28);
  });
});