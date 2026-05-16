import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runEducationQaCli } from "./cli";
import { gqaStrongCandidate } from "./fixtures/gqa";

describe("runEducationQaCli", () => {
  it("archives a manually generated candidate as normalized JSON", async () => {
    const root = await mkdtemp(join(tmpdir(), "aster-qa-cli-"));
    const inputPath = join(root, "candidate.json");
    const archiveDir = join(root, "archive");

    await writeFile(inputPath, JSON.stringify(gqaStrongCandidate), "utf8");

    const result = await runEducationQaCli(["archive", "--input", inputPath, "--out-dir", archiveDir]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("gqa-strong");
    await expect(readFile(join(archiveDir, "gqa-strong.json"), "utf8")).resolves.toContain(
      "Grouped Query Attention",
    );
  });

  it("grades archived candidates and reports the best candidate", async () => {
    const root = await mkdtemp(join(tmpdir(), "aster-qa-cli-"));
    const archiveDir = join(root, "archive");

    await runEducationQaCli(["archive", "--input-json", JSON.stringify(gqaStrongCandidate), "--out-dir", archiveDir]);
    const result = await runEducationQaCli(["grade", "--dir", archiveDir]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Best candidate: gqa-strong");
    expect(result.stdout).toContain("Score:");
  });
});
