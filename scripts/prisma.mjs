import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const args = process.argv.slice(2);
const offline = ["generate", "validate", "format"].includes(args[0]);
if (offline) {
  // Solo generación/validación de esquema, sin conectar a una base de datos ficticia.
  process.env.DATABASE_URL ||= "postgresql://placeholder:placeholder@localhost:5432/not_connected";
  process.env.DIRECT_URL ||= process.env.DATABASE_URL;
} else if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
  console.error("Configura DATABASE_URL y DIRECT_URL de PostgreSQL antes de ejecutar migraciones.");
  process.exit(1);
}
const result = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", ...args], {
  stdio: "inherit", env: process.env,
});
process.exit(result.status ?? 1);
