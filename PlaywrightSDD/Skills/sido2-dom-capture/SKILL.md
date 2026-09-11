---
name: sido2-dom-capture
description: Procedimiento para capturar el DOM de la UI de SIDO2 que aún no está automatizada y derivar locators robustos desde ella. Usar cuando un escenario requiera interaccionar con pantallas/formularios nuevos que no existen en el framework.
---

# Capturar el DOM de la UI nueva

Solo se usa cuando el escenario necesite interaccionar con UI que **NO está automatizada**
en el framework.

## Procedimiento

1. Identifica dónde se encuentra esa pantalla dentro de la aplicación (navegación, menú, etc.).
2. **Navega hasta ese punto** usando el framework (login → home → menú → pantalla objetivo).
   Todos los escenarios empiezan por el login hasta llegar al home.
3. **Captura el DOM** de los elementos nuevos relevantes del formulario/ventana (campos,
   botones, títulos, selects) incluyendo sus atributos significativos (`formcontrolname`,
   `data-testid`, `name`, `aria-label`, `placeholder`, `role`, texto visible, etc.).
4. A partir de ese DOM, **deriva los locators** siguiendo la skill `sido2-locators`.

## Herramientas útiles

Ejecución con ventana visible para inspeccionar:

```bash
npx playwright test tests/<feature>.spec.js --project=chromium --headed --grep "<escenario>"
```

Modo debug (Codegen / Inspector de Playwright):

```bash
npx playwright test tests/<feature>.spec.js --project=chromium --debug
```

Script de exploración para volcar el DOM de la pantalla actual:

```js
// Ejemplo: en un test temporal, tras navegar hasta la pantalla objetivo
const html = await page.content();
console.log(html);
// O centrar en los controles del diálogo:
const dialog = page.locator('p-dialog, .modal, [role="dialog"]');
const dom = await dialog.evaluate(el => el.outerHTML);
console.log(dom);
```

## Consejos

- Vuelca el DOM justo en el estado donde está la UI que interesa (con el modal abierto, el
  formulario visible, etc.).
- Busca en el HTML los `formcontrolname`, `placeholder`, `aria-label`, `role` y textos
  accesibles de cada campo antes de decidir el locator.
- Si el elemento es un autocomplete/select de PrimeNG (peticiones de red al escribir),
  captura también el comportamiento de apertura de opciones y la opción esperada.