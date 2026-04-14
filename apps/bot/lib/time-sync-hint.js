/**
 * Cross-platform guidance when local OS clock drifts from UTC (Discord snowflake age inflated, interaction 10062).
 * Same bot runs on Windows (dev) and Linux (e.g. Ubuntu on Oracle); keep hints in one place.
 */

/** Multiline block for startup / interaction warnings */
const TIME_SYNC_MULTILINE =
  '  • **Windows:** Settings → Time & language → Date & time → enable **Set time automatically** → **Sync now**. ' +
  'If that fails: Run `services.msc` → **Windows Time** → Start, Startup: **Automatic**; then **admin** CMD: `net start w32time` && `w32tm /resync`\n' +
  '  • **Linux (Ubuntu / Oracle VPS):** `sudo timedatectl set-ntp true` then `timedatectl status` (expect **System clock synchronized: yes**). ' +
  'If not: `sudo apt install -y chrony && sudo systemctl enable --now chrony` — ensure outbound **UDP 123** is allowed if you use a strict firewall.';

/** Short suffix for safeDefer* error logs (single line) */
const TIME_SYNC_INLINE =
  'Sync OS clock: Windows → Settings time Sync now, or admin `w32tm /resync`; Linux → `sudo timedatectl set-ntp true` or **chrony**.';

module.exports = {
  TIME_SYNC_MULTILINE,
  TIME_SYNC_INLINE,
};
