
const keys = [
  process.env.GEMINI_API_KEY,
].filter((key): key is string => !!key);

let currentKeyIndex = 0;

export function getApiKey(): string | undefined {
  return keys[currentKeyIndex];
}

export function rotateApiKey(): boolean {
  if (currentKeyIndex < keys.length - 1) {
    currentKeyIndex++;
    console.log(`Rotated to API key index: ${currentKeyIndex}`);
    return true; // Key rotated
  }
  console.warn('All API keys have been exhausted.');
  currentKeyIndex = 0; // Reset for next cycle, maybe after a delay
  return false; // No more keys to rotate to
}

export function getCurrentApiKeyIndex(): number {
  return currentKeyIndex;
}

export function getApiKeyCount(): number {
  return keys.length;
}

export function resetApiKeyIndex(): void {
  currentKeyIndex = 0;
}
