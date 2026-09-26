# LockerOps Kiosk

Interfaz de quiosco táctil para consultar estaciones de lockers y la disponibilidad
de sus compartimentos, con un flujo de reserva de prueba en local. La versión pública
del portfolio es de solo consulta; no procesa pagos.

El backend relacionado vive en
[LockerOps Platform](https://github.com/jaikostatham/lockerops-platform).

## Qué muestra

- Selección de estaciones y vista de compartimentos por estado.
- Detalle de un compartimento.
- Textos en español e inglés, con español como idioma inicial.
- Diseño pensado para una pantalla de quiosco táctil.

## Tecnologías

Vue 3 · Quasar · TypeScript · Vue Router · Vue I18n · Axios · Vite

```mermaid
flowchart LR
  U[Usuario del kiosk] --> V[Vue + Quasar]
  V --> A[Cliente Axios]
  A -->|GET /api| B[LockerOps Platform]
  B --> D[(PostgreSQL)]
```

## Ejecutar en local

Requisitos: Node.js 20.19 o posterior, o Node.js 22.12 o posterior, y el backend disponible en
`http://localhost:8080`.

```bash
npm ci
npm run dev
```

Vite sirve la interfaz en `http://localhost:9000` y reenvía `/api` al backend
local. Para probar con el backend en el puerto `8081`:

```powershell
$env:VITE_DEV_PROXY_TARGET = 'http://localhost:8081'
$env:VITE_RESERVATION_FLOW_ENABLED = 'false'
npm run dev
```

Los perfiles `local` y `testing` usan la base `lockerops_test`. Sus datos solo se
comparten cuando ambos se conectan a la misma instancia de PostgreSQL. Ahora el
backend local usa PostgreSQL en este equipo y aún no hay una base de testing
alojada.

## Configuración de API

En desarrollo, deja `VITE_API_BASE_URL` vacía para usar el proxy de Vite. En un
frontend desplegado, `VITE_API_BASE_URL` puede apuntar al origen HTTPS de la API.
Las variables `VITE_*` se incorporan al JavaScript que recibe el navegador, así que
son configuración pública y nunca deben contener contraseñas, tokens ni claves.

El valor debe ser solo el origen HTTPS del backend (sin `/api`); ese origen también
debe figurar en `CORS_ALLOWED_ORIGINS` del backend. Para producción, el backend
usa el perfil `prod`, requiere secretos del proveedor y bloquea escrituras por
defecto mientras la API no tenga autenticación.

Los perfiles, las bases y las precauciones para sus datos están descritos en la
[guía PostgreSQL del backend](https://github.com/jaikostatham/lockerops-platform/blob/develop/docs/postgresql-environments.md).

## Contrato consumido

Todas las versiones usan estas rutas de consulta:

- `GET /api/locker-stations`
- `GET /api/locker-stations/{id}`
- `GET /api/locker-stations/{lockerStationId}/compartments`
- `GET /api/locker-compartments/{id}`

En local, el flujo de prueba también llama a `POST /api/reservations` y
`POST /api/access-codes/validate`. En los builds públicos se desactiva ese flujo y
la API solo publica el catálogo de estaciones y lockers. No cargues datos
personales reales en un entorno público.

## Compilar y CI

```bash
npm run build
```

GitHub Actions ejecuta `npm ci` y `npm run build` en `develop`, `main` y los Pull
Requests hacia esas ramas. Por ahora solo comprueba el código: no publica una web
ni configura una URL pública. Las reservas se activan por defecto al ejecutar el
servidor local de Vite y se desactivan por defecto en builds de producción. La
variable `VITE_RESERVATION_FLOW_ENABLED` puede cambiar ese comportamiento; en un
despliegue público se recomienda establecerla explícitamente en `false`. No contiene
secretos.
