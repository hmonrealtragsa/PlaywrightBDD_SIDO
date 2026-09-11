---
name: sido2-locators
description: Mejores prácticas para elegir y capturar locators de Playwright en la aplicación SIDO2 (Angular/PrimeNG). Usar cuando haya que definir, validar o corregir selectores/locators de elementos de la UI.
---

# Mejores prácticas para los locators (OBLIGATORIO)

Orden de preferencia (de más a menos robusto):

1. **Role + nombre accesible**: `page.getByRole('button', { name: 'Nuevo Repostaje' })`.
2. **Label accesible**: `page.getByLabel('Kilómetro inicial')` para campos de formulario.
3. **Placeholder exacto**: `page.getByPlaceholder('Contraseña', { exact: true })`.
4. **Texto visible**: `page.getByText('Parte de Repostaje', { exact: false })`.
5. **Atributo semántico estable**: `[formcontrolname="usuario"]`, `[data-testid="x"]`,
   `[name="x"]`, `[aria-label="x"]`.
6. **CSS simple** solo como último recurso, y siempre evitando selectores frágiles
   (índices, clases generadas tipo `ng-star-inserted`, estilos volátiles).

## En aplicaciones Angular / PrimeNG (caso SIDO2)

- Prefiere los atributos que sean **estables** (no generados dinámicamente con hashes).
- Prioriza `formcontrolname`, `placeholder`, `role`, texto accesible y `aria-label`
  antes que clases CSS.
- Usa selectores relativos/contextuales (`filter({ hasText })`, `.first()`) solo cuando sea
  necesario para desambiguar.

## Ejemplos aplicados a SIDO2

```js
// Login
this.userNameInput = page.locator('[formcontrolname="usuario"]');
this.passwordInput = page.getByPlaceholder('Contraseña', { exact: true });
this.accessButton = page.locator('button').filter({ hasText: /^Acceder$/ });

// Parte de vehículos
this.newFuelButton = page.locator('button').filter({ hasText: /Nuevo Repostaje/i }).first();
this.fuelRepostajeModalTitle = page.getByText(/parte de repostaje|repostaje/i, { exact: false }).first();
```

## Referencia de los ya existentes

| Elemento | Locator usado en el framework |
|----------|-------------------------------|
| Campo usuario | `page.locator('[formcontrolname="usuario"]')` |
| Campo contraseña | `page.getByPlaceholder('Contraseña', { exact: true })` |
| Botón acceder | `page.locator('button').filter({ hasText: /^Acceder$/ })` |
| Título login | `page.getByText('Acceso al Sistema', { exact: true })` |
| Logo SIDO2 (home) | `page.getByText(/S\s*I\s*D\s*O\s*2/, { exact: true })` |
| Botón logout | `page.locator('[matripple]:has(i.fa-sign-out-alt)')` |
| Menú Vehículos | `page.locator('[href="/null"]').first()` |
| Item "Mis Partes de Vehículos" | `page.getByText(/Mis Partes de Vehículos/i, { exact: false })` |
| Botón "Nuevo Parte Km" | `page.locator('button').filter({ hasText: /Nuevo Parte Km/i }).first()` |
| Botón "Nuevo Repostaje" | `page.locator('button').filter({ hasText: /Nuevo Repostaje/i }).first()` |
| Botón "Nuevo Peaje" | `page.locator('button').filter({ hasText: /Nuevo Peaje/i }).first()` |
| Mensaje error login | `page.locator('div.animated.fast.fadeIn.ng-star-inserted').filter({ hasText: 'Usuario y contraseña no válidos' })` |