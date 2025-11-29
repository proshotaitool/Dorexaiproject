
export const metadata = {
  title: 'Download Your File',
  description: 'Your file is being prepared for download.',
};

export default function DownloadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {children}
    </div>
  );
}
