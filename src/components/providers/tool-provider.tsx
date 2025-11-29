'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { ToolManagerContext, ManagedTool } from '@/hooks/useToolManager';
import { tools as masterToolList } from '@/lib/tools';
import { useToast } from '@/hooks/use-toast';

interface ToolSetting {
    id: string;
    enabled: boolean;
}

export function ToolProvider({ children }: { children: React.ReactNode }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const settingsCollection = useMemo(() => {
        if (!firestore) return null;
        return collection(firestore, 'tools-settings');
    }, [firestore]);

    const { data: toolSettings, isLoading: settingsLoading } = useCollection<ToolSetting>(settingsCollection as any);

    const [managedTools, setManagedTools] = useState<ManagedTool[]>(
        masterToolList.map(tool => ({ ...tool, enabled: true }))
    );

    const toggleToolStatus = async (toolPath: string, newStatus: boolean) => {
        if (!firestore) {
            toast({ title: 'Error', description: 'Firestore is not available.', variant: 'destructive' });
            return;
        }
        const docId = toolPath.replace(/\//g, '_').substring(1);
        const toolDocRef = doc(firestore, 'tools-settings', docId);

        try {
            await setDoc(toolDocRef, { enabled: newStatus }, { merge: true });
        } catch (e) {
            console.error("Failed to toggle tool status:", e);
            // Revert UI on failure
            setManagedTools(prev => prev.map(t => t.path === toolPath ? { ...t, enabled: !newStatus } : t));
            throw new Error("Failed to update tool status in Firestore.");
        }
    };

    useEffect(() => {
        if (!settingsLoading) {
            const toolsWithSettings = masterToolList.map(tool => {
                const docId = tool.path.replace(/\//g, '_').substring(1);
                const setting = toolSettings?.find(s => s.id === docId);
                return {
                    ...tool,
                    enabled: setting ? setting.enabled : true,
                };
            });
            setManagedTools(toolsWithSettings);
        }
    }, [toolSettings, settingsLoading]);

    return (
        <ToolManagerContext.Provider value={{ managedTools, isLoading: settingsLoading, toggleToolStatus }}>
            {children}
        </ToolManagerContext.Provider>
    );
}
