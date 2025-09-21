const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

const app = express();
const PORT = process.env.PORT || 3000;

// THIS IS YOUR SECRET KEY. Change it to something long and random.
const SHARED_SECRET = 'change-this-to-a-very-secret-key-12345';

app.get('/api', async (req, res) => {
    // --- 1. Security Check ---
    const token = req.query.token;
    if (token !== SHARED_SECRET) {
        return res.status(403).send('Error: Invalid authentication token.');
    }

    // --- 2. Get Parameters ---
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('Error: Please provide a URL parameter.');
    }

    const width = parseInt(req.query.width, 10) || 1280;
    const height = parseInt(req.query.height, 10) || 800;
    const fullPage = req.query.fullPage === 'true';


    let browser = null;
    try {
        // --- 3. Launch Browser ---
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.setViewport({ width, height });

        // --- 4. Go to URL and Take Screenshot ---
        await page.goto(url, { waitUntil: 'networkidle0' });

        const imageBuffer = await page.screenshot({
            type: 'jpeg',
            quality: 85,
            fullPage: fullPage
        });

        // --- 5. Return the image ---
        res.setHeader('Content-Type', 'image/jpeg');
        res.send(imageBuffer);

    } catch (error) {
        console.error(error);
        return res.status(500).send(`Error generating screenshot for ${url}: ${error.message}`);
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Export the app for Vercel
module.exports = app;
