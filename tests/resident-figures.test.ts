import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { DEFAULT_RESIDENT, draftSchema, placeSchema, residentSchema } from '../src/lib/schema';
import { simulateResidents } from '../src/lib/simulation';

const legacyPlace = JSON.parse(readFileSync('examples/my-little-place.json', 'utf8'));
const { figure: _figure, ...legacyResident } = DEFAULT_RESIDENT;

describe('Resident figure compatibility', () => {
  it('keeps the original figure for old places and browser drafts', () => {
    for (const schema of [placeSchema, draftSchema]) {
      expect(schema.parse(legacyPlace).resident.figure).toBe('male');
      expect(schema.parse({ ...legacyPlace, resident: legacyResident }).resident.figure).toBe(
        'male',
      );
    }
    expect(
      draftSchema.parse({ ...legacyPlace, resident: { ...legacyResident, name: '', greeting: '' } })
        .resident.figure,
    ).toBe('male');
  });

  it.each(['male', 'female'] as const)(
    'preserves %s through draft storage and JSON export',
    (figure) => {
      const input = { ...legacyPlace, resident: { ...DEFAULT_RESIDENT, figure } };
      const restored = draftSchema.parse(JSON.parse(JSON.stringify(input)));
      const exported = JSON.stringify(placeSchema.parse(restored));
      expect(placeSchema.parse(JSON.parse(exported)).resident).toEqual(input.resident);
    },
  );

  it.each(['unknown', '', null, 1, {}])('rejects unsupported figure values: %j', (figure) => {
    for (const schema of [placeSchema, draftSchema])
      expect(
        schema.safeParse({ ...legacyPlace, resident: { ...DEFAULT_RESIDENT, figure } }).success,
      ).toBe(false);
  });

  it('retains strict validation for unrelated fields', () => {
    expect(residentSchema.safeParse({ ...DEFAULT_RESIDENT, unexpected: true }).success).toBe(false);
  });

  it('changes appearance without changing routes or event participation', () => {
    const male = placeSchema.parse({
      ...legacyPlace,
      resident: {
        ...DEFAULT_RESIDENT,
        routine: { morning: 'stroll', afternoon: 'stroll', evening: 'stroll', night: 'stroll' },
      },
    });
    const female = { ...male, resident: { ...male.resident, figure: 'female' as const } };
    for (let minute = 0; minute < 1440; minute += 17) {
      const {
        resident: maleResident,
        home: maleHome,
        ...maleState
      } = simulateResidents([male], minute, 0)[0];
      const {
        resident: femaleResident,
        home: femaleHome,
        ...femaleState
      } = simulateResidents([female], minute, 0)[0];
      expect(femaleState).toEqual(maleState);
      expect(femaleHome.id).toBe(maleHome.id);
      expect(femaleResident.figure).toBe('female');
      expect(maleResident.figure).toBe('male');
    }
  });
});
