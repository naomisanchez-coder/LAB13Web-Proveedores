/**
 * Aíslo las pruebas de la aplicación y exijo una conexión directa para migraciones.
 * @param {string} testConnection
 * @param {string | undefined} applicationConnection
 */
export function validateTestDatabaseURL(testConnection, applicationConnection) {
  const message = 'TEST_DATABASE_URL debe usar una base lab13..._test exclusiva y directa; en Neon debe pertenecer a una rama distinta de la aplicación.';
  try {
    const test = new URL(testConnection);
    const application = applicationConnection ? new URL(applicationConnection) : null;
    if (!['postgresql:', 'postgres:'].includes(test.protocol) || !/^\/lab13[\w-]*_test$/.test(test.pathname)) throw new Error();
    const isNeon = test.hostname.endsWith('.neon.tech');
    if (isNeon && test.hostname.includes('-pooler.')) throw new Error();
    if (application) {
      const host = (url) => `${url.hostname.replace('-pooler.', '.')}:${url.port || '5432'}`;
      const sameEndpoint = host(test) === host(application);
      if (sameEndpoint && (isNeon || test.pathname === application.pathname)) throw new Error();
    }
  } catch { throw new Error(message); }
}
