const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Use Stealth and Adblocker plugins
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

(async () => {
  // Launch Puppeteer with custom settings
  const browser = await puppeteer.launch({
    headless: false, // Set to false to see the browser
    args: [
      '--disable-gpu',
      '--no-sandbox',
      '--disable-extensions',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--flag-switches-begin --disable-site-isolation-trials --flag-switches-end',
      '--disable-dev-shm-usage',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certifcate-errors',
      '--ignore-certifcate-errors-spki-list',
    ],
    timeout: 60000, // Increase timeout to 60 seconds
  });

  // Open a new page
  const page = await browser.newPage();
  await page.setViewport({ width: 1900, height: 1900 });

  try {
    // Go to the main listing page
    await page.goto('https://www.myhome.ge/ka/s/iyideba-bina-Tbilisi/?Keyword=%E1%83%95%E1%83%90%E1%83%99%E1%83%94&AdTypeID=1&PrTypeID=1&cities=1&districts=38&regions=4&Page=1&CardView=2', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('a[href*="https://www.myhome.ge/ka/pr/"]', { timeout: 60000 });

    // Extract listing links
    const listingLinks = await page.evaluate(() => {
      const linkElements = document.querySelectorAll('a[href*="https://www.myhome.ge/ka/pr/"]');
      return Array.from(linkElements).map(link => link.href);
    });

    console.log('Extracted links:', listingLinks);

    // Extract IDs from links
    const listingIds = listingLinks.map(link => {
      const match = link.match(/\/pr\/(\d+)\//);
      return match ? match[1] : null;
    }).filter(id => id !== null);

    console.log('Extracted IDs:', listingIds);

    // Create a main folder named 'project'
    const projectDirectory = path.join(__dirname, 'project');
    if (!fs.existsSync(projectDirectory)) {
      fs.mkdirSync(projectDirectory);
    }

    // Create folders for each listing ID
    listingIds.forEach(id => {
      const idDirectory = path.join(projectDirectory, id);
      if (!fs.existsSync(idDirectory)) {
        fs.mkdirSync(idDirectory);
      }
    });

    // Function to download images
    const downloadImage = async (url, filepath) => {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
      });
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);
      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    };

    // Function to scrape listing details
    const scrapeListingDetails = async (link, idDirectory, id) => {
      const detailPage = await browser.newPage();
      await detailPage.goto(link, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // Extract image URLs
      const imageUrls = await detailPage.evaluate(() => {
        const imgElements = document.querySelectorAll('.swiper-thumbs img.swiper-lazy');
        return Array.from(imgElements).map(img => img.getAttribute('data-src') || img.src);
      });

      // Download and save images
      for (let i = 0; i < imageUrls.length; i++) {
        const imgUrl = imageUrls[i];
        const imgFilePath = path.join(idDirectory, `image_${i + 1}.jpg`);
        await downloadImage(imgUrl, imgFilePath);
      }

      // Extract listing details
      const listingDetails = await detailPage.evaluate(() => {
        const floorElement = document.querySelector('.icon.floor + div span:first-child');
        const bedroomElement = document.querySelector('.icon.bed + div span:first-child');
        const areaElement = document.querySelector('.icon.space + div span:first-child');
        const roomsElement = document.querySelector('.icon.space + div span:nth-child(2)');
        const priceElement = document.querySelector('.convertable[data-price-usd]');

        const floor = floorElement ? floorElement.innerText.trim() : 'N/A';
        const bedrooms = bedroomElement ? parseInt(bedroomElement.innerText.trim(), 10) : 'N/A';
        const areaText = areaElement ? areaElement.innerText.trim().split(' ')[0] : 'N/A';
        const roomsText = roomsElement ? roomsElement.innerText.trim().split(' ')[0] : 'N/A';
        const price = priceElement ? parseInt(priceElement.getAttribute('data-price-usd').replace(',', ''), 10) : 'N/A';

        const area = areaText !== 'N/A' ? parseFloat(areaText) : 'N/A';
        const rooms = roomsText !== 'N/A' ? parseInt(roomsText, 10) : 'N/A';

        return {
          floor,
          bedrooms,
          rooms,
          area,
          price
        };
      });

      // Write listing details to a text file
      const detailsFilePath = path.join(idDirectory, `${id}.txt`);
      const detailsContent = `{
id: ${id}, // Id of listing
floor: ${listingDetails.floor}, // floor / total floors in building
bedroom: ${listingDetails.bedrooms}, // bedroom quantity
rooms: ${listingDetails.rooms}, // room quantity
area: ${listingDetails.area}, // area in square meters
price: ${listingDetails.price} // price in USD
}`;
      fs.writeFileSync(detailsFilePath, detailsContent);

      await detailPage.close();
    };

    // Scrape details for each listing
    for (let i = 0; i < listingLinks.length; i++) {
      const idDirectory = path.join(projectDirectory, listingIds[i]);
      await scrapeListingDetails(listingLinks[i], idDirectory, listingIds[i]);
    }

    console.log('Details scraped and saved successfully.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
