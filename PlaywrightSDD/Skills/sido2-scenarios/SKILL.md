---
name: sido2-scenarios
description: Formato de los escenarios funcionales en los .spec.json de SIDO2 y cómo modelar los pasos Given/When/Then/And en el framework PlaywrightSDD. Usar cuando haya que crear o modificar un escenario en un spec, o traducir un Scenario/When/Then/And a código.
---

# Formato de los escenarios en el JSON (OBLIGATORIO)

El escenario en el `*.spec.json` debe seguir el **mismo estilo de los existentes** en
`src/specs/partesvehiculos.spec.json`: campos `name`, `action`, `when`, `then` y,
opcionalmente, `and` (pasos previos). **NO** uses un objeto `automation` de pasos
declarativos: ese estilo queda descartado. Ejemplo del formato correcto:

```json
{
  "name": "El usuario pulsa en el button nuevo Peaje y aparece una nueva ventana en la que se puede añadir un parte de peaje",
  "action": "new-peaje",
  "when": "El usuario clicka en el button \"Nuevo Peaje\"",
  "then": "Se comprueba que se abre una ventana para añadir un parte de peaje"
}
```

Reglas sobre los campos de texto:

- **`name`** → nombre funcional del escenario (coincide con el `Scenario:` de entrada).
- **`action`** → identificador corto (snake-case) que se mapea con el step en
  `src/steps/*.js` (`steps['<action>']`). Es el único campo que el runner usa para
  resolver el step.
- **`given`** → opcional, para credenciales/datos concretos del escenario.
- **`when`** → la acción que realiza el usuario, descrita en lenguaje natural
  (el `When:` de entrada).
- **`and`** → pasos previos adicionales (opcional, se puede repetir). Cada `and` describe
  una acción previa que se ejecuta antes de llegar al `then`.
- **`then`** → el resultado esperado, descrito en lenguaje natural (el `Then:` de entrada).

Los campos `when`/`and`/`then` son **solo documentación funcional humana**. El **código real**
(clicks, descripciones de botones, asserts, rellenados de formulario) se implementa en los
**steps** (`src/steps/*.js`) y los **page objects** (`src/pageobjects/*.js`), y se asocia al
escenario a través de su `action`. Consulta `src/specs/partesvehiculos.spec.json` y
`src/steps/vehicleSteps.js` como referencia de este patrón.

## Traducción entrada → spec

| Entrada del usuario | Campo del spec |
|---------------------|----------------|
| `Scenario:`         | `name`         |
| `When:`             | `when`         |
| `And:` (k veces)    | `and` (array, opcional) |
| `Then:`             | `then`         |

Si el escenario trae credenciales, colócalas en `given`:

```json
{
  "name": "...",
  "action": "...",
  "given": { "username": "hmonreal", "password": "test" },
  "when": "...",
  "and": ["...", "..."],
  "then": "..."
}
```