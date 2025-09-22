const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium'); // MODIFICAT AICI

const app = express();
// NU UITA SĂ PUI CHEIA TA SECRETĂ AICI!
const SHARED_SECRET = 'change-this-to-a-very-secret-key-12345'; 

app.get('/api/take', async (req, res) => {
    // Verificare securitate
    if (req.query.token !== SHARED_SECRET) {
        return res.status(403).send('Error: Invalid auth token.');
    }
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('Error: URL parameter is required.');
    }

    let browser = null;
    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(), // MODIFICAT AICI
            headless: chromium.headless, // MODIFICAT AICI
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        await page.setViewport({ 
            width: parseInt(req.query.width, 10) || 1280, 
            height: parseInt(req.query.height, 10) || 800 
        });

        await page.goto(url, { waitUntil: 'networkidle0', timeout: 25000 });
        
        const imageBuffer = await page.screenshot({ 
            type: 'jpeg', 
            quality: 85, 
            fullPage: true 
        });

        res.setHeader('Content-Type', 'image/jpeg');
        res.send(imageBuffer);

    } catch (error) {
        console.error(error);
        return res.status(500).send(`Error taking screenshot for ${url}: ${error.message}`);
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
});

module.exports = app;
