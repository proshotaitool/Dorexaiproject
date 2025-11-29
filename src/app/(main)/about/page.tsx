
'use client';

import Image from 'next/image';
import { Users, Lightbulb, CheckCircle, Shield } from 'lucide-react';
import { placeholderImages } from '@/lib/placeholder-images';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AboutPageContent {
  hero?: { title: string; subtitle: string; };
  mission?: { title: string; text: string; };
  vision?: { title: string; text: string; };
  values?: { title: string; text: string; };
}

export default function AboutPage() {
  const missionImage = placeholderImages.find(p => p.id === 'mission');
  const visionImage = placeholderImages.find(p => p.id === 'vision');
  const valuesImage = placeholderImages.find(p => p.id === 'values');

  const firestore = useFirestore();
  const pageDocRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, 'pages', 'about');
  }, [firestore]);

  const { data: content, isLoading } = useDoc<AboutPageContent>(pageDocRef);

  if(isLoading) {
    return (
        <div className="container mx-auto py-16">
            <div className="text-center mb-12">
                <Skeleton className="h-12 w-2/3 mx-auto" />
                <Skeleton className="h-6 w-1/2 mx-auto mt-4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
            </div>
        </div>
    )
  }

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <div className="relative pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="absolute inset-0">
          <div className="h-1/3 bg-background sm:h-2/3" />
        </div>
        <div className="relative container mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              {content?.hero?.title || "The Story Behind the Tools"}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-muted-foreground">
              {content?.hero?.subtitle || "We're a team of creators, developers, and innovators passionate about making complex digital tasks simple and accessible for everyone."}
            </p>
          </div>
          <div className="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
             <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
              <div className="flex-shrink-0">
                <Image className="h-48 w-full object-cover" src={missionImage?.imageUrl || "https://picsum.photos/seed/mission/600/300"} alt="Our Mission" width={600} height={300} data-ai-hint={missionImage?.imageHint || 'team brainstorming'} />
              </div>
              <div className="flex-1 bg-card p-6 flex flex-col justify-between">
                <div className="flex-1">
                   <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <Users className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-semibold">{content?.mission?.title || "Our Mission"}</h3>
                   </div>
                  <p className="mt-3 text-base text-muted-foreground">{content?.mission?.text || "To democratize digital creativity and productivity by providing powerful, intuitive, and accessible tools for everyone. We believe technology should be a bridge, not a barrier."}</p>
                </div>
              </div>
            </div>
             <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
              <div className="flex-shrink-0">
                <Image className="h-48 w-full object-cover" src={visionImage?.imageUrl || "https://picsum.photos/seed/vision/600/300"} alt="Our Vision" width={600} height={300} data-ai-hint={visionImage?.imageHint || 'futuristic technology'} />
              </div>
              <div className="flex-1 bg-card p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <Lightbulb className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-semibold">{content?.vision?.title || "Our Vision"}</h3>
                   </div>
                  <p className="mt-3 text-base text-muted-foreground">{content?.vision?.text || "We envision a world where anyone can bring their ideas to life, regardless of technical skill. Our goal is to be the go-to toolkit that empowers creation and simplifies workflows."}</p>
                </div>
              </div>
            </div>
             <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
              <div className="flex-shrink-0">
                <Image className="h-48 w-full object-cover" src={valuesImage?.imageUrl || "https://picsum.photos/seed/values/600/300"} alt="Our Values" width={600} height={300} data-ai-hint={valuesImage?.imageHint || 'people collaborating'} />
              </div>
              <div className="flex-1 bg-card p-6 flex flex-col justify-between">
                <div className="flex-1">
                   <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-semibold">{content?.values?.title || "Our Values"}</h3>
                   </div>
                   <ul className="mt-3 space-y-2 text-base text-muted-foreground">
                       <li className="flex items-start"><Shield className="h-5 w-5 text-primary mr-2 mt-1 flex-shrink-0"/><span><span className="font-semibold text-foreground">User-Centric:</span> We build for you.</span></li>
                       <li className="flex items-start"><Shield className="h-5 w-5 text-primary mr-2 mt-1 flex-shrink-0"/><span><span className="font-semibold text-foreground">Innovation:</span> We constantly push what's possible.</span></li>
                       <li className="flex items-start"><Shield className="h-5 w-5 text-primary mr-2 mt-1 flex-shrink-0"/><span><span className="font-semibold text-foreground">Integrity:</span> Your privacy and data are sacred.</span></li>
                   </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
