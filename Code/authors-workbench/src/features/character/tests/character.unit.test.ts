import { afterEach, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { sut } from './character.adapter';
import type { CharacterDriver, CharacterRecord, StoryDate } from './character.adapter';

const birthday: StoryDate = { year: 1998, month: 5, day: 10 };
const ids = (items: CharacterRecord[]) => items.map((item) => item.id);
const snapshot = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

// US-4.7; also supports the age shown in US-5.7.
describe('Character age calculation', () => {
  test.each([
    { label: 'day before birthday', date: { year: 2026, month: 5, day: 9 }, age: 27 },
    { label: 'on birthday', date: { year: 2026, month: 5, day: 10 }, age: 28 },
    { label: 'day after birthday', date: { year: 2026, month: 5, day: 11 }, age: 28 },
  ])('returns $age $label', ({ date, age }) => {
    expect(sut.calculateAge(birthday, date)).toBe(age);
  });

  const incomplete: Array<{
    label: string;
    birth: StoryDate | undefined;
    event: StoryDate | undefined;
  }> = [
    { label: 'birth date missing', birth: undefined, event: { year: 2026, month: 5, day: 10 } },
    { label: 'birth year only', birth: { year: 1998 }, event: { year: 2026, month: 5, day: 10 } },
    { label: 'birth day missing', birth: { year: 1998, month: 5 }, event: { year: 2026, month: 5, day: 10 } },
    { label: 'event date missing', birth: birthday, event: undefined },
    { label: 'event year only', birth: birthday, event: { year: 2026 } },
    { label: 'event day missing', birth: birthday, event: { year: 2026, month: 5 } },
  ];

  test.each(incomplete)('does not invent an exact age: $label', ({ birth, event }) => {
    const result = sut.calculateAge(birth, event);
    expect(result === undefined || result === null).toBe(true);
  });
});

// US-4.5: exact/partial dates and the optional birthday field.
describe('Birthday validation', () => {
  const valid: Array<{ label: string; value: StoryDate | undefined }> = [
    { label: 'optional birthday omitted', value: undefined },
    { label: 'year-only birth information', value: { year: 1998 } },
    { label: 'valid complete date', value: birthday },
    { label: 'leap day in a leap year', value: { year: 2024, month: 2, day: 29 } },
  ];

  test.each(valid)('accepts $label', ({ value }) => {
    expect(sut.validateBirthday(value)).toBe(true);
  });

  const invalid: Array<{ label: string; value: StoryDate }> = [
    { label: 'month zero', value: { year: 1998, month: 0, day: 10 } },
    { label: 'month thirteen', value: { year: 1998, month: 13, day: 10 } },
    { label: 'day zero', value: { year: 1998, month: 5, day: 0 } },
    { label: 'day thirty-two', value: { year: 1998, month: 5, day: 32 } },
    { label: '30 February', value: { year: 1998, month: 2, day: 30 } },
    { label: '31 April', value: { year: 2026, month: 4, day: 31 } },
    { label: 'leap day in a non-leap year', value: { year: 2023, month: 2, day: 29 } },
    { label: 'a day without a month', value: { year: 1998, day: 10 } },
  ];

  test.each(invalid)('rejects $label', ({ value }) => {
    expect(sut.validateBirthday(value)).toBe(false);
  });
});

// US-4.2: search results and clearing the search.
describe('Character search', () => {
  const characters: CharacterRecord[] = [
    { id: 'alice', name: 'Alice' },
    { id: 'bob', name: 'Bob' },
  ];

  test('returns the character matching the requested name', () => {
    expect(ids(sut.searchCharacters(characters, 'Alice'))).toEqual(['alice']);
  });

  test('returns an empty list when no names match', () => {
    expect(sut.searchCharacters(characters, 'Zoe')).toEqual([]);
  });

  test('restores the full supplied list when the search is cleared', () => {
    expect(ids(sut.searchCharacters(characters, ''))).toEqual(['alice', 'bob']);
  });
});

// US-4.2: use the application's actual role priority, not an invented one.
describe('Character role sorting', () => {
  beforeAll(() => {
    if (sut.rolePriority.length < 2) {
      throw new Error('Bind rolePriority to at least two real configured roles, highest priority first.');
    }
  });

  test('places the higher-priority role first', () => {
    const [high, low] = sut.rolePriority;
    const characters: CharacterRecord[] = [
      { id: 'low', name: 'Low', roles: [low!] },
      { id: 'high', name: 'High', roles: [high!] },
    ];
    expect(ids(sut.sortByRole(characters))).toEqual(['high', 'low']);
  });

  test('uses the highest-priority role when multiple roles are recorded', () => {
    const [high, low] = sut.rolePriority;
    const characters: CharacterRecord[] = [
      { id: 'low', name: 'Low', roles: [low!] },
      { id: 'multiple', name: 'Multiple', roles: [low!, high!] },
    ];
    expect(ids(sut.sortByRole(characters))).toEqual(['multiple', 'low']);
  });

  test.each([
    { label: 'roles omitted', roles: undefined },
    { label: 'empty roles array', roles: [] as string[] },
  ])('places characters without roles last: $label', ({ roles }) => {
    const characters: CharacterRecord[] = [
      { id: 'unassigned', name: 'Unassigned', roles },
      { id: 'assigned', name: 'Assigned', roles: [sut.rolePriority[0]!] },
    ];
    expect(ids(sut.sortByRole(characters))).toEqual(['assigned', 'unassigned']);
  });
});

describe('Recently added character sorting', () => {
  test('sorts from newest to oldest', () => {
    const characters: CharacterRecord[] = [
      { id: 'old', name: 'Old', createdAt: 1000 },
      { id: 'new', name: 'New', createdAt: 3000 },
      { id: 'middle', name: 'Middle', createdAt: 2000 },
    ];
    expect(ids(sut.sortRecentlyAdded(characters))).toEqual(['new', 'middle', 'old']);
  });
});

// US-4.1 / US-4.3 / US-4.4 and current-project isolation from US-4.2.
// The driver must exercise the REAL store/actions while isolating persistence.
describe('Character data operations', () => {
  let driver: CharacterDriver | undefined;

  beforeEach(async () => {
    driver = sut.createCharacterDriver();
    await driver.seed(
      {
        'project-a': [
          { id: 'alice', name: 'Alice', description: 'Original description', birthday, roles: [], createdAt: 1000 },
          { id: 'bob', name: 'Bob', description: 'Bob is unchanged', roles: [], createdAt: 2000 },
        ],
        'project-b': [
          { id: 'charlie', name: 'Charlie', description: 'Other project', roles: [], createdAt: 3000 },
        ],
      },
      'project-a',
    );
  });

  afterEach(async () => {
    await driver?.dispose?.();
    driver = undefined;
  });

  test('adds to the active project without changing existing characters or another project', async () => {
    const store = driver!;
    const beforeA = snapshot(await store.getCharacters('project-a'));
    const beforeB = snapshot(await store.getCharacters('project-b'));

    const created = await store.addCharacter({ name: 'Diana', description: 'New character', roles: [] });
    const afterA = await store.getCharacters('project-a');

    expect(afterA).toHaveLength(beforeA.length + 1);
    expect(afterA.find((item) => item.id === created.id)).toMatchObject({ name: 'Diana', description: 'New character' });
    for (const existing of beforeA) {
      expect(afterA.find((item) => item.id === existing.id)).toEqual(existing);
    }
    expect(await store.getCharacters('project-b')).toEqual(beforeB);
  });

  test('updates only the requested character and preserves unedited information', async () => {
    const store = driver!;
    const beforeA = snapshot(await store.getCharacters('project-a'));
    const beforeB = snapshot(await store.getCharacters('project-b'));
    const alice = beforeA.find((item) => item.id === 'alice')!;
    const bob = beforeA.find((item) => item.id === 'bob')!;

    await store.updateCharacter('alice', { description: 'Updated description' });
    const afterA = await store.getCharacters('project-a');

    expect(afterA.find((item) => item.id === 'alice')).toEqual({ ...alice, description: 'Updated description' });
    expect(afterA.find((item) => item.id === 'bob')).toEqual(bob);
    expect(await store.getCharacters('project-b')).toEqual(beforeB);
  });

  test('removes only the requested character from the active project', async () => {
    const store = driver!;
    const beforeA = snapshot(await store.getCharacters('project-a'));
    const beforeB = snapshot(await store.getCharacters('project-b'));
    const bob = beforeA.find((item) => item.id === 'bob')!;

    await store.removeCharacter('alice');
    const afterA = await store.getCharacters('project-a');

    expect(afterA).toHaveLength(beforeA.length - 1);
    expect(afterA.some((item) => item.id === 'alice')).toBe(false);
    expect(afterA.find((item) => item.id === 'bob')).toEqual(bob);
    expect(await store.getCharacters('project-b')).toEqual(beforeB);
  });
});
