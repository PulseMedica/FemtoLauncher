import C, { app as y, BrowserWindow as R, ipcMain as m } from "electron";
import { createRequire as N } from "node:module";
import { fileURLToPath as T } from "node:url";
import c from "node:path";
import { join as $ } from "path";
import j, { exec as S } from "node:child_process";
import v from "fs";
import x from "node:process";
import { promisify as L } from "node:util";
import V from "os";
import E from "fs/promises";
if (typeof C == "string")
  throw new TypeError("Not running in an Electron environment!");
const { env: F } = process, k = "ELECTRON_IS_DEV" in F, D = Number.parseInt(F.ELECTRON_IS_DEV, 10) === 1, O = k ? D : !C.app.isPackaged, _ = c.dirname(T(import.meta.url)), M = 1e3 * 1e3 * 10, A = L(j.execFile), U = async () => {
  let e;
  switch (x.arch) {
    case "x64":
      e = "fastlist-0.3.0-x64.exe";
      break;
    case "ia32":
      e = "fastlist-0.3.0-x86.exe";
      break;
    default:
      throw new Error(`Unsupported architecture: ${x.arch}`);
  }
  let r;
  O ? r = c.join(_, "..", "/extras", e) : r = c.join(_, "..", "..", e);
  const { stdout: t } = await A(r, {
    maxBuffer: M,
    windowsHide: !0
  });
  return t.trim().split(`\r
`).map((o) => o.split("	")).map(([o, n, i]) => ({
    pid: Number.parseInt(o, 10),
    ppid: Number.parseInt(n, 10),
    name: i
  }));
};
function I(e) {
  return e.split(".").map((r) => parseInt(r, 10));
}
function B(e, r) {
  for (let t = 0; t < Math.max(e.length, r.length); t++) {
    const o = e[t] || 0, n = r[t] || 0;
    if (o > n) return 1;
    if (o < n) return -1;
  }
  return 0;
}
function H(e) {
  try {
    const t = v.readdirSync(e, { withFileTypes: !0 }).filter((o) => o.isDirectory() && /^\d+(\.\d+)*$/.test(o.name)).map((o) => o.name);
    return t.length === 0 ? null : (t.sort((o, n) => {
      const i = I(o), a = I(n);
      return B(a, i);
    }), t[0]);
  } catch (r) {
    return console.error("Error reading directory:", r), null;
  }
}
function W() {
  const e = {
    versionNumber: "",
    versionPath: "",
    serverPath: "",
    clientPath: "",
    configPath: ""
  }, r = c.join(V.homedir(), "AppData", "Local", "PulseMedica", "FIH"), t = H(r);
  if (t !== null) {
    const o = c.join(r, t), n = c.join(o, "server", "PMServer.exe"), i = c.join(o, "client", "FSS UI.exe"), a = c.join(o, "server", "config.exe");
    return e.versionNumber = t, e.versionPath = o, e.serverPath = n, e.clientPath = i, e.configPath = a, console.log(e), e;
  } else
    return e.versionNumber = "[Error] Unable to determine current version #", e.versionPath = "[Error] Unable to find current version path.", e.serverPath = "[Error] Unable to find server path.", e.clientPath = "[Error] Unable to find client path.", e.configPath = "[Error] Unable to find config path.", e;
}
async function q() {
  const e = "C:/ProgramData/Pulsemedica/FSS/config/hw_profile.json";
  try {
    return await E.access(e), await E.readFile(e, "utf-8");
  } catch (r) {
    if (r instanceof Error)
      return JSON.stringify({
        Message: "Config file not found, or could not be opened. Note that hw_profile gets deleted when you run config.exe for target!",
        Config_Path: e
      }, null, 2);
    throw r;
  }
}
async function G(e) {
  const r = "C:/ProgramData/Pulsemedica/FSS/config/hw_profile.json";
  return E.writeFile(r, e, "utf8").then(() => (console.log("Config successfully saved to:", r), `[Success] Config updated and saved to: ${r}`)).catch((t) => (console.error("Error saving config:", t), `[Error] Couldn't save config: ${t.message}`));
}
N(import.meta.url);
const w = c.dirname(T(import.meta.url));
process.env.APP_ROOT = c.join(w, "..");
const P = process.env.VITE_DEV_SERVER_URL, ne = c.join(process.env.APP_ROOT, "dist-electron"), J = c.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = P ? c.join(process.env.APP_ROOT, "public") : J;
let h;
function b() {
  h = new R({
    title: "FemtoLauncher",
    icon: c.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: c.join(w, "preload.mjs")
    }
  }), h.webContents.on("did-finish-load", () => {
    h == null || h.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), P ? h.loadURL(P) : h.loadFile(c.join(w, "../dist/index.html"));
}
y.on("window-all-closed", () => {
  process.platform !== "darwin" && (y.quit(), h = null);
});
y.on("activate", () => {
  R.getAllWindows().length === 0 && b();
});
y.whenReady().then(
  () => {
    b();
  }
);
m.handle("get-paths", async (e, ...r) => W());
m.handle("run-config", async (e, r, t) => (console.log("------- run-config has been called -------"), new Promise((o, n) => {
  var u, s;
  let i = [], a = "", f = "", l;
  t === "sim" ? l = S(r + " -d") : (console.log(r), l = S(r)), (u = l.stdout) == null || u.on("data", (d) => {
    const g = d.toString();
    a += g, g.split(`
`).forEach((p) => {
      p.trim() && (i.push(p), console.log(`${p}`));
    });
  }), (s = l.stderr) == null || s.on("data", (d) => {
    const g = d.toString();
    f += g, g.split(`
`).forEach((p) => {
      p.trim() && (i.push(p), console.log(`${p}`));
    });
  }), l.on("close", (d) => {
    console.log(`child process exited with code ${d}`);
    const g = {
      // Note that stdout & stderr aren't actually used, but if you need them here they are.
      stdout: a,
      stderr: f,
      outputLines: i,
      // 1 array that has the output. This is to maintain sequential ordering.
      exitCode: d,
      success: d === 0
    };
    if (d === 0)
      o(g);
    else {
      const p = new Error(`Child process exited with code ${d}`);
      n(p);
    }
  }), l.on("error", (d) => {
    console.error("Failed to start child process.", d), `${d.message}`, n(d);
  });
})));
m.handle("run-sw-sim", async (e, r, t) => {
  var l, u;
  console.log(`--------- Running software in simulation ---------
`);
  const o = $(w, "..", "server_ready.txt");
  if (v.existsSync(o)) {
    console.log("A server ready file already exists, removing it now.");
    try {
      v.unlinkSync(o);
    } catch (s) {
      if (s.code !== "ENOENT")
        throw s;
    }
  }
  const n = S(r + " sim");
  (l = n.stdout) == null || l.on("data", (s) => {
    console.log(`stdout: ${s}`), e.sender.send("server-stdout", s.toString());
  }), (u = n.stderr) == null || u.on("data", (s) => {
    console.error(`stderr: ${s}`), e.sender.send("server-stderr", "[Error] " + s.toString());
  }), n.on("close", (s) => {
    console.log(`Server process exited with code ${s}`), e.sender.send("server-close", s);
  });
  const i = 30;
  let a = 0;
  const f = setInterval(() => {
    v.existsSync(o) && (clearInterval(f), e.sender.send("server-stdout", `
[Success] Server ready, starting UI now.`), console.log("Server is ready, opening UI..."), S(`"${t}"`)), a++, a > i && (clearInterval(f), console.error("Timeout: server_ready.txt not found."), e.sender.send("server-stderr", `
[Error] Server Timeout. Failed to start.`), n.kill());
  }, 1e3);
  return { success: !0, message: "Server process initiated successfully & UI opened." };
});
m.handle("run-sw-target", async (e, r, t) => {
  var l, u;
  console.log(`--------- Running server in target ---------
`);
  const o = $(w, "..", "server_ready.txt");
  if (v.existsSync(o)) {
    console.log("A server ready file already exists, removing it now.");
    try {
      v.unlinkSync(o);
    } catch (s) {
      if (s.code !== "ENOENT")
        throw s;
    }
  }
  const n = S(r);
  (l = n.stdout) == null || l.on("data", (s) => {
    console.log(`stdout: ${s}`), e.sender.send("server-stdout", s.toString());
  }), (u = n.stderr) == null || u.on("data", (s) => {
    console.error(`stderr: ${s}`), e.sender.send("server-stderr", "[Error] " + s.toString());
  }), n.on("close", (s) => {
    console.log(`Server process exited with code ${s}`), e.sender.send("server-close", s);
  });
  const i = 30;
  let a = 0;
  const f = setInterval(() => {
    v.existsSync(o) && (clearInterval(f), e.sender.send("server-stdout", `
[Success] Server ready, starting UI now.`), console.log("Server is ready, opening UI..."), S(`"${t}"`)), a++, a > i && (clearInterval(f), console.error("Timeout: server_ready.txt not found."), e.sender.send("server-stderr", `
[Error] Server Timeout. Failed to start.`), n.kill());
  }, 1e3);
  return { success: !0, message: "Server process initiated successfully & UI opened." };
});
m.handle("close-software", async (e, r) => {
  const t = "PMServer.exe", o = "FSS UI.exe", n = {
    serverResponse: "[Error] Some error occurred while trying to close PMServer.exe",
    uiResponse: "[Error] Some error occurred while trying to close FSS UI.exe"
  }, i = (a, f, l = 1e4) => Promise.race([
    new Promise((u) => {
      S(`taskkill /IM "${a}" /F`, (s, d, g) => {
        u(s ? `[Error] Could not kill ${f}.` : `[Success] ${f} successfully killed.`);
      });
    }),
    // Timeout in case it takes too long to return from the promise.
    new Promise(
      (u) => setTimeout(() => u(`[Error] Timeout while trying to kill ${f}.`), l)
    )
  ]);
  return await Promise.all([
    i(t, "PMServer"),
    i(o, "FSS UI")
  ]), n.serverResponse = "[Success] PMServer.exe was closed successfully.", n.uiResponse = "[Success] FSS UI.exe was closed successfully.", n;
});
m.handle("poll-service", async (e, r) => {
  try {
    const t = await U();
    return r ? t.some(
      (o) => o.name.toLowerCase().includes(r.toLowerCase())
    ) : !1;
  } catch (t) {
    return console.error("Error polling processes:", t), !1;
  }
});
m.handle("read-config", async () => q());
m.handle("save-config", async (e, r) => await G(r));
m.handle("debug", async (e) => await U());
export {
  ne as MAIN_DIST,
  J as RENDERER_DIST,
  P as VITE_DEV_SERVER_URL
};
