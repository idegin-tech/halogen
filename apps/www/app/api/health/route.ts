// Health check endpoint for Fly.io
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json(
    {
      status: 'UP',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
