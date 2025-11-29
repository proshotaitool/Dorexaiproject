
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MoreHorizontal,
  PlusCircle,
  Search,
  Loader2,
  Edit,
  Trash2,
  Eye,
  Infinity,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';


type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  plan: 'Free' | 'Pro' | 'Business';
  status: 'Active' | 'Suspended';
  joined: any;
};

type Plan = {
    id: string;
    name: string;
    price: {
        monthly: string;
        yearly: string;
    };
    features: string[];
    credits: number; // -1 for unlimited
    isPopular?: boolean;
}

const initialPlans: Plan[] = [
    { id: '1', name: 'Free', price: { monthly: '$0', yearly: '$0' }, features: ['Basic Tool Access', 'Limited File Processing', 'Standard Support'], credits: 100 },
    { id: '2', name: 'Pro', price: { monthly: '$10/month', yearly: '$96/year' }, features: ['Full Tool Access', 'Priority Processing', 'Ad-Free Experience', 'Priority Support'], isPopular: true, credits: 500 },
    { id: '3', name: 'Business', price: { monthly: 'Custom', yearly: 'Custom' }, features: ['Everything in Pro', 'Team Management', 'API Access', 'Dedicated Support'], credits: -1 },
];

const PlanEditDialog = ({ plan, open, onOpenChange, onSave }: { plan: Partial<Plan> | null; open: boolean; onOpenChange: (open: boolean) => void; onSave: (data: Plan) => void }) => {
    const isEditing = !!plan?.id;
    const [name, setName] = useState('');
    const [monthlyPrice, setMonthlyPrice] = useState('');
    const [yearlyPrice, setYearlyPrice] = useState('');
    const [features, setFeatures] = useState('');
    const [credits, setCredits] = useState<number | string>(100);
    const [isUnlimited, setIsUnlimited] = useState(false);

    useEffect(() => {
        if(plan) {
            setName(plan.name || '');
            setMonthlyPrice(plan.price?.monthly || '');
            setYearlyPrice(plan.price?.yearly || '');
            setFeatures(plan.features?.join('\n') || '');
            setIsUnlimited(plan.credits === -1);
            setCredits(plan.credits === -1 ? '' : (plan.credits || 100));
        } else {
            setName('');
            setMonthlyPrice('');
            setYearlyPrice('');
            setFeatures('');
            setCredits(100);
            setIsUnlimited(false);
        }
    }, [plan]);
    
    useEffect(() => {
      if (isUnlimited) {
        setCredits('');
      }
    }, [isUnlimited]);

    const handleSave = () => {
        const planData: Plan = {
            id: plan?.id || Date.now().toString(),
            name,
            price: {
                monthly: monthlyPrice,
                yearly: yearlyPrice
            },
            features: features.split('\n').filter(f => f.trim() !== ''),
            credits: isUnlimited ? -1 : Number(credits) || 0,
        };
        onSave(planData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="space-y-2">
                        <Label htmlFor="plan-name">Plan Name</Label>
                        <Input id="plan-name" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="plan-monthly-price">Monthly Price</Label>
                            <Input id="plan-monthly-price" value={monthlyPrice} onChange={e => setMonthlyPrice(e.target.value)} placeholder="$10/month" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="plan-yearly-price">Yearly Price</Label>
                            <Input id="plan-yearly-price" value={yearlyPrice} onChange={e => setYearlyPrice(e.target.value)} placeholder="$96/year" />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="plan-features">Features (one per line)</Label>
                        <Textarea id="plan-features" value={features} onChange={e => setFeatures(e.target.value)} className="min-h-[120px]" />
                    </div>
                    <div className="space-y-2">
                        <Label>Daily Credits</Label>
                        <div className='flex items-center gap-4'>
                             <Input 
                                type="number" 
                                value={credits} 
                                onChange={e => setCredits(e.target.value)} 
                                placeholder="e.g., 100"
                                disabled={isUnlimited}
                             />
                            <div className="flex items-center space-x-2">
                                <Switch id="unlimited-credits" checked={isUnlimited} onCheckedChange={setIsUnlimited} />
                                <Label htmlFor="unlimited-credits">Unlimited</Label>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSave}>Save Plan</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const UserSubscriptionDialog = ({ user, open, onOpenChange, onUserUpdated }: { user: User | null; open: boolean; onOpenChange: (open: boolean) => void; onUserUpdated: () => void }) => {
    const [plan, setPlan] = useState<User['plan']>('Free');
    const [status, setStatus] = useState<User['status']>('Active');
    const [isSaving, setIsSaving] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    useEffect(() => {
        if(user) {
            setPlan(user.plan);
            setStatus(user.status);
        }
    }, [user]);
    
    const handleSave = async () => {
      if(!user || !firestore) return;
      setIsSaving(true);
      try {
        const userRef = doc(firestore, 'users', user.id);
        await updateDoc(userRef, { plan, status });
        toast({ title: "Subscription Updated", description: "The user's subscription details have been updated." });
        onUserUpdated();
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error", description: "Failed to update subscription.", variant: "destructive" });
      } finally {
        setIsSaving(false);
      }
    };
    
    if(!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Subscription for {user.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Plan</Label>
                        <Select value={plan} onValueChange={(v) => setPlan(v as User['plan'])}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Free">Free</SelectItem>
                                <SelectItem value="Pro">Pro</SelectItem>
                                <SelectItem value="Business">Business</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={(v) => setStatus(v as User['status'])}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Suspended">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function SubscriptionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  
  const firestore = useFirestore();
  const usersCollection = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: users, isLoading: usersLoading, error } = useCollection<User>(usersCollection!);

  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [editingPlan, setEditingPlan] = useState<Partial<Plan> | null>(null);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUserSubDialogOpen, setIsUserSubDialogOpen] = useState(false);
  
  const { toast } = useToast();

  const handleAddPlan = () => {
    setEditingPlan(null);
    setIsPlanDialogOpen(true);
  }

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setIsPlanDialogOpen(true);
  }

  const handleSavePlan = (planData: Plan) => {
    if (editingPlan?.id) { // Editing existing
        setPlans(plans.map(p => p.id === planData.id ? planData : p));
        toast({ title: "Plan Updated", description: "The plan has been successfully updated." });
    } else { // Adding new
        setPlans([...plans, planData]);
        toast({ title: "Plan Added", description: "The new plan has been created." });
    }
    setIsPlanDialogOpen(false);
  }

  const handleDeletePlan = () => {
    if (deletingPlan) {
        setPlans(plans.filter(p => p.id !== deletingPlan.id));
        toast({ title: "Plan Deleted", description: "The plan has been successfully deleted.", variant: 'destructive' });
        setDeletingPlan(null);
    }
  }


  const subscribedUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter(user => {
      const isSubscribed = user.plan === 'Pro' || user.plan === 'Business';
      const planMatch = filterPlan === 'all' || user.plan.toLowerCase() === filterPlan;
      const searchMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      return isSubscribed && planMatch && searchMatch;
    });
  }, [users, filterPlan, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Subscriptions</h1>
          <p className="text-admin-muted-foreground">Manage your subscription plans and active subscribers.</p>
        </div>
        <Button onClick={handleAddPlan}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Plan
        </Button>
      </div>
      
       <div className="space-y-6">
          <Card>
            <CardHeader>
                <CardTitle>Manage Plans</CardTitle>
                <CardDescription>Add, edit, or delete subscription plans.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map(plan => (
                        <Card key={plan.id} className={cn("flex flex-col", plan.isPopular && "border-primary ring-2 ring-primary/20")}>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>{plan.name}</CardTitle>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleEditPlan(plan)}><Edit className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setDeletingPlan(plan)} className="text-red-500"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="text-2xl font-bold">{plan.price.monthly}</div>
                                {plan.price.yearly !== plan.price.monthly && <p className="text-sm text-muted-foreground">or {plan.price.yearly}</p>}
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <ul className="space-y-2 text-sm text-admin-muted-foreground">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Badge variant="outline" className="w-full justify-center py-2">
                                    {plan.credits === -1 ? (
                                        <><Infinity className="mr-2 h-4 w-4"/> Unlimited Credits</>
                                    ) : (
                                        `${plan.credits} Daily Credits`
                                    )}
                                </Badge>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Subscribers</CardTitle>
          <CardDescription>A list of all users with an active subscription.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10 h-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="Pro">Pro</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                   <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-red-500">
                      Error loading users: {error.message}
                    </TableCell>
                  </TableRow>
                ) : subscribedUsers.length > 0 ? (
                  subscribedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-admin-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            user.plan === 'Pro' && 'bg-blue-100 text-blue-800 border-blue-200',
                            user.plan === 'Business' && 'bg-purple-100 text-purple-800 border-purple-200'
                          )}
                        >
                          {user.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.status === 'Active' ? 'default' : 'destructive'}
                          className={cn(
                            user.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                          )}
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.joined?.toDate ? user.joined.toDate().toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingUser(user); setIsUserSubDialogOpen(true); }}>
                                <Edit className="mr-2 h-4 w-4"/>Edit Subscription
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No subscribed users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PlanEditDialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen} plan={editingPlan} onSave={handleSavePlan} />
      
      <AlertDialog open={!!deletingPlan} onOpenChange={(open) => !open && setDeletingPlan(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this plan?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the "{deletingPlan?.name}" plan.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePlan} className={buttonVariants({ variant: 'destructive'})}>
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UserSubscriptionDialog 
        user={editingUser}
        open={isUserSubDialogOpen}
        onOpenChange={setIsUserSubDialogOpen}
        onUserUpdated={() => {
            // This is a simple way to trigger a re-fetch in useCollection
            // In a real app, you might optimistically update the UI or use a more robust state management solution
            const currentUsers = [...(users || [])];
            const userIndex = currentUsers.findIndex(u => u.id === editingUser?.id);
            if(userIndex > -1) {
              // This part doesn't really work as expected without a proper state update mechanism,
              // but for this context it's a placeholder for re-fetching.
            }
        }}
      />
    </div>
  );
}
