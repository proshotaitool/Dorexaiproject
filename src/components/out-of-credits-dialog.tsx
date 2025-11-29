
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { Gem, Timer } from "lucide-react";

interface OutOfCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OutOfCreditsDialog({ open, onOpenChange }: OutOfCreditsDialogProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push('/pricing');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
              <Gem className="h-16 w-16 text-primary animate-pulse"/>
          </div>
          <AlertDialogTitle className="text-center text-2xl">You've run out of credits!</AlertDialogTitle>
          <AlertDialogDescription className="text-center pt-2">
            You receive 100 free credits every day. To continue using our tools without limits, please upgrade your plan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
          <Button onClick={handleUpgrade} className="w-full h-12">
            <Gem className="mr-2" /> Upgrade to Pro
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            <Timer className="mr-2" /> Wait for Tomorrow
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
