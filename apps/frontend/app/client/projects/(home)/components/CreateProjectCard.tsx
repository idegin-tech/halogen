'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PlusIcon } from 'lucide-react';

interface CreateProjectCardProps {
  onClick: () => void;
}

export function CreateProjectCard({ onClick }: CreateProjectCardProps) {
  return (
    <Card 
      className="overflow-hidden border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center"
      onClick={onClick}
    >
      <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full">
        <div className="rounded-full bg-primary/10 p-3 mb-4">
          <PlusIcon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium">Create New Project</h3>
        <p className="text-sm text-muted-foreground">Start building your new website</p>
      </CardContent>
    </Card>
  );
}