import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Regression guard for the dependency security updates in this change.
 *
 * - GHSA-wc9v-mj63-m9g5 / CVE-2017-16082 (pg): the advisory only lists fixes
 *   for old major lines (2.11.2 for 2.x, 3.6.4 for 3.x, ...). Every pg 8.x
 *   release is already fixed, and @prisma/adapter-pg additionally requires
 *   pg ^8.16.3, so moving the manifest back below 8.x would reintroduce the
 *   RCE and break the Prisma adapter.
 * - GHSA-mrhx-c7xc-m3w5 / CVE-2023-54404 (zod): fixed in zod 4.6.6.
 *
 * The assertion is on the declared minimum, so a range such as "^4.6.6" is
 * still allowed to resolve to the newer 4.6.7 that is installed today.
 */

const backendRoot = join(import.meta.dir, "..", "..", "..");

type Version = [number, number, number];

const SECURITY_FLOORS: Record<string, Version> = {
  pg: [8, 0, 0],
  zod: [4, 6, 6],
};

function readManifestRanges(): Record<string, string> {
  const manifest = JSON.parse(readFileSync(join(backendRoot, "package.json"), "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  return { ...manifest.devDependencies, ...manifest.dependencies };
}

function declaredMinimum(range: string): Version {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(range);
  if (!match) throw new Error(`Unsupported version range: ${range}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compare(a: Version, b: Version): number {
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

describe("security floors for patched dependencies", () => {
  const ranges = readManifestRanges();

  for (const [name, floor] of Object.entries(SECURITY_FLOORS)) {
    test(`${name} stays at or above the patched version`, () => {
      const declared = ranges[name];
      expect(declared).toBeDefined();
      expect(compare(declaredMinimum(declared as string), floor)).toBeGreaterThanOrEqual(0);
    });
  }
});
