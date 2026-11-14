import { test } from "node:test";
import assert from "node:assert/strict";
import { validateTestDatabaseURL } from "../scripts/test-database-config.mjs";
// URLs ficticias solo para comprobar el guard; nunca se usan para conectar.
const app='postgresql://fixture:fixture@ep-main.example.neon.tech/neondb';
test('rechazo la rama principal aunque se cambie el nombre de la base o el rol',()=>{
  assert.throws(()=>validateTestDatabaseURL('postgresql://other:fixture@ep-main.example.neon.tech/lab13_auth_test',app));
});
test('normalizo el hostname pooled para detectar la misma rama',()=>{
  assert.throws(()=>validateTestDatabaseURL('postgresql://fixture:fixture@ep-main.example.neon.tech/lab13_auth_test',app.replace('ep-main.','ep-main-pooler.')));
});
test('exijo conexión directa y nombre de pruebas antes de migrar',()=>{
  assert.throws(()=>validateTestDatabaseURL('postgresql://fixture:fixture@ep-test-pooler.example.neon.tech/lab13_auth_test',app));
  assert.throws(()=>validateTestDatabaseURL('postgresql://fixture:fixture@ep-test.example.neon.tech/neondb',app));
});
test('acepto una rama Neon independiente y una base de pruebas local distinta',()=>{
  assert.doesNotThrow(()=>validateTestDatabaseURL('postgresql://fixture:fixture@ep-test.example.neon.tech/lab13_auth_test',app));
  assert.doesNotThrow(()=>validateTestDatabaseURL('postgresql://fixture:fixture@localhost/lab13_auth_test','postgresql://fixture:fixture@localhost/lab13_main'));
});
