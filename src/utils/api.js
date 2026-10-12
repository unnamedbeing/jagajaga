const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function apiRequest(path, getToken, options = {}) {
  const request = async (token) => fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let token = await getToken?.();
  if (!token) {
    throw new Error('Sign in to save routes and places.');
  }

  let response = await request(token);
  if (response.status === 401) {
    token = await getToken?.({ skipCache: true });
    if (token) {
      response = await request(token);
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(response.status === 401
      ? 'Your sign-in session is no longer valid. Sign in again and retry.'
      : body.error || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
