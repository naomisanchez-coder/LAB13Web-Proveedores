# Laboratorio 13 — Autenticación y seguridad

Primera parte de la guía TECSUP: Next.js con Google OAuth y NextAuth.js v4.
El PDF proporcionado tiene 13 páginas; la TAREA comienza en la página 12 y queda fuera del alcance.

## Etapa 1 — Configuración

Proyecto inicializado directamente en la raíz, con TypeScript estricto, ESLint 9,
Tailwind CSS 4, App Router, estructura src y Turbopack en desarrollo.
Se reproduce la configuración de create-next-app sin crear otra carpeta ni un commit automático.
Next.js 15.5.29 conserva middleware.ts; NextAuth 4.24.15 y React 19 son compatibles
según los peerDependencies del registro npm. No se usó --force ni --legacy-peer-deps.

```bash
npm install
npm run dev
```

Los documentos académicos, variables locales y archivos generados quedan fuera de Git.

Adaptación de seguridad: se fija PostCSS 8.5.33 dentro de Next.js mediante overrides,
un parche del mismo major compatible, por los avisos de seguridad de la versión transitiva.
ESLint 9 se conserva por compatibilidad con eslint-config-next 15 (npm avisa su fin de soporte).
