import { app as S, BrowserWindow as C, ipcMain as h } from "electron";
import { createRequire as T } from "node:module";
import { fileURLToPath as R } from "node:url";
import d from "node:path";
import { join as F } from "path";
import j, { exec as v } from "node:child_process";
import w from "fs";
import x from "node:process";
import { promisify as L } from "node:util";
import A from "os";
import I from "fs/promises";
const O = d.dirname(R(import.meta.url)), P = 1e3 * 1e3 * 10, E = L(j.execFile), V = async () => {
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
  const s = d.join(O, "vendor", e), { stdout: t } = await E(s, {
    maxBuffer: P,
    windowsHide: !0
  });
  return t.trim().split(`\r
`).map((r) => r.split("	")).map(([r, o, c]) => ({
    pid: Number.parseInt(r, 10),
    ppid: Number.parseInt(o, 10),
    name: c
  }));
}, k = async (e = {}) => {
  const s = (e.all === !1 ? "" : "a") + "wwxo", t = {};
  return await Promise.all(["comm", "args", "ppid", "uid", "%cpu", "%mem"].map(async (r) => {
    const { stdout: o } = await E("ps", [s, `pid,${r}`], { maxBuffer: P });
    for (let c of o.trim().split(`
`).slice(1)) {
      c = c.trim();
      const [a] = c.split(" ", 1), p = c.slice(a.length + 1).trim();
      t[a] === void 0 && (t[a] = {}), t[a][r] = p;
    }
  })), Object.entries(t).filter(([, r]) => r.comm && r.args && r.ppid && r.uid && r["%cpu"] && r["%mem"]).map(([r, o]) => ({
    pid: Number.parseInt(r, 10),
    name: d.basename(o.comm),
    cmd: o.args,
    ppid: Number.parseInt(o.ppid, 10),
    uid: Number.parseInt(o.uid, 10),
    cpu: Number.parseFloat(o["%cpu"]),
    memory: Number.parseFloat(o["%mem"])
  }));
}, M = "ps output parsing failed", D = /^[ \t]*(?<pid>\d+)[ \t]+(?<ppid>\d+)[ \t]+(?<uid>[-\d]+)[ \t]+(?<cpu>\d+\.\d+)[ \t]+(?<memory>\d+\.\d+)[ \t]+(?<comm>.*)?/, B = async (e = {}) => {
  const s = e.all === !1 ? "wwxo" : "awwxo", t = [
    E("ps", [s, "pid,ppid,uid,%cpu,%mem,comm"], { maxBuffer: P }),
    E("ps", [s, "pid,args"], { maxBuffer: P })
  ], [r, o] = (await Promise.all(t)).map(({ stdout: i }) => i.trim().split(`
`)), c = new Set(t.map((i) => i.child.pid));
  r.shift(), o.shift();
  const a = {};
  for (const i of o) {
    const [l, n] = i.trim().split(" ");
    a[l] = n.join(" ");
  }
  return r.map((i) => {
    const l = D.exec(i);
    if (l === null)
      throw new Error(M);
    const { pid: n, ppid: u, uid: f, cpu: m, memory: $, comm: U } = l.groups;
    return {
      pid: Number.parseInt(n, 10),
      ppid: Number.parseInt(u, 10),
      uid: Number.parseInt(f, 10),
      cpu: Number.parseFloat(m),
      memory: Number.parseFloat($),
      name: d.basename(U),
      cmd: a[n]
    };
  }).filter((i) => !c.has(i.pid));
}, W = async (e = {}) => {
  try {
    return await B(e);
  } catch {
    return k(e);
  }
}, G = x.platform === "win32" ? V : W;
function b(e) {
  return e.split(".").map((s) => parseInt(s, 10));
}
function H(e, s) {
  for (let t = 0; t < Math.max(e.length, s.length); t++) {
    const r = e[t] || 0, o = s[t] || 0;
    if (r > o) return 1;
    if (r < o) return -1;
  }
  return 0;
}
function q(e) {
  try {
    const t = w.readdirSync(e, { withFileTypes: !0 }).filter((r) => r.isDirectory() && /^\d+(\.\d+)*$/.test(r.name)).map((r) => r.name);
    return t.length === 0 ? null : (t.sort((r, o) => {
      const c = b(r), a = b(o);
      return H(a, c);
    }), t[0]);
  } catch (s) {
    return console.error("Error reading directory:", s), null;
  }
}
function J() {
  const e = {
    versionNumber: "",
    versionPath: "",
    serverPath: "",
    clientPath: "",
    configPath: ""
  }, s = d.join(A.homedir(), "AppData", "Local", "PulseMedica", "FIH"), t = q(s);
  if (t !== null) {
    const r = d.join(s, t), o = d.join(r, "server", "PMServer.exe"), c = d.join(r, "client", "FSS UI.exe"), a = d.join(r, "server", "config.exe");
    return e.versionNumber = t, e.versionPath = r, e.serverPath = o, e.clientPath = c, e.configPath = a, console.log(e), e;
  } else
    return e.versionNumber = "[Error] Unable to determine current version #", e.versionPath = "[Error] Unable to find current version path.", e.serverPath = "[Error] Unable to find server path.", e.clientPath = "[Error] Unable to find client path.", e.configPath = "[Error] Unable to find config path.", e;
}
async function Y() {
  const e = "C:/ProgramData/Pulsemedica/FSS/config/hw_profile.json";
  try {
    return await I.access(e), await I.readFile(e, "utf-8");
  } catch (s) {
    if (s instanceof Error)
      return JSON.stringify({
        Message: "Config file not found, or could not be opened. Note that hw_profile gets deleted when you run config.exe for target!",
        Config_Path: e
      }, null, 2);
    throw s;
  }
}
async function z(e) {
  const s = "C:/ProgramData/Pulsemedica/FSS/config/hw_profile.json";
  return I.writeFile(s, e, "utf8").then(() => (console.log("Config successfully saved to:", s), `[Success] Config updated and saved to: ${s}`)).catch((t) => (console.error("Error saving config:", t), `[Error] Couldn't save config: ${t.message}`));
}
T(import.meta.url);
const y = d.dirname(R(import.meta.url));
process.env.APP_ROOT = d.join(y, "..");
const _ = process.env.VITE_DEV_SERVER_URL, le = d.join(process.env.APP_ROOT, "dist-electron"), K = d.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = _ ? d.join(process.env.APP_ROOT, "public") : K;
let g;
function N() {
  g = new C({
    title: "FemtoLauncher",
    icon: d.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: d.join(y, "preload.mjs")
    }
  }), g.webContents.on("did-finish-load", () => {
    g == null || g.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), _ ? g.loadURL(_) : g.loadFile(d.join(y, "../dist/index.html"));
}
S.on("window-all-closed", () => {
  process.platform !== "darwin" && (S.quit(), g = null);
});
S.on("activate", () => {
  C.getAllWindows().length === 0 && N();
});
S.whenReady().then(
  () => {
    N();
  }
);
h.handle("get-paths", async (e, ...s) => J());
h.handle("run-config", async (e, s, t) => (console.log("------- run-config has been called -------"), new Promise((r, o) => {
  var l, n;
  let c = [], a = "", p = "", i;
  t === "sim" ? i = v(s + " -d") : (console.log(s), i = v(s)), (l = i.stdout) == null || l.on("data", (u) => {
    const f = u.toString();
    a += f, f.split(`
`).forEach((m) => {
      m.trim() && (c.push(m), console.log(`${m}`));
    });
  }), (n = i.stderr) == null || n.on("data", (u) => {
    const f = u.toString();
    p += f, f.split(`
`).forEach((m) => {
      m.trim() && (c.push(m), console.log(`${m}`));
    });
  }), i.on("close", (u) => {
    console.log(`child process exited with code ${u}`);
    const f = {
      // Note that stdout & stderr aren't actually used, but if you need them here they are.
      stdout: a,
      stderr: p,
      outputLines: c,
      // 1 array that has the output. This is to maintain sequential ordering.
      exitCode: u,
      success: u === 0
    };
    if (u === 0)
      r(f);
    else {
      const m = new Error(`Child process exited with code ${u}`);
      o(m);
    }
  }), i.on("error", (u) => {
    console.error("Failed to start child process.", u), `${u.message}`, o(u);
  });
})));
h.handle("run-sw-sim", async (e, s, t) => {
  var i, l;
  console.log(`--------- Running software in simulation ---------
`);
  const r = F(y, "..", "server_ready.txt");
  if (w.existsSync(r)) {
    console.log("A server ready file already exists, removing it now.");
    try {
      w.unlinkSync(r);
    } catch (n) {
      if (n.code !== "ENOENT")
        throw n;
    }
  }
  const o = v(s + " sim");
  (i = o.stdout) == null || i.on("data", (n) => {
    console.log(`stdout: ${n}`), e.sender.send("server-stdout", n.toString());
  }), (l = o.stderr) == null || l.on("data", (n) => {
    console.error(`stderr: ${n}`), e.sender.send("server-stderr", "[Error] " + n.toString());
  }), o.on("close", (n) => {
    console.log(`Server process exited with code ${n}`), e.sender.send("server-close", n);
  });
  const c = 30;
  let a = 0;
  const p = setInterval(() => {
    w.existsSync(r) && (clearInterval(p), e.sender.send("server-stdout", `
[Success] Server ready, starting UI now.`), console.log("Server is ready, opening UI..."), v(`"${t}"`)), a++, a > c && (clearInterval(p), console.error("Timeout: server_ready.txt not found."), e.sender.send("server-stderr", `
[Error] Server Timeout. Failed to start.`), o.kill());
  }, 1e3);
  return { success: !0, message: "Server process initiated successfully & UI opened." };
});
h.handle("run-sw-target", async (e, s, t) => {
  var i, l;
  console.log(`--------- Running server in target ---------
`);
  const r = F(y, "..", "server_ready.txt");
  if (w.existsSync(r)) {
    console.log("A server ready file already exists, removing it now.");
    try {
      w.unlinkSync(r);
    } catch (n) {
      if (n.code !== "ENOENT")
        throw n;
    }
  }
  const o = v(s);
  (i = o.stdout) == null || i.on("data", (n) => {
    console.log(`stdout: ${n}`), e.sender.send("server-stdout", n.toString());
  }), (l = o.stderr) == null || l.on("data", (n) => {
    console.error(`stderr: ${n}`), e.sender.send("server-stderr", "[Error] " + n.toString());
  }), o.on("close", (n) => {
    console.log(`Server process exited with code ${n}`), e.sender.send("server-close", n);
  });
  const c = 30;
  let a = 0;
  const p = setInterval(() => {
    w.existsSync(r) && (clearInterval(p), e.sender.send("server-stdout", `
[Success] Server ready, starting UI now.`), console.log("Server is ready, opening UI..."), v(`"${t}"`)), a++, a > c && (clearInterval(p), console.error("Timeout: server_ready.txt not found."), e.sender.send("server-stderr", `
[Error] Server Timeout. Failed to start.`), o.kill());
  }, 1e3);
  return { success: !0, message: "Server process initiated successfully & UI opened." };
});
h.handle("close-software", async (e, s) => {
  const t = "PMServer.exe", r = "FSS UI.exe", o = {
    serverResponse: "[Error] Some error occurred while trying to close PMServer.exe",
    uiResponse: "[Error] Some error occurred while trying to close FSS UI.exe"
  }, c = (a, p, i = 1e4) => Promise.race([
    new Promise((l) => {
      v(`taskkill /IM "${a}" /F`, (n, u, f) => {
        l(n ? `[Error] Could not kill ${p}.` : `[Success] ${p} successfully killed.`);
      });
    }),
    // Timeout in case it takes too long to return from the promise.
    new Promise(
      (l) => setTimeout(() => l(`[Error] Timeout while trying to kill ${p}.`), i)
    )
  ]);
  return await Promise.all([
    c(t, "PMServer"),
    c(r, "FSS UI")
  ]), o.serverResponse = "[Success] PMServer.exe was closed successfully.", o.uiResponse = "[Success] FSS UI.exe was closed successfully.", o;
});
h.handle("poll-service", async (e, s) => {
  try {
    const t = await G();
    return s ? t.some(
      (r) => r.name.toLowerCase().includes(s.toLowerCase())
    ) : !1;
  } catch (t) {
    return console.error("Error polling processes:", t), !1;
  }
});
h.handle("read-config", async () => Y());
h.handle("save-config", async (e, s) => await z(s));
export {
  le as MAIN_DIST,
  K as RENDERER_DIST,
  _ as VITE_DEV_SERVER_URL
};
