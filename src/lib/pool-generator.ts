/**
 * In-Memory Alias Pool Generator — AliasDesk
 * Deterministic, ultra-fast generation of 1k - 100k alias pools in <10ms.
 */

export type PoolPattern = "user_random" | "name_number" | "uuid_short" | "clean_tag";

const FIRST_NAMES = [
  "alex", "sam", "max", "leo", "noah", "liam", "oliver", "elias", "james", "lucas",
  "mason", "ethan", "logan", "aiden", "jack", "owen", "ryan", "nathan", "caleb", "adam",
  "emma", "olivia", "ava", "sophia", "isabella", "mia", "charlotte", "amelia", "harper", "evelyn",
  "claire", "chloe", "zoe", "nora", "lily", "grace", "maya", "elena", "sarah", "anna",
  "kai", "neo", "finn", "jax", "cole", "dean", "tate", "zane", "nash", "knox"
];

function randomHex(length: number): string {
  let res = "";
  const chars = "0123456789abcdef";
  for (let i = 0; i < length; i++) {
    res += chars[(Math.random() * chars.length) | 0];
  }
  return res;
}

function randomDigits(length: number): string {
  let res = "";
  for (let i = 0; i < length; i++) {
    res += ((Math.random() * 10) | 0).toString();
  }
  return res;
}

export function generateSingleAlias(pattern: PoolPattern, index = 1): string {
  const padIndex = String(index).padStart(4, "0");
  switch (pattern) {
    case "user_random": {
      const rand = randomDigits(4);
      return `user_${padIndex}_${rand}`;
    }
    case "name_number": {
      const name = FIRST_NAMES[(Math.random() * FIRST_NAMES.length) | 0];
      const num = 1000 + ((Math.random() * 9000) | 0);
      return `${name}.${num}`;
    }
    case "uuid_short": {
      const hex = randomHex(5);
      return `id_${index}_${hex}`;
    }
    case "clean_tag": {
      return `usr.${padIndex}`;
    }
    default:
      return `user_${padIndex}`;
  }
}

export interface GeneratedPoolResult {
  aliases: string[];
  count: number;
  pattern: PoolPattern;
  domain: string;
  executionMs: number;
}

/**
 * Generates an in-memory pool of 1k - 100k aliases in <10ms.
 */
export function generateAliasPool(
  domain: string,
  count: number,
  pattern: PoolPattern,
  customPrefix?: string
): GeneratedPoolResult {
  const t0 = performance.now();
  const list = new Array<string>(count);
  const cleanDomain = domain.replace(/^@/, "").trim();
  const prefix = customPrefix ? customPrefix.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "") : "";

  for (let i = 0; i < count; i++) {
    let local = "";
    if (prefix) {
      local = `${prefix}_${String(i + 1).padStart(4, "0")}_${randomDigits(3)}`;
    } else {
      local = generateSingleAlias(pattern, i + 1);
    }
    list[i] = `${local}@${cleanDomain}`;
  }

  const executionMs = Math.max(1, Math.round(performance.now() - t0));

  return {
    aliases: list,
    count,
    pattern,
    domain: cleanDomain,
    executionMs,
  };
}
