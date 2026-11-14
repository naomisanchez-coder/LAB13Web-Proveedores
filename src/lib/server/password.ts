import "server-only";
import bcrypt from "bcrypt";
export const BCRYPT_COST = 12;
export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_COST);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);
