import net from "node:net";
import { spawn } from "node:child_process";

const PORT = 5432;
const BIN = "C:\\Program Files\\PostgreSQL\\17\\bin\\postgres.exe";
const DATA = "C:\\Program Files\\PostgreSQL\\17\\data";

function isOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
  });
}

if (await isOpen(PORT)) {
  console.log("PostgreSQL is already running.");
} else {
  const child = spawn(BIN, ["-D", DATA], { detached: true, stdio: "ignore" });
  child.unref();
  console.log("Started PostgreSQL in the background.");
}