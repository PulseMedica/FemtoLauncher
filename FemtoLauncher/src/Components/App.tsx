import { useState, useEffect } from 'react'
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

  const handleRunSoftware = async(mode:string) => {
    setOutputLines([])
    if (mode === "sim" ){
      const result = await window.ipcRenderer.invoke('run-sw-sim');
    }
    else if (mode === "target") {
      const result = await window.ipcRenderer.invoke("run-sw-target")
    }

    // Listen on channels coming from main process to update state
    window.ipcRenderer.on('server-stdout', (event, data) => {
      console.log('Renderer received stdout:', data);
      setOutputLines(prevLines => [...prevLines, data]);
    });

    window.ipcRenderer.on('server-stderr', (event, data) => {
      console.error('Renderer received stderr:', data);
      setOutputLines(prevLines => [...prevLines, data]);
    });

    window.ipcRenderer.on('server-close', (event, code) => {
      console.log('Renderer received close code:', code);
      setOutputLines(prevLines => [...prevLines, code]);
    });
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
