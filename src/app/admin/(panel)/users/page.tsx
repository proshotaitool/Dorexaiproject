
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
import { Button } from '@/components/ui/button';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { useCollection, useAuth, useFirestore } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { logAction } from '@/lib/logger';

type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  plan: 'Free' | 'Pro' | 'Business';
  status: 'Active' | 'Suspended';
  joined: any;
  role?: 'admin' | 'manager' | 'user';
};

const addUserSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(['user', 'manager', 'admin']),
  plan: z.enum(['Free', 'Pro', 'Business']),
});

type AddUserFormData = z.infer<typeof addUserSchema>;

const editUserSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  role: z.enum(['user', 'manager', 'admin']),
  plan: z.enum(['Free', 'Pro', 'Business']),
  status: z.enum(['Active', 'Suspended']),
});

type EditUserFormData = z.infer<typeof editUserSchema>;


const AddUserDialog = ({ onUserAdded }: { onUserAdded: () => void }) => {
  const [open, setOpen] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'user',
      plan: 'Free',
    },
  });

  const onSubmit = async (data: AddUserFormData) => {
    if (!auth || !firestore) {
      toast({ title: 'Error', description: 'Firebase not initialized.', variant: 'destructive'});
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const userProfile: Omit<User, 'id' | 'joined'> & { joined: any } = {
        name: data.name,
        email: data.email,
        plan: data.plan,
        role: data.role,
        status: 'Active',
        joined: serverTimestamp(),
      };

      await setDoc(doc(firestore, 'users', user.uid), userProfile);
      
      if(auth.currentUser) {
        logAction(firestore, auth.currentUser, `Created new user: ${data.email} (${data.role})`);
      }
      
      toast({ title: 'User Created', description: `${data.name} has been added successfully.` });
      form.reset();
      onUserAdded();
      setOpen(false);

    } catch (error: any) {
        let errorMessage = 'An unexpected error occurred.';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email address is already in use.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'The password is too weak.';
        }
        toast({ title: 'Error Creating User', description: errorMessage, variant: 'destructive' });
        console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user profile and assign them a role and plan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="user@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                       <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                       <SelectContent>
                         <SelectItem value="user">User</SelectItem>
                         <SelectItem value="manager">Manager</SelectItem>
                         <SelectItem value="admin">Admin</SelectItem>
                       </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                       <FormControl><SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger></FormControl>
                       <SelectContent>
                         <SelectItem value="Free">Free</SelectItem>
                         <SelectItem value="Pro">Pro</SelectItem>
                         <SelectItem value="Business">Business</SelectItem>
                       </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

const UserActions = ({ user, onAction }: { user: User, onAction: (action: 'view' | 'edit' | 'delete', user: User) => void }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onAction('view', user)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('edit', user)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit User
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-500" onClick={() => onAction('delete', user)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


const UserTableRow = ({ user, onAction }: { user: User; onAction: (action: 'view' | 'edit' | 'delete', user: User) => void }) => (
  <TableRow key={user.id}>
    <TableCell>
      <Checkbox />
    </TableCell>
    <TableCell>
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback>{user.name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{user.name || 'N/A'}</div>
          <div className="text-sm text-admin-muted-foreground">
            {user.email}
          </div>
        </div>
      </div>
    </TableCell>
    <TableCell>
      <Badge
        className={cn(
          user.plan === 'Pro' && 'bg-blue-500/10 text-blue-700 border-blue-200',
          user.plan === 'Business' && 'bg-purple-500/10 text-purple-700 border-purple-200',
          user.plan === 'Free' && 'bg-gray-500/10 text-gray-700 border-gray-200'
        )}
      >
        {user.plan || 'Free'}
      </Badge>
    </TableCell>
    <TableCell>
      <Badge
        variant={user.status === 'Active' ? 'default' : 'destructive'}
        className={cn(
            user.status === 'Active' ? 'bg-green-500/10 text-green-700 border-green-200' : 'bg-red-500/10 text-red-700 border-red-200'
        )}
      >
        {user.status || 'Active'}
      </Badge>
    </TableCell>
    <TableCell>{user.joined?.toDate ? user.joined.toDate().toLocaleDateString() : 'N/A'}</TableCell>
    <TableCell>
      <UserActions user={user} onAction={onAction} />
    </TableCell>
  </TableRow>
);


const UserDetailsDialog = ({ user, open, onOpenChange }: { user: User | null; open: boolean; onOpenChange: (open: boolean) => void }) => {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-xl">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-semibold">Plan:</span> {user.plan}</div>
            <div><span className="font-semibold">Status:</span> {user.status}</div>
            <div><span className="font-semibold">Role:</span> {user.role}</div>
            <div><span className="font-semibold">Joined:</span> {user.joined?.toDate ? user.joined.toDate().toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


const UserEditDialog = ({ user, open, onOpenChange, onUserUpdated }: { user: User | null; open: boolean; onOpenChange: (open: boolean) => void; onUserUpdated: () => void }) => {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user?.name || '',
      role: user?.role || 'user',
      plan: user?.plan || 'Free',
      status: user?.status || 'Active',
    },
  });
  
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        role: user.role,
        plan: user.plan,
        status: user.status
      });
    }
  }, [user, form]);

  const onSubmit = async (data: EditUserFormData) => {
    if (!firestore || !user) return;
    
    try {
      const userRef = doc(firestore, 'users', user.id);
      await updateDoc(userRef, data);
      
      if(auth.currentUser) {
        logAction(firestore, auth.currentUser, `Edited user profile: ${user.email}`);
      }

      toast({ title: 'User Updated', description: 'User profile has been updated successfully.' });
      onUserUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to update user.', variant: 'destructive' });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User: {user.name}</DialogTitle>
          <DialogDescription>Modify the user's details below.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}/>
              <FormField control={form.control} name="plan" render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Free">Free</SelectItem>
                      <SelectItem value="Pro">Pro</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}/>
            </div>
             <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}/>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};


