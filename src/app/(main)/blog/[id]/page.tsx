
'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { RelatedTools } from '@/components/related-tools';
import { tools } from '@/lib/tools';
import { Button } from '@/components/ui/button';

export default function BlogPostPage() {
  const params = useParams();
  const postId = params.id as string;
  const { posts, isLoaded } = useBlogPosts();

  const post = posts.find(p => p.id === postId);

  if (!isLoaded) {
    return (
      <div className="container max-w-4xl mx-auto py-12">
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="aspect-video w-full" />
          <div className="space-y-2 mt-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container text-center py-20">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <p className="text-muted-foreground">The blog post you're looking for does not exist.</p>
        <Button asChild className="mt-4">
            <Link href="/blog">Back to Blog</Link>
        </Button>
      </div>
    );
  }

  const relatedTools = tools.filter(tool => post.content.toLowerCase().includes(tool.name.toLowerCase()));

  return (
    <div className="bg-background">
      <div className="container max-w-4xl mx-auto py-12 md:py-16">
        <article>
          <header className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
                <Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Blog</Link>
            </Button>
            <Badge variant="secondary" className="mb-2">{post.category}</Badge>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">{post.title}</h1>
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{post.date?.toDate ? post.date.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
              </div>
            </div>
          </header>
          
          <div className="aspect-video w-full relative overflow-hidden rounded-xl mb-8 shadow-lg">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover"
              data-ai-hint={post.imageHint}
            />
          </div>

          <div
            className="prose prose-lg dark:prose-invert max-w-none mx-auto"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

        </article>
      </div>
       <RelatedTools tools={relatedTools} />
    </div>
  );
}
