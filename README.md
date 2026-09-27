# LockerOps Kiosk

Interfaz de quiosco táctil para consultar estaciones de lockers y la
disponibilidad de sus compartimentos. Incluye un flujo de reserva para pruebas
locales; la demo pública del portfolio es de solo consulta y no procesa pagos.

[Abrir la demo pública](https://lockerops-kiosk-frontend-prod.onrender.com/stations)

El backend relacionado es
[LockerOps Platform](https://github.com/jaikostatham/lockerops-platform).

## Funcionalidades

- Selección de estaciones y consulta de compartimentos por estado.
- Vista de detalle de un compartimento.
- Interfaz en español e inglés, con español como idioma inicial.
- Diseño adaptado a pantallas táctiles.

## Tecnologías

Vue 3 · Quasar · TypeScript · Vue Router · Vue I18n · Axios · Vite

```mermaid
flowchart LR
  U[Usuario del kiosco] --> V[Vue + Quasar]
  V --> A[Cliente Axios]
  A -->|GET /api| B[LockerOps Platform]
  B --> D[(PostgreSQL)]
```

## Ejecutar en local

Requisitos: Node.js 24.21.0 y el backend disponible en
`http://localhost:8080`.

```bash
npm ci
npm run dev
```

Vite sirve la interfaz en `http://localhost:9000` y reenvía `/api` al backend
local. Si el backend usa otro puerto, configura `VITE_DEV_PROXY_TARGET` en la
terminal antes de iniciar Vite:

```powershell
$env:VITE_DEV_PROXY_TARGET = 'http://localhost:8081'
npm run dev
```

En desarrollo, `VITE_API_BASE_URL` puede dejarse vacía para usar el proxy de
Vite. Las variables `VITE_*` se incorporan al JavaScript que recibe el
navegador; úsalas solo para configuración pública, nunca para contraseñas,
tokens ni claves.

## Contrato consumido

El catálogo consulta estas rutas:

- `GET /api/locker-stations`
- `GET /api/locker-stations/{id}`
- `GET /api/locker-stations/{lockerStationId}/compartments`
- `GET /api/locker-compartments/{id}`

El flujo de reserva local también puede usar `POST /api/reservations` y
`POST /api/access-codes/validate`. En la demo pública, la API limita las
operaciones al catálogo independientemente de la opción visual del frontend.
Usa solo datos ficticios en entornos públicos.

## Compilar

```bash
npm run build
```
