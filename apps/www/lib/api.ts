// Utility functions for API calls

export async function fetchProjectData(subdomain: string, path: string = '/') {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/preview/projects/subdomain/${subdomain}?path=${path}`;
    const response = await fetch(apiUrl, {
      next: { 
        revalidate: 180, // Revalidate every 3 minutes
        tags: [`subdomain-${subdomain}`, `path-${subdomain}-${path}`], // Tags for precise invalidation
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

// This function is no longer used as we're calling fetchProjectData directly
// Keeping for reference in case it's needed elsewhere
/*
export async function getProjectVariables(subdomain: string) {
  try {
    // Get project data from the API with variables included
    const projectData = await fetchProjectData(subdomain);
    
    if (!projectData || !projectData.variables) {
      console.warn('Project data or variables not found for subdomain:', subdomain);
    }
    
    return projectData?.variables || [];
  } catch (error) {
    console.error('Error fetching project variables:', error);
    return [];
  }
}
*/
