import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ title: string }> }
) {
  try {
    const { title } = await params;
    const apiUrl = process.env.NOCODB_API_URL;
    const tableId = process.env.NOCODB_TABLE_ID;
    const apiToken = process.env.NOCODB_API_TOKEN;
    
    // If no API token is provided, use mock data for testing
    if (!apiToken || apiToken === 'your_api_token_here') {
      const mockUrls = [
        {
          id: '1',
          title: 'google',
          url: 'https://www.google.com',
          description: 'Google search engine'
        },
        {
          id: '2',
          title: 'github',
          url: 'https://www.github.com',
          description: 'GitHub code hosting'
        },
        {
          id: '3',
          title: 'stackoverflow',
          url: 'https://stackoverflow.com',
          description: 'Stack Overflow Q&A'
        }
      ];
      
      const urlEntry = mockUrls.find((item) => 
        item.title.toLowerCase() === title.toLowerCase()
      );

      if (!urlEntry) {
        return NextResponse.json(
          { error: 'URL not found' },
          { status: 404 }
        );
      }

      return NextResponse.redirect(urlEntry.url, 302);
    }
    
    if (!apiUrl) {
      return NextResponse.json(
        { error: 'NocoDB API URL not configured' },
        { status: 500 }
      );
    }

    if (!tableId) {
      return NextResponse.json(
        { error: 'NocoDB Table ID not configured' },
        { status: 500 }
      );
    }

    // Construct the full API URL using the same pattern as the main API route
    const fullApiUrl = `${apiUrl}${tableId}/records?offset=0&limit=1000`;
    console.log('Making API request to:', fullApiUrl);
    console.log('Using token starting with:', apiToken.substring(0, 5) + '...');
    
    const response = await fetch(fullApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'xc-token': apiToken,
      },
    });

    if (!response.ok) {
      console.log('API Response Status:', response.status);
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

    console.log('API Response received successfully');
    const data = await response.json();
    console.log('Response data structure:', Object.keys(data));
    console.log('Total records in response:', data.list?.length || 0);
    
    // Find the URL with matching title (case-insensitive, trimmed)
    const urlEntry = data.list?.find((item: { Title?: string; title?: string; Url?: string; url?: string }) => {
      const itemTitle = (item.Title || item.title)?.toLowerCase().trim();
      const searchTitle = title.toLowerCase().trim();
      console.log(`Comparing "${itemTitle}" with "${searchTitle}"`);
      return itemTitle === searchTitle;
    });

    console.log('Found URL entry:', !!urlEntry);

    if (!urlEntry) {
      console.log('URL not found for title:', title);
      return NextResponse.json(
        { error: 'URL not found' },
        { status: 404 }
      );
    }

    const targetUrl = urlEntry.Url || urlEntry.url;
    console.log('Redirecting to:', targetUrl);
    
    // Redirect to the target URL
    return NextResponse.redirect(targetUrl, 302);
  } catch (error) {
    console.error('Error handling redirect:', error);
    return NextResponse.json(
      { error: 'Failed to process redirect' },
      { status: 500 }
    );
  }
}