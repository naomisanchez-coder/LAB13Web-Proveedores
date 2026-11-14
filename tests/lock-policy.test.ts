import { test } from "node:test";
import assert from "node:assert/strict";
import { afterFailure, emptyAttempt, isLocked, LOCK_DURATION_MS } from "../src/lib/lock-policy";
const now=new Date('2026-11-14T12:00:00Z');
test('los cuatro primeros fallos no bloquean; el quinto bloquea 15 minutos',()=>{
  let state=emptyAttempt();
  for(let i=1;i<=5;i++){state=afterFailure(state,now);assert.equal(state.failedAttempts,i);assert.equal(isLocked(state,now),i===5);}
  assert.equal(state.lockedUntil!.getTime()-now.getTime(),15*60*1000);
});
test('los intentos durante el bloqueo no prolongan el plazo',()=>{
  const locked={failedAttempts:5,lockedUntil:new Date(now.getTime()+LOCK_DURATION_MS)};
  assert.deepEqual(afterFailure(locked,new Date(now.getTime()+1000)),locked);
});
test('al vencer exactamente el plazo se desbloquea y el siguiente fallo cuenta como primero',()=>{
  const locked={failedAttempts:5,lockedUntil:new Date(now.getTime()+LOCK_DURATION_MS)};
  const expiry=locked.lockedUntil;
  assert.equal(isLocked(locked,expiry),false);
  assert.deepEqual(afterFailure(locked,expiry),{failedAttempts:1,lockedUntil:null});
});
test('el estado de éxito deja de estar bloqueado',()=>assert.equal(isLocked(emptyAttempt(),now),false));
