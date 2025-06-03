import { app as y, BrowserWindow as b, ipcMain as h } from "electron";
import { createRequire as T } from "node:module";
import { fileURLToPath as C } from "node:url";
import u from "node:path";
import { join as R } from "path";
import j, { exec as w } from "node:child_process";
import g from "fs";
import E from "node:process";
import { promisify as L } from "node:util";
import A from "os";
import x from "fs/promises";
const O = u.dirname(C(import.meta.url)), S = 1e3 * 1e3 * 10, P = L(j.execFile), V = async () => {
  let e;
  switch (E.arch) {
    case "x64":
      e = "fastlist-0.3.0-x64.exe";
      break;
    case "ia32":
      e = "fastlist-0.3.0-x86.exe";
      break;
    default:
      throw new Error(`Unsupported architecture: ${E.arch}`);
  }
  const o = u.join(O, "vendor", e), { stdout: t } = await P(o, {
    maxBuffer: S,
    windowsHide: !0
  });
  return t.trim().split(`\r
`).map((r) => r.split("	")).map(([r, n, i]) => ({
    pid: Number.parseInt(r, 10),
    ppid: Number.parseInt(n, 10),
    name: i
  }));
}, k = async (e = {}) => {
  const o = (e.all === !1 ? "" : "a") + "wwxo", t = {};
  return await Promise.all(["comm", "args", "ppid", "uid", "%cpu", "%mem"].map(async (r) => {
    const { stdout: n } = await P("ps", [o, `pid,${r}`], { maxBuffer: S });
    for (let i of n.trim().split(`
`).slice(1)) {
      i = i.trim();
      const [c] = i.split(" ", 1), d = i.slice(c.length + 1).trim();
      t[c] === void 0 && (t[c] = {}), t[c][r] = d;
    }
  })), Object.entries(t).filter(([, r]) => r.comm && r.args && r.ppid && r.uid && r["%cpu"] && r["%mem"]).map(([r, n]) => ({
    pid: Number.parseInt(r, 10),
    name: u.basename(n.comm),
    cmd: n.args,
    ppid: Number.parseInt(n.ppid, 10),
    uid: Number.parseInt(n.uid, 10),
    cpu: Number.parseFloat(n["%cpu"]),
    memory: Number.parseFloat(n["%mem"])
  }));
}, M = "ps output parsing failed", D = /^[ \t]*(?<pid>\d+)[ \t]+(?<ppid>\d+)[ \t]+(?<uid>[-\d]+)[ \t]+(?<cpu>\d+\.\d+)[ \t]+(?<memory>\d+\.\d+)[ \t]+(?<comm>.*)?/, B = async (e = {}) => {
  const o = e.all === !1 ? "wwxo" : "awwxo", t = [
    P("ps", [o, "pid,ppid,uid,%cpu,%mem,comm"], { maxBuffer: S }),
    P("ps", [o, "pid,args"], { maxBuffer: S })
  ], [r, n] = (await Promise.all(t)).map(({ stdout: a }) => a.trim().split(`
`)), i = new Set(t.map((a) => a.child.pid));
  r.shift(), n.shift();
  const c = {};
  for (const a of n) {
    const [l, s] = a.trim().split(" ");
    c[l] = s.join(" ");
  }
  return r.map((a) => {
    const l = D.exec(a);
    if (l === null)
      throw new Error(M);
    const { pid: s, ppid: m, uid: p, cpu: N, memory: $, comm: U } = l.groups;
    return {
      pid: Number.parseInt(s, 10),
      ppid: Number.parseInt(m, 10),
      uid: Number.parseInt(p, 10),
      cpu: Number.parseFloat(N),
      memory: Number.parseFloat($),
      name: u.basename(U),
      cmd: c[s]
    };
  }).filter((a) => !i.has(a.pid));
}, W = async (e = {}) => {
  try {
    return await B(e);
  } catch {
    return k(e);
  }
}, G = E.platform === "win32" ? V : W;
function _(e) {
  return e.split(".").map((o) => parseInt(o, 10));
}
function H(e, o) {
  for (let t = 0; t < Math.max(e.length, o.length); t++) {
    const r = e[t] || 0, n = o[t] || 0;
    if (r > n) return 1;
    if (r < n) return -1;
  }
  return 0;
}
function q(e) {
  try {
    const t = g.readdirSync(e, { withFileTypes: !0 }).filter((r) => r.isDirectory() && /^\d+(\.\d+)*$/.test(r.name)).map((r) => r.name);
    return t.length === 0 ? null : (t.sort((r, n) => {
      const i = _(r), c = _(n);
      return H(c, i);
    }), t[0]);
  } catch (o) {
    return console.error("Error reading directory:", o), null;
  }
}
function J() {
  const e = {
    versionNumber: "",
    versionPath: "",
    serverPath: "",
    clientPath: "",
    configPath: ""
  }, o = u.join(A.homedir(), "AppData", "Local", "PulseMedica", "FIH"), t = q(o);
  if (t !== null) {
    const r = u.join(o, t), n = u.join(r, "server", "PMServer.exe"), i = u.join(r, "client", "FSS UI.exe"), c = u.join(r, "server", "config.exe");
    return e.versionNumber = t, e.versionPath = r, e.serverPath = n, e.clientPath = i, e.configPath = c, console.log(e), e;
  } else
    return e.versionNumber = "[Error] Unable to determine current version #", e.versionPath = "[Error] Unable to find current version path.", e.serverPath = "[Error] Unable to find server path.", e.clientPath = "[Error] Unable to find client path.", e.configPath = "[Error] Unable to find config path.", e;
}
async function Y() {
  const e = "C:/ProgramData/Pulsemedica/FSS/config/hw_profile.json";
  try {
    return await x.access(e), await x.readFile(e, "utf-8");
  } catch (o) {
    if (o instanceof Error)
      return JSON.stringify({
        Message: "Config file not found, or could not be opened.",
        Config_Path: e
      }, null, 2);
    throw o;
  }
}
async function z(e) {
  const o = "C:/ProgramData/Pulsemedica/FSS/config/hw_profile.json";
  return x.writeFile(o, e, "utf8").then(() => (console.log("Config successfully saved to:", o), `[Success] Config updated and saved to: ${o}`)).catch((t) => (console.error("Error saving config:", t), `[Error] Couldn't save config: ${t.message}`));
}
T(import.meta.url);
const v = u.dirname(C(import.meta.url));
process.env.APP_ROOT = u.join(v, "..");
const I = process.env.VITE_DEV_SERVER_URL, le = u.join(process.env.APP_ROOT, "dist-electron"), K = u.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = I ? u.join(process.env.APP_ROOT, "public") : K;
let f;
function F() {
  f = new b({
    title: "FemtoLauncher",
    icon: u.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: u.join(v, "preload.mjs")
    }
  }), f.webContents.on("did-finish-load", () => {
    f == null || f.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), I ? f.loadURL(I) : f.loadFile(u.join(v, "../dist/index.html"));
}
y.on("window-all-closed", () => {
  process.platform !== "darwin" && (y.quit(), f = null);
});
y.on("activate", () => {
  b.getAllWindows().length === 0 && F();
});
y.whenReady().then(
  () => {
    F();
  }
);
h.handle("get-paths", async (e, ...o) => J());
h.handle("run-config", async (e, o) => (console.log("------- run-config has been called -------"), new Promise((t, r) => {
  var a, l;
  let n = [], i = "", c = "";
  const d = w(o + " -d");
  (a = d.stdout) == null || a.on("data", (s) => {
    const m = s.toString();
    i += m, m.split(`
`).forEach((p) => {
      p.trim() && (n.push(p), console.log(`${p}`));
    });
  }), (l = d.stderr) == null || l.on("data", (s) => {
    const m = s.toString();
    c += m, m.split(`
`).forEach((p) => {
      p.trim() && (n.push(p), console.log(`${p}`));
    });
  }), d.on("close", (s) => {
    console.log(`child process exited with code ${s}`);
    const m = {
      // Note that stdout & stderr aren't actually used, but if you need them here they are.
      stdout: i,
      stderr: c,
      outputLines: n,
      // 1 array that has the output. This is to maintain sequential ordering.
      exitCode: s,
      success: s === 0
    };
    if (s === 0)
      t(m);
    else {
      const p = new Error(`Child process exited with code ${s}`);
      r(p);
    }
  }), d.on("error", (s) => {
    console.error("Failed to start child process.", s), `${s.message}`, r(s);
  });
})));
h.handle("run-sw-sim", async (e, o, t) => {
  var a, l;
  console.log(`--------- Running software in simulation ---------
`);
  const r = R(v, "..", "server_ready.txt");
  if (g.existsSync(r)) {
    console.log("A server ready file already exists, removing it now.");
    try {
      g.unlinkSync(r);
    } catch (s) {
      if (s.code !== "ENOENT")
        throw s;
    }
  }
  const n = w(o + " sim");
  (a = n.stdout) == null || a.on("data", (s) => {
    console.log(`stdout: ${s}`), e.sender.send("server-stdout", s.toString());
  }), (l = n.stderr) == null || l.on("data", (s) => {
    console.error(`stderr: ${s}`), e.sender.send("server-stderr", "[Error] " + s.toString());
  }), n.on("close", (s) => {
    console.log(`Server process exited with code ${s}`), e.sender.send("server-close", s);
  });
  const i = 30;
  let c = 0;
  const d = setInterval(() => {
    g.existsSync(r) && (clearInterval(d), e.sender.send("server-stdout", "[Success] Server ready, starting UI now."), console.log("Server is ready, opening UI..."), w(`"${t}"`)), c++, c > i && (clearInterval(d), console.error("Timeout: server_ready.txt not found."), e.sender.send("server-stderr", "[Error] Server Timeout. Failed to start."), n.kill());
  }, 1e3);
  return { success: !0, message: "Server process initiated successfully & UI opened." };
});
h.handle("run-sw-target", async (e, o, t) => {
  var a, l;
  console.log(`--------- Running server in target ---------
`);
  const r = R(v, "..", "server_ready.txt");
  if (g.existsSync(r)) {
    console.log("A server ready file already exists, removing it now.");
    try {
      g.unlinkSync(r);
    } catch (s) {
      if (s.code !== "ENOENT")
        throw s;
    }
  }
  const n = w(o);
  (a = n.stdout) == null || a.on("data", (s) => {
    console.log(`stdout: ${s}`), e.sender.send("server-stdout", s.toString());
  }), (l = n.stderr) == null || l.on("data", (s) => {
    console.error(`stderr: ${s}`), e.sender.send("server-stderr", "[Error] " + s.toString());
  }), n.on("close", (s) => {
    console.log(`Server process exited with code ${s}`), e.sender.send("server-close", s);
  });
  const i = 30;
  let c = 0;
  const d = setInterval(() => {
    g.existsSync(r) && (clearInterval(d), e.sender.send("server-stdout", "[Success] Server ready, starting UI now."), console.log("Server is ready, opening UI..."), w(`"${t}"`)), c++, c > i && (clearInterval(d), console.error("Timeout: server_ready.txt not found."), e.sender.send("server-stderr", "[Error] Server Timeout. Failed to start."), n.kill());
  }, 1e3);
  return { success: !0, message: "Server process initiated successfully & UI opened." };
});
h.handle("close-software", async (e, o) => {
  const t = "PMServer.exe", r = "FSS UI.exe", n = {
    serverResponse: "[Error] Some error occurred while trying to close PMServer.exe",
    uiResponse: "[Error] Some error occurred while trying to close FSS UI.exe"
  }, i = (c, d, a = 1e4) => Promise.race([
    new Promise((l) => {
      w(`taskkill /IM "${c}" /F`, (s, m, p) => {
        l(s ? `[Error] Could not kill ${d}.` : `[Success] ${d} successfully killed.`);
      });
    }),
    // Timeout in case it takes too long to return from the promise.
    new Promise(
      (l) => setTimeout(() => l(`[Error] Timeout while trying to kill ${d}.`), a)
    )
  ]);
  return await Promise.all([
    i(t, "PMServer"),
    i(r, "FSS UI")
  ]), n.serverResponse = "[Success] PMServer.exe was closed successfully.", n.uiResponse = "[Success] FSS UI.exe was closed successfully.", n;
});
h.handle("poll-service", async (e, o) => {
  try {
    const t = await G();
    return o ? t.some(
      (r) => r.name.toLowerCase().includes(o.toLowerCase())
    ) : !1;
  } catch (t) {
    return console.error("Error polling processes:", t), !1;
  }
});
h.handle("read-config", async () => Y());
h.handle("save-config", async (e, o) => await z(o));
export {
  le as MAIN_DIST,
  K as RENDERER_DIST,
  I as VITE_DEV_SERVER_URL
};
