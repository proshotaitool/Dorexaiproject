
'use client';

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { PreviewBar } from '@/components/preview-bar';
import { usePreviewMode } from '@/hooks/usePreviewMode';
import { useDoc, useFirestore, useCollection } from '@/firebase';
import { collection, doc, addDoc, serverTimestamp, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import { ToolManagerContext, ManagedTool } from '@/hooks/useToolManager';
import { tools as masterToolList } from '@/lib/tools';
import { placeholderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';


interface SeoOverride {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
}

interface ToolSetting {
  id: string;
  enabled: boolean;
}

const blogPostsToAdd = [
  {
    title: 'Best Free Online Image Tools to Boost Creativity in 2025',
    category: 'Image Tools',
    status: 'Published' as const,
    author: 'DoreX Ai Team',
    imageUrl: placeholderImages.find(p => p.id === 'blog-1')?.imageUrl || '',
    imageHint: 'digital art creation',
    content: `
      <p>In 2025, visual content is more important than ever. Whether you're a marketer, a content creator, or just someone looking to spice up your social media, having the right image tools can make all the difference. The good news? You don't need to spend a fortune on complicated software. Here are the best free online image tools that will boost your creativity and productivity.</p>
      
      <h2>1. AI-Powered Background Remover</h2>
      <p>Gone are the days of painstakingly tracing outlines in Photoshop. Modern AI tools can remove the background from any image in a single click, leaving you with a clean, transparent cutout. This is a game-changer for creating professional product photos, clean headshots, or fun stickers.</p>
      <p><strong>Why it's essential:</strong> It saves an incredible amount of time and gives you a professional result instantly. Perfect for e-commerce, graphic design, and social media profiles.</p>
      <p><em>Suggestion: Try the <a href="/tools/ai-background-remover">AI Background Remover</a> to see the magic for yourself.</em></p>
      <img src="https://images.unsplash.com/photo-1618336753325-136544558509?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MjQ0Nzh8MHwxfHNlYXJjaHwyfHxwZXJzb24lMjB0cmFuc3BhcmVudCUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzI0MDgyMjE0fDA&ixlib=rb-4.0.3&q=80&w=1080" alt="A person with a transparent background created by an AI tool." data-ai-hint="person transparent background">
      
      <h2>2. Smart Image Compressor</h2>
      <p>Website speed is crucial for user experience and SEO. Large, unoptimized images are one of the biggest causes of slow load times. An intelligent image compressor reduces file size significantly without sacrificing noticeable quality.</p>
      <p><strong>Why it's essential:</strong> A faster website leads to better engagement, lower bounce rates, and improved search engine rankings. Our <a href="/tools/compress-image">Image Compressor</a> lets you find the perfect balance between size and quality.</p>

      <h2>3. The Versatile Image Converter</h2>
      <p>Different platforms require different image formats. A flexible image converter is a must-have in your toolkit. Need a transparent background? Convert to PNG. Need the smallest file size for the web? Convert to WEBP or a high-quality JPG.</p>
      <p><strong>Why it's essential:</strong> It ensures your images are always in the right format for the job, whether you're converting a <a href="/tools/convert-to-jpg">PNG to JPG</a> for compatibility or a <a href="/tools/convert-from-jpg">JPG to PNG</a> for transparency.</p>
      <img src="https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MjQ0Nzh8MHwxfHNlYXJjaHwxfHxmaWxlJTIwY29udmVyc2lvbiUyMHByb2Nlc3N8ZW58MHx8fHwxNzI0MDgyNDIxfDA&ixlib=rb-4.0.3&q=80&w=1080" alt="An abstract representation of file conversion." data-ai-hint="file conversion process">

      <h2>4. Quick & Easy Image Resizer</h2>
      <p>From social media posts to blog thumbnails, images need to be the right size. An image resizer allows you to change dimensions by pixels or percentage quickly. Locking the aspect ratio prevents distortion, ensuring your images always look their best.</p>
      <p><strong>Why it's essential:</strong> Properly sized images are crucial for web design and social media standards. Our <a href="/tools/resize-image">Image Resizer</a> even has an AI feature to suggest optimal dimensions for various use cases.</p>
      
      <h3>Conclusion</h3>
      <p>With these powerful and free online tools, you have everything you need to take your visual content to the next level. They are simple, fast, and designed to make your workflow more efficient, freeing you up to focus on what truly matters: your creativity.</p>
    `
  },
  {
    title: 'Why Multi-Tool Websites Are the Future of Digital Productivity',
    category: 'Productivity',
    status: 'Published' as const,
    author: 'DoreX Ai Team',
    imageUrl: placeholderImages.find(p => p.id === 'blog-5')?.imageUrl || '',
    imageHint: 'productivity dashboard',
    content: `
      <p>Remember the days of a cluttered desktop, filled with single-purpose applications? One for resizing images, another for converting documents, and a third for zipping files. The modern digital landscape is moving away from this fragmented approach and embracing a new, more efficient paradigm: the multi-tool website.</p>
      
      <h2>What is a Multi-Tool Website?</h2>
      <p>A multi-tool website, like DoreX Ai, is an all-in-one platform that consolidates dozens of utilities into a single, user-friendly interface. Instead of searching for a different website for every task, you have a comprehensive toolkit at your fingertips, covering everything from image and PDF editing to AI-powered content creation.</p>
      <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MjQ0Nzh8MHwxfHNlYXJjaHwxfHxzd2lzcyUyMGFybXklMjBrbmlmZSUyMG9uJTIwZGVza3xlbnwwfHx8fDE3MjQwODI2NDd8MA&ixlib=rb-4.0.3&q=80&w=1080" alt="A versatile swiss army knife on a desk, symbolizing a multi-tool website." data-ai-hint="versatile tool">

      <h2>The Advantages of an All-in-One Platform</h2>
      <p>Why is this model becoming the future of productivity? The benefits are clear and compelling:</p>
      
      <h3>1. Unmatched Convenience and Speed</h3>
      <p>The primary advantage is efficiency. There's no need to bookmark dozens of sites or remember which one does what. You go to one place, search for the tool you need (e.g., "merge PDF"), and get the job done. This streamlined workflow saves valuable time and reduces mental clutter.</p>

      <h3>2. A Consistent and User-Friendly Experience</h3>
      <p>Jumping between different websites means constantly adapting to new layouts, user interfaces, and ad placements. A multi-tool platform provides a consistent, predictable experience across all its utilities. Once you learn how to use one tool, you intuitively know how to use the others.</p>
      
      <h3>3. Cost-Effectiveness</h3>
      <p>Many specialized tools are moving towards subscription models. A multi-tool website often provides a vast array of utilities for free or under a single, affordable subscription. This consolidation offers tremendous value compared to paying for multiple individual services.</p>
      <img src="https://images.unsplash.com/photo-1579621970795-87f54f1235b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MjQ0Nzh8MHwxfHNlYXJjaHwxfHxtb25leSUyMHNhdmluZ3xlbnwwfHx8fDE3MjQwODI2ODF8MA&ixlib=rb-4.0.3&q=80&w=1080" alt="A piggy bank with coins, representing cost savings." data-ai-hint="money saving">

      <h3>4. Discoverability and Learning</h3>
      <p>Using an all-in-one platform often exposes you to tools you didn't even know you needed. You might come to compress an image but discover a tool that can automatically remove its background or another that can convert it to a different format. This fosters learning and helps you discover more efficient ways to complete your tasks.</p>

      <h3>Conclusion</h3>
      <p>The shift towards multi-tool websites is a natural evolution in our quest for greater digital productivity. By bringing together a wide range of essential utilities under one roof, these platforms simplify our digital lives, save us time, and empower us to get more done with less friction. The future of productivity isn't about having more tools; it's about having the right tools in one accessible place.</p>
    `
  },
  {
    title: 'How AI Tools Can Improve Your Daily Workflow (A Beginner\'s Guide)',
    category: 'AI & Productivity',
    status: 'Published' as const,
    author: 'DoreX Ai Team',
    imageUrl: placeholderImages.find(p => p.id === 'blog-4')?.imageUrl || '',
    imageHint: 'robot helping person',
    content: `
      <p>Artificial Intelligence (AI) isn't just a futuristic concept from sci-fi movies anymore; it's a practical tool that can significantly enhance your daily productivity. Whether you're a student, a writer, or a marketing professional, AI can help you work smarter, not harder. This beginner-friendly guide will show you how.</p>
      
      <h2>1. Conquer Information Overload with AI Summarization</h2>
      <p>We are constantly bombarded with information: long articles, dense reports, and endless email threads. It's impossible to read it all. This is where an AI summarizer becomes your secret weapon.</p>
      <p><strong>How it works:</strong> An <a href="/tools/text-summarization">AI Text Summarizer</a> reads and understands a long piece of text, identifies the key points, and condenses them into a short, easy-to-digest summary.</p>
      <p><strong>Use it to:</strong></p>
      <ul>
        <li>Quickly grasp the main ideas of a news article or research paper.</li>
        <li>Get a brief overview of a report before a meeting.</li>
        <li>Condense your own notes for faster revision.</li>
      </ul>
      <img src="https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MjQ0Nzh8MHwxfHNlYXJjaHwxfHxpbmZvcm1hdGlvbiUyMG92ZXJsb2FkJTIwYnJhaW58ZW58MHx8fHwxNzI0MDgyNzcyfDA&ixlib=rb-4.0.3&q=80&w=1080" alt="A cluttered mind map representing information overload." data-ai-hint="information overload">

      <h2>2. Break Through Writer's Block with an AI Content Generator</h2>
      <p>Staring at a blank page is one of the most frustrating experiences for anyone who needs to write. An AI content generator can act as your creative partner, helping you get started and flesh out your ideas.</p>
      <p><strong>How it works:</strong> You provide a simple prompt, and the <a href="/tools/ai-content-generator">AI Content Generator</a> will create text based on your request. The more specific your prompt, the better the result.</p>
      <p><strong>Use it to:</strong></p>
      <ul>
        <li>Brainstorm blog post titles or social media captions.</li>
        <li>Draft the first version of an email or a difficult message.</li>
        <li>Generate product descriptions or marketing taglines.</li>
      </ul>
      <img src="https://images.unsplash.com/photo-1516131206175-0a14b8678f5a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MjQ0Nzh8MHwxfHNlYXJjaHwxfHxsaWdodGJ1bGIlMjBvbiUyMGElMjBwYXBlfGVufDB8fHx8MTcyNDA4MjgxNnww&ixlib=rb-4.0.3&q=80&w=1080" alt="A lightbulb on a piece of paper, symbolizing a new idea." data-ai-hint="new idea">

      <h2>3. Enhance Your Photos with AI Editing Tools</h2>
      <p>Photo editing is another area where AI excels. Complex tasks that once required technical skill are now automated and accessible to everyone.</p>
      <p><strong>How it works:</strong> AI models trained on millions of images can understand the content of a photo and perform specific edits with incredible accuracy.</p>
      <p><strong>Use it to:</strong></p>
      <ul>
        <li>Instantly <a href="/tools/ai-background-remover">remove the background</a> from a portrait or product photo.</li>
        <li>Automatically <a href="/tools/image-upscaler">increase the resolution</a> of a low-quality image without losing detail.</li>
        <li>Use text prompts to make complex edits, like "make the sky more dramatic" with an <a href="/tools/ai-photo-editor">AI Photo Editor</a>.</li>
      </ul>
      
      <h3>Conclusion</h3>
      <p>Incorporating AI tools into your daily routine is about enhancing your own abilities, not replacing them. By automating tedious and time-consuming tasks, you free up more of your mental energy for creativity, critical thinking, and the work that truly matters. Start with one or two of these tools today and watch your productivity soar.</p>
    `
  },
  {
    title: 'Top Content Tools for Fast and Error-Free Writing in 2025',
    category: 'Content Tools',
    status: 'Published' as const,
    author: 'DoreX Ai Team',
    imageUrl: placeholderImages.find(p => p.id === 'blog-6')?.imageUrl || '',
    imageHint: 'writing content laptop',
    content: `
      <p>In the digital age, content is king. But creating high-quality, error-free content consistently can be a major challenge. Fortunately, a new wave of content tools has emerged to help writers, marketers, and students streamline their process and improve their output. Here are the must-have content tools for fast and flawless writing in 2025.</p>

      <h2>1. AI-Powered Grammar and Style Checkers</h2>
      <p>Basic spell-check is a thing of the past. Modern grammar tools go far beyond catching typos. They analyze your writing for style, tone, clarity, and fluency, offering intelligent suggestions to make your sentences more impactful and readable.</p>
      <p><strong>Why they're essential:</strong> They act as a second pair of eyes, ensuring your work is professional and polished before you hit "publish."</p>
      <img src="https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MjQ0Nzh8MHwxfHNlYXJjaHwxfHxjb2RlJTIwcmV2aWV3fGVufDB8fHx8MTcyNDA4Mjk3Mnww&ixlib=rb-4.0.3&q=80&w=1080" alt="A computer screen showing code being reviewed, symbolizing proofreading." data-ai-hint="proofreading text">
      
      <h2>2. The Intelligent Text Summarizer</h2>
      <p>Research is a fundamental part of writing, but it's also time-consuming. An <a href="/tools/text-summarization">AI Text Summarizer</a> can drastically speed up this process. Instead of reading a 20-page article, you can paste the text into the tool and get the key points in seconds.</p>
      <p><strong>Why it's essential:</strong> It allows you to absorb more information in less time, making your research phase far more efficient and helping you quickly determine which sources are most relevant to your topic.</p>

      <h2>3. The Creative Content and Idea Generator</h2>
      <p>Every writer faces the dreaded blank page. A <a href="/tools/ai-content-generator">Content Generator</a> is the ultimate cure for writer's block. By giving it a simple prompt, you can generate outlines, brainstorm titles, draft entire paragraphs, or even create social media posts from scratch.</p>
      <p><strong>Why it's essential:</strong> It's a powerful brainstorming partner that provides a starting point, helping you overcome initial inertia and get your creative juices flowing.</p>
      
      <h2>4. The Dynamic Rewriting and Paraphrasing Tool</h2>
      <p>Sometimes you have the right ideas but the wrong words. A paraphrasing tool helps you rephrase sentences to improve clarity, change the tone, or avoid repetition. Unlike basic synonym finders, modern AI-powered rewriters understand context and produce natural-sounding alternatives.</p>
      <p><strong>Why it's essential:</strong> It's perfect for refining your drafts, simplifying complex sentences, and ensuring your writing is engaging and varied. Many AI Content Generators can also perform this function if prompted correctly (e.g., "Rewrite this paragraph to be more formal").</p>
      <img src="https://images.unsplash.com/photo-1520692539952-6a3455b93118?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MjQ0Nzh8MHwxfHNlYXJjaHwxfHxtaXhpbmclMjBwYWludHN8ZW58MHx8fHwxNzI0MDgzMDM5fDA&ixlib=rb-4.0.3&q=80&w=1080" alt="Different colors of paint being mixed together, representing rewriting and rephrasing." data-ai-hint="rewriting rephrasing">
      
      <h3>Conclusion</h3>
      <p>The modern writer's toolkit is powered by intelligence and efficiency. By integrating these content tools into your workflow, you can eliminate common errors, speed up your research and drafting process, and consistently produce high-quality work. Embrace these technologies and spend less time on the tedious aspects of writing and more time on creating compelling content.</p>
    `
  }
];

function DynamicMetadata() {
  const pathname = usePathname();
  const firestore = useFirestore();

  const docId = pathname === '/' ? 'home' : pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-');
  const seoDocRef = firestore ? doc(firestore, 'seo-overrides', docId) : null;

  const { data: seoData } = useDoc<SeoOverride>(seoDocRef as any);

  useEffect(() => {
    if (seoData) {
      if (seoData.metaTitle) {
        document.title = `${seoData.metaTitle} | DoreX Ai`;
      }
      if (seoData.metaDescription) {
        const metaDescElement = document.querySelector('meta[name="description"]');
        if (metaDescElement) {
          metaDescElement.setAttribute('content', seoData.metaDescription);
        }
      }
    }
  }, [seoData]);

  return null;
}

function ToolProvider({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const settingsCollection = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'tools-settings');
  }, [firestore]);

  const { data: toolSettings, isLoading: settingsLoading } = useCollection<ToolSetting>(settingsCollection as any);
  
  const [managedTools, setManagedTools] = useState<ManagedTool[]>(
    masterToolList.map(tool => ({ ...tool, enabled: true }))
  );

  useEffect(() => {
    if (!settingsLoading) {
      const toolsWithSettings = masterToolList.map(tool => {
        const docId = tool.path.replace(/\//g, '_').substring(1);
        const setting = toolSettings.find(s => s.id === docId);
        return {
          ...tool,
          enabled: setting ? setting.enabled : true,
        };
      });
      setManagedTools(toolsWithSettings);
    }
  }, [toolSettings, settingsLoading]);

  return (
    <ToolManagerContext.Provider value={{ managedTools, isLoading: settingsLoading }}>
      {children}
    </ToolManagerContext.Provider>
  );
}

function DataSeeder() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const seedBlogData = async () => {
      if (firestore && !isSeeding) {
        const blogCollectionRef = collection(firestore, 'blog-posts');
        const snapshot = await getDocs(blogCollectionRef);
        
        if (snapshot.empty) {
          setIsSeeding(true);
          toast({ title: "No blog posts found.", description: "Seeding new blog posts for you..." });
          
          try {
            for (const postData of blogPostsToAdd) {
              await addDoc(blogCollectionRef, {
                ...postData,
                date: serverTimestamp(),
              });
            }
            toast({ title: "Success!", description: "5 new blog posts have been added." });
          } catch (error) {
            console.error("Error seeding blog posts:", error);
            toast({ title: "Error", description: "Could not add new blog posts.", variant: 'destructive' });
          } finally {
            setIsSeeding(false);
          }
        }
      }
    };
    seedBlogData();
  }, [firestore, isSeeding, toast]);

  return null; // This component does not render anything
}


export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const { isPreviewing } = usePreviewMode();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isPhotoEditorActive = isClient && pathname === '/tools/photo-editor' && sessionStorage.getItem('photo-editor-image');

  if (isPhotoEditorActive) {
    return <div className="h-screen w-screen">{children}</div>;
  }

  return (
    <ToolProvider>
      <DataSeeder />
      <div className="flex flex-col min-h-screen">
        <DynamicMetadata />
        {isPreviewing && <PreviewBar />}
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </ToolProvider>
  );
}
