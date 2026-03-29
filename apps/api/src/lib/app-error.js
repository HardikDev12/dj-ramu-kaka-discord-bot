class AppError extends Error {
  /**
   * @param {number} status HTTP status
   * @param {string} code Machine-readable code
   * @param {string} message Human-readable message
   */
  constructor(status, code, message) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

module.exports = { AppError };
