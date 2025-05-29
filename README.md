# FemtoLauncher
Exploratory repository to develop a launcher application to launch the FIH software.

# Checklist
[X] Base UI
[X] Be able to run a script and read its stdout.
[X] Be able to run Config.exe
[X] Be able to run PMServer.exe and read its stdout, display to user.
[X] Change launch software button to BOTH start PMserver.exe and FSS UI.exe. PMServer will create a "serverReady.txt" file which you wait for and once it's there you open UI.
    - look at start.ps1 for example.
[X] Checkbox to pick between SIM or TARGET.
[X] Fix bug where starting the app twice clears the UI?
[X] Have a "kill app" button which closes both server and UI.
[ ] "Edit config" functionality?

[ ] (eventually) Test edge case scenarios and see if am properly sending the right console messages.
