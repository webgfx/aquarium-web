export async function loadShaderModule(device, pathOrUrl, label, baseUrl) {
  // Determine the full URL for the shader
  let url;
  
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    // Already an absolute URL
    url = pathOrUrl;
  } else if (baseUrl) {
    // Use provided base URL (e.g., from assets.baseUrl)
    url = new URL(pathOrUrl, baseUrl).href;
  } else {
    // Fallback: resolve relative to this module (shader-loader.js)
    url = new URL(pathOrUrl, import.meta.url).href;
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load shader from ${url}: ${response.status}`);
  }
  const code = await response.text();
  return device.createShaderModule({ label: label ?? pathOrUrl, code });
}
