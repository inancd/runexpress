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
        const distanceElapsed = data.runVisuals && data.runVisuals.distance ? Math.ceil(data.runVisuals.distance.elapsed.num) : -1;
        const distanceRemaining = data.runVisuals && data.runVisuals.distance ? Math.floor(data.runVisuals.distance.remain.num) : -1;

        const elapsedTimeInSeconds =runParams && runParams?.durations.active ? runParams.durations.active / 1000 : 0;
        const elapsedTimeStr = formatTime(elapsedTimeInSeconds);

        const remainingTimeStr = data.runVisuals && data.runVisuals.time ? data.runVisuals.time.remain.str : 'N/A';       
        const gpsPoints = data.gpsArr ? data.gpsArr.length : 'N/A';
        const last_gps_time = data.gpsArr && data.gpsArr.length > 0 ? 
                                new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', 
                                                                year: 'numeric', month: 'long', day: 'numeric', 
                                                                hour: '2-digit', minute: '2-digit', second: '2-digit', 
                                                                hour12: false, timeZoneName: 'longGeneric' }).format(new Date(data.gpsArr[data.gpsArr.length - 1].timestamp)) 
                                : 'N/A';
    
        let infoTable = `
        <table style="border-collapse: collapse; width: 100%;">
            <tr><td style="border: 1px solid black; padding: 8px;"><b>Runner</b></td><td style="border: 1px solid black; padding: 8px;">${username || 'N/A'}</td></tr>
            <tr><td style="border: 1px solid black; padding: 8px;"><b>Device</b></td><td style="border: 1px solid black; padding: 8px;">${data.device || 'N/A'}</td></tr>
            <tr><td style="border: 1px solid black; padding: 8px;"><b>Pace</b></td><td style="border: 1px solid black; padding: 8px;">${`${data.pace} per km` || 'N/A'}</td></tr>
            <tr><td style="border: 1px solid black; padding: 8px;"><b>Run Started</b></td><td style="border: 1px solid black; padding: 8px;">${runStarted}</td></tr>
            <tr><td style="border: 1px solid black; padding: 8px;"><b>Last GPS Data Time</b></td><td style="border: 1px solid black; padding: 8px;">${last_gps_time}</td></tr>
            <tr><td style="border: 1px solid black; padding: 8px;"><b>Total Calories Burnt</b></td><td style="border: 1px solid black; padding: 8px;">${caloriesBurnt}</td></tr>
            <tr><td style="border: 1px solid black; padding: 8px;"><b>Total Distance</b></td><td style="border: 1px solid black; padding: 8px;">${distanceElapsed} meters</td></tr>
            <tr><td style="border: 1px solid black; padding: 8px;"><b>Remaining Distance</b></td><td style="border: 1px solid black; padding: 8px;">${distanceRemaining} meters</td></tr>
            <tr><td style="border: 1px solid black; padding: 8px;"><b>Elapsed Time</b></td><td style="border: 1px solid black; padding: 8px;">${elapsedTimeStr}</td></tr>
            <tr><td style="border: 1px solid black; padding: 8px;"><b>Remaining Time</b></td><td style="border: 1px solid black; padding: 8px;">${remainingTimeStr}</td></tr>
            <tr><td style="border: 1px solid black; padding: 8px;"><b>GPS point count</b></td><td style="border: 1px solid black; padding: 8px;">${gpsPoints}</td></tr>
        </table>
        `;
                              
      
        
        // Add the table to the extraInfo div
        extraInfo.innerHTML += infoTable;

        try {
            generateChart(data.lap1000, 1000);

            // Event listeners for buttons
            document.getElementById('lap250Btn').addEventListener('click', function() {
                generateChart(data.lap250, 250);
            });

            // Event listeners for buttons
            document.getElementById('lap500Btn').addEventListener('click', function() {
                generateChart(data.lap500, 500);
            });

            document.getElementById('lap1000Btn').addEventListener('click', function() {
                generateChart(data.lap1000, 1000);
            });            
        } catch (error) {
            
        }

        try {
            const totalDistance = distanceElapsed + distanceRemaining;
            const remainingTimeInSeconds = data.runVisuals && data.runVisuals.time ? Math.max(data.runVisuals.time.remain.num, 0) : 0;
            const totalTimeInSeconds = elapsedTimeInSeconds + remainingTimeInSeconds;            
            // Calculate distance progress percentage
            const distanceProgress = totalDistance > 0 ? (distanceElapsed / totalDistance) * 100 : 100;
            // Calculate time progress percentage
            const timeProgress = totalTimeInSeconds > 0 ? (elapsedTimeInSeconds / totalTimeInSeconds) * 100 : 100;
            // Calculate average pace
            const averagePace = calc_pace(distanceElapsed, elapsedTimeInSeconds);
                // Calculate remaining pace if distanceRemaining and remainingTime are greater than zero
            let remainingPace = null;
            if (distanceRemaining > 0 && remainingTimeInSeconds > 0) {
                remainingPace = calc_pace(distanceRemaining, remainingTimeInSeconds);
            }

            // Format the paces
            const formattedAveragePace = formatPace(averagePace);
            const formattedRemainingPace = remainingPace !== null ? formatPace(remainingPace) : 'N/A';

            // Now, update the DOM
            const summaryInfoDiv = document.getElementById('summaryInfo');

            // Clear any existing content
            summaryInfoDiv.innerHTML = '';

            // Function to create circular progress element
            const createCircularProgress = (label, progress, progressColor, totalLabel) => {
                const containerDiv = document.createElement('div');
                containerDiv.classList.add('progress-container');
            
                const circularDiv = document.createElement('div');
                circularDiv.classList.add('circular-progress');
                circularDiv.style.background = `conic-gradient(${progressColor} ${progress}%, #bbcf07 ${progress}% 100%)`; // Adjusting gradient
            
                circularDiv.innerHTML = `
                    <div class="progress-value">${Math.floor(progress)}%</div>
                `;
            
                const labelP = document.createElement('p');
                labelP.classList.add('text-center', 'mt-2', 'font-bold');
                labelP.textContent = label;
            
                const totalLabelP = document.createElement('p');
                totalLabelP.classList.add('text-center');
                totalLabelP.textContent = totalLabel;
            
                containerDiv.appendChild(circularDiv);
                containerDiv.appendChild(labelP);
                containerDiv.appendChild(totalLabelP);
            
                return containerDiv;
            };
            
            // Create the visual elements
            // Create circular distance progress
            const distanceDiv = createCircularProgress('Distance', distanceProgress, '#3b82f6', `${distanceElapsed}m / ${totalDistance}m`);
            // Create circular time progress
            const timeDiv = createCircularProgress('Time', timeProgress, '#10b981', `${formatTime(elapsedTimeInSeconds)} / ${formatTime(totalTimeInSeconds)}`);

            // 3. Remaining Pace
            const remainingPaceDiv = document.createElement('div');
            remainingPaceDiv.innerHTML = `
                <div>
                    <h3 class="text-center font-bold">Remaining Pace</h3>
                    <p class="text-center text-2xl">${formattedRemainingPace}</p>
                </div>
            `;

            // 4. Average Pace
            const averagePaceDiv = document.createElement('div');
            averagePaceDiv.innerHTML = `
                <div>
                    <h3 class="text-center font-bold">Average Pace</h3>
                    <p class="text-center text-2xl">${formattedAveragePace}</p>
                </div>
            `;

            // Append the elements to the summaryInfoDiv
            summaryInfoDiv.appendChild(distanceDiv);
            summaryInfoDiv.appendChild(timeDiv);
            summaryInfoDiv.appendChild(remainingPaceDiv);
            summaryInfoDiv.appendChild(averagePaceDiv);
            //console.log('Summary info elements added to the DOM:\n**\n', summaryInfoDiv.innerHTML, '\n**');

        } catch (error) {
            console.error('Error generating summary info:', error);
        }
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

