# FemtoLauncher
Exploratory repository to develop a launcher application to launch the FIH software.

# Features
[X] Run Config.
[X] Launch software from launcher.
[X] Display terminal outputs to the user.
[X] Indicator lights for process running -> PMServer, UI, MLServer
[ ] Config Editor
[ ] List of "interfering applications". Indicate a warning to the user if they're running (optotune cockpit, amplitude sw, etc.)
[X] Explicit "kill software" button.
    - Currently this will look for and kill any UI and Server processes (takes around 5 seconds).
[ ] Have the launcher show changlogs. FemtoDeploy would have to download the changelog information and include it in the repo.

# Updating FemtoDeploy
[ ] Include a launcher version as it does server and UI then download it.
[ ]  Remove start.ps1 script, and point the NSIS installer / entrypoint to the installer.
    - Would also modify NSIS since there would no longer by target vs. simulation (handled by launcher).

# Quality
[ ] Units tests.
[ ] Test edge case scenarios and see if am properly sending the right console messages.
[ ] Probably want to move things out of app.tsx. The launcher is just 1 page, but probably need to start splitting up the main file so its not huge.

# Known Issues
[X] Close software takes too long - should probably show a "loading" or something. And bring the output container to the bottom so user can see, OR clear it.
[ ] Log messages in output-container are outputting the same message twice.
