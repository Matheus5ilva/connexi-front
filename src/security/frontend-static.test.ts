import { describe, expect, it } from "vitest";

const sourceFiles = import.meta.glob("../**/*.{ts,tsx}", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

function productionFiles() {
  return Object.entries(sourceFiles).filter(
    ([file]) => !/\.test\.(ts|tsx)$/.test(file),
  );
}

describe("Frontend static security checks", () => {
  it("nao usa console direto nem debugger no codigo de producao", () => {
    const findings = productionFiles().flatMap(([file, content]) => {
      const matches = [
        ...content.matchAll(/\bconsole\.(log|debug|info|warn|error)\b/g),
        ...content.matchAll(/\bdebugger\b/g),
      ];

      return matches.map((match) => `${file}: ${match[0]}`);
    });

    expect(findings).toEqual([]);
  });

  it("nao usa localStorage e mantem sessionStorage em pontos conhecidos", () => {
    const allowedSessionStorageFiles = [
      "../auth/session.ts",
      "../services/api/auth/token-store.ts",
      "../pages/admin/tenants/index.tsx",
    ];

    const localStorageFindings = productionFiles()
      .filter(([, content]) => content.includes("localStorage"))
      .map(([file]) => file);
    const sessionStorageFindings = productionFiles()
      .filter(([, content]) => content.includes("sessionStorage"))
      .map(([file]) => file)
      .filter((file) => !allowedSessionStorageFiles.includes(file));

    expect(localStorageFindings).toEqual([]);
    expect(sessionStorageFindings).toEqual([]);
  });
});
