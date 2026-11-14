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

## Etapa 3 — Sesión y navegación

Se conservan LogoutButton y SessionProvider de la guía, el layout de servidor,
las fuentes Geist, MyAuthApp, Dashboard, Profile, fotografía y cierre de sesión.
Se omite console.log(session) para no registrar datos personales. Se añade text-white
al encabezado negro para asegurar legibilidad y lang="es" por el idioma del contenido.
La configuración de imágenes Google se incorpora en la etapa 5, en el orden de la guía.

## Etapa 4 — Páginas

Se conservan los textos, clases Tailwind, fondos grises, tarjetas blancas y botones
mostrados por el docente. Las páginas con JSX usan .tsx y la raíz redirige a /dashboard.
Dashboard y Profile usan getServerSession(authOptions) y redirigen a /signIn si no hay usuario:
la captura importa redirect pero no lo ejecuta; se completa la comprobación para evitar
renderizar contenido privado incluso antes de incorporar el middleware.

En el login se elimina redirect:false y useRouter: según la API de NextAuth v4,
redirect:false solo aplica a Credentials y Email, no a OAuth. Google necesita navegar
al proveedor; se conserva signIn("google", { callbackUrl: "/dashboard" }).

## Etapa 5 — Protección y validación

src/middleware.ts utiliza withAuth de NextAuth v4 y la misma página /signIn que authOptions.
Se amplía matcher con /:path* para proteger también rutas descendientes. Se mantiene
middleware.ts; no hace falta proxy.ts en Next.js 15. Las dos páginas privadas verifican
además getServerSession desde el servidor. Las pruebas previas al middleware confirmaron
que esa segunda comprobación funciona de forma independiente.

next.config.ts permite exclusivamente imágenes HTTPS de lh3.googleusercontent.com mediante
remotePatterns, la alternativa actual a images.domains (obsoleto en Next.js).

### Resultados reales

- npm install: correcto, sin forzar peerDependencies.
- npm run lint: correcto, sin errores ni advertencias.
- npx tsc --noEmit: correcto.
- npm run build: correcto; genera las seis rutas de aplicación y el middleware.
- npm run start: inicia correctamente y pasa las 18 comprobaciones HTTP de test:auth.
- npm run dev: inicia con Turbopack y pasa las mismas 18 comprobaciones HTTP.
- Se verificaron redirecciones, login público, proveedor Google único, sesión anónima,
  cookies inválidas, sesiones caducadas, renderizado de nombre/correo/imagen con JWT
  firmado localmente y signout con CSRF que borra la cookie y redirige al login.
- El script no abre navegador, no contacta Google y no imprime secretos ni cookies.
  Los JWT son fixtures locales efímeros, no una autenticación Google real.
- npm audit --omit=dev: cero vulnerabilidades. npm audit completo reporta seis avisos
  moderados transitivos en la cadena @typescript-eslint/minimatch de desarrollo.
  No se forzó una actualización mayor de esa cadena para ocultarlos.
- El primer build con fuentes Geist falló por DNS dentro del sandbox. Con acceso de red
  para descargar Google Fonts pasó; los builds siguientes usaron las fuentes en caché.

Para repetir las comprobaciones, con Node 24 y .env.local configurado:

```bash
npm run build
npm run start
# En otra terminal:
npm run test:auth
```

Detener el servidor con Ctrl+C antes de cambiar entre start y dev, que usan el puerto 3000.
El build usa Webpack estable por defecto en Next.js 15; el desarrollo usa Turbopack como la guía.

### Versiones comprobadas

Node 24.21.0; npm 11.19.0; Next.js 15.5.29; NextAuth 4.24.15; React/React DOM 19.3.1;
TypeScript 5.9.3; ESLint 9.39.5; Tailwind CSS y @tailwindcss/postcss 4.3.5;
react-icons 5.7.0; PostCSS 8.5.33 (override compatible).
Las versiones resueltas quedan registradas en package-lock.json.

### Git

Se inicializó main en la raíz y se vinculó únicamente origin al repositorio solicitado.
El remoto estaba vacío, por lo que no hubo historia que integrar.
Los commits se realizan por las cinco etapas con los mensajes solicitados.
Los intentos de push fallaron por ausencia de autenticación GitHub en Git:
`could not read Username for 'https://github.com': Device not configured`.
No se modificó el remoto ni se usó force push. Tras autenticar Git localmente, ejecutar:

```bash
git push -u origin main
```

### Pruebas manuales pendientes

1. Completar el cliente OAuth y usuarios de prueba en Google Cloud, editar .env.local y reiniciar.
2. Revisar visualmente /signIn y sus estilos en escritorio y móvil.
3. Pulsar Continue with Google, completar consentimiento y comprobar el callback y /dashboard.
4. Verificar nombre, correo, fotografía real y navegación a /profile; recargar ambas páginas.
5. Cerrar sesión con el botón y comprobar el bloqueo al volver a las rutas privadas.
6. Probar la cancelación o rechazo del consentimiento de Google y volver al login.
7. Autenticar Git y publicar los cinco commits en origin/main.

No se implementaron CredentialsProvider, registro, bcrypt, bloqueo de intentos,
GitHubProvider, Prisma o base de datos; tampoco se desplegó en Vercel.

### Fuentes para las adaptaciones

La fuente principal es el PDF del docente, revisado completo con sus capturas.
Para comprobar compatibilidad y ajustes mínimos:

- https://next-auth.js.org/configuration/nextjs
- https://next-auth.js.org/getting-started/client
- https://next-auth.js.org/providers/google
- https://nextjs.org/docs/15/app/api-reference/file-conventions/middleware
- https://nextjs.org/docs/app/api-reference/components/image#remotepatterns
- https://nextjs.org/support-policy
