// Utility functions for API calls

export async function fetchProjectData(subdomain: string, path: string, tags: string[]) {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/preview/projects/subdomain/${subdomain}?path=${path}`;
    const response = await fetch(apiUrl, {
      next: { 
        revalidate: 180, // Revalidate every 3 minutes
        tags
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch project data: ${response.statusText}`);
    }

    const result = await response.json();
    return result.payload;
  } catch (error) {
    console.error('Error fetching project data:', error);
    throw error;
  }
}

