import $, { app as y, BrowserWindow as F, ipcMain as h } from "electron";
import { createRequire as k } from "node:module";
import { fileURLToPath as b } from "node:url";
import a from "node:path";
import { join as D } from "path";
import V, { exec as _ } from "node:child_process";
import E from "fs";
import C from "node:process";
import { promisify as O } from "node:util";
import A from "os";
import x from "fs/promises";
if (typeof $ == "string")
  throw new TypeError("Not running in an Electron environment!");
const { env: N } = process, M = "ELECTRON_IS_DEV" in N, B = Number.parseInt(N.ELECTRON_IS_DEV, 10) === 1, L = M ? B : !$.app.isPackaged, R = a.dirname(b(import.meta.url)), H = 1e3 * 1e3 * 10, W = O(V.execFile), U = async () => {
  let e;
  switch (C.arch) {
    case "x64":
      e = "fastlist-0.3.0-x64.exe";
      break;
    case "ia32":
      e = "fastlist-0.3.0-x86.exe";
      break;
    default:
      throw new Error(`Unsupported architecture: ${C.arch}`);
  }
  let r;
  L ? r = a.join(R, "..", "/extras", e) : r = a.join(R, "..", "..", e);
  const { stdout: t } = await W(r, {
    maxBuffer: H,
    windowsHide: !0
  });
  return t.trim().split(`\r
`).map((o) => o.split("	")).map(([o, c, s]) => ({
    pid: Number.parseInt(o, 10),
    ppid: Number.parseInt(c, 10),
    name: s
  }));
};
function T(e) {
  return e.split(".").map((r) => parseInt(r, 10));
}
function q(e, r) {
  for (let t = 0; t < Math.max(e.length, r.length); t++) {
    const o = e[t] || 0, c = r[t] || 0;
    if (o > c) return 1;
    if (o < c) return -1;
  }
  return 0;
}
function G(e) {
  try {
    const t = E.readdirSync(e, { withFileTypes: !0 }).filter((o) => o.isDirectory() && /^\d+(\.\d+)*$/.test(o.name)).map((o) => o.name);
    return t.length === 0 ? null : (t.sort((o, c) => {
      const s = T(o), l = T(c);
      return q(l, s);
    }), t[0]);
  } catch (r) {
    return console.error("Error reading directory:", r), null;
  }
}
function J() {
  const e = {
    versionNumber: "",
    versionPath: "",
    serverPath: "",
    clientPath: "",
    configPath: ""
  }, r = a.join(A.homedir(), "AppData", "Local", "PulseMedica", "FIH"), t = G(r);
  if (t !== null) {
    const o = a.join(r, t), c = a.join(o, "server", "PMServer.exe"), s = a.join(o, "client", "FSS UI.exe"), l = a.join(o, "server", "config.exe");
    return e.versionNumber = t, e.versionPath = o, e.serverPath = c, e.clientPath = s, e.configPath = l, console.log(e), e;
  } else
    return e.versionNumber = "[Error] Unable to determine current version #", e.versionPath = "[Error] Unable to find current version path.", e.serverPath = "[Error] Unable to find server path.", e.clientPath = "[Error] Unable to find client path.", e.configPath = "[Error] Unable to find config path.", e;
}
async function K() {
  const e = "C:/ProgramData/Pulsemedica/FSS/config/hw_profile.json";
  try {
    return await x.access(e), await x.readFile(e, "utf-8");
  } catch (r) {
    if (r instanceof Error)
      return JSON.stringify({
        Message: "Config file not found, or could not be opened. Note that hw_profile gets deleted when you run config.exe for target!",
        Config_Path: e
      }, null, 2);
    throw r;
  }
}
async function Y(e) {
  const r = "C:/ProgramData/Pulsemedica/FSS/config/hw_profile.json";
  return x.writeFile(r, e, "utf8").then(() => (console.log("Config successfully saved to:", r), `[Success] Config updated and saved to: ${r}`)).catch((t) => (console.error("Error saving config:", t), `[Error] Couldn't save config: ${t.message}`));
}
k(import.meta.url);
const P = a.dirname(b(import.meta.url)), S = D(P, ...L ? [".."] : ["..", "..", ".."], "server_ready.txt");
process.env.APP_ROOT = a.join(P, "..");
const I = process.env.VITE_DEV_SERVER_URL, ae = a.join(process.env.APP_ROOT, "dist-electron"), z = a.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = I ? a.join(process.env.APP_ROOT, "public") : z;
let p;
function j() {
  p = new F({
    title: "FemtoLauncher",
    icon: a.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: a.join(P, "preload.mjs")
    }
  }), p.webContents.on("did-finish-load", () => {
    p == null || p.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), I ? p.loadURL(I) : p.loadFile(a.join(P, "../dist/index.html"));
}
y.on("window-all-closed", () => {
  process.platform !== "darwin" && (y.quit(), p = null);
});
y.on("activate", () => {
  F.getAllWindows().length === 0 && j();
});
y.whenReady().then(
  () => {
    j();
  }
);
h.handle("get-paths", async (e, ...r) => J());
h.handle("startup-ui-logs", async (e) => ({
  cwd: P,
  server_ready_path: S
}));
h.handle("run-config", async (e, r, t) => (console.log("------- run-config has been called -------"), new Promise((o, c) => {
  var g, v;
  let s = [], l = "", m = "", d;
  t === "sim" ? d = _(r + " -d") : (console.log(r), d = _(r)), (g = d.stdout) == null || g.on("data", (i) => {
    const n = i.toString();
    l += n, n.split(`
`).forEach((u) => {
      u.trim() && (s.push(u), console.log(`${u}`));
    });
  }), (v = d.stderr) == null || v.on("data", (i) => {
    const n = i.toString();
    m += n, n.split(`
`).forEach((u) => {
      u.trim() && (s.push(u), console.log(`${u}`));
    });
  }), d.on("close", (i) => {
    console.log(`child process exited with code ${i}`);
    const n = {
      // Note that stdout & stderr aren't actually used, but if you need them here they are.
      stdout: l,
      stderr: m,
      outputLines: s,
      // 1 array that has the output. This is to maintain sequential ordering.
      exitCode: i,
      success: i === 0
    };
    if (i === 0)
      o(n);
    else {
      const u = new Error(`Child process exited with code ${i}`);
      c(u);
    }
  }), d.on("error", (i) => {
    console.error("Failed to start child process.", i), `${i.message}`, c(i);
  });
})));
h.handle("run-sw", async (e, r, t, o) => {
  if (console.log(`--------- Running server in target ---------
`), E.existsSync(S)) {
    console.log("A server ready file already exists, removing it now.");
    try {
      E.unlinkSync(S);
    } catch (l) {
      if (l.code !== "ENOENT") throw l;
    }
  }
  const c = o === "sim" ? `${r} sim` : r, s = _(c);
  return await new Promise((l) => {
    var n, u;
    let d, g = !1;
    d = setInterval(() => {
      E.existsSync(S) && (clearInterval(d), clearTimeout(i), e.sender.send("server-stdout", "[Success] Server ready, starting UI now."), console.log("Server is ready, opening UI..."), _(`"${t}"`), l({ success: !0, message: "[Success] Server process initiated successfully & UI opened." }));
    }, 1e3);
    const i = setTimeout(() => {
      g = !0, clearInterval(d), s.kill(), e.sender.send("server-stderr", "[Error] Server Timeout. Failed to start."), console.error("Timeout: server_ready.txt not found."), l({ success: !1, message: "[Error] Server process was not able to start." });
    }, 6e4);
    (n = s.stdout) == null || n.on("data", (f) => {
      console.log(`stdout: ${f}`), e.sender.send("server-stdout", f.toString());
    }), (u = s.stderr) == null || u.on("data", (f) => {
      const w = f.toString();
      console.error(`stderr: ${w}`), e.sender.send("server-stderr", "[Error] " + w), clearInterval(d), clearTimeout(i), s.kill(), l({ success: !1, message: "[Error] " + w });
    }), s.on("close", (f) => {
      g || console.log(`Server process exited with code ${f}`);
    });
  });
});
h.handle("close-software", async (e, r) => {
  const t = "PMServer.exe", o = "FSS UI.exe", c = {
    serverResponse: "[Error] Some error occurred while trying to close PMServer.exe",
    uiResponse: "[Error] Some error occurred while trying to close FSS UI.exe"
  }, s = async (l, m, d = 1e4) => {
    const v = (await U()).filter((n) => n.name === l);
    if (v.length === 0)
      return `[Error] No running process found with name ${m}.`;
    const i = v.map(
      (n) => new Promise((u, f) => {
        try {
          process.kill(n.pid, "SIGKILL"), u(!0);
        } catch (w) {
          f(`[Error] Failed to kill ${m} (PID ${n.pid}): ${w}`);
        }
      })
    );
    return Promise.race([
      Promise.allSettled(i).then((n) => n.every((f) => f.status === "fulfilled") ? `[Success] ${m} successfully killed.` : `[Partial] Some instances of ${m} could not be killed.`),
      new Promise(
        (n) => setTimeout(() => n(`[Error] Timeout while trying to kill ${m}.`), d)
      )
    ]);
  };
  return c.serverResponse = await s(t, "PMServer"), c.uiResponse = await s(o, "FSS UI"), c;
});
h.handle("poll-service", async (e, r) => {
  try {
    const t = await U();
    return r ? t.some(
      (o) => o.name.toLowerCase().includes(r.toLowerCase())
    ) : !1;
  } catch (t) {
    return console.error("Error polling processes:", t), !1;
  }
});
h.handle("read-config", async () => K());
h.handle("save-config", async (e, r) => await Y(r));
export {
  ae as MAIN_DIST,
  z as RENDERER_DIST,
  I as VITE_DEV_SERVER_URL
};
