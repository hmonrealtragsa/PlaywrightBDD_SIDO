# Módulo 03 — Home SIDO2

> **Spec:** `src/specs/home.spec.json` · **Page object:** `src/pageobjects/HomePage.js` · **Steps:** `src/steps/homeSteps.js`

**Cobertura:** 7 escenarios automatizados · ✅ Verdes

---

### 1. El usuario abre el cuadrante mensual del mes actual
`action: open-current-month-quadrant` — El usuario inicia sesión, pulsa el botón "Abrir Cuadrante" del mes actual y se valida que se abre el diálogo de cuadrante mensual. ✅

### 2. El usuario abre Horario Jornada desde el cuadrante mensual del mes actual
`action: open-current-month-workday-schedule` — El usuario inicia sesión, abre el cuadrante mensual del mes actual, pulsa la opción "Horario Jornada" y se valida el texto "Jornada realizada según los fichajes". ✅

### 3. El usuario crea una nueva actuación desde el cuadrante mensual del mes actual
`action: create-current-month-actuation` — El usuario inicia sesión, abre el cuadrante mensual del mes actual, pulsa "Nueva Actuación", selecciona "Todas", marca la primera actuación disponible para alta, confirma y se valida que la actuación aparece en "Detalle por Actuación". ✅

### 4. El usuario avanza los meses visibles de la home pulsando en el botón siguiente
`action: advance-home-months` — El usuario inicia sesión, navega por el carrusel de meses con el botón siguiente y se comprueba que los meses visibles avanzan correctamente. ✅

### 5. El usuario retrocede los meses visibles de la home pulsando en el botón anterior
`action: go-back-home-months` — El usuario inicia sesión, navega por el carrusel de meses con el botón anterior y se comprueba que los meses visibles retroceden correctamente. ✅

### 6. El usuario abre la información de usuario desde la home
`action: open-user-info-drawer` — El usuario inicia sesión, abre la ficha lateral de usuario desde la home y se valida la información principal mostrada. ✅

### 7. El usuario abre el cuadrante mensual desde la ficha de usuario en home
`action: open-user-monthly-quadrant-from-drawer` — El usuario inicia sesión, abre la ficha de usuario, pulsa el icono de calendario y se comprueba que se abre el cuadrante mensual del usuario. ✅

---

**Verificación:** `npx playwright test tests/home.spec.js --project=chromium --headed` → 7 passed.
