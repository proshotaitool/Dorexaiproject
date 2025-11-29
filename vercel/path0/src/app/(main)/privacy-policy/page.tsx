
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Mail } from "lucide-react";

export default function PrivacyPolicyPage() {
  const sections = [
    { title: "1. Introduction", content: "Welcome to DoreX Ai. We are committed to protecting your privacy and handling your data in an open and transparent manner. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services." },
    { title: "2. Information We Collect", content: "We may collect personal information that you provide to us, such as your name, email address, and payment information when you register for an account or subscribe to a plan. We also collect non-personal information, such as browser type, IP address, and usage data, to help us improve our services." },
    { title: "3. How We Use Your Information", content: "We use the information we collect to provide and maintain our services, process transactions, communicate with you, personalize your experience, and ensure the security of our platform. We do not sell your personal data to third parties." },
    { title: "4. File Handling and Security", content: "Your privacy is paramount. Files you upload for processing are handled securely over an encrypted connection. We do not store your files on our servers longer than necessary to perform the requested service; they are automatically deleted after 24 hours." },
    { title: "5. Cookies and Tracking Technologies", content: "We use cookies and similar tracking technologies to operate and personalize our services, remember your preferences, and analyze website traffic. You can control the use of cookies at the individual browser level." },
    { title: "6. Your Data Protection Rights", content: "Depending on your location, you may have certain rights regarding your personal data, including the right to access, correct, or request the deletion of your personal information. Please contact us to exercise these rights." },
    { title: "7. Changes to This Privacy Policy", content: "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the 'Last updated' date. We encourage you to review this policy periodically." },
  ];

  const contactSection = {
      title: "8. Contact Us",
      content: "If you have any questions or concerns about this Privacy Policy or our data practices, please reach out to us via our contact page."
  };

  return (
    <div>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-20 bg-gradient-to-br from-blue-100 via-cyan-100 to-white animate-gradient"></div>
        <div 
          className="absolute inset-0 -z-10 bg-grid-slate-900/[0.04]"
          style={{ backgroundPosition: '10px 10px' }}
        ></div>
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                Privacy Policy
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
        </div>
      </div>
      <div className="container -mt-12 pb-16">
        <Card className="max-w-4xl mx-auto shadow-lg">
            <CardHeader>
                <CardTitle className="text-3xl">Your Privacy Matters</CardTitle>
            </CardHeader>
            <CardContent className="p-8 md:p-12">
                 <div className="prose prose-lg dark:prose-invert max-w-none mx-auto space-y-8">
                    {sections.map(section => (
                        <div key={section.title}>
                        <h2 className="text-2xl font-bold !mb-3">{section.title}</h2>
                        <p className="text-muted-foreground !mt-0">{section.content}</p>
                        </div>
                    ))}
                    <div>
                        <h2 className="text-2xl font-bold !mb-3">{contactSection.title}</h2>
                        <p className="text-muted-foreground !mt-0">{contactSection.content}</p>
                        <Button asChild className="mt-4">
                            <Link href="/contact"><Mail className="mr-2 h-4 w-4" /> Go to Contact Page</Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
