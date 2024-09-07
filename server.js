const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/data/*', (req, res) => {
  const fullPath = req.params[0];  // Capture everything after /data/
  const [username, ...queryParts] = fullPath.split('?');
  const filePath = path.join(__dirname, 'data', `${username}.json`);

  //console.log(`app.get-data-Username: ${username}`);
  //console.log(`app.get-data-File path: ${filePath}`);

  // Check if the file exists
  fs.readFile(filePath, (err, data) => {
    if (err) {
      return res.status(404).json({ error: 'User not found' });
    }

    const jsonData = JSON.parse(data);
    // const response = {
    //   username: username,
    //   data: jsonData,
    // };

    // Process query parameters (key-value pairs after `?`)
    // queryParts.forEach(part => {
    //   const [key, value] = part.split('=');
    //   response[key] = value;
    // });

    // for (const [key, value] of Object.entries(response)) {
    //   if (Array.isArray(value)) {
    //     console.log(`${key} is an array with length ${value.length}`);
    //   } else if (typeof value === 'object' && value !== null) {
    //     console.log(`${key} is an object with ${Object.keys(value).length} keys`);
    //   } else if (typeof value === 'string') {
    //     console.log(`${key} is ${value}`);
    //   } else {
    //     console.log(`${key} is ${value}`);
    //   }
    // }

    res.json(jsonData);
  });
});

app.get('/:username', (req, res) => {
  const username = req.params.username;

  // Ignore favicon.ico requests
  if (username === 'favicon.ico') {
    return res.status(204).end();  // Return no content for favicon requests
  }

  const filePath = path.join(__dirname, 'data', `${username}.json`);

  //console.log(`app.get-username-Username: ${username}`);
  //console.log(`app.get-username-File path: ${filePath}`);

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