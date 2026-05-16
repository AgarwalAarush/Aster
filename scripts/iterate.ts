import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const phase = process.argv[2];
const sweepId = process.argv[3];
const variantModule = process.argv[4];
const variantExport = process.argv[5];

if (!phase || !sweepId) {
  process.stderr.write(
    "usage:\n" +
      "  iterate render <sweep-id> <variant-module> <variant-export>\n" +
      "  iterate ingest-candidates <sweep-id>\n" +
      "  iterate render-critic <sweep-id>\n" +
      "  iterate ingest-critiques <sweep-id>\n" +
      "  iterate aggregate <sweep-id>\n" +
      "  iterate decide <sweep-id>\n",
  );
  process.exit(1);
}

async function run(script: string, args: string[]): Promise<void> {
  const { stdout, stderr } = await execFileAsync(
    "node",
    ["--experimental-strip-types", "--no-warnings", `scripts/${script}.ts`, ...args],
    { maxBuffer: 16 * 1024 * 1024 },
  );
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}

switch (phase) {
  case "render":
    if (!variantModule || !variantExport) {
      process.stderr.write("render needs <variant-module> <variant-export>\n");
      process.exit(1);
    }
    await run("render-iteration-prompts", [sweepId, variantModule, variantExport]);
    break;
  case "ingest-candidates":
    await run("ingest-sweep", [sweepId]);
    break;
  case "render-critic":
    await run("render-critic-prompts", [sweepId]);
    break;
  case "ingest-critiques":
    await run("ingest-critiques", [sweepId]);
    break;
  case "aggregate":
    await run("aggregate-sweep", [sweepId]);
    break;
  case "decide":
    await run("decide", [sweepId]);
    break;
  default:
    process.stderr.write(`unknown phase: ${phase}\n`);
    process.exit(1);
}
