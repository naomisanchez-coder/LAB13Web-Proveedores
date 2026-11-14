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

## Etapa 2 — Google OAuth

El Route Handler conserva NextAuth(authOptions), GoogleProvider y las exportaciones GET/POST.
Se mueve authOptions a src/lib/auth.ts porque App Router limita las exportaciones de route.ts.
Se declara la estrategia JWT, compatible con el middleware v4 y sin base de datos.
La página personalizada /signIn se configura en NextAuth y se replicará en el middleware.

En Google Cloud, crear un proyecto, configurar la pantalla de consentimiento y crear
un cliente OAuth de tipo **Aplicación web**. Si está en modo de prueba, agregar tu cuenta
como usuario de prueba. Configurar exactamente:

- Origen JavaScript: http://localhost:3000
- URI de redirección: http://localhost:3000/api/auth/callback/google

Editar .env.local localmente y completar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET
con los valores de tu propio cliente. Mantener NEXTAUTH_URL=http://localhost:3000.
NEXTAUTH_SECRET ya se generó mediante crypto.randomBytes(32) y nunca se imprime.
No copiar las credenciales ni el secreto que aparecen en las capturas docentes.
Reiniciar npm run dev después de cambiar el entorno. No publicar .env.local ni pegarlo en el chat.
.env.example contiene únicamente placeholders.
