
'use client';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, MoreVertical, Edit, Trash2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AdminBlogPage() {
  const { posts, deletePost, isLoaded } = useBlogPosts();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  const handleDelete = async () => {
    if (postToDelete) {
      try {
        await deletePost(postToDelete);
        toast({
            title: 'Post Deleted',
            description: 'The blog post has been successfully deleted.',
        });
      } catch (error) {
        toast({
            title: 'Error',
            description: 'Failed to delete the post.',
            variant: 'destructive',
        });
      } finally {
        setPostToDelete(null);
      }
    }
  }

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Blog Management</h1>
          <p className="text-admin-muted-foreground">Create, edit, and manage your blog posts.</p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>
      
       <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-muted-foreground" />
          <Input 
              placeholder="Search posts..." 
              className="pl-10 h-10 w-full max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

      {!isLoaded ? (
        <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-admin-muted/30">
            <Search className="mx-auto h-12 w-12 text-admin-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Posts Found</h3>
            <p className="mt-2 text-sm text-admin-muted-foreground">There are no blog posts that match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
            <Card key={post.id} className="flex flex-col">
                <CardHeader className="p-0 relative">
                    <Image
                        src={post.imageUrl}
                        alt={post.title}
                        width={600}
                        height={400}
                        data-ai-hint={post.imageHint}
                        className="aspect-video w-full rounded-t-lg object-cover"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 bg-black/30 hover:bg-black/50 text-white hover:text-white">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/admin/blog/edit/${post.id}`}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500" onClick={() => setPostToDelete(post.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent className="p-4 flex-1">
                <CardTitle className="text-lg mb-2">{post.title}</CardTitle>
                <Badge variant="outline" className="text-xs">{post.category}</Badge>
                </CardContent>
                <CardFooter className="p-4 text-xs text-admin-muted-foreground flex justify-between items-center">
                <span>By {post.author} &bull; {post.date?.toDate ? post.date.toDate().toLocaleDateString() : 'N/A'}</span>
                <Badge 
                    className={cn(
                        post.status === 'Published' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    )}
                >
                    {post.status}
                </Badge>
                </CardFooter>
            </Card>
            ))}
        </div>
      )}
      <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the blog post.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
