import { app, BrowserWindow, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { join } from "path";
import childProcess, { exec } from "node:child_process";
import fs from "fs";
import process$1 from "node:process";
import { promisify } from "node:util";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
const TEN_MEGABYTES = 1e3 * 1e3 * 10;
const execFile = promisify(childProcess.execFile);
const windows = async () => {
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
  const binaryPath = path.join(__dirname$1, "vendor", binary);
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
const nonWindowsMultipleCalls = async (options = {}) => {
  const flags = (options.all === false ? "" : "a") + "wwxo";
  const returnValue = {};
  await Promise.all(["comm", "args", "ppid", "uid", "%cpu", "%mem"].map(async (cmd) => {
    const { stdout } = await execFile("ps", [flags, `pid,${cmd}`], { maxBuffer: TEN_MEGABYTES });
    for (let line of stdout.trim().split("\n").slice(1)) {
      line = line.trim();
      const [pid] = line.split(" ", 1);
      const value = line.slice(pid.length + 1).trim();
      if (returnValue[pid] === void 0) {
        returnValue[pid] = {};
      }
      returnValue[pid][cmd] = value;
    }
  }));
  return Object.entries(returnValue).filter(([, value]) => value.comm && value.args && value.ppid && value.uid && value["%cpu"] && value["%mem"]).map(([key, value]) => ({
    pid: Number.parseInt(key, 10),
    name: path.basename(value.comm),
    cmd: value.args,
    ppid: Number.parseInt(value.ppid, 10),
    uid: Number.parseInt(value.uid, 10),
    cpu: Number.parseFloat(value["%cpu"]),
    memory: Number.parseFloat(value["%mem"])
  }));
};
const ERROR_MESSAGE_PARSING_FAILED = "ps output parsing failed";
const psOutputRegex = /^[ \t]*(?<pid>\d+)[ \t]+(?<ppid>\d+)[ \t]+(?<uid>[-\d]+)[ \t]+(?<cpu>\d+\.\d+)[ \t]+(?<memory>\d+\.\d+)[ \t]+(?<comm>.*)?/;
const nonWindowsCall = async (options = {}) => {
  const flags = options.all === false ? "wwxo" : "awwxo";
  const psPromises = [
    execFile("ps", [flags, "pid,ppid,uid,%cpu,%mem,comm"], { maxBuffer: TEN_MEGABYTES }),
    execFile("ps", [flags, "pid,args"], { maxBuffer: TEN_MEGABYTES })
  ];
  const [psLines, psArgsLines] = (await Promise.all(psPromises)).map(({ stdout }) => stdout.trim().split("\n"));
  const psPids = new Set(psPromises.map((promise) => promise.child.pid));
  psLines.shift();
  psArgsLines.shift();
  const processCmds = {};
  for (const line of psArgsLines) {
    const [pid, cmds] = line.trim().split(" ");
    processCmds[pid] = cmds.join(" ");
  }
  const processes = psLines.map((line) => {
    const match = psOutputRegex.exec(line);
    if (match === null) {
      throw new Error(ERROR_MESSAGE_PARSING_FAILED);
    }
    const { pid, ppid, uid, cpu, memory, comm } = match.groups;
    const processInfo = {
      pid: Number.parseInt(pid, 10),
      ppid: Number.parseInt(ppid, 10),
      uid: Number.parseInt(uid, 10),
      cpu: Number.parseFloat(cpu),
      memory: Number.parseFloat(memory),
      name: path.basename(comm),
      cmd: processCmds[pid]
    };
    return processInfo;
  }).filter((processInfo) => !psPids.has(processInfo.pid));
  return processes;
};
const nonWindows = async (options = {}) => {
  try {
    return await nonWindowsCall(options);
  } catch {
    return nonWindowsMultipleCalls(options);
  }
};
const psList = process$1.platform === "win32" ? windows : nonWindows;
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
ipcMain.handle("close-software", async (event, processName) => {
  const serverProcess = "PMServer.exe";
  const uiProcess = "FSS UI.exe";
  const result = {
    serverResponse: "[Error] Some error occurred while trying to close PMServer.exe",
    uiResponse: "[Error] Some error occurred while trying to close FSS UI.exe"
  };
  const killProcess = (process2, label, timeoutMs = 1e4) => {
    return Promise.race([
      new Promise((resolve) => {
        exec(`taskkill /IM "${process2}" /F`, (err, stdout, stderr) => {
          if (err) {
            resolve(`[Error] Could not kill ${label}.`);
          } else {
            resolve(`[Success] ${label} successfully killed.`);
          }
        });
      }),
      // Timeout in case it takes too long to return from the promise.
      new Promise(
        (resolve) => setTimeout(() => resolve(`[Error] Timeout while trying to kill ${label}.`), timeoutMs)
      )
    ]);
  };
  await Promise.all([
    killProcess(serverProcess, "PMServer"),
    killProcess(uiProcess, "FSS UI")
  ]);
  result.serverResponse = "[Success] PMServer.exe was closed successfully.";
  result.uiResponse = "[Success] FSS UI.exe was closed successfully.";
  return result;
});
ipcMain.handle("poll-pmserver", async () => {
  const processes = await psList();
  return processes.some((p) => p.name === "PMServer.exe");
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
