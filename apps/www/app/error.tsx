'use client';

import React from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Something went wrong</h1>
      <p className="mb-4">We encountered an error while loading this page.</p>
      <div className="flex gap-4">        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded"
        >
          Try again
        </button>
        <Link href="/" className="px-4 py-2 border rounded">
          Return Home
        </Link>
      </div>
    </div>
  );
}
