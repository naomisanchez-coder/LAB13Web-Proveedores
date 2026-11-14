export function authProviderLabel(provider?: string): string {
  switch (provider) {
    case "google": return "Google";
    case "github": return "GitHub";
    case "credentials": return "Correo y contraseña";
    default: return "No disponible en esta sesión";
  }
}
