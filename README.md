# Laboratorio 13 — Autenticación y seguridad

## 1. Descripción general

En este laboratorio implementé una aplicación con Next.js 15, TypeScript y NextAuth.js v4.
Amplié el acceso inicial con Google para incorporar registro, correo y contraseña,
bloqueo temporal y la configuración de GitHub OAuth. También rediseñé las páginas
con una interfaz clara, superficies blancas y acentos violeta e índigo.

Trabajé directamente en la raíz del repositorio y conservé los cinco commits de la
primera parte. Mantuve la arquitectura y amplié los métodos de acceso sin reemplazar
la autenticación existente.

**Estado de verificación:** confirmé el proyecto Neon `LAB13-Web-Proveedores`, las conexiones
pooled y directa y la rama principal `production`. Probé primero la migración en una rama
independiente y después la apliqué en la base principal, sin borrar datos ni insertar usuarios
ficticios. Verifiqué las tres tablas y consultas Prisma reales.

En la rama `lab13-auth-test`, base `lab13_auth_test`, comprobé registro, duplicados, bcrypt,
credenciales, JWT, bloqueo persistente, concurrencia y logout. La suite completa aprobó
39 pruebas sin omisiones y el flujo HTTP real aprobó diez comprobaciones adicionales.
Google conserva su configuración; sus flujos interactivos quedan para la comprobación manual.
GitHub todavía requiere sus credenciales OAuth. No ejecuté un despliegue.

## 2. Objetivos

- Integré diferentes métodos de acceso conservando sesiones JWT y rutas privadas.
- Preparé almacenamiento persistente para usuarios, intentos y límites de solicitudes.
- Incorporé validaciones de cliente y servidor y hash bcrypt para las contraseñas.
- Diseñé un bloqueo temporal seguro ante solicitudes concurrentes.
- Organicé una interfaz responsive y una documentación reproducible.
- Preparé la aplicación para un despliegue posterior, sin ejecutarlo.

## 3. Tecnologías utilizadas

| Tecnología | Versión comprobada | Uso |
| --- | --- | --- |
| Node.js / npm | 24.21.0 / 11.19.0 | Ejecución y dependencias |
| Next.js | 15.5.29 | App Router, servidor y middleware |
| NextAuth.js | 4.24.15 | Google, CredentialsProvider, GitHub y JWT |
| React / React DOM | 19.3.1 | Componentes e interfaces |
| TypeScript | 5.9.3 | Tipado estricto |
| Tailwind CSS | 4.3.5 | Estilos y utilidades |
| ESLint | 9.39.5 | Análisis estático |
| Prisma / Prisma Client | 6.19.3 | Esquema, migraciones y consultas PostgreSQL |
| bcrypt | 6.0.0 | Hash de contraseñas con coste 12 |
| react-icons | 5.7.0 | Iconos de la interfaz |
| PostCSS | 8.5.33 | Parche compatible para la dependencia de Next.js |

Mantuve Next.js 15 y NextAuth v4 para conservar la arquitectura y las APIs del laboratorio.
No utilicé `--force`, `--legacy-peer-deps`, NextAuth v5 ni migraciones mayores innecesarias.
Usé Turbopack en desarrollo y el build estable por defecto de Next.js 15 en producción.
Fijé Node 24 en `engines` y mantuve la misma versión de Prisma y su cliente.

## 4. Funcionalidades desarrolladas

| Funcionalidad | Implementación y comprobación |
| --- | --- |
| Google OAuth | Conservé proveedor y variables. Verifiqué su presencia por HTTP; debo repetir el flujo manual tras los cambios. |
| Registro | Comprobé por HTTP el registro persistente, la normalización, el hash bcrypt y la prevención de duplicados en la base aislada. |
| Credenciales | Comprobé el login real de NextAuth contra Neon pooled, la sesión JWT y el acceso a dashboard y perfil. También verifiqué el rechazo cuando falta la base de datos. |
| Bloqueo | Verifiqué cinco fallos, quince minutos de bloqueo, persistencia en otro proceso, concurrencia, recuperación y reinicio del contador. |
| GitHub OAuth | Preparé GitHubProvider, callback y avatar; se habilita únicamente con sus dos variables reales. |
| Rutas privadas | Conservé middleware y comprobación de sesión en cada página; verifiqué el rechazo sin sesión. |
| Dashboard y perfil | Mostré datos reales de sesión, método verificable y avatar con alternativa de iniciales. |
| Navegación | Incorporé menú móvil, enlace activo y cierre de sesión con estado de carga. |

