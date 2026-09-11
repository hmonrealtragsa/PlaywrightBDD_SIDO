---
name: sido2-scenario-builder
description: Convierte una descripción funcional del usuario (JSON, objeto o texto natural) al formato exacto que usan los escenarios de PlaywrightSDD en src/specs/*.spec.json. Usar cuando el usuario entregue un escenario sin normalizar, con un formato libre o parcialmente estructurado.
---

# Objetivo

Transforma la entrada del usuario a un escenario compatible con la convención del framework
`PlaywrightSDD`:

```json
{
  "name": "El usuario pulsa en el button nuevo Peaje y aparece una nueva ventana en la que se puede añadir un parte de peaje",
  "action": "new-peaje",
  "when": "El usuario clicka en el button \"Nuevo Peaje\"",
  "then": "Se comprueba que se abre una ventana para añadir un parte de peaje"
}
```

La salida debe ser un objeto JSON limpio, con los campos mínimos necesarios y siguiendo el
patrón de los specs existentes.

## Entrada que puede recibir

Acepta cualquiera de estas variantes:

1. JSON ya estructurado:
   ```json
   {
     "name": "El usuario pulsa en el button nuevo Repostaje y aparece una nueva ventana",
     "action": "new-fuel-recharge",
     "when": "El usuario accede a Vehículos > Nuevo repostaje",
     "then": "Se comprueba que se abre una ventana para añadir un parte de repostaje"
   }
   ```

2. Objeto en lenguaje natural:
   ```text
   Scenario: El usuario pulsa en el button nuevo Repostaje y aparece una nueva ventana
   When: El usuario accede a Vehículos > Nuevo repostaje
   Then: Se comprueba que se abre una ventana para añadir un parte de repostaje
   ```

3. Descripción libre del usuario:
   ```text
   Quiero automatizar que al crear un repostaje se muestre correctamente en el calendario.
   ```

## Regla de salida obligatoria

Devuelve siempre un escenario con esta estructura mínima:

```json
{
  "name": "<descripción funcional completa>",
  "action": "<identificador-kebab-case>",
  "when": "<acción realizada por el usuario>",
  "then": "<resultado esperado>"
}
```

Campos opcionales solo si aportan valor real:

- `given`: datos concretos del escenario (usuario, vehículo, importe, fechas, etc.)
- `and`: array de pasos previos adicionales cuando el flujo tenga varios pasos previos

## Cómo transformar la información

### 1) `name`

Usa la descripción del caso de negocio en lenguaje natural, con continuidad y sin inventar
terminología técnica que el usuario no haya dicho.

- Buen ejemplo: `El usuario pulsa en el button nuevo Repostaje y aparece una nueva ventana`
- No conviertas a un formato técnico por defecto si el usuario ya lo expresó funcionalmente.

### 2) `action`

Genera un identificador corto, legible y estable en kebab-case a partir del nombre del caso.

Reglas:

- minúsculas
- sin tildes ni caracteres raros
- reemplaza espacios por `-`
- usa verbos y sustantivos clave del flujo
- debe ser estable y reutilizable en `src/steps/*.js`

Ejemplos:

- `El usuario pulsa en el button nuevo Repostaje` → `new-fuel-recharge`
- `El usuario pulsa en el button nuevo Peaje` → `new-peaje`
- `El usuario visualiza el calendario de vehículos` → `view-vehicle-calendar`

### 3) `when`

Escribe la acción del usuario en estilo funcional, idéntico a los `when` del repo:

- preferible: `El usuario accede a Vehículos > Nuevo repostaje > completa los datos obligatorios`
- no usar `click` a menos que sea literal y necesario
- si el usuario dio varios pasos, agrúpalos en una sola cadena narrativa

### 4) `then`

Escribe el resultado esperado del escenario en lenguaje natural y verificable.

- preferible: `El parte de nuevo repostaje se crea correctamente y aparece en el calendario`
- debe describir un criterio verificable, no la implementación técnica

### 5) `and`

Usa `and` solo cuando existan pasos previos adicionales que no formen parte del `when` principal,
por ejemplo:

```json
{
  "name": "El usuario pulsa en el button nuevo Repostaje y aparece una nueva ventana",
  "action": "new-fuel-recharge",
  "when": "El usuario accede a Vehículos > Nuevo repostaje",
  "and": [
    "El usuario intenta abrir el formulario de repostaje",
    "El usuario comprueba que el modal se visualiza correctamente"
  ],
  "then": "Se comprueba que se abre una ventana para añadir un parte de repostaje"
}
```

### 6) `given`

Usa `given` solo cuando el escenario requiera datos concretos o una precondición de entorno,
por ejemplo:

```json
{
  "given": {
    "vehicle": "Vehículo de prueba",
    "fuel": "Gasolina",
    "paymentMethod": "Medio propio"
  }
}
```

No uses `given` para información que no sea un dato del caso de prueba.

## Reglas de calidad

1. Mantén el mismo estilo que los specs actuales: campos en minúsculas y strings en lenguaje
   natural.
2. No añadas un campo `automation` ni objetos declarativos de pasos.
3. No conviertas un `then` en un detalle técnico de UI o de implementación.
4. Si faltan detalles, conserva lo que sí está definido y deja espacios vacíos solo cuando no
   haya forma fiable de inferir la intención del usuario.
5. El resultado debe ser inmediatamente utilizable por `feature-runner.js` y por el paso del
   agent que luego implementará el código real.

## Ejemplos de transformación

### Caso 1: entrada JSON parcial

Entrada:
```json
{
  "name": "El usuario pulsa en el button nuevo Repostaje y aparece una nueva ventana",
  "when": "El usuario accede a Vehículos > Nuevo repostaje",
  "then": "Se comprueba que se abre una ventana para añadir un parte de repostaje"
}
```

Salida recomendada:
```json
{
  "name": "El usuario pulsa en el button nuevo Repostaje y aparece una nueva ventana",
  "action": "new-fuel-recharge",
  "when": "El usuario accede a Vehículos > Nuevo repostaje",
  "then": "Se comprueba que se abre una ventana para añadir un parte de repostaje"
}
```

### Caso 2: entrada en texto natural

Entrada:
```text
Scenario: El usuario pulsa en el button nuevo Peaje y aparece una nueva ventana en la que se puede añadir un parte de peaje
When: El usuario clicka en el button "Nuevo Peaje"
Then: Se comprueba que se abre una ventana para añadir un parte de peaje
```

Salida:
```json
{
  "name": "El usuario pulsa en el button nuevo Peaje y aparece una nueva ventana en la que se puede añadir un parte de peaje",
  "action": "new-peaje",
  "when": "El usuario clicka en el button \"Nuevo Peaje\"",
  "then": "Se comprueba que se abre una ventana para añadir un parte de peaje"
}
```

## Criterio de validación final

Antes de devolver el resultado final, comprueba que:

- `name` es la descripción funcional del caso
- `action` es un identificador kebab-case único y consistente
- `when` describe la acción del usuario
- `then` describe el resultado esperado
- no hay campos extra fuera del patrón del repo

Si el usuario ha dado una entrada suelta o incompleta, normaliza solo la información que sí es
confiable; no inventes datos de negocio que no se le hayan indicado.
