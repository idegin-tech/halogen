
export async function fetchProjectData(subdomain: string, path: string, tags: string[]) {
  try {
    console.log('Fetching project data...', {
      subdomain,
      path,
      tags
    });
    
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/preview/projects/subdomain/${subdomain}?path=${path}&includeMetadata=true`;
    console.log('API TO GET PROJECT:', apiUrl);
    
    const response = await fetch(apiUrl, {
      next: { 
        revalidate: 180,
        tags 
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('API response error:', response.status, response.statusText);
      throw new Error(`Failed to fetch project data: ${response.statusText}`);
    }

    const result = await response.json();
    return result.payload;
  } catch (error) {
    console.error('Error fetching project data:', error);
    throw error;
  }
}