## 5. Estructura del proyecto

```text
.
├── .env.example
├── .gitignore
├── README.md
├── next.config.ts
├── package.json / package-lock.json
├── tsconfig.json / eslint.config.mjs / postcss.config.mjs
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       ├── migration_lock.toml
│       └── 202611140001_init_auth/migration.sql
├── scripts/
│   ├── prisma.mjs
│   ├── test.mjs
│   ├── smoke-auth.mjs / smoke-credentials.mjs
│   ├── test-database-config.mjs
│   └── check-secrets.mjs
├── src/
│   ├── middleware.ts
│   ├── types/next-auth.d.ts
│   ├── app/
│   │   ├── api/auth/[...nextauth]/route.ts
│   │   ├── api/register/route.ts
│   │   ├── dashboard/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── register/page.tsx
│   │   ├── signIn/page.tsx
│   │   ├── page.tsx / layout.tsx / globals.css
│   ├── components/
│   │   ├── auth/AuthShell.tsx / FormFields.tsx
│   │   ├── LoginForm.tsx / RegisterForm.tsx
│   │   ├── Navbar.tsx / Avatar.tsx
│   │   └── LogoutButton.tsx / SessionProvider.tsx
│   └── lib/
│       ├── auth.ts / validation.ts / lock-policy.ts / session-display.ts
│       └── server/db.ts / password.ts / credentials.ts / request-security.ts
└── tests/
    ├── validation.test.ts / password.test.ts / lock-policy.test.ts
    ├── request-security.test.ts / registration.test.ts
    ├── session-claims.test.ts / github-config.test.ts / prisma-config.test.ts
    ├── database.integration.test.ts / test-database-config.test.ts
    ├── helpers/auth-worker.ts
    └── fixtures/prisma.config.mjs
```

Conservé `.env.local` fuera de Git. También excluí archivos de entorno de pruebas,
`node_modules`, `.next`, bases locales, logs, temporales y documentos académicos.

## 6. Configuración del entorno

Instalo las dependencias en la raíz con Node 24:

```bash
npm install
```

El script `postinstall` genera Prisma Client. Para una copia nueva del repositorio, creo
`.env.local` a partir de `.env.example`. Si ya existe, lo edito sin sobrescribir las credenciales.
Nunca publico ese archivo ni incluyo secretos en capturas o mensajes.

| Variable | Configuración que completo localmente |
| --- | --- |
| GOOGLE_CLIENT_ID | ID del cliente web de Google |
| GOOGLE_CLIENT_SECRET | Secreto de ese cliente |
| NEXTAUTH_URL | `http://localhost:3000` durante el desarrollo |
| NEXTAUTH_SECRET | Secreto aleatorio y estable, exclusivo del entorno |
| DATABASE_URL | Conexión PostgreSQL con pooling compatible con el proveedor |
| DIRECT_URL | Conexión directa PostgreSQL para las migraciones |
| TEST_DATABASE_URL | Solo en .env.test.local: conexión directa de la rama aislada; no se copia a producción |
| GITHUB_CLIENT_ID | ID de la OAuth App de GitHub |
| GITHUB_CLIENT_SECRET | Secreto de esa OAuth App |

Conservé intacto el secreto ya existente. En una instalación completamente nueva puedo
reemplazar el placeholder con `crypto.randomBytes(32)` escribiéndolo directamente al archivo,
sin mostrarlo en consola. No cambio el secreto al reiniciar: también se utiliza como clave HMAC
para los identificadores de seguridad. Reinicio el servidor después de editar las variables.

