export async function getJson(url, { timeoutMs = 10000 } = {}) {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP request failed: ${response.status}`);
  return response.json();
}
