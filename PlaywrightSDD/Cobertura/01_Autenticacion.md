# Módulo 01 — Autenticación SIDO2

> **Spec:** `src/specs/login.spec.json` · **Page object:** `src/pageobjects/LoginPage.js` · **Steps:** `src/steps/authSteps.js`

**Cobertura:** 4 escenarios automatizados · ✅ Verdes

---

### 1. El usuario navega correctamente a SIDO2
`action: login` — El usuario inicia sesión con sus credenciales y llega a la pantalla de home. ✅

### 2. El usuario se desloguea correctamente de SIDO2
`action: logout` — El usuario inicia sesión, pulsa el botón de logout y vuelve a la pantalla de login. ✅

### 3. El usuario intenta loguearse con credenciales inválidas
`action: logout-invalid` — El usuario introduce credenciales inválidas y se muestra el mensaje "Usuario y contraseña no válidos". ✅

### 4. El usuario intenta loguearse sin contraseña y se marca el campo en rojo
`action: missing-password` — El usuario inicia sesión sin contraseña y el campo se marca como inválido. ✅

---

**Verificación:** `npx playwright test tests/login.spec.js --project=chromium` → 4 passed.