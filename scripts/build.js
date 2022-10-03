import fs from "fs";
import { execa } from "execa";

const targets = fs.readdirSync("packages").filter((f) => {
  if (!fs.statSync(`packages/${f}`).isDirectory()) {
    return false;
  }
  return true;
});

run();

async function run() {
  await buildAll(targets);
}

async function buildAll(targets) {
  await runParallel(targets, build);
}

async function runParallel(source, iteratorFn) {
  const ret = [];
  for (const item of source) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);
  }
  return Promise.all(ret);
}

async function build(target) {
  await execa(
    "rollup",
    ["-c", "--environment", [`TARGET:${target}`].filter(Boolean).join(",")],
    { stdio: "inherit" }
  );
}
