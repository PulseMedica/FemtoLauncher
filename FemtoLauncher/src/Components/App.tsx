import { useState, useEffect, useCallback, useRef } from 'react'
import '../Styles/App.css'
import logo from "../assets/logo.png"

// MODULES
import Services from './Services';
import WarningModal from './WarningModal';
import EditConfigModal from './EditConfigModal';
import { config } from 'node:process';
import { version } from 'node:os';

function App() {
  const [outputLines, setOutputLines] = useState<string[]>([]);;
  const [mode, setMode] = useState('sim');
  const [loading, setLoading] = useState(false);
  const [isEditConfigOpen, setIsEditConfigOpen] = useState(false);
  const [versionNumber, setVersionNumber] = useState("");
  const [serverPath, setServerPath] = useState("");
  const [clientPath, setClientPath] = useState("");
  const [configPath, setConfigPath] = useState("");
  const outputContainerRef = useRef<HTMLDivElement | null>(null);

  // Get paths to server / client.
  useEffect(() => {
    let alreadySet = false; // To handle mount useEffects not re-running twice.
    setOutputLines([]);
    async function getPaths() {
      // Honestly you can remove these next 2 lines if you want, the useEFfect() will just run twice due to react strict mode in development environment.
      if (alreadySet) return;
      alreadySet = true;
      const result = await window.ipcRenderer.invoke("get-paths");
      setVersionNumber(result.versionNumber);
      setServerPath(result.serverPath);
      setClientPath(result.clientPath);
      setConfigPath(result.configPath)
      setOutputLines(prev => [
        ...prev,
        "Server Artifact: ",
        result.serverPath,
        "Client Artifact: ",
        result.clientPath,
        "Config Artifact: ",
        result.configPath,
        "Current Version: ",
        result.versionNumber
      ]);
    }
    getPaths();
  }, []);

  // Runs config.
  const handleRunConfigClick = async() => {
    setOutputLines([])
    setLoading(true);
    const resultObject = await window.ipcRenderer.invoke('run-config', configPath);
    const results = resultObject.outputLines;
    setLoading(false);
    setOutputLines(results);
  }

  // Helper function to determine the class for each line
  const getLineClass = (line:string) => {
    if (line.startsWith('[Error]')){
      return 'error-line'
    }
    else if (line.startsWith('[Success]')){
      return 'success-line'
    }
    else{
      return 'output-line'
    }
  };

  const handleModeSelect = (event:any) => {
    setMode(event.target.value);
  }

  const handleServerStdout = useCallback((event: Electron.IpcRendererEvent, data: string) => {
    console.log('Renderer received stdout:', data);
    setOutputLines(prevLines => [...prevLines, data]);
  }, []);

  const handleServerStderr = useCallback((event: Electron.IpcRendererEvent, data: string) => {
    console.error('Renderer received stderr:', data);
    setOutputLines(prevLines => [...prevLines, data]);
  }, []);

  const handleServerClose = useCallback((event: Electron.IpcRendererEvent, code: number) => {
    console.log('Renderer received close code:', code);
    setOutputLines(prevLines => [...prevLines, `Process closed with code: ${code}`]); // Ensure it's a string
  }, []);

  useEffect(() => {
    window.ipcRenderer.on('server-stdout', handleServerStdout);
    window.ipcRenderer.on('server-stderr', handleServerStderr);
    window.ipcRenderer.on('server-close', handleServerClose);

    // Cleanup function that runs when the component unmounts
    return () => {
      window.ipcRenderer.off('server-stdout', handleServerStdout);
      window.ipcRenderer.off('server-stderr', handleServerStderr);
      window.ipcRenderer.off('server-close', handleServerClose);
    };
  }, [handleServerStdout, handleServerStderr, handleServerClose]); // Rerun if these functions change.

  useEffect(() => { // Listens for changes to outputContainer. If so, will automatically scroll to the bottom of it to show.
    if (outputContainerRef.current) {
      outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight;
    }
  }, [outputLines])

  const handleRunSoftware = async(mode:string) => {
    setOutputLines([])
    setLoading(true);
    if (mode === "sim" ){
      setOutputLines((prevLines => [...prevLines, "---- Running Server in Simulation ----\n"]));
      const result = await window.ipcRenderer.invoke('run-sw-sim', serverPath, clientPath);
    }
    else if (mode === "target") {
      setOutputLines((prevLines => [...prevLines, "---- Running Server in Target ----\n"]));
      const result = await window.ipcRenderer.invoke("run-sw-target", serverPath, clientPath)
    }
    setLoading(false);
  }

  const handleCloseSoftware = async() => {
    setLoading(true);
    const result = await window.ipcRenderer.invoke("close-software")
    setLoading(false);
    setOutputLines(prevLines => [...prevLines, result.serverResponse])
    setOutputLines(prevLines => [...prevLines, result.uiResponse])
  }

  return (
    <div className="app-container">
      <div className="logo-container">
        <img src={logo} alt="" />
      </div>
      <div className="modal-container">
          <div className="title">Welcome to FIH Launcher</div>

          <div className="inputs-container">
            <div className="mode-selector-container">
                <div className="radio-parent-container">
                  <div className="radio-container">
                    <input id="target" type="radio" name="target" value="target" checked={mode === "target"} onChange={handleModeSelect}/>
                    <label htmlFor="target">Target</label>
                  </div>
                  <div className="radio-container">
                    <input id="sim" type="radio" name="sim" value="sim" checked={mode === "sim"} onChange={handleModeSelect}/>
                    <label htmlFor="sim">Simulation</label>
                  </div>
                </div>
                {<Services></Services>}
            </div>

            <button id="btn-run-config" onClick={handleRunConfigClick} disabled={loading}>
              Run Config
            </button>

            <button id="btn-open-config-editor" onClick={() => setIsEditConfigOpen(true)} disabled={loading}>
              Edit Config
            </button>

            <div> {/* Wrapped in div to align the warning icon. */}
              <button id="btn-launch-sw" onClick={() => handleRunSoftware(mode)} disabled={loading || serverPath.startsWith('[Error]') || clientPath.startsWith('[Error')}> {/* Starts both the server and UI in one go. */}
                Launch Software
              </button>
              <WarningModal/>
            </div>

            <button id="btn-close-sw" onClick={handleCloseSoftware} disabled={loading}>
              Close Software
            </button>

            <div className="output-container" ref={outputContainerRef}>
                {loading ? ( /* If the script is still loading */
                    <div id="loading-icon"></div>
                ) : (
                    outputLines.map((line, index) => (
                        <div key={index} className={`${getLineClass(line)}`}>
                            {'\n' + line}
                        </div>
                    ))
                )}
            </div>

          </div>
        </div>

        {/* Out of modal */}
        <div className="version-container">
            {versionNumber
              ? "Current Version: " + versionNumber
              : "[Error] Could not find current version!"}
        </div>

        {isEditConfigOpen && (
          <div className="edit-config-modal-container">
            <EditConfigModal
              isOpen={isEditConfigOpen}
              onClose={() => setIsEditConfigOpen(false)}
              setOutputLines={setOutputLines}
            />
          </div>

        )}

    </div>
  )
}

export default App
