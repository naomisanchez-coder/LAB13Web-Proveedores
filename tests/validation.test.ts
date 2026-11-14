import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeEmail, validateRegistration } from "../src/lib/validation";
const valid = { name: 'Ana Sánchez', email: ' ANA@EXAMPLE.TEST ', password: 'Password123', confirmPassword: 'Password123' };
test('normalizo el correo y devuelvo únicamente datos permitidos', () => {
  assert.equal(normalizeEmail(valid.email),'ana@example.test');
  const result = validateRegistration({ ...valid, role:'admin', passwordHash:'injected' });
  assert.ok(result.ok);
  assert.deepEqual(Object.keys(result.data).sort(),['email','name','password']);
  assert.equal(result.data.email,'ana@example.test');
});
for (const [name, input] of [
  ['payload ausente',null], ['tipos incorrectos',{name:1,email:[],password:{}}],
  ['nombre demasiado corto',{...valid,name:'A'}], ['nombre demasiado largo',{...valid,name:'a'.repeat(101)}],
  ['correo inválido',{...valid,email:'sin-arroba'}], ['contraseña corta',{...valid,password:'Aa12345',confirmPassword:'Aa12345'}],
  ['sin mayúscula',{...valid,password:'password123',confirmPassword:'password123'}],
  ['sin número',{...valid,password:'PasswordABC',confirmPassword:'PasswordABC'}],
  ['confirmación distinta',{...valid,confirmPassword:'OtraPassword123'}],
  ['más de 72 bytes UTF-8',{...valid,password:'Aa1'+'é'.repeat(35),confirmPassword:'Aa1'+'é'.repeat(35)}],
] as const) test(`rechazo ${name}`,()=>assert.equal(validateRegistration(input).ok,false));
test('acepto el límite de 72 bytes sin truncamiento',()=>{
  const password='Aa1'+'x'.repeat(69);
  assert.equal(validateRegistration({...valid,password,confirmPassword:password}).ok,true);
});
