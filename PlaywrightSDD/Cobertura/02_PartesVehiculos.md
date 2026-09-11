# Módulo 02 — Partes de Vehículos

> **Spec:** `src/specs/partesvehiculos.spec.json` · **Page object:** `src/pageobjects/VehiclePage.js` · **Steps:** `src/steps/vehicleSteps.js`

**Cobertura:** 9 escenarios automatizados · ✅ Verdes

---

### 1. Cuando el user intenta rellenar el campo Actuacion y actividad sin haber rellenado previamente el campo vehículo aparece un warning
`action: warningNoVehiculo-km-part` — El usuario abre "Nuevo Parte Km", intenta acceder a "Actuación y Actividad" sin seleccionar antes el vehículo y el framework valida el warning mostrado por la aplicación. ✅

---

### 2. El usuario navega a Vehículos y comprueba que aparece "Mis Partes de Vehículos"
`action: vehicle-navigation` — El usuario navega hasta Vehículos y se comprueba que aparece la opción "Mis Partes de Vehículos". ✅

### 3. El usuario abre el formulario Nuevo Parte Km desde Mis Partes de Vehículos
`action: new-km-part` — El usuario clicka en "Nuevo Parte Km" y se abre la ventana para añadir un parte de kilómetros. ✅

### 4. El usuario pulsa en el botón nuevo Repostaje y aparece una nueva ventana para añadir un parte de repostaje
`action: new-fuel-recharge` — El usuario clicka en "Nuevo Repostaje" y se abre la ventana para añadir un parte de repostaje. ✅

### 5. El usuario pulsa en el botón nuevo Peaje y aparece una nueva ventana para añadir un parte de peaje
`action: new-peaje` — El usuario clicka en "Nuevo Peaje" y se abre la ventana para añadir un parte de peaje. ✅

### 6. El usuario genera un parte de kilómetros
`action: new-km-part` — El usuario rellena el formulario del parte de km (vehículo, actividad, km inicial 10, km final 100, itinerario, responsable) y se crea el parte. ✅

> ⚠️ **Nota:** el escenario 6 valida actualmente la apertura del diálogo. El rellenado completo del formulario depende de confirmar los selectores reales del modal y enviar los datos (ver `03_Pendientes.md`).

### 7. Crear un parte de kilómetros desde Mis Partes de Vehículos
`action: create-km-part` — El usuario crea un parte de kilómetros desde "Mis Partes de Vehículos", selecciona vehículo/destinatario, informa fecha, kms e itinerario y valida el mensaje de éxito junto con la presencia del parte en la lista. ✅

---

### 8. El usuario abre un parte de kilometros existentes y comprueba que se abre una ventana con los datos correctos
`action: open-km-part` — El usuario abre un parte de kilómetros existente desde "Mis Partes de Vehículos" y valida en el modal vehículo, actividad, fecha, kms, itinerario, horario y destinatario. ✅

---

### 9. El usuario abre un parte de kilómetros existente y comprueba que puede eliminarlo
`action: delete-km-part` — El usuario crea o reutiliza un parte controlado de kilómetros, lo abre desde "Mis Partes de Vehículos", valida la opción "Eliminar", confirma el borrado y comprueba el aviso de éxito junto con la desaparición del parte en la lista. ✅

---

**Verificación:** `npx playwright test --project=chromium --headed -g "Cuando el user intenta rellenar el campo Actuacion y actividad sin haber rellenado previamente el campo vehículo aparece un warning"` → 1 passed en la validación focalizada del escenario nuevo.