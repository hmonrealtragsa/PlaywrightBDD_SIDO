---
name: sido2-cobertura
description: Cómo y dónde actualizar la documentación de cobertura de tests de SIDO2 (carpeta Cobertura/) cuando un escenario queda automatizado y verificado. Usar después de validar un escenario nuevo, o cuando haya que reflejar cobertura parcial/pendiente.
---

# Actualizar la documentación de cobertura

La documentación de cobertura vive en `Cobertura/` dentro del framework PlaywrightSDD.
Cuando un escenario se valida correctamente (pasa la verificación), hay que reflejarlo
en esta documentación.

## Estructura de `Cobertura/`

- `index.md` → resumen global: tabla por módulos y total de escenarios verdes.
- `01_Autenticacion.md` → escenarios de autenticación automatizados.
- `02_PartesVehiculos.md` → escenarios de partes de vehículos automatizados.
- `03_Pendientes.md` → funcionalidad aún no automatizada (en análisis) y priorización.
- (futuros `NN_<Modulo>.md` para módulos nuevos que se vayan automatizando).

## Procedimiento

1. Identifica el módulo al que pertenece el escenario (Autenticación, Partes de
   Vehículos, Desplazamiento, Obras, etc.) y abre el fichero correspondiente en
   `Cobertura/` (`01_Autenticacion.md`, `02_PartesVehiculos.md`, o crea uno nuevo
   `NN_<Modulo>.md` si el módulo aún no existe).
2. Añade el escenario con formato **conciso**, al estilo del resto del documento:
   solo el nombre del escenario, su `action` y una breve descripción, marcándolo
   como ✅ automatizado. Ejemplo:
   ```markdown
   ### N. El usuario pulsa en el botón nuevo Repostaje y aparece una nueva ventana
   `action: new-fuel-recharge` — El usuario clicka en "Nuevo Repostaje" y se abre la
   ventana para añadir un parte de repostaje. ✅
   ```
3. Si el escenario sustituye o completa uno que estaba marcado como pendiente o
   parcialmente cubierto, actualiza también `Cobertura/03_Pendientes.md` (o el fichero
   del módulo) para reflejar que ya está cubierto.
4. Mantén las cuentas actualizadas: incrementa el número de escenarios automatizados
   del módulo y actualiza el **resumen global** en `Cobertura/index.md` (tabla por
   módulos y total de escenarios verdes).
5. No dejes la documentación desactualizada; cada escenario que pase la verificación
   debe quedar reflejado en la cobertura antes de dar por terminada la tarea.

> Si el escenario NO pudo verificarse (falla o bloqueado), NO lo añadas como
> automatizado en la cobertura; indícalo como pendiente/parcial en
> `Cobertura/03_Pendientes.md` con la causa.