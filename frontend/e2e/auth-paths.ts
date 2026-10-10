import path from "node:path";

/** Where auth.setup.ts saves the live sessions (gitignored: real refresh tokens). */
export const AUTH_DIR = path.join(__dirname, "..", "playwright", ".auth");
export const USER_STATE = path.join(AUTH_DIR, "user.json");
export const ADMIN_STATE = path.join(AUTH_DIR, "admin.json");