## 7. Configuración de Google OAuth

En Google Cloud configuro una aplicación web, la pantalla de consentimiento y, si corresponde,
mi cuenta como usuario de prueba. Utilizo exactamente:

- Origen JavaScript local: `http://localhost:3000`.
- Callback local: `http://localhost:3000/api/auth/callback/google`.

Introduzco las credenciales de mi propio cliente en `.env.local`. No reutilizo credenciales
de ejemplos públicos. Conservé Google independiente de PostgreSQL para
que la falta de conexión de las cuentas locales no elimine ese método de acceso.

## 8. Configuración de GitHub OAuth

Creo manualmente una **OAuth App** desde GitHub → Settings → Developer settings → OAuth Apps.
Configuro la página principal local como `http://localhost:3000` y el callback como:

```text
http://localhost:3000/api/auth/callback/github
```

Completo `GITHUB_CLIENT_ID` y `GITHUB_CLIENT_SECRET` en `.env.local` y reinicio.
Mientras falte alguno, el proveedor no se registra y el botón aparece deshabilitado.
La autorización de GitHub CLI para publicar commits es independiente de esta OAuth App.
Para un dominio de producción preparo una aplicación OAuth con su callback correspondiente.

## 9. Persistencia y seguridad

### Arquitectura PostgreSQL

Elegí PostgreSQL persistente y Prisma 6. Preparé tres tablas:

- `users`: identificador, nombre, correo único normalizado, hash nullable y fechas.
- `login_attempts`: identificador HMAC, fallos, fecha de desbloqueo y actualización.
- `request_limits`: identificador HMAC, contador y vencimiento de la ventana.

Las cuentas locales se guardan en `users`. No añadí un adaptador OAuth ni una vinculación por
correo: Google y GitHub mantienen identidades diferentes mediante proveedor e identificador
externo. No creo contraseñas para esas cuentas. La fecha de registro se muestra únicamente
cuando proviene de la cuenta local; no invento fechas para perfiles OAuth.

Las sesiones siguen siendo JWT. Mantuve los accesos a Prisma y bcrypt exclusivamente en el
servidor Node.js; el middleware solo verifica el JWT y no carga el cliente de base de datos.
Reutilizo una instancia de Prisma por proceso, pero todos los registros y contadores residen
en PostgreSQL, no en memoria ni en el sistema de archivos.

### Crear y migrar mi base

Conservé el proyecto Neon existente `LAB13-Web-Proveedores` y comprobé administrativamente
que las URLs locales corresponden a su rama `production`. `DATABASE_URL` usa pooling y
`DIRECT_URL` una conexión directa al mismo destino; ambas respondieron mediante consultas reales.
No cambié el plan gratuito ni contraté recursos de pago.

Creé la rama independiente `lab13-auth-test`, con cómputo mínimo y suspensión por inactividad,
y una base exclusiva llamada `lab13_auth_test`. Guardé su conexión directa únicamente en
`.env.test.local`, ignorado y con permisos privados. Conservé intacto `.env.local`.

Revisé la migración `202611140001_init_auth`: solo crea tablas, índices y restricciones.
La apliqué primero en pruebas, ejecuté la integración y después ejecuté `npm run db:migrate`
en el destino principal confirmado. Verifiqué `users`, `login_attempts`, `request_limits`
y el historial `_prisma_migrations` en ambos destinos. La migración quedó completa y no
inserté cuentas de integración en la base principal.

Para mantener el esquema utilizo:

```bash
npm run db:generate
npm run db:validate
# Siempre reviso el destino antes de aplicar migraciones pendientes:
npm run db:migrate
```

`db:migrate` utiliza `prisma migrate deploy`; no hace reset ni elimina datos. En ejecución
serverless mantengo pooling; para migraciones utilizo la conexión directa.
Los comandos de generación y validación usan una URL placeholder únicamente cuando falta
el entorno; no intentan conectarse a ella ni generan usuarios de demostración.

