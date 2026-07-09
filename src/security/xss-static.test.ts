import { describe, expect, it } from "vitest";

const forbiddenSinks = [
  "dangerouslySet" + "InnerHTML",
  "inner" + "HTML",
  "outer" + "HTML",
  "document." + "write",
  "eval(",
  "new " + "Function",
];
const sourceFiles = import.meta.glob("../**/*.{ts,tsx}", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

describe("XSS static checks", () => {
  it("nao usa sinks perigosos de HTML no codigo de producao", () => {
    const findings = Object.entries(sourceFiles).flatMap(([file, content]) => {
      if (/\.test\.(ts|tsx)$/.test(file)) {
        return [];
      }
      return forbiddenSinks
        .filter((sink) => content.includes(sink))
        .map((sink) => `${file}: ${sink}`);
    });

    expect(findings).toEqual([]);
  });
});
