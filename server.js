const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.static(path.join(__dirname, 'public')));


app.get('/data/:username', (req, res) => {
  const username = req.params.username;
  const filePath = path.join(__dirname, 'data', `${username}.json`);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      return res.status(404).json({ error: 'User not found' });
    }

    const jsonData = JSON.parse(data);
    res.json(jsonData);
  });
});


app.get('/:username', (req, res) => {
  const username = req.params.username;
  const filePath = path.join(__dirname, 'data', `${username}.json`);

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