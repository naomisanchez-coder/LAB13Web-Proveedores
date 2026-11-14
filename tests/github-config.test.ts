import { test } from "node:test";
import assert from "node:assert/strict";
// Placeholders exclusivos de esta prueba de configuración, sin contactar al proveedor.
process.env.GITHUB_CLIENT_ID='unit-test-placeholder';
process.env.GITHUB_CLIENT_SECRET='unit-test-placeholder';
test('activo GitHub solo con configuración completa y sin vinculación peligrosa por correo',async()=>{
  const { authOptions } = await import('../src/lib/auth');
  const provider=authOptions.providers.find(item=>item.id==='github');
  assert.ok(provider);
  assert.ok('options' in provider);
  assert.equal(provider.options?.allowDangerousEmailAccountLinking,false);
  assert.equal(authOptions.pages?.error,'/signIn');
});
