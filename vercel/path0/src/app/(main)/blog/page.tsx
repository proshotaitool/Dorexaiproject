
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, FileText } from 'lucide-react';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { Skeleton } from '@/components/ui/skeleton';

export default function BlogPage() {
  const { posts, isLoaded } = useBlogPosts();
  
  const publishedPosts = posts.filter(p => p.status === 'Published');
  const featuredPost = publishedPosts[0];
  const otherPosts = publishedPosts.slice(1);

  if (!isLoaded) {
    return (
      <div className="container py-12 md:py-16">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-2/5 mx-auto" />
          <Skeleton className="h-6 w-3/5 mx-auto mt-4" />
        </div>
        <Card className="mb-12 overflow-hidden md:grid md:grid-cols-2 md:items-center">
            <Skeleton className="aspect-video w-full"/>
            <div className="p-8 space-y-4">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-10 w-32" />
            </div>
        </Card>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-video w-full" />
              <CardContent className="p-6 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">DoreX Ai Blog</h1>
        <p className="mt-3 text-muted-foreground md:text-lg max-w-2xl mx-auto">
          Your go-to resource for digital creativity, productivity tips, and updates from our team.
        </p>
      </div>

      {publishedPosts.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/20">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Blog Posts Yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Check back soon for articles, tips, and updates!</p>
        </div>
      ) : (
        <>
          {/* Featured Post */}
          {featuredPost && (
            <Card className="mb-12 overflow-hidden md:grid md:grid-cols-2 md:items-center">
              <div className="md:order-2">
                  <Link href={`/blog/${featuredPost.id}`} className="block group">
                      <div className="aspect-video overflow-hidden">
                          <Image
                          src={featuredPost.imageUrl}
                          alt={featuredPost.title}
                          width={800}
                          height={450}
                          data-ai-hint={featuredPost.imageHint}
                          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                          />
                      </div>
                  </Link>
              </div>
              <div className="p-6 md:p-8 md:order-1">
                <Badge variant="secondary" className="mb-2">{featuredPost.category}</Badge>
                <h2 className="text-2xl lg:text-3xl font-semibold hover:text-primary transition-colors">
                   <Link href={`/blog/${featuredPost.id}`}>{featuredPost.title}</Link>
                </h2>
                <p className="mt-3 text-muted-foreground line-clamp-3">{featuredPost.content.replace(/<[^>]*>?/gm, '').substring(0, 200)}...</p>
                <div className="mt-4 text-sm text-muted-foreground">
                  <span>By {featuredPost.author}</span>
                  <span className="mx-2">&bull;</span>
                  <span>{featuredPost.date?.toDate().toLocaleDateString()}</span>
                </div>
                 <Button asChild className="mt-6">
                  <Link href={`/blog/${featuredPost.id}`}>Read More <ArrowRight className="ml-2 h-4 w-4"/></Link>
                </Button>
              </div>
            </Card>
          )}

          {/* Other Posts */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {otherPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`} className="group">
                <Card className="h-full overflow-hidden transition-shadow duration-300 hover:shadow-xl">
                  {post.imageUrl && (
                    <CardHeader className="p-0">
                      <div className="aspect-video overflow-hidden">
                        <Image
                          src={post.imageUrl}
                          alt={post.title}
                          width={600}
                          height={400}
                          data-ai-hint={post.imageHint}
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    </CardHeader>
                  )}
                  <CardContent className="p-6">
                    <Badge variant="secondary" className="mb-2">{post.category}</Badge>
                    <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">{post.title}</h2>
                    <p className="mt-3 text-muted-foreground text-sm line-clamp-3">{post.content.replace(/<[^>]*>?/gm, '').substring(0, 150)}...</p>
                  </CardContent>
                  <CardFooter className="p-6 pt-0 text-sm text-muted-foreground">
                    <span>By {post.author}</span>
                    <span className="mx-2">&bull;</span>
                    <span>{post.date?.toDate().toLocaleDateString()}</span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
