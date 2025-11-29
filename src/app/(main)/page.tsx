
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Zap, Lock, Sparkles, FileImage, FileText, Brain, Star, Gem, Type, TextQuote, Merge, Scissors, Wand2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchBar } from '@/components/search-bar';
import { useTranslation } from '@/hooks/use-translation';
import { ToolCard } from '@/components/tool-card';
import { placeholderImages } from '@/lib/placeholder-images';
import { useToolManager } from '@/hooks/useToolManager';
import { Skeleton } from '@/components/ui/skeleton';

const FloatingIcon = ({ icon: Icon, className }: { icon: React.ElementType, className?: string }) => (
  <div className={`absolute hidden md:block animate-float ${className}`}>
    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-full shadow-lg">
      <Icon className="h-6 w-6 text-white" />
    </div>
  </div>
);

export default function Home() {
  const { t } = useTranslation();
  const { managedTools, isLoading: toolsLoading } = useToolManager();

  const toolCategories = [
    {
      name: 'Image Tools',
      description: 'Compress, resize, convert, and enhance images with AI.',
      icon: FileImage,
      path: '/tools/image',
      color: 'from-blue-500 to-cyan-400',
      iconColor: 'text-blue-500'
    },
    {
      name: 'PDF Tools',
      description: 'Merge, split, compress, and convert PDF documents.',
      icon: FileText,
      path: '/tools/pdf',
      color: 'from-red-500 to-orange-400',
      iconColor: 'text-red-500'
    },
    {
      name: 'AI Tools',
      description: 'AI-powered text, speech, and content generation.',
      icon: Brain,
      path: '/tools/text-ai',
      color: 'from-purple-500 to-pink-400',
      iconColor: 'text-purple-500'
    },
    {
      name: 'Premium Tools',
      description: 'Unlock exclusive features with our premium toolkit.',
      icon: Gem,
      path: '/premium',
      color: 'from-yellow-400 to-amber-500',
      iconColor: 'text-yellow-400',
      isPremium: true,
    },
    {
      name: 'Text Tools',
      description: 'Format, analyze, and manipulate your text with ease.',
      icon: Type,
      path: '/tools/text-ai',
      color: 'from-green-500 to-teal-400',
      iconColor: 'text-green-500',
    },
    {
      name: 'Content Tools',
      description: 'Generate and refine content for your projects.',
      icon: TextQuote,
      path: '/tools/text-ai',
      color: 'from-indigo-500 to-violet-400',
      iconColor: 'text-indigo-500',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      title: 'Graphic Designer',
      quote: t('homepage.testimonials.testimonial1.quote'),
      avatar: placeholderImages.find(p => p.id === 'testimonial-1')?.imageUrl || '',
      imageHint: placeholderImages.find(p => p.id === 'testimonial-1')?.imageHint || '',
      initials: 'SJ'
    },
    {
      name: 'Michael Chen',
      title: 'Content Creator',
      quote: t('homepage.testimonials.testimonial2.quote'),
      avatar: placeholderImages.find(p => p.id === 'testimonial-2')?.imageUrl || '',
      imageHint: placeholderImages.find(p => p.id === 'testimonial-2')?.imageHint || '',
      initials: 'MC'
    },
    {
      name: 'Emily Davis',
      title: 'Marketing Manager',
      quote: t('homepage.testimonials.testimonial3.quote'),
      avatar: placeholderImages.find(p => p.id === 'testimonial-3')?.imageUrl || '',
      imageHint: placeholderImages.find(p => p.id === 'testimonial-3')?.imageHint || '',
      initials: 'ED'
    },
  ];

  const features = [
    {
      icon: Zap,
      title: t('homepage.features.feature1.title'),
      description: t('homepage.features.feature1.description'),
    },
    {
      icon: Lock,
      title: t('homepage.features.feature2.title'),
      description: t('homepage.features.feature2.description'),
    },
    {
      icon: Sparkles,
      title: t('homepage.features.feature3.title'),
      description: t('homepage.features.feature3.description'),
    },
  ];

  const popularToolPaths = [
    '/tools/compress-image',
    '/tools/ai-background-remover',
    '/tools/merge-pdf',
    '/tools/resize-image',
    '/tools/text-summarization',
    '/tools/crop-image',
    '/tools/convert-to-jpg',
    '/tools/watermark-image',
    '/tools/meme-generator',
    '/tools/image-to-text',
    '/tools/pdf-to-word',
    '/tools/word-to-pdf',
  ];

  const popularTools = managedTools
    .filter(t => popularToolPaths.includes(t.path) && t.enabled)
    .slice(0, 12);


  return (
    <div className="flex flex-col overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative w-full min-h-[600px] flex items-center justify-center pt-20 pb-10 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-20 bg-gradient-to-br from-blue-50 via-purple-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-black"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl opacity-50 animate-blob-1 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-secondary/30 to-purple-200/30 rounded-full blur-3xl opacity-50 animate-blob-2 -z-10"></div>

        {/* 3D Background Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-20 pointer-events-none -z-10 animate-float">
          <img
            src="/hero-sphere.png"
            alt="3D Abstract Sphere"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="container px-4 md:px-6 z-10 relative">
          <div className="flex flex-col items-center text-center space-y-8 animate-fade-in-up max-w-4xl mx-auto">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/50 dark:bg-white/10 border border-white/20 backdrop-blur-sm shadow-sm text-sm font-medium text-primary">
              <Sparkles className="w-4 h-4 mr-2" />
              <span>The Ultimate AI Toolkit</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
              {t('homepage.hero.title')}{' '}
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                {t('homepage.hero.titleHighlight')}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t('homepage.hero.subtitle')}
            </p>

            <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-6">
              <SearchBar />

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                <Button size="lg" asChild className="rounded-full h-12 px-8 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all w-full sm:w-auto">
                  <Link href="/signup">Get Started Free</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="rounded-full h-12 px-8 text-base font-bold border-2 hover:bg-secondary/50 transition-all w-full sm:w-auto">
                  <Link href="/tools">Explore Tools</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Categories Section */}
      <section id="tool-categories" className="w-full py-24 relative overflow-hidden">
        <div className="container relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">{t('homepage.toolCategories.title')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t('homepage.toolCategories.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {toolCategories.map((category) => (
              <Link key={category.name} href={category.path} className="group block h-full">
                <Card className={cn(
                  "h-full transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border-white/40 bg-white/60 dark:bg-black/40 backdrop-blur-xl overflow-hidden relative",
                  category.isPremium && "border-yellow-400/50 shadow-yellow-400/10"
                )}>
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                  <CardContent className="p-8 flex flex-col items-center text-center h-full relative z-10">
                    <div className={`mb-6 p-4 rounded-2xl bg-gradient-to-br ${category.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                      <category.icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{category.name}</h3>
                    <p className="text-muted-foreground mb-6 flex-grow leading-relaxed">{category.description}</p>
                    <div className="flex items-center text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      {t('homepage.toolCategories.viewTools')} <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Most Popular Tools Section */}
      <section className="w-full py-24 bg-secondary/30 relative">
        {/* Decorative Wave */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-background to-transparent"></div>

        <div className="container relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
            <div className="text-left">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Most Popular Tools</h2>
              <p className="mt-2 text-muted-foreground text-lg">
                Essential tools for your daily workflow.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/tools">View All Tools</Link>
            </Button>
          </div>

          {toolsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {popularTools.map((tool) => {
                if (!tool) return null;
                return (
                  <ToolCard key={tool.path} tool={tool} />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Features / Why Choose Section */}
      <section className="w-full py-24 relative overflow-hidden">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('homepage.features.title')}</h2>
            <p className="mt-4 text-muted-foreground md:text-lg max-w-2xl mx-auto">{t('homepage.features.subtitle')}</p>
          </div>
          <div className="grid items-start gap-12 md:grid-cols-3">
            {features.map((feature, i) => (
              <div key={feature.title} className="flex flex-col items-center text-center gap-6 p-6 rounded-3xl bg-white/50 dark:bg-white/5 border border-white/20 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/20 p-5 text-primary shadow-inner">
                  <feature.icon className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full py-24 bg-gradient-to-b from-transparent to-secondary/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('homepage.testimonials.title')}</h2>
            <p className="mt-4 text-muted-foreground md:text-lg">
              {t('homepage.testimonials.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={testimonial.name} className="border-white/40 bg-white/60 dark:bg-black/40 backdrop-blur-md hover:shadow-xl transition-all duration-500" style={{ animationDelay: `${index * 150}ms` }}>
                <CardContent className="p-8">
                  <div className="flex mb-6">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <p className="mb-8 text-foreground/80 italic text-lg">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                      {testimonial.avatar && <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.imageHint} />}
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{testimonial.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-lg">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="w-full py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-10"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-gradient-to-b from-primary/10 to-transparent rounded-full blur-3xl -z-10"></div>

        <div className="container text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto mb-8">
            {t('homepage.finalCta.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t('homepage.finalCta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="rounded-full h-14 px-10 text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all">
              <Link href="/signup">{t('homepage.finalCta.cta')}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-full h-14 px-10 text-lg border-2 hover:bg-secondary/50">
              <Link href="/tools">Explore Tools</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
