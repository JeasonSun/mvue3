import { execa } from "execa";

const target = "reactivity";

build(target);

async function build(target) {
  await execa("rollup", ["-cw", "--environment", `TARGET:${target}`], {
    stdio: "inherit",
  });
}
