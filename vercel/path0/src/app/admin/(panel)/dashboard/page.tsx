
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, Wrench, FileText, Activity, Server, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useAuth } from '@/firebase';
import { collection } from 'firebase/firestore';
import { tools } from '@/lib/tools';
import Link from 'next/link';

const systemStatus = [
    { name: 'Database', status: 'Operational', icon: Server },
    { name: 'Storage', status: 'Operational', icon: Server },
    { name: 'API', status: 'Operational', icon: Activity },
    { name: 'Email Service', status: 'Operational', icon: Activity },
];

const quickActions = [
    { label: 'Manage Users', icon: Users, href: '/admin/users' },
    { label: 'Manage Tools', icon: Wrench, href: '/admin/tools' },
    { label: 'Manage Blog', icon: FileText, href: '/admin/blog' },
];

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  
  const usersCollection = firestore ? collection(firestore, 'users') : null;
  const { data: users, isLoading: usersLoading } = useCollection<any>(usersCollection as any);
  
  const blogCollection = firestore ? collection(firestore, 'blog-posts') : null;
  const { data: blogPosts, isLoading: blogLoading } = useCollection(blogCollection as any);

  const proUsers = users?.filter(u => u.plan === 'Pro' || u.plan === 'Business').length || 0;
  
  const totalTools = tools.length;
  const totalBlogPosts = blogPosts?.length || 0;

  const stats = [
    { title: 'Total Users', value: usersLoading ? '...' : users?.length || 0, icon: Users, color: 'text-blue-500' },
    { title: 'Active Subscriptions', value: usersLoading ? '...' : proUsers, icon: CreditCard, color: 'text-green-500' },
    { title: 'Total Tools', value: totalTools, icon: Wrench, color: 'text-purple-500' },
    { title: 'Blog Posts', value: blogLoading ? '...' : totalBlogPosts, icon: FileText, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-admin-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
                {systemStatus.map(service => (
                    <li key={service.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <service.icon className="h-5 w-5 text-admin-muted-foreground" />
                           <span className="font-medium">{service.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span className="text-sm text-green-600">{service.status}</span>
                        </div>
                    </li>
                ))}
            </ul>
            <p className="text-xs text-admin-muted-foreground mt-4">Last updated: {new Date().toLocaleTimeString()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {quickActions.map(action => (
                <Button key={action.label} variant="outline" className="justify-start gap-3 h-12 text-base" asChild>
                    <Link href={action.href}>
                      <action.icon className="h-5 w-5 text-primary" />
                      <span>{action.label}</span>
                      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </Link>
                </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
