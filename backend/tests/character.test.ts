/**
 * Тесты для модуля character
 */

import { Character, getTarget, getHunter, getAllCharacters, HUNT_CHAIN } from '../src/models/character';

describe('Character', () => {
  test('должен получить цель охоты для каждого персонажа', () => {
    expect(getTarget(Character.PECHENKA)).toBe(Character.BLUE);
    expect(getTarget(Character.BLUE)).toBe(Character.STRONTIUM);
    expect(getTarget(Character.STRONTIUM)).toBe(Character.RED);
    expect(getTarget(Character.RED)).toBe(Character.GREEN);
    expect(getTarget(Character.GREEN)).toBe(Character.YELLOW);
    expect(getTarget(Character.YELLOW)).toBe(Character.PECHENKA);
  });

  test('должен получить охотника для каждого персонажа', () => {
    expect(getHunter(Character.PECHENKA)).toBe(Character.YELLOW);
    expect(getHunter(Character.BLUE)).toBe(Character.PECHENKA);
    expect(getHunter(Character.STRONTIUM)).toBe(Character.BLUE);
    expect(getHunter(Character.RED)).toBe(Character.STRONTIUM);
    expect(getHunter(Character.GREEN)).toBe(Character.RED);
    expect(getHunter(Character.YELLOW)).toBe(Character.GREEN);
  });

  test('должен вернуть все персонажи', () => {
    const characters = getAllCharacters();
    expect(characters).toHaveLength(6);
    expect(characters).toContain(Character.PECHENKA);
    expect(characters).toContain(Character.BLUE);
    expect(characters).toContain(Character.STRONTIUM);
    expect(characters).toContain(Character.RED);
    expect(characters).toContain(Character.GREEN);
    expect(characters).toContain(Character.YELLOW);
  });

  test('цепочка охоты должна быть замкнутой', () => {
    const allCharacters = getAllCharacters();
    const targets = allCharacters.map(char => getTarget(char));
    
    // Каждый персонаж должен быть целью ровно один раз
    const targetCounts = new Map<Character, number>();
    targets.forEach(target => {
      targetCounts.set(target, (targetCounts.get(target) || 0) + 1);
    });
    
    allCharacters.forEach(char => {
      expect(targetCounts.get(char)).toBe(1);
    });
  });
});

