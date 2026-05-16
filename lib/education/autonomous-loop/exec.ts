import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function runNodeScript(script: string, args: string[]): Promise<void> {
  const { stdout, stderr } = await execFileAsync(
    "node",
    ["--experimental-strip-types", "--no-warnings", `scripts/${script}.ts`, ...args],
    { maxBuffer: 32 * 1024 * 1024, cwd: process.cwd() },
  );
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}
