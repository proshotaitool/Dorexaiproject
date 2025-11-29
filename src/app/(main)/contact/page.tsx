
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Users, MessageSquare } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters.' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    if (!firestore) {
        toast({ title: 'Error', description: 'Could not connect to the database.', variant: 'destructive'});
        return;
    }
    setIsLoading(true);
    try {
        await addDoc(collection(firestore, 'contact-messages'), {
            ...data,
            submittedAt: serverTimestamp()
        });
        toast({ title: 'Message Sent!', description: 'Thank you for reaching out. We will get back to you soon.'});
        form.reset();
    } catch (error) {
        console.error('Error submitting contact form:', error);
        toast({ title: 'Submission Failed', description: 'There was a problem sending your message. Please try again.', variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="bg-background">
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
            We'd Love to Hear From You
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Whether you have a question, feedback, or need support, our team is ready to help. Fill out the form below and we'll get back to you within 24-48 hours.
          </p>
        </div>
      </div>

      <div className="container -mt-8 pb-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Send us a message</CardTitle>
            <CardDescription>Fill out the form below and we'll get back to you as soon as possible.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="name">Full Name</Label>
                      <FormControl>
                        <Input id="name" placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="email">Email</Label>
                      <FormControl>
                        <Input id="email" type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="subject">Subject</Label>
                      <FormControl>
                        <Input id="subject" placeholder="Regarding my account" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="message">Message</Label>
                      <FormControl>
                        <Textarea id="message" placeholder="Your message..." className="min-h-[150px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Sending...' : 'Send Message'}
                </Button>
                </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6 pt-10">
            <h2 className="text-2xl font-semibold">Other Ways to Reach Us</h2>
            <p className="text-muted-foreground">
                While our contact form is the best way to get a detailed response, here are other resources that might help you find what you're looking for.
            </p>
            <div className="space-y-4">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Mail className="h-6 w-6"/>
                    </div>
                    <div>
                        <h3 className="font-semibold">General Inquiries</h3>
                        <p className="text-muted-foreground text-sm">For general questions and information, email us at <a href="mailto:info@dorexai.space" className="text-primary hover:underline">info@dorexai.space</a>.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Users className="h-6 w-6"/>
                    </div>
                    <div>
                        <h3 className="font-semibold">Partnerships</h3>
                        <p className="text-muted-foreground text-sm">Interested in partnering with us? Contact our partnerships team at <a href="mailto:partners@dorexai.space" className="text-primary hover:underline">partners@dorexai.space</a>.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <MessageSquare className="h-6 w-6"/>
                    </div>
                    <div>
                        <h3 className="font-semibold">Help Center</h3>
                        <p className="text-muted-foreground text-sm">Find answers to frequently asked questions in our <a href="/help-center" className="text-primary hover:underline">Help Center</a>.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
