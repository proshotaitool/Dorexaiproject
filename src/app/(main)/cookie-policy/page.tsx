
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Mail } from "lucide-react";

export default function CookiePolicyPage() {
  return (
    <div className="bg-background">
      <div className="relative overflow-hidden">
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
                    <p>
                        Welcome to DoreX Ai. This Cookie Policy explains how we use cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
                    </p>

                    <div>
                        <h2 className="text-2xl font-bold !mb-3">1. What Are Cookies?</h2>
                        <p className="text-muted-foreground !mt-0">
                            Cookies are small text files placed on your device (computer, smartphone, etc.) by websites that you visit. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site. Cookies help us understand how you use our services, remember your preferences, and improve your overall user experience.
                        </p>
                    </div>

                     <div>
                        <h2 className="text-2xl font-bold !mb-3">2. How We Use Cookies</h2>
                        <p className="text-muted-foreground !mt-0">
                            We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies enable us to track and target the interests of our users to enhance the experience on our online properties. This includes:
                        </p>
                        <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                            <li><strong>To provide our services:</strong> We use cookies to enable user authentication, which allows you to log in to your account and access our tools.</li>
                            <li><strong>To improve our services:</strong> We use performance and analytics cookies to collect information about how users interact with our website, which pages are visited most often, and if they receive error messages. This helps us improve how our website works.</li>
                            <li><strong>To personalize your experience:</strong> Functionality cookies allow our website to remember choices you make (such as your user name, language, or the region you are in) and provide enhanced, more personal features.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold !mb-3">3. Types of Cookies We Use</h2>
                        <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                            <li><strong>Session Cookies:</strong> These are temporary cookies that expire when you close your browser. They are used to link your actions during a single browser session.</li>
                            <li><strong>Persistent Cookies:</strong> These cookies are stored on your device for a set period or until you delete them. They are used to remember your preferences or actions across multiple sites.</li>
                            <li><strong>Analytics Cookies:</strong> We use services like Google Analytics to understand website traffic and user behavior. These cookies collect information in an aggregate form to help us understand how our website is being used.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold !mb-3">4. Your Choices Regarding Cookies</h2>
                        <p className="text-muted-foreground !mt-0">
                            You have the right to decide whether to accept or reject cookies. Most web browsers are set to accept cookies by default. However, you can usually modify your browser setting to decline cookies if you prefer. If you choose to reject cookies, you may still use our website, though your access to some functionality and areas may be restricted. You can manage your cookie preferences through your web browser's settings.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold !mb-3">5. Changes to This Cookie Policy</h2>
                        <p className="text-muted-foreground !mt-0">
                            We may update this Cookie Policy from time to time to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore revisit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
                        </p>
                    </div>

                     <div>
                        <h2 className="text-2xl font-bold !mb-3">6. Contact Us</h2>
                        <p className="text-muted-foreground !mt-0">If you have any questions about our use of cookies or other technologies, please get in touch with us through our contact page.</p>
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
