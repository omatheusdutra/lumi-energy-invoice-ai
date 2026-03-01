const TAG_PATTERN = /<[^>]*>/g;
const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/g;

export function sanitizeText(input: string): string {
  return input.replace(TAG_PATTERN, '').replace(CONTROL_CHAR_PATTERN, '').trim();
}
