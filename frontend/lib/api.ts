const BASE_URL = '/api';

interface FetchOptions extends RequestInit {
  data?: any;
}

export async function apiClient(endpoint: string, { data, ...customConfig }: FetchOptions = {}) {
  const headers = new Headers(customConfig.headers);

  if (data) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    customConfig.body = JSON.stringify(data);
  }

  const config: RequestInit = {
    method: data ? 'POST' : 'GET',
    ...customConfig,
    headers,
    credentials: 'include', // Extremely important for sending cookies
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    let responseData;
    
    // Attempt to parse JSON response if exists
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (response.ok) {
      return responseData;
    }

    // Include status parsing here so errors have more context
    throw new Error(responseData?.message || `API error: ${response.status}`);
  } catch (error: any) {
    console.error(`API Client Error (${endpoint}):`, error);
    throw error; // Re-throw so caller can handle
  }
}
