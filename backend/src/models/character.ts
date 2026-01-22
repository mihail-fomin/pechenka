/**
 * Персонажи игры "Печенька" и их отношения
 * 
 * Лор персонажей:
 * 
 * Печенька бьет Синего, потому как синий — это цвет Куки Монстра. 
 * Печенье для Куки Монстра — это всё. И самая большая любовь, и самый лучший друг, 
 * и смысл жизни. Не будь печенья, Куки Монстр просто не смог бы существовать. 
 * Получается, что Печенька сильнее Синего.
 * 
 * Синий бьет Стронция, потому как синий ассоциируется с небом и атмосферой.
 * Стронций обладает высокой химической активностью, на воздухе быстро реагирует 
 * с влагой и кислородом, покрываясь желтой оксидной пленкой. У Стронция 
 * выработалась аллергия на синий.
 * 
 * Стронций бьет 37, потому как в периодической системе между Рубидием (№37) 
 * и Стронцием (№38) существует давний спор. Главный аргумент Стронция — атомная 
 * масса (87,62 против 85,467). Стронций считается сильнейшим.
 * 
 * 37 бьет Персов, потому как в 37 году произошло восстание в Парфии, которое 
 * подкосило Парфянское царство. Персия и Парфия связаны историей.
 * 
 * Персы бьют Косинуса, потому как персидские математики внесли огромный вклад 
 * в развитие тригонометрии, и косинус — их творение.
 * 
 * Косинус бьет Печеньку, потому как форма печенья часто круглая, а косинус 
 * определяет окружность. Косинус "контролирует" форму печенья.
 */

export enum Character {
  PECHENKA = 'Печенька',
  BLUE = 'Синий',
  STRONTIUM = 'Стронций',
  THIRTYSEVEN = '37',
  PERSIANS = 'Персы',
  COSINUS = 'Косинус'
}

/**
 * Цепочка охоты: кто на кого охотится
 * Каждый персонаж охотится на следующего в цепочке
 * 
 * Для 4 игроков: Печенька → Синий → Стронций → 37 → Печенька
 * Для 5 игроков: Печенька → Синий → Стронций → 37 → Персы → Печенька
 * Для 6 игроков: Печенька → Синий → Стронций → 37 → Персы → Косинус → Печенька
 */
export const HUNT_CHAIN: Record<Character, Character> = {
  [Character.PECHENKA]: Character.BLUE,
  [Character.BLUE]: Character.STRONTIUM,
  [Character.STRONTIUM]: Character.THIRTYSEVEN,
  [Character.THIRTYSEVEN]: Character.PERSIANS,
  [Character.PERSIANS]: Character.COSINUS,
  [Character.COSINUS]: Character.PECHENKA
};

/**
 * Получить персонажей для заданного количества игроков
 * @param playerCount - Количество игроков (4-6)
 * @returns Массив персонажей для игры
 */
export function getCharactersForPlayerCount(playerCount: number): Character[] {
  const allCharacters = [
    Character.PECHENKA,
    Character.BLUE,
    Character.STRONTIUM,
    Character.THIRTYSEVEN,
    Character.PERSIANS,
    Character.COSINUS
  ];
  // Для 4 игроков: убираем Персов и Косинуса
  if (playerCount === 4) {
    return allCharacters.slice(0, 4); // Печенька, Синий, Стронций, 37
  }
  // Для 5 игроков: убираем Косинуса
  if (playerCount === 5) {
    return allCharacters.slice(0, 5); // Печенька, Синий, Стронций, 37, Персы
  }
  // Для 6 игроков: все персонажи
  return allCharacters;
}

/**
 * Получить цепочку охоты для заданного количества игроков
 * @param playerCount - Количество игроков (4-6)
 * @returns Цепочка охоты
 */
export function getHuntChainForPlayerCount(playerCount: number): Partial<Record<Character, Character>> {
  if (playerCount === 4) {
    return {
      [Character.PECHENKA]: Character.BLUE,
      [Character.BLUE]: Character.STRONTIUM,
      [Character.STRONTIUM]: Character.THIRTYSEVEN,
      [Character.THIRTYSEVEN]: Character.PECHENKA // Замыкаем на Печеньку
    };
  }
  if (playerCount === 5) {
    return {
      [Character.PECHENKA]: Character.BLUE,
      [Character.BLUE]: Character.STRONTIUM,
      [Character.STRONTIUM]: Character.THIRTYSEVEN,
      [Character.THIRTYSEVEN]: Character.PERSIANS,
      [Character.PERSIANS]: Character.PECHENKA // Замыкаем на Печеньку
    };
  }
  // Для 6 игроков - полная цепочка
  return HUNT_CHAIN;
}

/**
 * Получить цель охоты для персонажа (кого он должен атаковать)
 * @param character - Персонаж
 * @param playerCount - Количество игроков (опционально, по умолчанию 6)
 * @returns Цель охоты
 */
export function getTarget(character: Character, playerCount: number = 6): Character {
  const chain = getHuntChainForPlayerCount(playerCount);
  const target = chain[character];
  if (!target) {
    throw new Error(`Не найдена цель для персонажа ${character}`);
  }
  return target;
}

/**
 * Получить охотника для персонажа (кто на него охотится)
 * @param character - Персонаж
 * @param playerCount - Количество игроков (опционально, по умолчанию 6)
 * @returns Охотник
 */
export function getHunter(character: Character, playerCount: number = 6): Character {
  const chain = getHuntChainForPlayerCount(playerCount);
  for (const [hunter, target] of Object.entries(chain)) {
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
