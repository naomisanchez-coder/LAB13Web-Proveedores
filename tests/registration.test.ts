import { test } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../src/app/api/register/route";
import { authenticateCredentials } from "../src/lib/server/credentials";
const url='http://localhost:3000/api/register';
test('el endpoint directo rechaza registros de otro origen',async()=>{
  assert.equal((await POST(new Request(url,{method:'POST',headers:{origin:'https://attacker.example'}}))).status,403);
});
test('el servidor valida el formulario sin depender de JavaScript del cliente',async()=>{
  const response=await POST(new Request(url,{method:'POST',headers:{origin:'http://localhost:3000','content-type':'application/json'},body:'{}'}));
  assert.equal(response.status,400);assert.ok((await response.json()).errors.email);
});
test('sin PostgreSQL el registro falla de forma controlada, nunca crea una cuenta ficticia', {skip:!!process.env.TEST_DATABASE_URL},async()=>{
  const response=await POST(new Request(url,{method:'POST',headers:{origin:'http://localhost:3000','content-type':'application/json'},body:JSON.stringify({name:'Test Local',email:'unit@example.test',password:'Password123',confirmPassword:'Password123'})}));
  assert.equal(response.status,503);
  const body=await response.text();assert.doesNotMatch(body,/Prisma|postgresql|passwordHash|DATABASE_URL/);
});
test('sin PostgreSQL CredentialsProvider rechaza el acceso sin generar una sesión', {skip:!!process.env.TEST_DATABASE_URL}, async()=>{
  assert.equal(await authenticateCredentials({email:'unit@example.test',password:'Password123'},new Headers()),null);
});
