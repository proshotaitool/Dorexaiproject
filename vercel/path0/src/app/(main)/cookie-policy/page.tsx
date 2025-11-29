import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Mail } from "lucide-react";

export default function CookiePolicyPage() {
  const sections = [
    { title: "1. What Are Cookies?", content: "Cookies are small text files placed on your device (computer, smartphone, etc.) by websites that you visit. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site." },
    { title: "2. How We Use Cookies", content: "We use cookies to understand how you use our services, to improve your user experience, and to personalize content. This includes session cookies (which expire when you close your browser) and persistent cookies (which stay on your device for a set period or until you delete them)." },
    { title: "3. Types of Cookies We Use", content: "We use essential cookies for core functionality like user authentication and security. Performance cookies help us analyze traffic and user behavior to improve our services. Functionality cookies remember your preferences to provide a more personal experience." },
    { title: "4. Your Choices Regarding Cookies", content: "You have the right to decide whether to accept or reject cookies. You can manage your cookie preferences through your web browser controls. Please note that if you choose to reject cookies, you may still use our website, though your access to some functionality and areas may be restricted." },
    { title: "5. Changes to This Cookie Policy", content: "We may update this Cookie Policy from time to time to reflect changes to the cookies we use or for other operational, legal, or regulatory reasons. Please revisit this policy regularly to stay informed about our use of cookies." },
  ];
  const contactSection = {
      title: "6. Contact Us",
      content: "If you have any questions about our use of cookies or other technologies, please get in touch with us through our contact page."
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
                Cookie Policy
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
        </div>
      </div>
      <div className="container -mt-12 pb-16">
        <Card className="max-w-4xl mx-auto shadow-lg">
            <CardHeader>
                <CardTitle className="text-3xl">Our Use of Cookies</CardTitle>
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
