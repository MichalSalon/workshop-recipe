import { spawn } from "node:child_process";

const children = [
  spawn("npm", ["run", "dev", "-w", "@deck/api"], { stdio: "inherit" }),
  spawn("npm", ["run", "dev", "-w", "@deck/frontend"], { stdio: "inherit" }),
];

const stop = () => {
  for (const child of children) child.kill("SIGTERM");
};

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

for (const child of children) {
  child.on("exit", (code) => {
    if (code && code !== 0) stop();
  });
}
