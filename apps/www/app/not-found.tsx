'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Page Not Found</h1>
      <p className="mb-4">The page you were looking for does not exist.</p>
      <Link href="/" className="text-primary hover:underline">
        Return to Home
      </Link>
    </div>
  );
}
