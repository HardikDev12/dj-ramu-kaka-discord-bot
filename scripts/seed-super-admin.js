const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { connect, disconnect, User } = require('@music-bot/db');

async function main() {
  const email = String(process.env.SUPER_ADMIN_EMAIL || 'valu17eraze@gmail.com').trim().toLowerCase();
  const password = String(process.env.SUPER_ADMIN_PASSWORD || '@$Ylum121001');
  const rawName = String(process.env.SUPER_ADMIN_NAME || 'Super Admin').trim();
  const nameParts = rawName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || 'Super';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Admin';
  const displayName = rawName.slice(0, 80);

  if (!email || !password) {
    throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required');
  }
  if (password.length < 8) {
    throw new Error('SUPER_ADMIN_PASSWORD must be at least 8 characters');
  }

  await connect();
  const passwordHash = await bcrypt.hash(password, 12);
  const doc = await User.findOneAndUpdate(
    { email },
    { email, passwordHash, firstName, lastName, displayName },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  console.log('[seed-super-admin] ready:', {
    id: doc._id.toString(),
    email: doc.email,
    firstName: doc.firstName,
    lastName: doc.lastName,
    displayName: doc.displayName,
  });
}

main()
  .catch((err) => {
    console.error('[seed-super-admin] failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await disconnect();
    } catch {
      /* ignore */
    }
  });
