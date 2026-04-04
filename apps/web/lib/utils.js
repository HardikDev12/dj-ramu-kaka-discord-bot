/**
 * Join class names (no clsx/tailwind-merge — avoids webpack `__webpack_require__.n` issues in some Next 14 builds).
 * @param {(string | undefined | null | false)[]} parts
 */
export function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}
