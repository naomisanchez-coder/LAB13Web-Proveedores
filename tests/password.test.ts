import { test } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import { BCRYPT_COST, hashPassword, verifyPassword } from "../src/lib/server/password";
test('bcrypt genera hash con sal y coste 12; comprueba contraseña correcta e incorrecta',async()=>{
  const password='OnlyForLocalTest123';
  const [one,two]=await Promise.all([hashPassword(password),hashPassword(password)]);
  assert.notEqual(one,password); assert.notEqual(one,two);
  assert.equal(bcrypt.getRounds(one),BCRYPT_COST); assert.equal(BCRYPT_COST,12);
  assert.equal(await verifyPassword(password,one),true);
  assert.equal(await verifyPassword('WrongLocalTest123',one),false);
});
