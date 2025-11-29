
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AuditLog {
    id: string;
    userId: string;
    userEmail: string;
    action: string;
    timestamp: any;
}

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const firestore = useFirestore();
  
  const logsCollection = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'audit-logs'), orderBy('timestamp', 'desc'));
  }, [firestore]);

  const { data: logs, isLoading } = useCollection<AuditLog>(logsCollection);

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    if (!searchTerm) return logs;
    return logs.filter(log =>
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [logs, searchTerm]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <p className="text-admin-muted-foreground">Track all administrative actions performed.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            A log of all changes made by administrators.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-muted-foreground" />
              <Input 
                placeholder="Search logs by user email or action..."
                className="pl-10 h-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead className="text-right">Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : filteredLogs.length > 0 ? (
                           filteredLogs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{log.userEmail.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{log.userEmail}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{log.action}</TableCell>
                                    <TableCell className="text-right text-admin-muted-foreground">
                                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'N/A'}
                                    </TableCell>
                                </TableRow>
                           ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                   No logs found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
