export type RegistrationFields = "name" | "email" | "password" | "confirmPassword";
export type FieldErrors = Partial<Record<RegistrationFields, string>>;
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const validEmail = (email: string) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const passwordBytes = (password: string) => new TextEncoder().encode(password).length;

export function validateRegistration(input: unknown):
  | { ok: true; data: { name: string; email: string; password: string } }
  | { ok: false; errors: FieldErrors } {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const name = typeof value.name === "string" ? value.name.trim().replace(/\s+/g, " ") : "";
  const email = typeof value.email === "string" ? normalizeEmail(value.email) : "";
  const password = typeof value.password === "string" ? value.password : "";
  const errors: FieldErrors = {};
  if (name.length < 2 || name.length > 100 || /[\x00-\x1f\x7f]/.test(name)) errors.name = "Introduce un nombre de 2 a 100 caracteres.";
  if (!validEmail(email)) errors.email = "Introduce un correo electrónico válido.";
  if (password.length < 8 || passwordBytes(password) > 72 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = "Usa al menos 8 caracteres, mayúscula, minúscula y número (máximo 72 bytes).";
  }
  if (value.confirmPassword !== password) errors.confirmPassword = "Las contraseñas no coinciden.";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data: { name, email, password } };
}
