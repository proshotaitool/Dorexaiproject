const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        console.log('Browser launched');
        const page = await browser.newPage();
        console.log('Navigating...');
        await page.goto('https://example.com');
        console.log('Taking screenshot...');
        await page.screenshot({ path: 'example.png' });
        console.log('Screenshot saved');
        await browser.close();
    } catch (error) {
        console.error('Error:', error);
    }
})();
