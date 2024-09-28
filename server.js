const express = require('express');
const path = require('path');
const fs = require('fs');
const { handleUserData } = require('./public/scripts/dataHandler');

const app = express();
const PORT = process.env.PORT || 3000;
const enforceUpdate = true;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/data/*', async (req, res) => {
  const fullPath = req.params[0];  // Capture everything after /data/
  const [username, ...queryParts] = fullPath.split('?');
  const filePath = path.join(__dirname, 'data', `${username}.json`);

  //console.log(`app.get-data-Username: ${username}`);
  //console.log(`app.get-data-File path: ${filePath}`);

  // if the file doesn't exist first try calling fetchMapsData in maps.js
  if (!fs.existsSync(filePath)) {
    await handleUserData(username, false);
  }

  // Check if the file exists
  fs.readFile(filePath, (err, data) => {
    if (err) {
      return res.status(404).json({ error: 'User not found' });
    }

    const jsonData = JSON.parse(data);

    res.json(jsonData);
  });
});

app.get('/:username', async (req, res) => {
  const username = req.params.username;

  // Ignore favicon.ico requests
  if (username === 'favicon.ico') {
    return res.status(204).end();  // Return no content for favicon requests
  }

  const localFilePath = path.join(__dirname, 'data', `${username}.json`);
  let force_to_download = enforceUpdate;
  // Append log data to a file
  const logFilePath = path.join(__dirname, 'access_logs.txt');
  let userIp = '???';
  let timestamp = 0;
  let readableTimestamp = '???';
  let connectionCount = 1;
  
  try {
    // Get user's IP address
    userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    // Normalize IPv4-mapped IPv6 addresses
    if (userIp.startsWith('::ffff:')) {
      userIp = userIp.split('::ffff:')[1];
    }
  
    // Get current timestamps
    timestamp = Date.now();
    readableTimestamp = new Date().toISOString(); // Use ISO format for readable timestamp
  } catch (err) {
    readableTimestamp = 'err:<'+err.message+'>';
  }
  
  let logExists = false;
  
  try {
    // Read the log file contents if it exists
    if (fs.existsSync(logFilePath)) {
      const logData = fs.readFileSync(logFilePath, 'utf8');
      const logLines = logData.split('\n').filter(Boolean); // Split into lines and remove empty lines
  
      // Search for the user IP in the existing logs
      logLines.forEach((line, index) => {
        const [loggedIp, loggedUsername, loggedTimestamp, loggedReadableTimestamp, loggedCount] = line.split('#');
  
        // If the IP and username match and the timestamp is within 10 minutes (600000 ms)
        if (loggedIp === userIp && loggedUsername === username && (timestamp - parseInt(loggedTimestamp)) < 600000) {
          // Update the connection count and log entry
          connectionCount = parseInt(loggedCount || 1) + 1;
          logLines[index] = `${loggedIp}#${loggedUsername}#${loggedTimestamp}#${loggedReadableTimestamp}#${connectionCount}`;
          logExists = true;
        }
      });
  
      // If an update was made, overwrite the log file with the updated data
      if (logExists) {
        fs.writeFileSync(logFilePath, logLines.join('\n') + '\n', 'utf8');
      }
    }
  } catch (err) {
    console.error('Error reading or updating the log file:', err);
  }
  
  // If the log entry doesn't exist or wasn't updated, create a new log entry
  if (!logExists) {
    const newLogData = `${userIp}#${username}#${timestamp}#${readableTimestamp}#${connectionCount}\n`;
    try {
      fs.appendFileSync(logFilePath, newLogData, 'utf8');
    } catch (err) {
      console.error('Error logging access:', err);
      // Ignore the error and continue the request handling
    }
  }

  const fileExists = fs.existsSync(localFilePath);
  if (fileExists) {
      const stats = fs.statSync(localFilePath);
      const fileAgeInSeconds = (Date.now() - stats.mtime.getTime()) / 1000; // Time difference in seconds

      // Initialize timeThreshold with default 30 seconds
      let timeThreshold = 30;

      try {
          // Read and parse the JSON file
          const jsonData = fs.readFileSync(localFilePath, 'utf-8');
          const data = JSON.parse(jsonData);

          // Check if lap250 exists and is a non-empty array
          if (data.lap250 && Array.isArray(data.lap250) && data.lap250.length > 0) {
              // Get the pace value of the last item
              const lastLap = data.lap250[data.lap250.length - 1];
              const pace = lastLap.pace;

              // Calculate the timeThreshold
              timeThreshold = Math.max(Math.ceil(1.05 * pace * 15), 10);
          } else {
              // Use fixed 30 seconds value if lap250 doesn't exist
              timeThreshold = 30;
          }
      } catch (err) {
          console.error('Error reading or parsing JSON file:', err);
          // Use fixed 30 seconds value in case of error
          timeThreshold = 30;
      }
      
      // 36 seconds is 6'00'' pace for 100 meters
      if (force_to_download && fileAgeInSeconds < timeThreshold) {
          console.log(`handleUserData-->File exists and is less than ${timeThreshold} seconds old. Skipping download.`);
          force_to_download = false;
      }
  }  

  console.log(`app.get-username-Username: ${username}`);
  console.log(`app.get-username-File path: ${localFilePath}`);

  // if the file doesn't exist first try calling fetchMapsData in maps.js
  if (!fs.existsSync(localFilePath) || force_to_download) {
    await handleUserData(username, force_to_download);
  }

  fs.access(localFilePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).render('error', { message: 'Böyle bir kullanıcı yok' });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});