### Registro y contraseñas

Normalicé el correo, limité el nombre y validé la confirmación en cliente y servidor.
Exijo al menos ocho caracteres con mayúscula, minúscula y número, y un máximo de 72 bytes
UTF-8 para evitar el truncamiento silencioso de bcrypt. Guardo únicamente el hash con sal y
coste 12. No guardo la contraseña original ni su confirmación.

El índice único de correo evita duplicados también en concurrencia. Devuelvo la misma respuesta
202 al procesar un registro o encontrar una cuenta existente, sin devolver hash o usuario completo.
El formulario conduce después al inicio de sesión. Todavía no incorporé verificación de correo,
recuperación de contraseña ni vinculación manual de cuentas; no forman parte de esta implementación.

### Límites y bloqueo

- Limité el registro a cinco solicitudes válidas por origen de red y hora y tres por correo y hora.
- Limité el acceso por credenciales a veinte intentos por origen de red cada quince minutos.
- Al quinto fallo de una cuenta aplico un bloqueo de quince minutos, incluso con contraseña correcta.
- No prolongué el bloqueo con intentos adicionales. Al vencer, el siguiente fallo comienza en uno;
  una autenticación correcta restablece el contador y elimina el bloqueo.
- Serialicé los intentos de una misma cuenta con `pg_advisory_xact_lock` dentro de una transacción.
  Los incrementos del límite de solicitudes utilizan UPSERT atómico.
- Apliqué el mismo tratamiento a correos inexistentes y comparé contra un hash de respaldo para
  reducir diferencias de tiempo. No expongo existencia de cuenta, contadores ni fechas de bloqueo.

Solo confío en la cabecera de IP sanitizada por Vercel cuando `VERCEL=1`. En local y otros hosts
uso un bucket compartido para no permitir que una cabecera falsa eluda el límite. Esto significa
que varios usuarios locales comparten los límites. Para otro alojamiento debo configurar su
frontera de confianza antes de habilitar límites por IP. El bloqueo de cuenta no es la única barrera;
los límites de red lo complementan, aunque no sustituyen una protección especializada ante ataques distribuidos.

### Endpoints, sesiones y errores

Verifico el origen exacto del registro, exijo JSON y limito el cuerpo a 4096 bytes también sin
Content-Length. Devuelvo 400, 403, 413, 415, 429 o 503 según corresponda. Un servicio de cuentas
sin configuración no devuelve éxito ni crea una sesión ficticia. NextAuth conserva su comprobación
CSRF, cookies y flujo OAuth. No guardo contraseñas o sesiones en localStorage.

Protegí `/dashboard` y `/profile`, incluidas rutas descendientes, con middleware y verificación
adicional de servidor. Permití imágenes HTTPS únicamente de Google y avatares GitHub; mostré
iniciales cuando no hay fotografía o no se puede cargar.

No registro formularios, cookies, cadenas de conexión ni tokens. Conservo los códigos de diagnóstico
de NextAuth sin sus metadatos sensibles y excluí las URLs de callback del log de solicitudes de desarrollo.

## 10. Ejecución local

```bash
npm install
npm run dev
```

Abro manualmente `http://localhost:3000`. El acceso inicial redirige al dashboard y, sin sesión,
al login. Para comprobar la compilación de producción uso:

```bash
npm run build
npm run start
```

Uso un solo servidor en el puerto 3000 y detengo el anterior antes de alternar entre desarrollo
y producción. No abro el navegador desde los scripts ni tomo capturas automáticamente.

