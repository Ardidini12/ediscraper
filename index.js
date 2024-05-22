// index.js
const express = require('express');
const app = express();
const scraper = require('./scraper');

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Welcome to the Web Scraper!');
});

app.get('/scrape', async (req, res) => {
  try {
    const data = await scraper.scrape();
    res.json(data);
  } catch (error) {
    res.status(500).send('Error occurred while scraping data.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
