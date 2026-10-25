import type { StoryDate } from "../lib/domain";

export function isValidBirthday(
  birthday: StoryDate | undefined
): boolean {
  // Birthday is optional.
  if (birthday === undefined) {
    return false;
  }

  const { year, month, day } = birthday;

  if (!Number.isInteger(year)) {
    return false;
  }

  // A year-only record is valid.
  // A day cannot be supplied without a month.
  if (month === undefined) {
    return day === undefined;
  }

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return false;
  }

  // A year-and-month record is valid.
  if (day === undefined) {
    return true;
  }

  if (!Number.isInteger(day) || day < 1) {
    return false;
  }

  const isLeapYear =
    year % 4 === 0 &&
    (year % 100 !== 0 || year % 400 === 0);

  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day <= (daysInMonth[month - 1] ?? 0);
}