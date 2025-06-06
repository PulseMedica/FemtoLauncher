import electron, { app, BrowserWindow, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { join } from "path";
import childProcess, { exec } from "node:child_process";
import fs from "fs";
import process$1 from "node:process";
import { promisify } from "node:util";
import os from "os";
import fs$1 from "fs/promises";
if (typeof electron === "string") {
  throw new TypeError("Not running in an Electron environment!");
}
const { env } = process;
const isEnvSet = "ELECTRON_IS_DEV" in env;
const getFromEnv = Number.parseInt(env.ELECTRON_IS_DEV, 10) === 1;
const isDev = isEnvSet ? getFromEnv : !electron.app.isPackaged;
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
const TEN_MEGABYTES = 1e3 * 1e3 * 10;
const execFile = promisify(childProcess.execFile);
const processList = async () => {
  let binary;
  switch (process$1.arch) {
    case "x64":
      binary = "fastlist-0.3.0-x64.exe";
      break;
    case "ia32":
      binary = "fastlist-0.3.0-x86.exe";
      break;
    default:
      throw new Error(`Unsupported architecture: ${process$1.arch}`);
  }
  let binaryPath;
  if (isDev) {
    binaryPath = path.join(__dirname$1, "..", "/extras", binary);
  } else {
    binaryPath = path.join(__dirname$1, "..", "..", binary);
  }
  const { stdout } = await execFile(binaryPath, {
    maxBuffer: TEN_MEGABYTES,
    windowsHide: true
  });
  return stdout.trim().split("\r\n").map((line) => line.split("	")).map(([pid, ppid, name]) => ({
    pid: Number.parseInt(pid, 10),
    ppid: Number.parseInt(ppid, 10),
    name
  }));
};
function parseVersion(versionStr) {
  return versionStr.split(".").map((num) => parseInt(num, 10));
}
function compareVersions(v1, v2) {
  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1 = v1[i] || 0;
    const num2 = v2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}
function getHighestVersionFolder(dirPath) {
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    const versionFolders = items.filter((item) => item.isDirectory() && /^\d+(\.\d+)*$/.test(item.name)).map((item) => item.name);
    if (versionFolders.length === 0) {
      return null;
    }
    versionFolders.sort((a, b) => {
      const vA = parseVersion(a);
      const vB = parseVersion(b);
      return compareVersions(vB, vA);
    });
    return versionFolders[0];
  } catch (err) {
    console.error("Error reading directory:", err);
    return null;
  }
}
function getLatestVersionPath() {
  const result = {
    versionNumber: "",
    versionPath: "",
    serverPath: "",
    clientPath: "",
    configPath: ""
  };
  const basePath = path.join(os.homedir(), "AppData", "Local", "PulseMedica", "FIH");
  const currentVersion = getHighestVersionFolder(basePath);
  if (currentVersion !== null) {
    const latestVersionPath = path.join(basePath, currentVersion);
    const serverPath = path.join(latestVersionPath, "server", "PMServer.exe");
    const clientPath = path.join(latestVersionPath, "client", "FSS UI.exe");
    const configPath = path.join(latestVersionPath, "server", "config.exe");
    result.versionNumber = currentVersion;
    result.versionPath = latestVersionPath;
    result.serverPath = serverPath;
    result.clientPath = clientPath;
    result.configPath = configPath;
    console.log(result);
    return result;
  } else {
    result.versionNumber = "[Error] Unable to determine current version #";
    result.versionPath = "[Error] Unable to find current version path.";
    result.serverPath = "[Error] Unable to find server path.";
    result.clientPath = "[Error] Unable to find client path.";
    result.configPath = "[Error] Unable to find config path.";
    return result;
  }
}
async function loadConfigContent() {
  const configPath = "C:/ProgramData/Pulsemedica/FSS/config/hw_profile.json";
  try {
    await fs$1.access(configPath);
    const fileContents = await fs$1.readFile(configPath, "utf-8");
    return fileContents;
  } catch (err) {
    if (err instanceof Error) {
      const defaultConfig = {
        Message: "Config file not found, or could not be opened. Note that hw_profile gets deleted when you run config.exe for target!",
        Config_Path: configPath
      };
      const defaultContent = JSON.stringify(defaultConfig, null, 2);
      return defaultContent;
    }
    throw err;
  }
}
async function saveConfig(textContent) {
  const configPath = "C:/ProgramData/Pulsemedica/FSS/config/hw_profile.json";
  return fs$1.writeFile(configPath, textContent, "utf8").then(() => {
    console.log("Config successfully saved to:", configPath);
    return `[Success] Config updated and saved to: ${configPath}`;
  }).catch((err) => {
    console.error("Error saving config:", err);
    return `[Error] Couldn't save config: ${err.message}`;
  });
}
createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const server_ready_path = join(__dirname, ...isDev ? [".."] : ["..", "..", ".."], "server_ready.txt");
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    title: "FemtoLauncher",
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
    win.loadFile(path.join(__dirname, "../dist/index.html"));
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
ipcMain.handle("get-paths", async (event, ...args) => {
  const result = getLatestVersionPath();
  return result;
});
ipcMain.handle("startup-ui-logs", async (event) => {
  const result = {
    cwd: __dirname,
    server_ready_path
  };
  return result;
});
ipcMain.handle("run-config", async (event, configPath, mode) => {
  console.log("------- run-config has been called -------");
  return new Promise((resolve, reject) => {
    var _a, _b;
    let combinedOutputLines = [];
    let stdoutData = "";
    let stderrData = "";
    let child;
    if (mode === "sim") {
      child = exec(configPath + " -d");
    } else {
      console.log(configPath);
      child = exec(configPath);
    }
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
ipcMain.handle("run-sw", async (event, serverPath, clientPath, mode) => {
  console.log("--------- Running server in target ---------\n");
  if (fs.existsSync(server_ready_path)) {
    console.log("A server ready file already exists, removing it now.");
    try {
      fs.unlinkSync(server_ready_path);
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
  }
  const serverCommand = mode === "sim" ? `${serverPath} sim` : serverPath;
  const child = exec(serverCommand);
  return await new Promise((resolve) => {
    var _a, _b;
    const timeout = 45 * 1e3;
    let interval;
    let timedOut = false;
    const checkReadyFile = () => {
      if (fs.existsSync(server_ready_path)) {
        clearInterval(interval);
        clearTimeout(timeoutHandle);
        event.sender.send("server-stdout", "[Success] Server ready, starting UI now.");
        console.log("Server is ready, opening UI...");
        exec(`"${clientPath}"`);
        resolve({ success: true, message: "[Success] Server process initiated successfully & UI opened." });
      }
    };
    interval = setInterval(checkReadyFile, 1e3);
    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      clearInterval(interval);
      child.kill();
      event.sender.send("server-stderr", "[Error] Server Timeout. Failed to start.");
      console.error("Timeout: server_ready.txt not found.");
      resolve({ success: false, message: "[Error] Server process was not able to start." });
    }, timeout);
    (_a = child.stdout) == null ? void 0 : _a.on("data", (data) => {
      console.log(`stdout: ${data}`);
      event.sender.send("server-stdout", data.toString());
    });
    (_b = child.stderr) == null ? void 0 : _b.on("data", (data) => {
      const msg = data.toString();
      console.error(`stderr: ${msg}`);
      event.sender.send("server-stderr", "[Error] " + msg);
      clearInterval(interval);
      clearTimeout(timeoutHandle);
      child.kill();
      resolve({ success: false, message: "[Error] " + msg });
    });
    child.on("close", (code) => {
      if (!timedOut) console.log(`Server process exited with code ${code}`);
    });
  });
});
ipcMain.handle("close-software", async (event, processName) => {
  const serverProcessName = "PMServer.exe";
  const uiProcessName = "FSS UI.exe";
  const result = {
    serverResponse: "[Error] Some error occurred while trying to close PMServer.exe",
    uiResponse: "[Error] Some error occurred while trying to close FSS UI.exe"
  };
  const killProcessByName = async (targetName, label, timeoutMs = 1e4) => {
    const processes = await processList();
    const matching = processes.filter((p) => p.name === targetName);
    if (matching.length === 0) {
      return `[Error] No running process found with name ${label}.`;
    }
    const killPromises = matching.map(
      (proc) => new Promise((resolve, reject) => {
        try {
          process.kill(proc.pid, "SIGKILL");
          resolve(true);
        } catch (err) {
          reject(`[Error] Failed to kill ${label} (PID ${proc.pid}): ${err}`);
        }
      })
    );
    return Promise.race([
      Promise.allSettled(killPromises).then((results) => {
        const allSucceeded = results.every((res) => res.status === "fulfilled");
        return allSucceeded ? `[Success] ${label} successfully killed.` : `[Partial] Some instances of ${label} could not be killed.`;
      }),
      new Promise(
        (resolve) => setTimeout(() => resolve(`[Error] Timeout while trying to kill ${label}.`), timeoutMs)
      )
    ]);
  };
  result.serverResponse = await killProcessByName(serverProcessName, "PMServer");
  result.uiResponse = await killProcessByName(uiProcessName, "FSS UI");
  return result;
});
ipcMain.handle("poll-service", async (_event, matchPattern) => {
  try {
    const processes = await processList();
    if (!matchPattern) return false;
    return processes.some(
      (proc) => proc.name.toLowerCase().includes(matchPattern.toLowerCase())
    );
  } catch (err) {
    console.error("Error polling processes:", err);
    return false;
  }
});
ipcMain.handle("read-config", async () => {
  const configContent = loadConfigContent();
  return configContent;
});
ipcMain.handle("save-config", async (event, textContent) => {
  const res = await saveConfig(textContent);
  return res;
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
