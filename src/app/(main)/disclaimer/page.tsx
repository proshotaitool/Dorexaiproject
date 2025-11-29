
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DisclaimerPage() {
  const sections = [
    { title: "1. Accuracy of Information", content: "The information provided by DoreX Ai ('we', 'us', or 'our') on dorexai.space (the 'Site') and the services it provides is for general informational and functional purposes only. All information on the Site is provided in good faith, however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information or tool output on the Site." },
    { title: "2. No Professional Advice", content: "The information and tools on our Site are not intended to be a substitute for professional advice (e.g., legal, financial, or technical). The results from our tools are generated automatically and should be reviewed for accuracy. Any action you take upon the information or tool outputs from this website is strictly at your own risk, and we will not be liable for any losses and damages in connection with the use of our website." },
    { title: "3. External Links Disclaimer", content: "The Site may contain (or you may be sent through the Site) links to other websites or content belonging to or originating from third parties or links to websites and features in banners or other advertising. Such external links are not investigated, monitored, or checked for accuracy, adequacy, validity, reliability, availability, or completeness by us." },
    { title: "4. Errors and Omissions Disclaimer", content: "While we have made every attempt to ensure that the information contained in this site has been obtained from reliable sources and that our tools function correctly, DoreX Ai is not responsible for any errors or omissions or for the results obtained from the use of this information. All information and tools are provided 'as is', with no guarantee of completeness, accuracy, timeliness or of the results obtained from their use." },
    { title: "5. Fair Use Disclaimer", content: "The content on this website may contain copyrighted material the use of which has not always been specifically authorized by the copyright owner. We are making such material available for criticism, comment, news reporting, teaching, scholarship, or research. We believe this constitutes a 'fair use' of any such copyrighted material as provided for in section 107 of the US Copyright Law." },
    { title: "6. Views Expressed Disclaimer", content: "The views and opinions expressed on this Site, particularly in blog posts or user-generated content, are those of the authors and do not necessarily reflect the official policy or position of any other agency, organization, employer, or company, including DoreX Ai." },
  ];

  return (
    <div className="bg-background">
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                Disclaimer
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
                    <p className="!mt-0 text-muted-foreground">By using this website, you hereby consent to our disclaimer and agree to its terms. If you do not agree with any part of this disclaimer, you must not use our website or services.</p>
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