## 11. Pruebas y validaciones

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
npm run db:validate
npm run check:secrets
npm run test:db
# Requiere el build; inicia y detiene su propio servidor aislado:
npm run test:credentials
# Con un servidor local ya iniciado:
npm run test:auth
```

Resultados comprobados el 14 de noviembre de 2026:

| Comprobación | Resultado real |
| --- | --- |
| Suite completa, incluida integración PostgreSQL y guard de aislamiento | 39 pruebas aprobadas; cero fallos y cero omisiones |
| npm run test:db | Correcto contra la rama independiente; incluye un proceso nuevo y solicitudes concurrentes |
| HTTP real de credenciales sobre Neon pooled | Diez comprobaciones correctas; fixtures eliminados al terminar |
| ESLint | Sin errores ni advertencias |
| TypeScript | Sin errores |
| Build Next.js y vercel-build | Correctos, con rutas dinámicas, middleware y generación de Prisma |
| Esquema y generación de Prisma | Correctos |
| Conexiones reales pooled y directa de Neon | SELECT correcto en ambas; mismo destino y TLS |
| Migraciones y tablas de aplicación | Migración completa y tres tablas verificadas en principal y pruebas |
| HTTP local con la configuración actual | 22 comprobaciones seguras correctas |
| Revisión de secretos locales en archivos publicables e historia | Sin coincidencias detectadas |

Separé dos verificaciones HTTP. `test:auth` revisa rutas, cookies inválidas o caducadas,
CSRF, registro inválido y logout, sin registrar usuarios en la base principal. Sus JWT de
fixture comprueban renderizado, pero no acreditan un login real.

`test:credentials` inicia un servidor propio en un puerto libre con la conexión pooled de
la rama aislada. Registra una cuenta real de prueba, verifica el hash, rechaza el duplicado,
prueba cinco fallos y el bloqueo de quince minutos, adelanta únicamente el vencimiento del
fixture y completa el login real de NextAuth. Verifica el JWT emitido, dashboard, perfil
y logout. Limpia sus propios datos y detiene solo su servidor al terminar.

La verificación final encontró cero usuarios de integración restantes en ambas bases.
No probé interactivamente Google ni GitHub ni abrí un navegador.

Implementé estilos para escritorio, tablet y móvil, foco de teclado, etiquetas, mensajes accesibles
y menú responsive. Aún debo revisar visualmente esas interfaces en mi navegador; no considero
esa revisión sustituida por las pruebas HTTP.

### Pruebas PostgreSQL aisladas

Dejé configurada `TEST_DATABASE_URL` en `.env.test.local`, con la conexión directa de
`lab13_auth_test` en la rama `lab13-auth-test`. No publico esa URL ni su contraseña.

```bash
npm run test:db
npm run build
npm run test:credentials
```

El guard exige un nombre de base que empiece por `lab13` y termine en `_test`. En Neon
rechaza el endpoint de la aplicación incluso si cambia el nombre de la base o el rol,
normaliza los hosts pooled para identificar la misma rama y exige conexión directa al migrar.
Añadí pruebas específicas para evitar esas vías de confusión.

La suite aplica migraciones solo en la base de pruebas y comprueba registro, duplicados,
bcrypt, contraseña correcta e incorrecta, quinto fallo, concurrencia, persistencia en otro
proceso y recuperación. No espera quince minutos: modifica el vencimiento únicamente del
fixture aislado. El auxiliar de reinicio utiliza una función asíncrona compatible con CommonJS.

Cuando falta la variable, `test:db` termina con código 2 sin usar la base principal como
sustituto. Las pruebas unitarias de ausencia de base de datos eliminan temporalmente esa
variable solo dentro de su proceso aislado, por lo que también se ejecutan con Neon configurado.
No borré tablas, no usé reset y no ejecuté pruebas destructivas sobre producción.

### Auditoría de dependencias

Mantengo visible el resultado de `npm audit`: quedan seis hallazgos moderados en la cadena de
herramientas ESLint/TypeScript. Corregí los hallazgos altos de Prisma mediante un override
específico de `@prisma/config` a `deepmerge-ts 8.0.2`, sin migrar Prisma 6.

Revisé el consumidor: utiliza `deepmerge` para objetos de configuración, no las APIs o la mezcla
de Maps afectadas por los cambios de la versión 8. Añadí dos pruebas de regresión para mezcla,
ciclos y carga real de configuración de Prisma; también validé generación, esquema y build.
Con ese parche, `npm audit --omit=dev` reporta cero vulnerabilidades. No utilicé flags para
forzar peers ni oculté los avisos moderados restantes.

npm 11 también advierte sobre scripts de instalación sin una política allowScripts explícita.
No modifiqué políticas globales: comprobé la generación del cliente y la ejecución real de bcrypt.
ESLint 9 conserva el aviso de fin de soporte de su rama; mantuve su versión compatible con Next.js 15.

## 12. Preparación para Vercel

Preparé la generación del cliente con `postinstall` y el comando:

```bash
npm run vercel-build
```

Este comando genera Prisma y compila Next.js; no crea recursos, no ejecuta migraciones de
producción y no despliega. Antes de un despliegue posterior debo:

1. Configurar Node 24 y copiar de forma privada las variables necesarias al entorno de Vercel.
2. Apuntar a la base principal Neon ya migrada, usando pooling en DATABASE_URL y conexión directa en DIRECT_URL.
3. Configurar `NEXTAUTH_URL` con mi dominio HTTPS final y conservar un secreto seguro y estable.
4. Registrar los callbacks HTTPS de Google y GitHub en sus consolas; revisar sus usuarios de prueba.
5. Configurar como build command `npm run vercel-build` e instalar también las dependencias de build.
6. Repetir registro, login, bloqueo, logout, OAuth e inspección responsive en un entorno de pruebas.
7. Revisar los avisos de dependencias antes de habilitar producción.

No ejecuté un despliegue. La compilación local no demuestra todavía el funcionamiento remoto,
la configuración efectiva de Vercel ni los flujos interactivos OAuth tras los cambios.

## 13. Organización de Git

Conservé los cinco commits iniciales y organicé la ampliación en cambios progresivos:
persistencia, registro, credenciales, bloqueo, GitHub, interfaz de autenticación, espacio privado,
pruebas, una corrección transitiva de seguridad y documentación. Validé cada etapa antes de publicarla en `origin/main`, sin reescribir
la historia ni utilizar force push. Puedo revisar todos los hashes con `git log --oneline`.

## 14. Conclusiones y aprendizajes

- Comprendí que una sesión JWT y una cuenta persistente tienen responsabilidades diferentes.
- Aprendí a validar y normalizar datos antes de guardarlos y a respetar el límite real de bcrypt.
- Comprobé que un contador en memoria no permite un bloqueo fiable entre instancias serverless.
- Evité confundir un correo compartido con una identidad compartida entre proveedores OAuth.
- Diferencié las pruebas de lógica y HTTP de una autenticación real con base de datos y proveedores.
- Preparé una arquitectura compatible con un despliegue posterior, manteniendo explícitas las
  configuraciones y comprobaciones que todavía debo completar.

### Documentación que consulté

Consulté las referencias oficiales para resolver compatibilidad y configuración:

- [NextAuth v4 y Next.js](https://next-auth.js.org/configuration/nextjs).
- [CredentialsProvider](https://next-auth.js.org/providers/credentials).
- [Google](https://next-auth.js.org/providers/google) y [GitHub](https://next-auth.js.org/providers/github).
- [Seguridad de vinculación OAuth](https://next-auth.js.org/configuration/providers/oauth).
- [Prisma 6 en Vercel](https://docs.prisma.io/docs/orm/v6/prisma-client/deployment/serverless/deploy-to-vercel).
- [Migraciones de despliegue](https://www.prisma.io/docs/orm/v6/prisma-client/deployment/deploy-database-changes-with-prisma-migrate).
- [Cabeceras de solicitudes Vercel](https://vercel.com/docs/headers/request-headers).
- [Aviso de seguridad corregido en deepmerge-ts](https://github.com/RebeccaStevens/deepmerge-ts/security/advisories/GHSA-ggr8-5vv4-36mx).
- [Node.js en Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
