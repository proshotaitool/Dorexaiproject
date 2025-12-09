'use server';

import mammoth from 'mammoth';
import puppeteer from 'puppeteer';

export async function convertWordToPdf(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('No file provided');
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Convert DOCX to HTML using mammoth
    const { value: htmlBody, messages } = await mammoth.convertToHtml({ buffer });

    if (messages.length > 0) {
      console.log('Mammoth messages:', messages);
    }

    // 2. Wrap HTML in a basic template for better styling
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 40px;
            color: #333;
          }
          h1, h2, h3, h4, h5, h6 {
            color: #000;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
          }
          p {
            margin-bottom: 1em;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 1em;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          img {
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        ${htmlBody}
      </body>
      </html>
    `;

    // 3. Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px',
      },
    });

    // Generate Screenshot for Preview
    // Set viewport to approximate A4 ratio (at 72dpi, A4 is ~595x842. Let's use higher res)
    await page.setViewport({ width: 794, height: 1123 });
    const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 80 });

    await browser.close();

    // 4. Return as base64 strings
    const base64Pdf = Buffer.from(pdfBuffer).toString('base64');
    const base64Preview = Buffer.from(screenshotBuffer).toString('base64');

    return {
      pdfUrl: `data:application/pdf;base64,${base64Pdf}`,
      previewUrl: `data:image/jpeg;base64,${base64Preview}`
    };

  } catch (error) {
    console.error('Conversion error:', error);
    throw new Error('Failed to convert file');
  }
}

export async function getWordPreview(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('No file provided');
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { value: htmlBody } = await mammoth.convertToHtml({ buffer });

    // Return just the body content for the preview
    return htmlBody;
  } catch (error) {
    console.error('Preview error:', error);
    throw new Error('Failed to generate preview');
  }
}
