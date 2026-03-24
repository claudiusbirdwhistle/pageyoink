import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { globSync } from "glob";

/**
 * Regression test: ensure no arrow functions or named functions are passed
 * directly to page.evaluate() — TypeScript's __name decorator breaks them
 * in tsx dev mode. All page.evaluate calls must use string-based scripts.
 *
 * ALLOWED:
 *   page.evaluate(`(function() { ... })()`)
 *   page.evaluate(SOME_STRING_VARIABLE)
 *   page.evaluate(SOME_STRING_VARIABLE, arg1, arg2)  // string + serializable args
 *
 * NOT ALLOWED:
 *   page.evaluate(() => { ... })
 *   page.evaluate((arg) => { ... }, value)
 *   page.evaluate(async () => { ... })
 *   page.evaluate(function() { ... })
 */
describe("__name decorator regression", () => {
  it("no arrow/named functions passed to page.evaluate()", () => {
    const sourceFiles = globSync("src/**/*.ts", {
      cwd: process.cwd(),
      ignore: ["src/**/*.test.ts", "src/**/*.d.ts"],
    });

    const violations: string[] = [];

    // Match page.evaluate( followed by an arrow function or function keyword
    // This regex catches:
    //   page.evaluate(() =>
    //   page.evaluate((arg) =>
    //   page.evaluate(async () =>
    //   page.evaluate(async (arg) =>
    //   page.evaluate(function(
    const pattern =
      /page\.evaluate\(\s*(?:async\s+)?(?:\([^)]*\)\s*=>|function\s*\()/;

    for (const file of sourceFiles) {
      const content = readFileSync(file, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
          violations.push(`${file}:${i + 1}: ${lines[i].trim()}`);
        }
      }
    }

    if (violations.length > 0) {
      throw new Error(
        "Found arrow/named functions in page.evaluate() — use string-based scripts instead.\n" +
          "See docs/agent-loop.md 'TypeScript gotcha' section.\n\n" +
          violations.join("\n"),
      );
    }
  });
});
