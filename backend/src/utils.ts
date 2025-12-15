/**
 * Вспомогательные функции
 */

/**
 * Перемешать массив (алгоритм Фишера-Йетса)
 * @param array - Массив для перемешивания
 * @param seed - Опциональный seed для детерминированности
 * @returns Новый перемешанный массив
 */
export function shuffleArray<T>(array: T[], seed?: number): T[] {
  const shuffled = [...array];
  let random: () => number;

  if (seed !== undefined) {
    let seedValue = seed;
    random = () => {
      seedValue = (seedValue * 9301 + 49297) % 233280;
      return seedValue / 233280;
    };
  } else {
    random = Math.random;
  }

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Создать простой генератор случайных чисел с seed
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  /**
   * Генерация случайного числа от 0 до 1
   */
  random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Генерация случайного целого числа в диапазоне [min, max)
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min)) + min;
  }
}

