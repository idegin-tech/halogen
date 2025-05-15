import { NextRequest, NextResponse } from 'next/server';
import { cache } from 'react';

// Define the TTL for caching (24 hours in seconds)
const CACHE_TTL = 86400;

// Create a cached version of the font fetching function
const fetchGoogleFonts = cache(async () => {
  const apiKey = process.env.GOOGLE_FONTS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Fonts API key is not configured');
  }

  const url = `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`;
  const response = await fetch(url, {
    next: { revalidate: CACHE_TTL } // Use Next.js cache with revalidation
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch fonts: ${response.statusText}`);
  }

  return await response.json();
});

/**
 * Proxy API endpoint to fetch Google Fonts without exposing the API key to the client
 * Supports pagination with page and limit parameters
 */
export async function GET(request: NextRequest) {  try {
    // Check if the API key is configured
    const apiKey = process.env.GOOGLE_FONTS_API_KEY;
    if (!apiKey) {
      console.error('Google Fonts API key is not configured');
      return NextResponse.json(
        { error: 'Google Fonts API key is not configured' },
        { status: 500 }
      );
    }
    
    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const query = searchParams.get('query') || '';

    // Calculate pagination indices
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // Get all fonts from the cached function
    const data = await fetchGoogleFonts();    // Ensure data.items exists and is an array
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Invalid Google Fonts API response: missing items array');
    }
    
    // Apply filtering if there's a search query
    let filteredItems = data.items;
    if (query) {
      filteredItems = data.items.filter((item: any) => 
        item.family.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    console.log(`Fonts API: Found ${data.items.length} total fonts, ${filteredItems.length} after filtering by "${query}"`);

    // Apply pagination
    const paginatedItems = filteredItems.slice(startIndex, endIndex);
    
    // Return paginated and filtered data with metadata
    return NextResponse.json({
      items: paginatedItems,
      totalItems: filteredItems.length,
      totalPages: Math.ceil(filteredItems.length / limit),
      currentPage: page,
      hasMore: endIndex < filteredItems.length
    });
  } catch (error: any) {
    console.error('Error fetching Google Fonts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load Google Fonts' },
      { status: 500 }
    );
  }
}
