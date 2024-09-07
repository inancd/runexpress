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
    await handleUserData(username, enforceUpdate);
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

  const filePath = path.join(__dirname, 'data', `${username}.json`);

  //console.log(`app.get-username-Username: ${username}`);
  //console.log(`app.get-username-File path: ${filePath}`);

  // if the file doesn't exist first try calling fetchMapsData in maps.js
  if (!fs.existsSync(filePath)) {
    await handleUserData(username, enforceUpdate);
  }

  fs.access(filePath, fs.constants.F_OK, (err) => {
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