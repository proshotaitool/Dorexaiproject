
'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDoc, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

// Define a general structure for page content
interface PageContent {
  [key: string]: string | { [key: string]: string } | any[];
}

const getPageSchema = (pageId: string) => {
    switch(pageId) {
        case 'about':
            return {
                hero: { title: '', subtitle: '' },
                mission: { title: 'Our Mission', text: ''},
                vision: { title: 'Our Vision', text: '' },
                values: { title: 'Our Values', text: '' }
            };
        default:
            return { title: '', subtitle: '' };
    }
}


export default function EditWebsitePage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.id as string;
  
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const pageDocRef = useMemo(() => {
    if (!firestore || !pageId) return null;
    return doc(firestore, 'pages', pageId);
  }, [firestore, pageId]);

  const { data: pageContent, isLoading } = useDoc(pageDocRef);

  const methods = useForm();
  const { register, handleSubmit, reset, formState: { isSubmitting, isDirty } } = methods;

  useEffect(() => {
    if (pageContent) {
      reset(pageContent);
    } else if (!isLoading) {
      // If no content, initialize with schema
      reset(getPageSchema(pageId));
    }
  }, [pageContent, isLoading, reset, pageId]);
  

  const onSubmit = async (data: PageContent) => {
    if (!pageDocRef) return;
    try {
        await setDoc(pageDocRef, data, { merge: true });
        toast({ title: "Success!", description: "Page content has been updated." });
    } catch(e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to save content.', variant: 'destructive'});
    }
  };

  const renderField = (fieldName: string, value: any, parentKey = '') => {
    const fullKey = parentKey ? `${parentKey}.${fieldName}` : fieldName;
    
    if (typeof value === 'string') {
        const isTextArea = value.length > 100 || fieldName.toLowerCase().includes('text') || fieldName.toLowerCase().includes('description');
        return (
            <div key={fullKey} className="space-y-2">
                <Label htmlFor={fullKey} className="capitalize">{fieldName.replace(/([A-Z])/g, ' $1')}</Label>
                {isTextArea ? (
                    <Textarea id={fullKey} {...register(fullKey)} className="min-h-[100px]" />
                ) : (
                    <Input id={fullKey} {...register(fullKey)} />
                )}
            </div>
        );
    }
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return (
            <Card key={fullKey} className="bg-muted/30">
                <CardHeader>
                    <CardTitle className="text-lg capitalize">{fieldName.replace(/([A-Z])/g, ' $1')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Object.entries(value).map(([key, subValue]) => renderField(key, subValue, fullKey))}
                </CardContent>
            </Card>
        )
    }
    
    return null;
  }

  if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
  }

  return (
    <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/admin/website-editor">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold capitalize">Editing: {pageId.replace(/-/g, ' ')}</h1>
                        <p className="text-admin-muted-foreground">Modify the content for this page.</p>
                    </div>
                </div>
                <Button type="submit" disabled={isSubmitting || !isDirty}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>
            <div className="space-y-6">
               {pageContent ? Object.entries(pageContent).filter(([key]) => key !== 'id').map(([key, value]) => renderField(key, value))
               : Object.entries(getPageSchema(pageId)).map(([key, value]) => renderField(key, value))
               }
            </div>
        </form>
    </FormProvider>
  );
}
