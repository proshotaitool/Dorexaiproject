'use server';

import { PDFDocument } from 'pdf-lib';
import puppeteer from 'puppeteer';

export async function compressPdf(formData: FormData) {
    const file = formData.get('file') as File;
    const quality = parseFloat(formData.get('quality') as string) || 0.7; // Default quality 0.7

    if (!file) {
        throw new Error('No file provided');
    }

    try {
        console.log(`Starting PDF Compression with quality: ${quality}...`);
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Pdf = buffer.toString('base64');

        console.log('Launching Puppeteer...');
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        // Use a reasonable viewport.
        await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1 });

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

        console.log('Rendering pages to compressed images...');
        const pagesData = await page.evaluate(async (pdfData, quality) => {
            // @ts-ignore
            const loadingTask = pdfjsLib.getDocument({ data: atob(pdfData) });
            const pdf = await loadingTask.promise;
            const numPages = pdf.numPages;

            // Process pages in batches to avoid memory issues but speed up rendering
            const batchSize = 3;
            const results = new Array(numPages);

            for (let i = 1; i <= numPages; i += batchSize) {
                const batchPromises = [];
                for (let j = i; j < i + batchSize && j <= numPages; j++) {
                    batchPromises.push((async (pageNum) => {
                        const page = await pdf.getPage(pageNum);
                        // Adjust scale based on quality to further reduce size/time
                        // If quality is low, we don't need high resolution
                        const scale = quality < 0.6 ? 1.0 : 1.5;
                        const viewport = page.getViewport({ scale });

                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        await page.render({
                            canvasContext: context,
                            viewport: viewport
                        }).promise;

                        return {
                            index: pageNum - 1,
                            data: canvas.toDataURL('image/jpeg', quality),
                            width: viewport.width,
                            height: viewport.height
                        };
                    })(j));
                }

                const batchResults = await Promise.all(batchPromises);
                batchResults.forEach(res => {
                    results[res.index] = res;
                });
            }

            return results;
        }, base64Pdf, quality);

        await browser.close();

        console.log('Rebuilding PDF...');
        const newPdfDoc = await PDFDocument.create();

        for (const pageData of pagesData) {
            const base64Image = pageData.data.replace(/^data:image\/(png|jpeg);base64,/, "");
            const imageBytes = Buffer.from(base64Image, 'base64');
            const embeddedImage = await newPdfDoc.embedJpg(imageBytes);

            const page = newPdfDoc.addPage([pageData.width, pageData.height]);
            page.drawImage(embeddedImage, {
                x: 0,
                y: 0,
                width: pageData.width,
                height: pageData.height,
            });
        }

        const pdfBytes = await newPdfDoc.save();
        const compressedBase64 = Buffer.from(pdfBytes).toString('base64');

        console.log('Compression complete.');
        return `data:application/pdf;base64,${compressedBase64}`;

    } catch (error) {
        console.error('PDF Compression error:', error);
        throw new Error('Failed to compress file');
    }
}
