/**
 * Path configuration for the WebGPU Aquarium
 * This file resolves the base paths for assets and shaders so the aquarium
 * can work from any location on your web server.
 */

// Get the directory containing this script
const scriptUrl = new URL(import.meta.url);
export const AQUARIUM_BASE = new URL('./', scriptUrl).href;
export const CORE_BASE = new URL('../core/', scriptUrl).href;

/**
 * Resolve a path relative to the aquarium folder
 */
export function resolveAquariumPath(path) {
  return new URL(path, AQUARIUM_BASE).href;
}

/**
 * Resolve a path relative to the core folder
 */
export function resolveCorePath(path) {
  return new URL(path, CORE_BASE).href;
}
