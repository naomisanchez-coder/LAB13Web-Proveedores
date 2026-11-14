import { test } from "node:test";
import assert from "node:assert/strict";
import { loadConfigFromFile } from "@prisma/config";
import { deepmerge } from "deepmerge-ts";

test('el parche deepmerge conserva la mezcla de objetos y tolera ciclos sin agotar la pila',()=>{
  assert.deepEqual(deepmerge({migrations:{path:'prisma/migrations'},flags:{safe:true}},{flags:{enabled:true}}),{migrations:{path:'prisma/migrations'},flags:{safe:true,enabled:true}});
  const left: {self?:unknown}={};left.self=left;
  const right: {self?:unknown}={};right.self=right;
  assert.doesNotThrow(()=>deepmerge(left,right));
});
test('Prisma 6 carga su configuración real mediante el merger corregido',async()=>{
  const result=await loadConfigFromFile({configFile:'tests/fixtures/prisma.config.mjs',configRoot:process.cwd()});
  assert.ok('config' in result && result.config);
  assert.match(result.config.schema ?? '', /prisma[/\\]schema\.prisma$/);
});
