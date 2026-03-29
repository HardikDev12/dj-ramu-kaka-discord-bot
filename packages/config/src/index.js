/**
 * @param {string} name
 * @returns {string}
 */
function requireEnv(name) {
  const v = process.env[name];
  if (v === undefined || v === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

/**
 * @param {string} name
 * @param {string} [defaultValue]
 * @returns {string | undefined}
 */
function env(name, defaultValue) {
  const v = process.env[name];
  if (v === undefined || v === '') return defaultValue;
  return v;
}

module.exports = { requireEnv, env };
