---
name: sido2-framework
description: Arquitectura y convenciones del framework de automatización PlaywrightSDD de SIDO2. Usar cuando haya que escribir, modificar o entender código dentro del framework (page objects, steps, specs, tests, feature-runner, configuración).
---

# Arquitectura del framework (PlaywrightSDD)

Documenta cómo está organizado el framework para escribir código que encaje con el patrón
SDD existente.

## Árbol del framework

- `src/config/env.js` → variables de entorno (`SIDO2_BASE_URL`, `SIDO2_USERNAME`, `SIDO2_PASSWORD`).
- `src/pageobjects/*.js` → **Page Objects** que encapsulan la UI y sus locators.
- `src/steps/*.js` → **steps** reutilizables (flujos compuestos) por feature. Cada step se
  registra bajo una clave igual al `action` del escenario (`createVehicleSteps()` devuelve
  un objeto `{ 'action-name': async (pageObject, scenario) => {...} }`).
- `src/specs/*.spec.json` → **fuente de verdad** por feature: lista de `scenarios` con
  `name`, `action`, y opcionalmente `given`, `when`, `and` y `then`.
- `tests/*.spec.js` → registran un feature con `registerFeatureTests(...)`.
- `tests/feature-runner.js` → motor que ejecuta los escenarios.

## Cómo se ejecuta un escenario (prioridad del runner)

En `feature-runner.js`, `registerFeatureTests` resuelve cada escenario así:

1. Si existe el `step` mapeado por `action` (`steps[scenario.action]`), lo ejecuta
   pasándole `(pageObject, scenario)`.
2. Si hay `scenario.when`/`scenario.then` y no hay step mapeado, usa el fallback
   `runStructuredScenarioFallback` (mecanismo por texto).
3. Si no hay nada, lanza error.

Por tanto, para un escenario nuevo el trabajo es: **crear/actualizar el step en
`src/steps/*.js` bajo la clave `scenario.action`** y, dentro de él, orquestar la ejecución
de los page objects (login → navegación → click → assert).

## Convenciones de código del proyecto

- **JavaScript (CommonJS)**, no TypeScript. Usa `require`/`module.exports`.
- Los page objects extienden `LoginPage` cuando el flujo requiere login/sesión
  (ver `VehiclePage extends LoginPage`).
- Usa `await expect(locator).toBeVisible({ timeout: 15000 })` para las aserciones.
- Espera con `waitFor({ state: 'visible', timeout: 15000 })` y `waitForLoadState('networkidle')`.
- Credenciales: usa las de `src/config/env.js` (`SIDO2_USERNAME`, `SIDO2_PASSWORD`), con
  fallback si el scenario trae las suyas en `given`.
- No añadas comentarios salvo que ayuden a entender un selector complejo.
- Mantén `module.exports` al final de cada archivo.

## Cómo se estructura un step

Un step recibe `(pageObject, scenario)` y debe implementar el `when`/`and` (acciones) y
comprobar el `then` (aserciones):

```js
'new-peaje': async (loginPage, scenario) => {
  const username = scenario?.given?.username || SIDO2_USERNAME;
  const password = scenario?.given?.password || SIDO2_PASSWORD;
  await doNewPeajeFlow(loginPage, username, password);  // login → navegación → click → assert
},
```

## Registrar un test nuevo

Si un escenario nuevo necesita su propio fichero de test:

```js
// tests/<feature>.spec.js
const { registerFeatureTests } = require('./feature-runner');
const { createVehicleSteps } = require('../src/steps/vehicleSteps');
registerFeatureTests('<feature>.spec.json', createVehicleSteps(), VehiclePage);
```

Añade también un script en `package.json` siguiendo el patrón de `test:vehiculos`:

```json
"test:<feature>": "npx playwright test tests/<feature>.spec.js --project=chromium"
```