import { runEducationQaCli } from "../lib/education/qa/cli.ts";

const result = await runEducationQaCli(process.argv.slice(2));

if (result.stdout) {
  process.stdout.write(result.stdout);
}

if (result.stderr) {
  process.stderr.write(result.stderr);
}

process.exitCode = result.exitCode;
