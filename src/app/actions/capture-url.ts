'use server';

import puppeteer from 'puppeteer';

type CaptureResult = {
    success: boolean;
    dataUrl?: string;
    error?: string;
};

export async function captureUrl(url: string, width: number, height: number): Promise<CaptureResult> {
    let browser;
    try {
        // Validate URL
        try {
            new URL(url);
        } catch (e) {
            return { success: false, error: 'Invalid URL provided.' };
        }

        console.log('Launching browser for URL:', url);
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        console.log('Browser launched');
        const page = await browser.newPage();
        await page.setViewport({ width, height });

        // Navigate to URL with a timeout
        console.log('Navigating to page...');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log('Navigation complete');

        // Take screenshot
        const screenshot = await page.screenshot({ encoding: 'base64', type: 'png' });
        const dataUrl = `data:image/png;base64,${screenshot}`;

        return { success: true, dataUrl };
    } catch (error: any) {
        console.error('Capture failed:', error);
        return { success: false, error: error.message || 'Failed to capture URL' };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
