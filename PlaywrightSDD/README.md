# PlaywrightSDD

Framework base para desarrollo guiado por especificaciones (SDD) con Playwright.

## Arquitectura

- `src/config/env.js`: variables de entorno.
- `src/pageobjects/LoginPage.js`: Page Object del login.
- `src/specs/sido2-login.spec.json`: fuente de verdad del escenario.
- `tests/sdd-login.spec.js`: ejecuta escenarios basados en la especificación.

## Flujo

1. Se define el escenario en JSON.
2. La prueba lo interpreta y ejecuta.
3. El Page Object encapsula la UI.
4. El test valida la navegación y el mensaje de bienvenida.

## Ejecución

```bash
npm install
cp .env.example .env
npm run test:login
```

## CI/CD

Configura estos secretos en GitHub:

- `SIDO2_BASE_URL`
- `SIDO2_USERNAME`
- `SIDO2_PASSWORD`

Después puedes ejecutar:

```bash
npm run ci:smoke
```

Ajusta `SIDO2_BASE_URL` y los selectores del login cuando dispongas de la URL real y la UI del SIDO2.
