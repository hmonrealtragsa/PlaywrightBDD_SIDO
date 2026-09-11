# Cobertura de Tests — SIDO2

> **Proyecto:** PlaywrightSDD / SIDO2
> **Última verificación:** 11/09/2026
> **Resultado:** 20 escenarios automatizados documentados · validación focalizada reciente: 7 passed · 0 fail

---

## Resumen por módulos

| Módulo | Escenarios | Estado |
|--------|-----------|--------|
| [01_Autenticacion](01_Autenticacion.md) | 4 | ✅ Verdes |
| [02_PartesVehiculos](02_PartesVehiculos.md) | 9 | ✅ Verdes |
| [03_Home](03_Home.md) | 7 | ✅ Verdes |

**Ejecución:**

```bash
npx playwright test --project=chromium --reporter=list
npm run test:login          # Autenticación
npm run test:vehiculos      # Partes de vehículos
npm run test:home           # Home
```