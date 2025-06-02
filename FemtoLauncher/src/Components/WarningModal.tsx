import { useState, useEffect } from "react"
import '../Styles/WarningModal.css'

const WarningModal = () => {
    const [hovered, setHovered] = useState(false);
    const [outputLines, setOutputLines] = useState<string[]>([]);;

    // Potentially interferring applications
    const [amplitude, setAmplitude] = useState(false);
    const [optotuneCockpit, setOptotuneCockpit] = useState(false);
    const [superlumBLC, setSuperlumBLC] = useState(false);
    const [thorImageOCT, setThorImageOCT] = useState(false);
    const [wavefrontViewer, setWavefrontViewer] = useState(false);
    const [powerMeter, setPowerMeter] = useState(false);
    const [spinviewCamera, setSpinviewCamera] = useState(false);


    useEffect(() => {
        const pollService = async (
        serviceName: string,
        label: string,
        setStateFunction: (value: boolean) => void
        ) => {
        try {
            if (window.ipcRenderer?.invoke) {
            const serviceState = await window.ipcRenderer.invoke('poll-service', serviceName);
            setStateFunction(serviceState);

            setOutputLines((prev) => {
                const isAlreadyListed = prev.includes(label);

                if (serviceState && !isAlreadyListed) {
                return [...prev, label]; // add to list if running
                }

                if (!serviceState && isAlreadyListed) {
                return prev.filter((line) => line !== label); // remove from list if stopped
                }

                return prev; // no change
            });
            } else {
            console.warn("ipcRenderer not available or invoke method missing.");
            }
        } catch (error) {
            console.error(`Error polling ${label}:`, error);
        }
        };

        // Set up intervals for each service. To test these, pass in "firefox or chrome.exe" to bring up the modal. Cuz the icon only displays if there's an interferring application.
        const ampltiudeInterval = setInterval(() => {
            pollService('Driver Fibre TF', "Amplitude", setAmplitude);
        }, 2000);

        const optotuneCockpitInterval = setInterval(() => {
            pollService('OptoProduct.exe', "Optotune Cockpit", setOptotuneCockpit);
        }, 2000);

        const superlumBLCInterval = setInterval(() => {
            pollService('', "Superlum BLC", setSuperlumBLC);
        }, 2000);

        const thorImageOCTInterval = setInterval(() => {
            pollService('ThorImageOCT.exe', "ThorImage OCT",setThorImageOCT)
        }, 2000)

        const wavefrontViewerInterval = setInterval(() => {
            pollService('wfs.exe',  "Wavefront Viewer",setWavefrontViewer)
        }, 2000)

        const powerMeterInterval = setInterval(() => {
            pollService('Thorlabs Optical Power Monitor.exe', "PowerMeter", setPowerMeter)
        }, 2000)

        const spinviewCameraInterval = setInterval(() => {
            pollService('SpinView_WPF', "Spinview Camera",setSpinviewCamera)
        }, 2000)

        // Initial poll when component mounts
        pollService("Driver Fibre TF", "Amplitude",setAmplitude);
        pollService("OptoProduct.exe", "Optotune Cockpit", setOptotuneCockpit);
        pollService("", "Superlum BLC", setSuperlumBLC);
        pollService("ThorImageOCT.exe", "ThorImage OCT", setThorImageOCT);
        pollService("wfs.exe", "Wavefront Viewer", setWavefrontViewer);
        pollService("Thorlabs Optical Power Monitor.exe", "PowerMeter", setPowerMeter);
        pollService("SpinView_WPF", "Spinview Camera", setSpinviewCamera);

        // Cleanup function to clear intervals when the component unmounts
        return () => {
            clearInterval(ampltiudeInterval);
            clearInterval(optotuneCockpitInterval);
            clearInterval(superlumBLCInterval);
            clearInterval(thorImageOCTInterval);
            clearInterval(wavefrontViewerInterval);
            clearInterval(powerMeterInterval);
            clearInterval(spinviewCameraInterval);
        };

    }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

    return (
        <div className="warning-container">
            {/* Will onyl render if there is a warning in the first place. */}
            {outputLines.length !== 0 && (
                <>
                    <span className="warning-icon">⚠️</span>
                    <div className="warning-modal">
                        Open Applications that may potentially be interfering:
                        <ul>
                            {outputLines.map((line, index) => (
                                <li key={index}>{line}</li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
        </div>
    )
}

export default WarningModal
