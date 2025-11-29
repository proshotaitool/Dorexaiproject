
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Mail } from "lucide-react";

export default function PrivacyPolicyPage() {
  const sections = [
    { 
      title: "1. Introduction", 
      content: "Welcome to DoreX Ai ('we', 'us', or 'our'). We are committed to protecting your privacy and handling your data in an open and transparent manner. This Privacy Policy outlines our practices regarding the collection, use, disclosure, and protection of your information when you visit our website (dorexai.space) and use our suite of online tools ('Services'). By using our Services, you agree to the collection and use of information in accordance with this policy." 
    },
    { 
      title: "2. Information We Collect", 
      content: "We collect information to provide and improve our Services. The types of information we may collect are: <br/><br/><strong>Personal Information:</strong> This is information you voluntarily provide to us, such as your name, email address, and payment information when you register for an account, subscribe to a plan, or contact us for support. <br/><strong>Usage Data:</strong> We automatically collect information when you access and use our Services. This may include your IP address, browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, and other diagnostic data. <br/><strong>Uploaded Content:</strong> We temporarily process the files you upload to our tools (e.g., images, PDFs) solely for the purpose of providing the requested service." 
    },
    { 
      title: "3. How We Use Your Information", 
      content: "We use the collected information for various purposes: <ul><li>To provide, operate, and maintain our Services.</li><li>To process your transactions and manage your subscriptions.</li><li>To notify you about changes to our Services.</li><li>To provide customer support and respond to your inquiries.</li><li>To monitor the usage of our Services to detect, prevent, and address technical issues.</li><li>To improve our offerings and personalize your experience.</li></ul> We do not sell or rent your personal data to third parties." 
    },
    { 
      title: "4. File Handling and Data Security", 
      content: "Your privacy is paramount. All files you upload for processing are transmitted over a secure, encrypted connection (SSL/TLS). We do not store your files on our servers longer than necessary to perform the requested service. In most cases, your files are automatically and permanently deleted from our servers within 24 hours of processing. We do not access, view, or share the content of your files." 
    },
    { 
      title: "5. Cookies and Tracking Technologies", 
      content: "We use cookies and similar tracking technologies to operate and personalize our services, remember your preferences (like language settings), and analyze website traffic. Cookies are small files stored on your device that help us improve our Site and your experience. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service. For more details, please see our <a href='/cookie-policy' class='text-primary hover:underline'>Cookie Policy</a>." 
    },
    { 
      title: "6. Your Data Protection Rights", 
      content: "Depending on your location, you may have certain rights under data protection laws. These may include the right to: <ul><li>Access, update, or request the deletion of your personal information.</li><li>Object to the processing of your personal data.</li><li>Request that we restrict the processing of your personal information.</li><li>Request a copy of your data in a portable format.</li></ul> To exercise these rights, please contact us through our contact page." 
    },
    { 
      title: "7. Changes to This Privacy Policy", 
      content: "We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the 'Last updated' date at the top. We encourage you to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page." 
    },
  ];

  const contactSection = {
      title: "8. Contact Us",
      content: "If you have any questions or concerns about this Privacy Policy or our data practices, please do not hesitate to reach out to us. We are here to help."
  };

  return (
    <div className="bg-background">
      <div className="relative overflow-hidden">
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
                        <div className="text-muted-foreground !mt-0" dangerouslySetInnerHTML={{ __html: section.content }} />
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
