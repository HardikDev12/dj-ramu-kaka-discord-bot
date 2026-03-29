const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { connect, disconnect } = require('@music-bot/db');

(async () => {
  try {
    await connect();
    console.log('MongoDB: connected (INFRA-02)');
    await disconnect();
    process.exit(0);
  } catch (err) {
    console.error('MongoDB:', err.message);
    process.exit(1);
  }
})();