const PACE_MUL = 60 / 3.6;
function calc_pace(dist_mt, time_sec) {
  return (PACE_MUL * time_sec) / dist_mt;
}

// Function to format the pace into mm'ss'' format
function formatPace(pace) {
    if (pace === 0) return '0\'00"';
    const totalSeconds = pace * 60; // pace is in minutes per km
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
}

// Function to format timestamp into HH:MM:SS format
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-GB');
}

// Helper function to format total seconds into HH:MM:SS
function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.round(totalSeconds % 60);

    const hoursStr = hours > 0 ? `${hours}:` : '';
    const minutesStr = `${minutes.toString().padStart(2, '0')}:`;
    const secondsStr = seconds.toString().padStart(2, '0');

    return `${hoursStr}${minutesStr}${secondsStr}`;
}

// Function to generate the chart
function generateChart(lapData, lapDistance) {
    const ctx = document.getElementById('lapChart').getContext('2d');

    // Extract data for the chart
    const labels = lapData.map(lap => `Lap ${lap.lapID}`);
    const paces = lapData.map(lap => lap.pace);

    // Determine the pace range for coloring
    const minPace = Math.min(...paces);
    const maxPace = Math.max(...paces);

    // Generate background colors based on pace
    const backgroundColors = paces.map(pace => getColor(pace, minPace, maxPace));

    // Destroy previous chart instance if it exists
    if (window.lapChartInstance) {
        window.lapChartInstance.destroy();
    }

    // Create the chart
    window.lapChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `${lapDistance}m Lap Pace`,
                data: paces,
                backgroundColor: backgroundColors,
            }]
        },
        options: {
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return formatPace(value);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Pace (min/km)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            const lap = lapData[index];
                            const formattedPace = formatPace(lap.pace);
                            const formattedTime = formatTimestamp(lap.timestamp);
                            return `Time: ${formattedTime}\nPace: ${formattedPace}`;
                        }
                    }
                }
            }
        }
    });
}

// Function to get color based on pace
function getColor(value, min, max) {
    const ratio = (value - min) / (max - min);
    const red = Math.floor(255 * ratio);
    const green = Math.floor(255 * (1 - ratio));
    return `rgb(${red}, ${green}, 0)`;
}