
'use client';

import { usePreviewMode } from '@/hooks/usePreviewMode';
import { Button } from './ui/button';
import { Eye } from 'lucide-react';

export function PreviewBar() {
  const { exitPreviewMode } = usePreviewMode();

  return (
    <div className="bg-yellow-400 text-yellow-900 px-4 py-2 flex items-center justify-center text-sm font-semibold sticky top-0 z-[60]">
      <div className="flex items-center gap-4">
        <Eye className="h-5 w-5" />
        <p>You are currently in Preview Mode.</p>
        <Button
          onClick={exitPreviewMode}
          variant="outline"
          size="sm"
          className="bg-yellow-100/20 border-yellow-600/50 hover:bg-yellow-100/40 h-8"
        >
          Exit Preview
        </Button>
      </div>
    </div>
  );
}
