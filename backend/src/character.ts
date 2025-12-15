/**
 * Персонажи игры "Печенька" и их отношения
 */

export enum Character {
  PECHENKA = 'Печенька',
  BLUE = 'Синий',
  STRONTIUM = 'Стронций',
  RED = 'Красный',
  GREEN = 'Зелёный',
  YELLOW = 'Жёлтый'
}

/**
 * Цепочка охоты: кто на кого охотится
 * Каждый персонаж охотится на следующего в цепочке
 */
export const HUNT_CHAIN: Record<Character, Character> = {
  [Character.PECHENKA]: Character.BLUE,
  [Character.BLUE]: Character.STRONTIUM,
  [Character.STRONTIUM]: Character.RED,
  [Character.RED]: Character.GREEN,
  [Character.GREEN]: Character.YELLOW,
  [Character.YELLOW]: Character.PECHENKA
};

/**
 * Получить цель охоты для персонажа (кого он должен атаковать)
 * @param character - Персонаж
 * @returns Цель охоты
 */
export function getTarget(character: Character): Character {
  return HUNT_CHAIN[character];
}

/**
 * Получить охотника для персонажа (кто на него охотится)
 * @param character - Персонаж
 * @returns Охотник
 */
export function getHunter(character: Character): Character {
  for (const [hunter, target] of Object.entries(HUNT_CHAIN)) {
    if (target === character) {
      return hunter as Character;
    }
  }
  throw new Error(`Не найден охотник для персонажа ${character}`);
}

/**
 * Получить все доступные персонажи
 * @returns Массив всех персонажей
 */
export function getAllCharacters(): Character[] {
  return Object.values(Character);
}

