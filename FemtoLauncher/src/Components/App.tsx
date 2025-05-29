import { useState, useEffect, useCallback } from 'react'
import reactLogo from '../assets/react.svg'
import viteLogo from '/electron-vite.animate.svg'
import '../Styles/App.css'
import logo from "../assets/logo.png"

function App() {
  const [outputLines, setOutputLines] = useState<string[]>([]);;
  const [mode, setMode] = useState('sim');

  // Runs config.
  const handleRunConfigClick = async() => {
    setOutputLines([])
    const resultObject = await window.ipcRenderer.invoke('run-config');
    const results = resultObject.outputLines;
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

  const handleRunSoftware = async(mode:string) => {
    setOutputLines([])
    if (mode === "sim" ){
      const result = await window.ipcRenderer.invoke('run-sw-sim');
    }
    else if (mode === "target") {
      const result = await window.ipcRenderer.invoke("run-sw-target")
    }
  }

  const handleKillSoftware = async() => {
    const result = await window.ipcRenderer.invoke("kill-software")
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
                <div className="radio-container">
                  <input type="radio" name="target" value="target" checked={mode === "target"} onClick={handleModeSelect}/>
                  <label htmlFor="target">Target</label>
                </div>

                <div className="radio-container">
                  <input type="radio" name="sim" value="sim" checked={mode === "sim"} onClick={handleModeSelect}/>
                  <label htmlFor="sim">Simulation</label>
                </div>
            </div>

            <button id="btn-run-config" onClick={handleRunConfigClick}>
              Run Config
            </button>

            <button id="btn-launch-sw" onClick={() => handleRunSoftware(mode)}> {/* Starts both the server and UI in one go. */}
              Launch Software
            </button>

            <div className="output-container">
                {!outputLines ? ( /* If the script is still loading */
                    <div>Loading...</div>
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
    </div>
  )
}

export default App
