# FemtoLauncher

Exploratory repository to develop a launcher application to launch the FIH software.

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

## Updating FemtoDeploy

- [ ] Include a launcher version as it does server and UI, then download it.
- [ ] Remove `start.ps1` script, and point the NSIS installer / entrypoint to the installer.
  - Would also modify NSIS since there would no longer be target vs. simulation (handled by launcher).

## Quality

- [x] Launch software should only be enabled if all server/client artifacts have been found.
- [x] Display (deploy) version number on the UI.
- [ ] Unit tests.
- [ ] Test edge case scenarios and ensure correct console messages.
- [ ] Refactor: Move things out of `app.tsx` — the launcher is just one page, but the file is growing too large.

## Known Issues

- [x] Close software takes too long — should probably show a "loading" state or bring output container to view, OR clear it.
- [ ] Log messages in `output-container` are outputting the same message twice. *This is because of react dev mode. Not a real bug if ran in produyction*.
