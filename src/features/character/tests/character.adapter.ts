/**
 * Integration template: bind these methods to YOUR application's real code.
 * This file deliberately contains no replacement business implementation.
 * Never return hard-coded expected values or mock the logic under test here.
 */
export interface StoryDate {
  year: number;
  month?: number;
  day?: number;
}

/** Canonical test fixture shape; map field names to your real model here. */
export interface CharacterRecord {
  id: string;
  name: string;
  birthday?: StoryDate;
  roles?: string[] | undefined;
  description?: string;
  /** Numeric timestamps used only by the fixtures; convert real ISO dates if needed. */
  createdAt?: number;
}

export type NewCharacter = Omit<CharacterRecord, 'id'>;
export type CharacterPatch = Partial<NewCharacter>;
type MaybePromise<T> = T | Promise<T>;

export interface CharacterDriver {
  /** Reset/isolate the real store and seed valid test projects. */
  seed(
    projects: Record<string, CharacterRecord[]>,
    activeProjectId: string,
  ): MaybePromise<void>;
  getCharacters(projectId: string): MaybePromise<CharacterRecord[]>;
  /** Delegate to the real active-project action; return the record it created. */
  addCharacter(character: NewCharacter): MaybePromise<CharacterRecord>;
  updateCharacter(id: string, patch: CharacterPatch): MaybePromise<void>;
  removeCharacter(id: string): MaybePromise<void>;
  /** Restore mocks/subscriptions/store state after each test, if applicable. */
  dispose?(): MaybePromise<void>;
}

export interface CharacterTestAdapter {
  /** Copy/import the real configured priority, highest first. */
  rolePriority: readonly string[];
  /** Return an exact age or the real missing-value sentinel (null/undefined). */
  calculateAge(
    birth: StoryDate | undefined,
    eventDate: StoryDate | undefined,
  ): number | null | undefined;
  /** An omitted birthday is valid because the field is optional. */
  validateBirthday(value: StoryDate | undefined): boolean;
  searchCharacters(items: CharacterRecord[], query: string): CharacterRecord[];
  sortByRole(items: CharacterRecord[]): CharacterRecord[];
  sortRecentlyAdded(items: CharacterRecord[]): CharacterRecord[];
  createCharacterDriver(): CharacterDriver;
}

function notConnected(name: string): never {
  throw new Error(
    `Connect ${name} in character.adapter.ts to the real project implementation before running these tests.`,
  );
}

// Replace each binding below with a call/import from your actual project.
// Example only, NOT a verified project import:
// import { characterAgeAtYear } from '../domain.ts;
// calculateAge: (birth, event) => calculateAgeAtEvent(birth, event),
export const sut: CharacterTestAdapter = {
  rolePriority: [],
  calculateAge: () => notConnected('characterAgeAtYear'),
  validateBirthday: () => notConnected('validateBirthday'),
  searchCharacters: () => notConnected('searchCharacters'),
  sortByRole: () => notConnected('sortByRole'),
  sortRecentlyAdded: () => notConnected('sortRecentlyAdded'),
  createCharacterDriver: () => notConnected('createCharacterDriver'),
};
