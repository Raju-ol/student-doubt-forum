export const API_ROOT = import.meta.env.VITE_API_URL || '/api/v1';
export async function api(route, { method = 'GET', body, token, signal } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  let response;
  try { response = await fetch(API_ROOT + route, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined, signal }); }
  catch (error) { if (error.name === 'AbortError') throw error; throw new Error('Cannot reach the server. Check your connection and try again.'); }
  const result = await response.json().catch(() => ({ message: 'The server returned an unexpected response.' }));
  if (!response.ok || !result.success) { const error = new Error(result.message || 'Request failed.'); error.status = response.status; throw error; }
  return result.data;
}
