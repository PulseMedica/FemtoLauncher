import { app, BrowserWindow, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { join } from "path";
import { exec } from "node:child_process";
import fs from "fs";
createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(
  () => {
    createWindow();
  }
);
ipcMain.handle("run-config", async (event, ...args) => {
  console.log("------- run-config has been called -------");
  const config_exe_path = join(__dirname, "..", "electron/main/scripts/config.exe");
  return new Promise((resolve, reject) => {
    var _a, _b;
    let combinedOutputLines = [];
    let stdoutData = "";
    let stderrData = "";
    const child = exec(config_exe_path);
    (_a = child.stdout) == null ? void 0 : _a.on("data", (data) => {
      const chunk = data.toString();
      stdoutData += chunk;
      chunk.split("\n").forEach((line) => {
        if (line.trim()) {
          combinedOutputLines.push(line);
          console.log(`${line}`);
        }
      });
    });
    (_b = child.stderr) == null ? void 0 : _b.on("data", (data) => {
      const chunk = data.toString();
      stderrData += chunk;
      chunk.split("\n").forEach((line) => {
        if (line.trim()) {
          combinedOutputLines.push(line);
          console.log(`${line}`);
        }
      });
    });
    child.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
      const result = {
        // Note that stdout & stderr aren't actually used, but if you need them here they are.
        stdout: stdoutData,
        stderr: stderrData,
        outputLines: combinedOutputLines,
        // 1 array that has the output. This is to maintain sequential ordering.
        exitCode: code,
        success: code === 0
      };
      if (code === 0) {
        resolve(result);
      } else {
        const error = new Error(`Child process exited with code ${code}`);
        reject(error);
      }
    });
    child.on("error", (err) => {
      console.error("Failed to start child process.", err);
      `Failed to start process: ${err.message}`;
      reject(err);
    });
  });
});
ipcMain.handle("run-sw-sim", async (event) => {
  var _a, _b;
  console.log("--------- Running software in simulation ---------");
  const server_ready_path = join(__dirname, "..", "server_ready.txt");
  const serverPath = "c:/Users/nathan_pulsemedica/AppData/Local/PulseMedica/FIH/1.0.0.779/server/PMServer.exe";
  const uiPath = "C:/Users/nathan_pulsemedica/AppData/Local/PulseMedica/FIH/1.0.0.779/client/FSS UI.exe";
  if (fs.existsSync(server_ready_path)) {
    console.log("A server ready file already exists, removing it now.");
    fs.unlinkSync(server_ready_path);
  }
  const child = exec(serverPath + " sim");
  (_a = child.stdout) == null ? void 0 : _a.on("data", (data) => {
    console.log(`stdout: ${data}`);
    event.sender.send("server-stdout", data.toString());
  });
  (_b = child.stderr) == null ? void 0 : _b.on("data", (data) => {
    console.error(`stderr: ${data}`);
    event.sender.send("server-stderr", data.toString());
  });
  child.on("close", (code) => {
    console.log(`Server process exited with code ${code}`);
    event.sender.send("server-close", code);
  });
  const timeout = 30;
  let timer = 0;
  const interval = setInterval(() => {
    if (fs.existsSync(server_ready_path)) {
      clearInterval(interval);
      event.sender.send("server-sim-ready", true);
      console.log("Server is ready, opening UI...");
      exec(`"${uiPath}"`);
    }
    timer++;
    if (timer > timeout) {
      clearInterval(interval);
      console.error("Timeout: server_ready.txt not found.");
      event.sender.send("server-sim-ready", false);
      child.kill();
    }
  }, 1e3);
  return { success: true, message: "Server process initiated successfully & UI opened." };
});
ipcMain.handle("run-sw-target", async (event) => {
  var _a, _b;
  console.log("--------- Running server in target ---------");
  const server_ready_path = join(__dirname, "..", "server_ready.txt");
  const serverPath = "c:/Users/nathan_pulsemedica/AppData/Local/PulseMedica/FIH/1.0.0.779/server/PMServer.exe";
  const uiPath = "C:/Users/nathan_pulsemedica/AppData/Local/PulseMedica/FIH/1.0.0.779/client/FSS UI.exe";
  if (fs.existsSync(server_ready_path)) {
    console.log("A server ready file already exists, removing it now.");
    fs.unlinkSync(server_ready_path);
  }
  const child = exec(serverPath);
  (_a = child.stdout) == null ? void 0 : _a.on("data", (data) => {
    console.log(`stdout: ${data}`);
    event.sender.send("server-stdout", data.toString());
  });
  (_b = child.stderr) == null ? void 0 : _b.on("data", (data) => {
    console.error(`stderr: ${data}`);
    event.sender.send("server-stderr", data.toString());
  });
  child.on("close", (code) => {
    console.log(`Server process exited with code ${code}`);
    event.sender.send("server-close", code);
  });
  const timeout = 30;
  let timer = 0;
  const interval = setInterval(() => {
    if (fs.existsSync(server_ready_path)) {
      clearInterval(interval);
      event.sender.send("server-ready", true);
      console.log("Server is ready, opening UI...");
      exec(`"${uiPath}"`);
    }
    timer++;
    if (timer > timeout) {
      clearInterval(interval);
      console.error("Timeout: server_ready.txt not found.");
      event.sender.send("server-ready", false);
      child.kill();
    }
  }, 1e3);
  return { success: true, message: "Server process initiated successfully & UI opened." };
});
ipcMain.handle("kill-software", async (event) => {
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
