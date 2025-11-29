
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart2,
  Wrench,
  Database,
  Star,
  FileText,
  FileImage,
  Brain,
  ArrowRight,
  Merge,
  Bot
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useMemo } from 'react';
import { tools } from '@/lib/tools';
import { ToolCard } from '@/components/tool-card';


export default function DashboardPage() {
  const { user, profile } = useUser();

  const favoriteTools = useMemo(() => {
    if (!profile?.favoriteTools) return [];
    return tools.filter(tool => profile.favoriteTools.includes(tool.path));
  }, [profile]);


  return (
    <div className="container py-12">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Welcome, {user?.displayName || 'User'}!</h1>
         <Button asChild>
            <Link href="/tools">Explore Tools <ArrowRight className="ml-2"/></Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks This Month</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Real-time analytics coming soon!</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used Tool</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N/A</div>
            <p className="text-xs text-muted-foreground">Real-time analytics coming soon!</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Processed</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 GB</div>
            <p className="text-xs text-muted-foreground">Real-time analytics coming soon!</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorite Tools</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{favoriteTools.length}</div>
            <p className="text-xs text-muted-foreground">You have {favoriteTools.length} favorite tools</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-6">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>
              A visual overview of your task history for the past week.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <BarChart2 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Real-time Analytics Coming Soon</h3>
                <p className="mt-2 text-sm text-muted-foreground">Your weekly activity chart will appear here.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest completed tasks.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Recent Activity</h3>
                <p className="mt-2 text-sm text-muted-foreground">Once you use a tool, your activity will show here.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
            <CardHeader>
                <CardTitle>Your Favorite Tools</CardTitle>
                <CardDescription>Quick access to your most-used tools.</CardDescription>
            </CardHeader>
            <CardContent>
                {favoriteTools.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {favoriteTools.map(tool => (
                          <ToolCard key={tool.path} tool={tool} />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border-2 border-dashed rounded-lg">
                      <Star className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">No Favorite Tools Yet</h3>
                      <p className="mt-2 text-sm text-muted-foreground">Add tools to your favorites for quick access.</p>
                      <Button asChild className="mt-4">
                          <Link href="/tools">Explore Tools</Link>
                      </Button>
                  </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
