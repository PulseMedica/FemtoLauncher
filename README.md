# FemtoLauncher

Exploratory repository to develop a launcher application to launch the FIH software.

## Running the Application
1. Run in developer with watch feature - ```npm run dev```
2. Run in production -
3. Build an executable - ```npm run make```

## Features

- [x] Run Config.
- [x] Launch software from launcher.
- [x] Display terminal outputs to the user.
- [x] Indicator lights for process running -> PMServer, UI, MLServer
- [X] Simple config text editor.
- [x] Indicates a warning to the user if a potentially interfering app is running (Optotune Cockpit, Amplitude SW, etc.).
- [x] Explicit "kill software" button.
  - Currently this will look for and kill any UI and Server processes (takes around 5 seconds).
- [ ] Have the launcher show changelogs. FemtoDeploy would have to download the changelog information and include it in the repo.
- [ ] Button to open the elastic logging service.

## Updating FemtoDeploy

- [ ] Include a launcher version as it does server and UI, then download it.
- [ ] Remove `start.ps1` script, and point the NSIS installer / entrypoint to the installer.
  - Would also modify NSIS since there would no longer be target vs. simulation (handled by launcher).

## Quality

- [x] Launch software should only be enabled if all server/client artifacts have been found.
- [x] Display (deploy) version number on the UI.
- [x] Have an "onStartup" for production that console.logs (to the renderer side) for good debugging purposes.
- [ ] Unit tests.
- [ ] Test edge case scenarios and ensure correct console messages.

## Known Issues

- [x] Close software takes too long — should probably show a "loading" state or bring output container to view, OR clear it.
- [x] Log messages in `output-container` are outputting the same message twice. *This is because of react dev mode. Not a real bug if ran in produyction*.
- [x] When app is bundled into executable - need to include the fastlist.exe for psList() to work correctly. *Fixed this by turning it into a local helper instead of a node module, and then bundling the .exe into an "extras" directory.*
- [x] Improve error handling and when I'm actually returning when the app is waiting for the server to start. Should exit on any stderr and only return control to user AFTER timeout, server_ready is found, or stderr.
- [x] Server-ready path on Gandalf appears to be different? It times out not being able to find it when trying to start server (both dev & production mode). But this is not the case if running locally. *Found out that where it's looking for server-ready is incorrect*

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
