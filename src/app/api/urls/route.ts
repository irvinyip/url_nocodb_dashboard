import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiUrl = process.env.NOCODB_API_URL;
    const tableId = process.env.NOCODB_TABLE_ID;
    const apiToken = process.env.NOCODB_API_TOKEN;
    
    console.log('API Configuration Check:');
    console.log('- API URL exists:', !!apiUrl);
    console.log('- Table ID exists:', !!tableId);
    console.log('- API Token exists:', !!apiToken);
    console.log('- API Token length:', apiToken?.length || 0);
    console.log('- API Token starts with:', apiToken?.substring(0, 5) + '...');
    
    // If no API token is provided or it's invalid, return mock data for testing
    if (!apiToken || apiToken === 'your_api_token_here' || apiToken.length < 10) {
      console.log('Using mock data due to invalid/missing API token');
      const mockUrls = [
        {
          id: '1',
          title: 'google',
          url: 'https://www.google.com',
          description: 'Google search engine - the most popular search engine in the world'
        },
        {
          id: '2',
          title: 'github',
          url: 'https://www.github.com',
          description: 'GitHub - code hosting platform for version control and collaboration'
        },
        {
          id: '3',
          title: 'stackoverflow',
          url: 'https://stackoverflow.com',
          description: 'Stack Overflow - question and answer site for professional programmers'
        }
      ];
      
      return NextResponse.json({ urls: mockUrls });
    }
    
    // Only proceed with API call if we have a valid token and table ID
    if (!apiUrl || !tableId) {
      console.log('API URL or Table ID not configured');
      return NextResponse.json(
        { error: 'NocoDB API URL or Table ID not configured' },
        { status: 500 }
      );
    }

    // Construct the full API URL with hardcoded records endpoint
    const fullApiUrl = `${apiUrl}${tableId}/records?offset=0&limit=1000`;
    console.log('Making API request to:', fullApiUrl);
    const response = await fetch(fullApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'xc-token': apiToken,
      },
    });

    console.log('API Response Status:', response.status);
    console.log('API Response OK:', response.ok);

    if (!response.ok) {
      console.log('API request failed with status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Try to get error details from response
      let errorDetails = '';
      try {
        const errorData = await response.text();
        console.log('Error response body:', errorData);
        errorDetails = errorData;
      } catch {
        console.log('Could not parse error response');
      }
      
      throw new Error(`NocoDB API error: ${response.status} - ${errorDetails}`);
    }

    const data = await response.json();
    console.log('API Response data received:', !!data);
    
    // Transform NocoDB data to our expected format
    const urls = data.list?.map((item: { Id?: string; id?: string; Title?: string; title?: string; Url?: string; url?: string; Description?: string; description?: string }) => ({
      id: item.Id || item.id,
      title: item.Title || item.title,
      url: item.Url || item.url,
      description: item.Description || item.description,
    })) || [];

    console.log('Transformed URLs count:', urls.length);
    return NextResponse.json({ urls });
  } catch (error) {
    console.error('Error fetching NocoDB data:', error);
    
    // Even on error, fall back to mock data to keep the app functional
    console.log('Falling back to mock data due to error');
    const mockUrls = [
      {
        id: '1',
        title: 'google',
        url: 'https://www.google.com',
        description: 'Google search engine - the most popular search engine in the world'
      },
      {
        id: '2',
        title: 'github',
        url: 'https://www.github.com',
        description: 'GitHub - code hosting platform for version control and collaboration'
      },
      {
        id: '3',
        title: 'stackoverflow',
        url: 'https://stackoverflow.com',
        description: 'Stack Overflow - question and answer site for professional programmers'
      }
    ];
    
    return NextResponse.json({ urls: mockUrls });
  }
}