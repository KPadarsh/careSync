import { spawn } from "child_process";

const socketProc = spawn("npx", ["tsx", "src/server/socket-server.ts"], {
  stdio: "inherit",
  shell: true,
});

const nextProc = spawn("npx", ["next", "dev"], {
  stdio: "inherit",
  shell: true,
});

const cleanup = () => {
  try {
    socketProc.kill();
  } catch {}
  try {
    nextProc.kill();
  } catch {}
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);