const UserDeleteDialog = ({ user, open, onOpenChange, onUserDeleted }: { user: User | null; open: boolean; onOpenChange: (open: boolean) => void; onUserDeleted: () => void }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!firestore || !user) return;
    setIsDeleting(true);
    try {
      // Note: This only deletes the Firestore record.
      // Deleting from Firebase Auth is a separate, more destructive action not implemented here for safety.
      await deleteDoc(doc(firestore, 'users', user.id));

      if (auth.currentUser) {
        logAction(firestore, auth.currentUser, `Deleted user: ${user.email}`);
      }
      
      toast({ title: 'User Deleted', description: `${user.name}'s profile has been deleted.` });
      onUserDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to delete user.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  }
  
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User: {user.name}?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the user's profile data.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const [dialogState, setDialogState] = useState<{
    mode: 'view' | 'edit' | 'delete' | null;
    user: User | null;
  }>({ mode: null, user: null });
  
  const firestore = useFirestore();
  const usersCollection = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore, refreshKey]);

  const { data: users, isLoading: usersLoading } = useCollection<User>(usersCollection);

  const processedUsers = useMemo(() => {
    if (!users) return { admin: null, staff: [], regularUsers: [] };

    let admin: User | null = null;
    const staff: User[] = [];
    const regularUsers: User[] = [];

    users.forEach((userDoc) => {
      const u = {
        ...userDoc,
        role: userDoc.role || 'user'
      };

      if (u.role === 'admin') {
        admin = u;
      } else if (u.role === 'manager') {
        staff.push(u);
      } else {
        regularUsers.push(u);
      }
    });

    const term = searchTerm.toLowerCase();
    const plan = filterPlan.toLowerCase();

    const filterFn = (user: User) =>
      ((user.name && user.name.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term))) &&
      (plan === 'all' || (user.plan && user.plan.toLowerCase() === plan));

    return {
      admin: admin && filterFn(admin) ? admin : null,
      staff: staff.filter(filterFn),
      regularUsers: regularUsers.filter(filterFn),
    };

  }, [users, searchTerm, filterPlan]);

  const { admin, staff, regularUsers } = processedUsers;
  
  const handleRefresh = useCallback(() => {
    setRefreshKey(oldKey => oldKey + 1);
  }, []);

  const handleAction = (action: 'view' | 'edit' | 'delete', user: User) => {
    setDialogState({ mode: action, user });
  };
  
  const closeDialog = () => {
    setDialogState({ mode: null, user: null });
  }

  const renderTable = (userList: User[], title: string, description: string) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"><Checkbox /></TableHead>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading && refreshKey === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : userList.length > 0 ? (
                userList.map(user => <UserTableRow key={user.id} user={user} onAction={handleAction} />)
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No users found in this category.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="text-admin-muted-foreground">View, manage, and edit users.</p>
        </div>
        <div className="flex w-full md:w-auto items-center gap-2">
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-muted-foreground" />
                <Input 
                    placeholder="Search users..." 
                    className="pl-10 h-10"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className="w-[160px] h-10">
                    <SelectValue placeholder="Filter by plan" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="Free">Free</SelectItem>
                    <SelectItem value="Pro">Pro</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                </SelectContent>
            </Select>
             <AddUserDialog onUserAdded={handleRefresh} />
        </div>
      </div>
      
      <div className="space-y-8">
        {renderTable(
          [...(admin ? [admin] : []), ...staff],
          "Staff",
          "Administrators and managers of the platform."
        )}
        {renderTable(
          regularUsers,
          "Users",
          "All registered users of the platform."
        )}
      </div>

      <UserDetailsDialog
        user={dialogState.user}
        open={dialogState.mode === 'view'}
        onOpenChange={closeDialog}
      />
      <UserEditDialog
        user={dialogState.user}
        open={dialogState.mode === 'edit'}
        onOpenChange={closeDialog}
        onUserUpdated={handleRefresh}
      />
      <UserDeleteDialog
        user={dialogState.user}
        open={dialogState.mode === 'delete'}
        onOpenChange={closeDialog}
        onUserDeleted={handleRefresh}
      />
    </div>
  );
}
