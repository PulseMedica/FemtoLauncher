// This component displays the status of various services (PMserver, UI, etc.)
import { useState, useEffect, useCallback } from 'react'
import "../Styles/Services.css"
const Services = () => {
    // I'd love to have these in an object instead but I can't get it to work nicely.
    // For now they're just individual states, but maybe can revisit later.
    const [serverStatus, setServerStatus] = useState(false)
    const [uiStatus, setUiStatus] = useState(false)

    function handleServiceClass(service:boolean) {
        if (service){
            return "service-live";
        }
        else{
            return "service-dead";
        }
    }

    useEffect(() => {
        const pollService = async (serviceName:string, setStateFunction:Function) => {
        try {
            // Ensure window.ipcRenderer and its invoke method exist
            if (window.ipcRenderer && typeof window.ipcRenderer.invoke === 'function') {
            const serviceState = await window.ipcRenderer.invoke('poll-service', serviceName);
            setStateFunction(serviceState); // Update the state with the received value
            } else {
            console.warn("ipcRenderer not available or invoke method missing.");
            }
        } catch (error) {
            console.error(`Error polling ${serviceName}:`, error);
        }
    };

    // Set up intervals for each service
    const pmServerInterval = setInterval(() => {
        pollService('PMServer.exe', setServerStatus);
        }, 2000); // Poll pmServer every 5 seconds (adjust as needed)

        const fssUIInterval = setInterval(() => {
        pollService('FSS UI.exe', setUiStatus);
        }, 2000); // Poll fssUI every 5 seconds (adjust as needed)

        // Initial poll when component mounts
        pollService('PMServer.exe', setServerStatus);
        pollService('FSS UI.exe', setUiStatus);

        // Cleanup function to clear intervals when the component unmounts
        return () => {
        clearInterval(pmServerInterval);
        clearInterval(fssUIInterval);
        };
    }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount


    return(
        <div className="services-container">
            <div className="service-item">
                <div className="service-name">Server:</div>
                <div className={handleServiceClass(serverStatus)}></div>
            </div>
            <div className="service-item">
                <div className="service-name">UI:</div>
                <div className={handleServiceClass(uiStatus)}></div>
            </div>
        </div>
    )

}

export default Services;
