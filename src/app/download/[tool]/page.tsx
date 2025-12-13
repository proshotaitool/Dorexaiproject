'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, CheckCircle, Hourglass, ArrowLeft, Loader2, FileText } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import { AdsterraAds } from '@/components/ads/AdsterraAds';

export default function DownloadPage() {
  const router = useRouter();
  const params = useParams();
  const [countdown, setCountdown] = useState(5);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [fileName, setFileName] = useState('your-file');
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);
  const fileUrlRef = useRef<string | null>(null);
  const toolName = params.tool as string;

  const handleDownload = async () => {
    if (!fileUrlRef.current) return;
    if (downloadStarted) return; // Prevent multiple downloads
    setDownloadStarted(true);

    try {
      // Convert Data URL to Blob URL for better download handling
      const response = await fetch(fileUrlRef.current);
      const blob = await response.blob();

      // Validation: Check if blob size matches expected size
      const expectedSize = sessionStorage.getItem(`${toolName}-size`);
      if (expectedSize && blob.size !== parseInt(expectedSize)) {
        console.warn(`File size mismatch: Expected ${expectedSize}, got ${blob.size}`);
        if (Math.abs(blob.size - parseInt(expectedSize)) > 100) {
          // Strict validation could go here
        }
      }

      // Strict JPEG Validation (Only for Image Compressor)
      // We check if the filename ends with .jpg or .jpeg
      if (toolName === 'compress-image' && !fileName.toLowerCase().endsWith('.jpg') && !fileName.toLowerCase().endsWith('.jpeg')) {
        console.warn("Invalid file extension for compressor. Enforcing .jpg");
        setFileName(prev => prev.replace(/\.[^/.]+$/, "") + ".jpg");
      }

      // Force application/octet-stream to ensure download and prevent browser from trying to display it
      // This often helps with filename adherence
      const newBlob = new Blob([blob], { type: 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(newBlob);

      const link = document.createElement('a');
      link.href = blobUrl;

      // Sanitize and ensure filename
      const safeFileName = fileName && fileName.trim() !== '' ? fileName : `download-${Date.now()}.bin`;
      link.download = safeFileName;
      link.target = '_self'; // Explicitly set target to self

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
      console.error("Download failed:", error);
      setDownloadStarted(false); // Allow retry
    }
  };

  useEffect(() => {
    if (!toolName) {
      router.push('/');
      return;
    }

    const fileDataKey = `${toolName}-file`;
    const fileNameKey = `${toolName}-filename`;

    let attempt = 0;
    const maxAttempts = 10;
    let intervalId: NodeJS.Timeout;

    const tryToLoadFile = () => {
      try {
        const fileData = sessionStorage.getItem(fileDataKey);
        const name = sessionStorage.getItem(fileNameKey);

        if (fileData && name) {
          if (fileData.startsWith('blob:') || fileData.startsWith('data:')) {
            fileUrlRef.current = fileData;
            fetch(fileData)
              .then(res => res.blob())
              .then(blob => {
                setFileSize(formatBytes(blob.size));
              });
          }
          setFileName(name);
          setIsPreparing(false);

          // Clean up session storage
          sessionStorage.removeItem(fileDataKey);
          sessionStorage.removeItem(fileNameKey);
          sessionStorage.removeItem(`${toolName}-size`);
          sessionStorage.removeItem(`${toolName}-type`);

          clearInterval(intervalId);
          return;
        }
      } catch (error) {
        console.error("Could not access session storage:", error);
        clearInterval(intervalId);
        router.push('/');
        return;
      }

      attempt++;
      if (attempt >= maxAttempts) {
        clearInterval(intervalId);
        // If no file data is found after several attempts, redirect
        router.push('/');
      }
    };

    intervalId = setInterval(tryToLoadFile, 200);

    return () => clearInterval(intervalId);
  }, [router, toolName]);


  useEffect(() => {
    if (isPreparing || downloadStarted) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      handleDownload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, isPreparing, downloadStarted]);

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-background via-muted to-background p-4 md:p-8">
      <div className="grid grid-cols-12 gap-4 md:gap-8 h-full min-h-[90vh]">

        <aside className="hidden lg:flex col-span-2 items-center justify-center">
          <AdsterraAds type="banner_160x600" />
        </aside>

        <main className="col-span-12 lg:col-span-8 flex flex-col items-center justify-center space-y-4 md:space-y-8">
          <div className="w-full max-w-4xl flex justify-center">
            <AdsterraAds type="banner_468x60" />
          </div>

          <Card className="w-full max-w-lg text-center shadow-2xl animate-fade-in-up">
            <CardHeader>
              <CardTitle className="text-3xl font-bold">
                {downloadStarted ? 'Download Started!' : isPreparing ? 'Preparing your file...' : 'Your Download is Ready!'}
              </CardTitle>
              <CardDescription>
                {downloadStarted
                  ? 'Thank you for using DoreX Ai.'
                  : isPreparing
                    ? 'Please wait a moment while we prepare your file.'
                    : `Your download for "${fileName}" will begin shortly.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPreparing ? (
                <div className="my-8 flex flex-col items-center justify-center text-muted-foreground">
                  <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                  <p>Loading file data...</p>
                </div>
              ) : (
                <>
                  <div className="my-8 flex flex-col items-center justify-center">
                    <div className="bg-muted p-6 rounded-xl border w-full flex items-center gap-4 mb-8">
                      <FileText className="h-10 w-10 text-primary flex-shrink-0" />
                      <div className="text-left overflow-hidden">
                        <p className="font-semibold truncate">{fileName}</p>
                        <p className="text-sm text-muted-foreground">{fileSize || 'Calculating...'}</p>
                      </div>
                    </div>
                    {downloadStarted ? (
                      <CheckCircle className="h-24 w-24 text-green-500 animate-pulse" />
                    ) : (
                      <div className="relative h-32 w-32">
                        <svg className="absolute inset-0" viewBox="0 0 36 36">
                          <path
                            className="text-muted/20"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <path
                            className="text-primary"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray={`${countdown * 20}, 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-bold">{countdown}</span>
                          <Hourglass className="h-6 w-6 text-muted-foreground animate-spin" style={{ animationDuration: '3s' }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {downloadStarted ? (
                    <Button onClick={() => {
                      const returnUrl = sessionStorage.getItem('return-url');
                      router.push(returnUrl || '/tools');
                    }} className="w-full">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Tools
                    </Button>
                  ) : (
                    <p className="text-muted-foreground">
                      Your download will begin automatically...
                    </p>
                  )}

                  <div className="mt-4">
                    <Button variant="link" size="sm" onClick={handleDownload}>
                      Click here if your download doesn't start.
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>


        </main>

        <aside className="hidden lg:flex col-span-2 items-center justify-center">
          {/* Right sidebar ad can go here if needed */}
        </aside>
      </div>
    </div>
  );
}
