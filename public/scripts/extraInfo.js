document.addEventListener("DOMContentLoaded", async function () {
    // Wait for the DOM to be fully loaded before running the script

    // Get the extraInfo div
    const extraInfo = document.getElementById("extraInfo");

    // Extract the full path and query parameters from the URL
    const fullPath = window.location.pathname.split('/');
    const username = fullPath[1];  // Extract the username from the path
    const queryParams = new URLSearchParams(window.location.search);  // Properly handle query params

    // Log the full path and query parameters (for debugging)
    console.log(`Full path: ${fullPath}`);
    console.log(`Query parameters:`, queryParams.toString());

    // Clear any previous content in the extraInfo div
    extraInfo.innerHTML = '';
    // Fetch data based on the username
    try {
        const data = await fetchData(username);

        // Add checks for data validation
        const runParams = data.runParams || {};
        const timestamps = runParams.timestamps || {};
        const runStarted = timestamps.activityStart ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', 
                                                                                         year: 'numeric', month: 'long', day: 'numeric', 
                                                                                         hour: '2-digit', minute: '2-digit', second: '2-digit', 
                                                                                         hour12: false, timeZoneName: 'longGeneric' }).format(new Date(timestamps.activityStart)) 
        : 'N/A';
        const caloriesBurnt = runParams.calories ? `${Math.ceil(runParams.calories.total)} cal` : 'N/A';
        const distanceElapsed = data.runVisuals && data.runVisuals.distance ? 
            Math.ceil(data.runVisuals.distance.elapsed.num) : 'N/A';
        const distanceRemaining = data.runVisuals && data.runVisuals.distance ? 
            Math.floor(data.runVisuals.distance.remain.num) : 'N/A';
        const elapsedTime = data.runVisuals && data.runVisuals.time ? 
            data.runVisuals.time.elapsed.str : 'N/A';
        const remainingTime = data.runVisuals && data.runVisuals.time ? 
            data.runVisuals.time.remain.str : 'N/A';
        const gpsPoints = data.gpsArr ? data.gpsArr.length : 'N/A';

        // Create a table for the fetched data
        let infoTable = `
          <table>
            <tr><td><b>Runner</b></td><td>${username || 'N/A'}</td></tr>
            <tr><td><b>Device</b></td><td>${data.device || 'N/A'}</td></tr>
            <tr><td><b>Pace</b></td><td>${`${data.pace} per km` || 'N/A'}</td></tr>
            <tr><td><b>Run Started</b></td><td>${runStarted}</td></tr>
            <tr><td><b>Total Calories Burnt</b></td><td>${caloriesBurnt}</td></tr>
            <tr><td><b>Total Distance</b></td><td>${distanceElapsed} meters</td></tr>
            <tr><td><b>Remaining Distance</b></td><td>${distanceRemaining} meters</td></tr>
            <tr><td><b>Elapsed Time</b></td><td>${elapsedTime}</td></tr>
            <tr><td><b>Remaining Time</b></td><td>${remainingTime}</td></tr>
            <tr><td><b>GPS point count</b></td><td>${gpsPoints}</td></tr>
          </table>
        `;
        
        // Add the table to the extraInfo div
        extraInfo.innerHTML += infoTable;
    } catch (error) {
        console.error('Error fetching data:', error);
        let errorParagraph = document.createElement('p');
        errorParagraph.textContent = `Error fetching data: ${error.message}`;
        extraInfo.appendChild(errorParagraph);
    }

    try {
        // Create a new section for query parameters
        let querySection = document.createElement('div');
        querySection.style.marginTop = '20px';
        querySection.innerHTML = '<h3><b>Query Parameters</b></h3>';
        extraInfo.appendChild(querySection);

        // Check if queryParams are empty
        if (!queryParams || queryParams.toString() === '') {
            let paragraph = document.createElement('p');
            paragraph.textContent = 'No query parameters found';
            querySection.appendChild(paragraph);
        } else {
            console.log(`queryParams: ${queryParams.toString()}`);
            
            // Decode the queryParams string and split by "?" or "&"
            const decodedParams = decodeURIComponent(queryParams.toString());

            // Since you have ":", split first by "?"
            decodedParams.split('&').forEach(param => {
                const [key, value] = param.split('=');  // Split key-value by ":"
                
                // Construct the output string with bold key and italic value
                let output = `<b>${key}</b> = <i>${value}</i>`;
                
                // Create a new paragraph element for each entry and append it to the div
                const paragraph = document.createElement('p');
                paragraph.innerHTML = output;  // Use innerHTML to render HTML tags
                querySection.appendChild(paragraph);
            });
        }

    } catch (error) {
        console.error('Error queryParams:', error);
        let errorParagraph = document.createElement('p');
        errorParagraph.textContent = `Error queryParams: ${error.message}`;
        extraInfo.appendChild(errorParagraph);
    }
});

// Fetch data asynchronously
async function fetchData(username, enforceUpdate = false) {
    const response = await fetch(`/data/${username}`);
    if (!response.ok || enforceUpdate) {
        throw new Error('User not found');
    }    
    const the_response = await response.json();
    return the_response;
}