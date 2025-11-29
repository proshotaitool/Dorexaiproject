
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCollection, useFirestore, useAuth } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';

export interface BlogPost {
  id: string;
  title: string;
  category: string;
  status: 'Published' | 'Draft';
  author: string;
  date: any; // Can be Date or Firestore Timestamp
  imageUrl: string;
  imageHint: string;
  content: string;
}

export function useBlogPosts() {
  const firestore = useFirestore();
  const { user } = useAuth();
  
  const postsCollection = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'blog-posts'), orderBy('date', 'desc'));
  }, [firestore]);

  const { data: posts, isLoading } = useCollection<BlogPost>(postsCollection as any);

  const addPost = useCallback(async (newPostData: Omit<BlogPost, 'id' | 'date' | 'author'>) => {
    if (!firestore || !user) throw new Error("Firestore or user not available");

    const newPost: Omit<BlogPost, 'id'> = {
      ...newPostData,
      date: serverTimestamp(),
      author: user.displayName || 'Admin',
    };
    
    await addDoc(collection(firestore, 'blog-posts'), newPost);
  }, [firestore, user]);
  
  const updatePost = useCallback(async (postId: string, updatedData: Partial<Omit<BlogPost, 'id'>>) => {
    if (!firestore) throw new Error("Firestore not available");
    
    const postRef = doc(firestore, 'blog-posts', postId);
    await updateDoc(postRef, {
        ...updatedData,
        date: serverTimestamp() // Also update the date on edit
    });
  }, [firestore]);

  const deletePost = useCallback(async (postId: string) => {
    if (!firestore) throw new Error("Firestore not available");
    
    const postRef = doc(firestore, 'blog-posts', postId);
    await deleteDoc(postRef);
  }, [firestore]);

  return { posts, addPost, updatePost, deletePost, isLoaded: !isLoading };
}
