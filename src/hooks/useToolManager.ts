
'use client';

import { useContext, createContext } from 'react';
import { tools as masterToolList, Tool } from '@/lib/tools';

export type ManagedTool = Tool & {
  enabled: boolean;
};

export interface ToolManagerContextType {
  managedTools: ManagedTool[];
  isLoading: boolean;
  toggleToolStatus: (toolPath: string, newStatus: boolean) => Promise<void>;
}

export const ToolManagerContext = createContext<ToolManagerContextType>({
  managedTools: masterToolList.map(t => ({...t, enabled: true})),
  isLoading: true,
  toggleToolStatus: async (toolPath: string, newStatus: boolean) => {
    // This is a placeholder. The actual implementation is in the admin panel
    // where this action is performed. This prevents server-side code in a client context.
    console.warn("toggleToolStatus called from a non-admin context.");
  },
});

export function useToolManager() {
  const context = useContext(ToolManagerContext);
  if (context === undefined) {
    throw new Error('useToolManager must be used within a ToolProvider');
  }
  return context;
}
