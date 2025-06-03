import { app as y, BrowserWindow as b, ipcMain as g } from "electron";
import { createRequire as j } from "node:module";
import { fileURLToPath as C } from "node:url";
import u from "node:path";
import { join as R } from "path";
import L, { exec as w } from "node:child_process";
import h from "fs";
import x from "node:process";
import { promisify as T } from "node:util";
import A from "os";
import E from "fs/promises";
const V = u.dirname(C(import.meta.url)), P = 1e3 * 1e3 * 10, S = T(L.execFile), k = async () => {
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
  const t = u.join(V, "vendor", e), { stdout: s } = await S(t, {
    maxBuffer: P,
    windowsHide: !0
  });
  return s.trim().split(`\r
`).map((r) => r.split("	")).map(([r, o, i]) => ({
    pid: Number.parseInt(r, 10),
    ppid: Number.parseInt(o, 10),
    name: i
  }));
}, M = async (e = {}) => {
  const t = (e.all === !1 ? "" : "a") + "wwxo", s = {};
  return await Promise.all(["comm", "args", "ppid", "uid", "%cpu", "%mem"].map(async (r) => {
    const { stdout: o } = await S("ps", [t, `pid,${r}`], { maxBuffer: P });
    for (let i of o.trim().split(`
`).slice(1)) {
      i = i.trim();
      const [c] = i.split(" ", 1), d = i.slice(c.length + 1).trim();
      s[c] === void 0 && (s[c] = {}), s[c][r] = d;
    }
  })), Object.entries(s).filter(([, r]) => r.comm && r.args && r.ppid && r.uid && r["%cpu"] && r["%mem"]).map(([r, o]) => ({
    pid: Number.parseInt(r, 10),
    name: u.basename(o.comm),
    cmd: o.args,
    ppid: Number.parseInt(o.ppid, 10),
    uid: Number.parseInt(o.uid, 10),
    cpu: Number.parseFloat(o["%cpu"]),
    memory: Number.parseFloat(o["%mem"])
  }));
}, D = "ps output parsing failed", O = /^[ \t]*(?<pid>\d+)[ \t]+(?<ppid>\d+)[ \t]+(?<uid>[-\d]+)[ \t]+(?<cpu>\d+\.\d+)[ \t]+(?<memory>\d+\.\d+)[ \t]+(?<comm>.*)?/, B = async (e = {}) => {
  const t = e.all === !1 ? "wwxo" : "awwxo", s = [
    S("ps", [t, "pid,ppid,uid,%cpu,%mem,comm"], { maxBuffer: P }),
    S("ps", [t, "pid,args"], { maxBuffer: P })
  ], [r, o] = (await Promise.all(s)).map(({ stdout: a }) => a.trim().split(`
`)), i = new Set(s.map((a) => a.child.pid));
  r.shift(), o.shift();
  const c = {};
  for (const a of o) {
    const [l, n] = a.trim().split(" ");
    c[l] = n.join(" ");
  }
  return r.map((a) => {
    const l = O.exec(a);
    if (l === null)
      throw new Error(D);
    const { pid: n, ppid: m, uid: p, cpu: $, memory: N, comm: U } = l.groups;
    return {
      pid: Number.parseInt(n, 10),
      ppid: Number.parseInt(m, 10),
      uid: Number.parseInt(p, 10),
      cpu: Number.parseFloat($),
      memory: Number.parseFloat(N),
      name: u.basename(U),
      cmd: c[n]
    };
  }).filter((a) => !i.has(a.pid));
}, W = async (e = {}) => {
  try {
    return await B(e);
  } catch {
    return M(e);
  }
}, G = x.platform === "win32" ? k : W;
function _(e) {
  return e.split(".").map((t) => parseInt(t, 10));
}
function H(e, t) {
  for (let s = 0; s < Math.max(e.length, t.length); s++) {
    const r = e[s] || 0, o = t[s] || 0;
    if (r > o) return 1;
    if (r < o) return -1;
  }
  return 0;
}
function q(e) {
  try {
    const s = h.readdirSync(e, { withFileTypes: !0 }).filter((r) => r.isDirectory() && /^\d+(\.\d+)*$/.test(r.name)).map((r) => r.name);
    return s.length === 0 ? null : (s.sort((r, o) => {
      const i = _(r), c = _(o);
      return H(c, i);
    }), s[0]);
  } catch (t) {
    return console.error("Error reading directory:", t), null;
  }
}
function J() {
  const e = {
    versionNumber: "",
    versionPath: "",
    serverPath: "",
    clientPath: "",
    configPath: ""
  }, t = u.join(A.homedir(), "AppData", "Local", "PulseMedica", "FIH"), s = q(t);
  if (s !== null) {
    const r = u.join(t, s), o = u.join(r, "server", "PMServer.exe"), i = u.join(r, "client", "FSS UI.exe"), c = u.join(r, "server", "config.exe");
    return e.versionNumber = s, e.versionPath = r, e.serverPath = o, e.clientPath = i, e.configPath = c, console.log(e), e;
  } else
    return e.versionNumber = "[Error] Unable to determine current version #", e.versionPath = "[Error] Unable to find current version path.", e.serverPath = "[Error] Unable to find server path.", e.clientPath = "[Error] Unable to find client path.", e.configPath = "[Error] Unable to find config path.", e;
}
async function Y() {
  const e = "C:/ProgramData/Pulsemedica/FSS/config/hw_profile.json";
  try {
    return await E.access(e), await E.readFile(e, "utf-8");
  } catch (t) {
    if (t instanceof Error)
      return JSON.stringify({
        Message: "Config file not found, or could not be opened.",
        Config_Path: e
      }, null, 2);
    throw t;
  }
}
async function z(e) {
  const t = "C:/ProgramData/Pulsemedica/FSS/config/hw_profile.json";
  return E.writeFile(t, e, "utf8").then(() => (console.log("Config successfully saved to:", t), `[Success] Config updated and saved to: ${t}`)).catch((s) => (console.error("Error saving config:", s), `[Error] Couldn't save config: ${s.message}`));
}
j(import.meta.url);
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
g.handle("get-paths", async (e, ...t) => J());
g.handle("run-config", async (e, t) => (console.log("------- run-config has been called -------"), new Promise((s, r) => {
  var a, l;
  let o = [], i = "", c = "";
  const d = w(t + " -d");
  (a = d.stdout) == null || a.on("data", (n) => {
    const m = n.toString();
    i += m, m.split(`
`).forEach((p) => {
      p.trim() && (o.push(p), console.log(`${p}`));
    });
  }), (l = d.stderr) == null || l.on("data", (n) => {
    const m = n.toString();
    c += m, m.split(`
`).forEach((p) => {
      p.trim() && (o.push(p), console.log(`${p}`));
    });
  }), d.on("close", (n) => {
    console.log(`child process exited with code ${n}`);
    const m = {
      // Note that stdout & stderr aren't actually used, but if you need them here they are.
      stdout: i,
      stderr: c,
      outputLines: o,
      // 1 array that has the output. This is to maintain sequential ordering.
      exitCode: n,
      success: n === 0
    };
    if (n === 0)
      s(m);
    else {
      const p = new Error(`Child process exited with code ${n}`);
      r(p);
    }
  }), d.on("error", (n) => {
    console.error("Failed to start child process.", n), `${n.message}`, r(n);
  });
})));
g.handle("run-sw-sim", async (e, t, s) => {
  var a, l;
  console.log(`--------- Running software in simulation ---------
`);
  const r = R(v, "..", "server_ready.txt");
  h.existsSync(r) && (console.log("A server ready file already exists, removing it now."), h.unlinkSync(r));
  const o = w(t + " sim");
  (a = o.stdout) == null || a.on("data", (n) => {
    console.log(`stdout: ${n}`), e.sender.send("server-stdout", n.toString());
  }), (l = o.stderr) == null || l.on("data", (n) => {
    console.error(`stderr: ${n}`), e.sender.send("server-stderr", n.toString());
  }), o.on("close", (n) => {
    console.log(`Server process exited with code ${n}`), e.sender.send("server-close", n);
  });
  const i = 30;
  let c = 0;
  const d = setInterval(() => {
    h.existsSync(r) && (clearInterval(d), e.sender.send("server-sim-ready", !0), console.log("Server is ready, opening UI..."), w(`"${s}"`)), c++, c > i && (clearInterval(d), console.error("Timeout: server_ready.txt not found."), e.sender.send("server-sim-ready", !1), o.kill());
  }, 1e3);
  return { success: !0, message: "Server process initiated successfully & UI opened." };
});
g.handle("run-sw-target", async (e, t, s) => {
  var a, l;
  console.log(`--------- Running server in target ---------
`);
  const r = R(v, "..", "server_ready.txt");
  h.existsSync(r) && (console.log("A server ready file already exists, removing it now."), h.unlinkSync(r));
  const o = w(t);
  (a = o.stdout) == null || a.on("data", (n) => {
    console.log(`stdout: ${n}`), e.sender.send("server-stdout", n.toString());
  }), (l = o.stderr) == null || l.on("data", (n) => {
    console.error(`stderr: ${n}`), e.sender.send("server-stderr", n.toString());
  }), o.on("close", (n) => {
    console.log(`Server process exited with code ${n}`), e.sender.send("server-close", n);
  });
  const i = 30;
  let c = 0;
  const d = setInterval(() => {
    h.existsSync(r) && (clearInterval(d), e.sender.send("server-ready", !0), console.log("Server is ready, opening UI..."), w(`"${s}"`)), c++, c > i && (clearInterval(d), console.error("Timeout: server_ready.txt not found."), e.sender.send("server-ready", !1), o.kill());
  }, 1e3);
  return { success: !0, message: "Server process initiated successfully & UI opened." };
});
g.handle("close-software", async (e, t) => {
  const s = "PMServer.exe", r = "FSS UI.exe", o = {
    serverResponse: "[Error] Some error occurred while trying to close PMServer.exe",
    uiResponse: "[Error] Some error occurred while trying to close FSS UI.exe"
  }, i = (c, d, a = 1e4) => Promise.race([
    new Promise((l) => {
      w(`taskkill /IM "${c}" /F`, (n, m, p) => {
        l(n ? `[Error] Could not kill ${d}.` : `[Success] ${d} successfully killed.`);
      });
    }),
    // Timeout in case it takes too long to return from the promise.
    new Promise(
      (l) => setTimeout(() => l(`[Error] Timeout while trying to kill ${d}.`), a)
    )
  ]);
  return await Promise.all([
    i(s, "PMServer"),
    i(r, "FSS UI")
  ]), o.serverResponse = "[Success] PMServer.exe was closed successfully.", o.uiResponse = "[Success] FSS UI.exe was closed successfully.", o;
});
g.handle("poll-service", async (e, t) => {
  try {
    const s = await G();
    return t ? s.some(
      (r) => r.name.toLowerCase().includes(t.toLowerCase())
    ) : !1;
  } catch (s) {
    return console.error("Error polling processes:", s), !1;
  }
});
g.handle("read-config", async () => Y());
g.handle("save-config", async (e, t) => await z(t));
export {
  le as MAIN_DIST,
  K as RENDERER_DIST,
  I as VITE_DEV_SERVER_URL
};
