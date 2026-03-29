/** @param {string[]} ids */
function parseAdminIds(ids) {
  const raw = ids || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

module.exports = { parseAdminIds };
