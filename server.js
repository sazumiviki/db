const express = require('express');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const dbFile = 'database.json';
const dbFilePath = path.join(__dirname, dbFile);
const password = process.env.PASSWORD || 'defaultPassword';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
async function createDatabaseFile() {
  try {
    await fs.access(dbFilePath);
  } catch (error) {
    await fs.writeFile(dbFilePath, '[]');
  }
}

app.use(async (req, res, next) => {
  await createDatabaseFile();
  next();
});

function authenticate(req, res, next) {
  const userPassword = req.body.password || req.headers['x-password'];
  if (userPassword === password) {
    next();
  } else {
    res.send(`
      <html>
        <body>
          <form action="/data" method="post">
            <label for="password">Password:</label>
            <input type="password" id="password" name="password">
            <input type="submit" value="Submit">
          </form>
          <p>The password you entered is incorrect.</p>
        </body>
      </html>
    `);
  }
}

app.post('/saveData', authenticate, async (req, res) => {
  try {
    const currentData = await fs.readFile(dbFilePath, 'utf-8');
    const jsonData = JSON.parse(currentData);
    jsonData.push(req.body);
    await fs.writeFile(dbFilePath, JSON.stringify(jsonData, null, 2));

    res.json({ success: true, message: 'Data saved successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'An error occurred in reading the data.' });
  }
});

app.post('/data', authenticate, async (req, res) => {
  try {
    const currentData = await fs.readFile(dbFilePath, 'utf-8');
    const jsonData = JSON.parse(currentData);

    res.json(jsonData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'An error occurred in reading the data.' });
  }
});

app.get('/data-form', (req, res) => {
  res.send(`
    <html>
      <body>
        <form action="/data" method="post">
          <label for="password">Password:</label>
          <input type="password" id="password" name="password">
          <input type="submit" value="Submit">
        </form>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
