'use server';

import { Document, Packer, Paragraph, ImageRun } from 'docx';
import puppeteer from 'puppeteer';

export async function convertPdfToWord(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) {
        throw new Error('No file provided');
    }

    try {
        console.log('Starting PDF to Word conversion...');
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Pdf = buffer.toString('base64');

        console.log('Launching Puppeteer...');
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        // Set a large viewport to ensure good quality screenshots
        // Reduced scale slightly for performance debugging
        await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1.5 });

        console.log('Injecting PDF.js...');
        const pdfJsContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <script>
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        </script>
        <style>body { margin: 0; }</style>
      </head>
      <body>
        <div id="container"></div>
      </body>
      </html>
    `;

        await page.setContent(pdfJsContent);

        console.log('Rendering pages...');
        // Pass the PDF data to the browser context
        // We'll evaluate a function that renders the PDF and returns images
        const pagesData = await page.evaluate(async (pdfData) => {
            // @ts-ignore
            const loadingTask = pdfjsLib.getDocument({ data: atob(pdfData) });
            const pdf = await loadingTask.promise;
            const numPages = pdf.numPages;
            const results = [];

            console.log('PDF loaded, pages:', numPages);

            for (let i = 1; i <= numPages; i++) {
                console.log('Rendering page', i);
                const page = await pdf.getPage(i);
                const scale = 1.5; // Reduced scale for performance
                const viewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                results.push({
                    data: canvas.toDataURL('image/jpeg', 0.8),
                    width: viewport.width / scale, // Original width in points (PDF units)
                    height: viewport.height / scale
                });
            }
            return results;
        }, base64Pdf);

        console.log('Pages rendered, closing browser...');
        await browser.close();

        console.log('Generating DOCX...');
        // Now convert images to DOCX
        const doc = new Document({
            sections: pagesData.map(pageData => {
                // Remove header
                const base64Image = pageData.data.replace(/^data:image\/(png|jpeg);base64,/, "");
                const imageBuffer = Buffer.from(base64Image, 'base64');

                // Calculate dimensions for Word
                // 1 point = 1.333 pixels (96 DPI) approx.
                const scaledWidth = pageData.width * 1.3333;
                const scaledHeight = pageData.height * 1.3333;

                return {
                    properties: {
                        page: {
                            margin: {
                                top: 0,
                                right: 0,
                                bottom: 0,
                                left: 0,
                            },
                        },
                    },
                    children: [
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: imageBuffer,
                                    transformation: {
                                        width: scaledWidth,
                                        height: scaledHeight,
                                    },
                                    type: "jpg",
                                }),
                            ],
                        }),
                    ],
                };
            }),
        });

        const docxBuffer = await Packer.toBuffer(doc);
        console.log('Conversion complete.');
        return `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${docxBuffer.toString('base64')}`;

    } catch (error) {
        console.error('PDF to Word conversion error:', error);
        throw new Error('Failed to convert file');
    }
}
