import { loadEnv, parseAdminIds } from "@djramu/config";

const env = loadEnv();
const admins = parseAdminIds(env.ADMIN_IDS);

console.log(
  "[@djramu/api] scaffold — %s admin id(s) configured (Phase 2: HTTP + OAuth)",
  admins.length,
);
