import { describe, expect, test } from "@jest/globals";

import { isValidBirthday } from "../../../test/characterBirthday";
import type { StoryDate } from "../../../lib/domain";

interface BirthdayCase {
  description: string;
  birthday: StoryDate | undefined;
  expected: boolean;
}

describe("isValidBirthday", () => {
  const cases: BirthdayCase[] = [
    {
      description: "rejects a missing required birthday",
      birthday: undefined,
      expected: false,
    },
    {
      description: "accepts a year-only birthday",
      birthday: { year: 1998 },
      expected: true,
    },
    {
      description: "accepts a year and month without a day",
      birthday: { year: 1998, month: 5 },
      expected: true,
    },
    {
      description: "accepts a valid complete birthday",
      birthday: { year: 1998, month: 5, day: 10 },
      expected: true,
    },
    {
      description: "rejects 30 February",
      birthday: { year: 1998, month: 2, day: 30 },
      expected: false,
    },
    {
      description: "accepts 29 February in a leap year",
      birthday: { year: 2024, month: 2, day: 29 },
      expected: true,
    },
    {
      description: "rejects 29 February in a non-leap year",
      birthday: { year: 2023, month: 2, day: 29 },
      expected: false,
    },
    {
      description: "rejects 31 April",
      birthday: { year: 2026, month: 4, day: 31 },
      expected: false,
    },
    {
      description: "rejects a month outside the valid range",
      birthday: { year: 1998, month: 13, day: 10 },
      expected: false,
    },
    {
      description: "rejects day zero",
      birthday: { year: 1998, month: 5, day: 0 },
      expected: false,
    },
    {
      description: "rejects a day without a month",
      birthday: { year: 1998, day: 10 },
      expected: false,
    },
    {
      description: "rejects a non-integer year",
      birthday: { year: 1998.5 },
      expected: false,
    },
  ];

  test.each(cases)(
    "$description",
    ({ birthday, expected }) => {
      expect(isValidBirthday(birthday)).toBe(expected);
    }
  );
});