
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfServicePage() {
  const sections = [
    { title: "1. Acceptance of Terms", content: "By accessing or using the DoreX Ai website ('Site') and any of its services ('Services'), you agree to be bound by these Terms of Service ('Terms') and all applicable laws and regulations. If you disagree with any part of the terms, you are prohibited from using our Services. Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms." },
    { title: "2. Description of Service", content: "DoreX Ai provides a suite of online tools for digital file manipulation, including but not limited to image compression, PDF merging, and AI-powered content generation. You agree to use our Services only for lawful purposes and in a manner that does not infringe the rights of, or restrict or inhibit the use and enjoyment of, the Service by any third party. The Services are provided on an 'AS IS' and 'AS AVAILABLE' basis." },
    { title: "3. User Accounts & Responsibilities", content: "To access certain features, you may be required to create an account. You are responsible for safeguarding your account information, including your password, and for all activities or actions that occur under your account. You agree to provide us with accurate, complete, and current registration information. You must notify us immediately of any unauthorized use of your account or any other breach of security." },
    { title: "4. User Content & File Handling", content: "You retain all your rights to any files you upload or submit to the Service ('User Content'). We do not claim ownership of your User Content. For the sole purpose of operating and providing the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, process, and display your User Content. We automatically delete all uploaded files from our servers within 24 hours." },
    { title: "5. Intellectual Property", content: "The Service and its original content (excluding User Content), features, and functionality are and will remain the exclusive property of DoreX Ai and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent. Nothing in these Terms gives you a right to use the DoreX Ai name or any of the DoreX Ai trademarks, logos, domain names, and other distinctive brand features." },
    { title: "6. Termination", content: "We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of these Terms. If you wish to terminate your account, you may simply discontinue using the Service." },
    { title: "7. Limitation of Liability", content: "In no event shall DoreX Ai, nor its directors, employees, partners, agents, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use, or alteration of your transmissions or content." },
    { title: "8. Governing Law", content: "These Terms shall be governed and construed in accordance with the laws of our jurisdiction, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights." },
    { title: "9. Changes to Terms", content: "We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms." }
  ];
  return (
    <div className="bg-background">
        <div className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
            Terms of Service
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
        </div>
      </div>
      <div className="container -mt-12 pb-16">
        <Card className="max-w-4xl mx-auto shadow-lg">
            <CardHeader>
                <CardTitle className="text-3xl">Please Read Carefully</CardTitle>
            </CardHeader>
            <CardContent className="p-8 md:p-12">
                 <div className="prose prose-lg dark:prose-invert max-w-none mx-auto space-y-8">
                    <p className="!mt-0 text-muted-foreground">Please read these Terms of Service carefully before using our website and services operated by DoreX Ai.</p>
                    {sections.map(section => (
                        <div key={section.title}>
                        <h2 className="text-2xl font-bold !mb-3">{section.title}</h2>
                        <p className="text-muted-foreground !mt-0">{section.content}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
