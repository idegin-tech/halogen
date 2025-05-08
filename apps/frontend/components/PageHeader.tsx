'use client';

import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  rightContent?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, rightContent, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      
      {rightContent && (
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {rightContent}
        </div>
      )}
    </div>
  );
}