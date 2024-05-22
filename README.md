# ediscraper
scraper
Real Estate Scraper
This project is a web scraper for extracting real estate listings from MyHome.ge, including images and details such as floor number, bedroom quantity, room quantity, area in square meters, and price in USD. The extracted data is saved in respective folders for each listing.

Features
Extracts links to real estate listings
Saves images from the listings
Extracts and saves details (floor, bedrooms, rooms, area, price) into a text file
Organizes the data into folders named after each listing's ID
Prerequisites
Node.js (>=14.0.0)
npm (>=6.0.0)

Setup
1-Clone the repository:

git clone https://github.com/Ardidini12/ediscraper
cd ediscraper

2-Install the required npm packages:
npm install
npm install axios puppeteer-extra puppeteer-extra-plugin-stealth puppeteer-extra-plugin-adblocker fs-extra

3-Run the script:
node index.js

How it Works
The script launches a Puppeteer browser instance.
It navigates to the specified MyHome.ge URL to extract links to individual real estate listings.
For each extracted link, it:
Creates a folder named after the listing's ID.
Downloads images and saves them in the respective folder.
Extracts details (floor, bedrooms, rooms, area, price) and saves them in a text file named id.txt inside the respective folder.

Notes
The script is set to run with a visible browser window (headless: false). You can change this to true if you do not need to see the browser actions.


Conclusion
This scraper is a basic implementation to extract real estate listings from MyHome.ge. 




