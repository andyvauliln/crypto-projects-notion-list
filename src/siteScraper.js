import dotenv from 'dotenv';
import fs2 from 'fs';
import fs from 'fs/promises';
import puppeteer from 'puppeteer';
import fullPageScreenshot from 'puppeteer-full-page-screenshot';
import LoggerInstance from './loging.js';


dotenv.config();

const { NOTION_API_TOKEN } = process.env;


export const getSiteData = async (link, tokenName, tokenId) => {
    try {
        // if (fs2.existsSync('screenshots')) {
        //     await fs.mkdir("screenshots");
        // }
        const browser = await puppeteer.launch({
            headless: false,
            timeout: 100000
        });


        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto(link, {
            waitUntil: 'networkidle0'
        });

        const pageUrls = await page.evaluate(() => {
            const urlArray = Array.from(document.links).map((link) => link.href);
            const uniqueUrlArray = [...new Set(urlArray)];
            return uniqueUrlArray;
        });
        await page.emulateMediaType('screen');

        await page.screenshot({ path: `screenshots/${tokenName}1.png`, fullPage: true });
        await fullPageScreenshot(page, { path: `screenshots/${tokenName}2.png` });
        const pdf = await page.pdf({
            path: `screenshots/${tokenName}.pdf`,
            margin: { top: '20px', right: '50px', bottom: '20px', left: '50px' },
            printBackground: true,
            format: 'A4'
        });

        LoggerInstance.logInfo(`getSiteData = ${tokenId} ${tokenName} - ${link} ${pageUrls[0]} \n\n ${pageUrls} }`)

        return { pageUrls: pageUrls, browser }
    } catch (error) {
        LoggerInstance.logError(`ERROR WHEN TAKE SCREENSHOT ${tokenId} ${tokenName} ${link} \n\n ${error.message} \n\n ${error.stack}`)
        return { pageUrls: [], browser }
    }
}

// export getSiteData;
