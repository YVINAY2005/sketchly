import { WORD_DATASET, WordEntry } from '@sketchly/shared';

export class WordService {
  /**
   * Normalizes a string: trims, lowercases, and collapses whitespace.
   */
  public static normalize(text: string): string {
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /**
   * Selects N random words from the dataset matching the chosen category and custom words.
   */
  public static getWordChoices(
    count: number = 3,
    category: string = 'all',
    customWords: string[] = []
  ): string[] {
    let pool: string[] = [];

    // Include custom words if provided
    if (customWords && customWords.length > 0) {
      pool.push(...customWords.map(w => w.trim()).filter(Boolean));
    }

    // Filter main dataset
    const filteredDataset = category === 'all'
      ? WORD_DATASET
      : WORD_DATASET.filter(entry => entry.category === category);

    pool.push(...filteredDataset.map(e => e.word));

    // Deduplicate pool
    const uniquePool = Array.from(new Set(pool.map(w => w.toLowerCase())));

    if (uniquePool.length <= count) {
      return uniquePool;
    }

    // Shuffle and pick `count` words
    const shuffled = [...uniquePool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Generates a masked string with underscores for hidden letters, keeping spaces and symbols.
   */
  public static generateMask(word: string, revealedIndices: Set<number> = new Set()): string {
    const chars = word.split('');
    return chars
      .map((char, index) => {
        if (char === ' ') return '  ';
        if (char === '-' || char === '\'') return char;
        if (revealedIndices.has(index)) return char.toUpperCase();
        return '_';
      })
      .join(' ');
  }

  /**
   * Calculates Levenshtein distance between two normalized strings.
   */
  public static levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Determines whether a guess is close to the target word (1 character difference for words >= 4 letters).
   */
  public static isCloseGuess(guess: string, target: string): boolean {
    const normGuess = this.normalize(guess);
    const normTarget = this.normalize(target);

    if (normGuess === normTarget) return false;
    if (normTarget.length < 4) return false;

    const dist = this.levenshteinDistance(normGuess, normTarget);
    return dist === 1;
  }
}
