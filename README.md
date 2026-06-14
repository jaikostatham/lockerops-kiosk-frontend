# LockerOps Kiosk Frontend

MVP provisional de frontend para `LockerOps Platform`, construido como una interfaz de kiosco tactil de solo lectura.

## Stack

- Vue 3
- Quasar Framework
- TypeScript
- Vue Router
- Vue I18n
- Axios
- Vite

## Configuracion

En desarrollo se recomienda mantener vacia la URL base publica para usar el proxy de Vite:

```bash
VITE_API_BASE_URL=
VITE_DEV_PROXY_TARGET=http://localhost:8080
```

El archivo `.env.example` incluye estos valores para desarrollo local.

Si `VITE_API_BASE_URL` queda vacio, el servidor de desarrollo usa un proxy interno de Vite desde `/api` hacia `VITE_DEV_PROXY_TARGET`. Esto evita CORS sin tocar el backend. Si defines `VITE_API_BASE_URL=http://localhost:8080`, el navegador llamara directamente al backend y el backend debera permitir CORS desde `http://localhost:9000`.

## Ejecutar en local

Instala dependencias:

```bash
npm install
```

Arranca el frontend:

```bash
npm run dev
```

La aplicacion queda disponible normalmente en:

```bash
http://localhost:9000
```

Compilar:

```bash
npm run build
```

## Backend esperado

Backend local:

```bash
http://localhost:8080
```

Repositorio backend inspeccionado en modo lectura:

```bash
../lockerops-platform
```

## Endpoints consumidos

Este frontend solo consume endpoints de lectura:

- `GET /api/locker-stations`
- `GET /api/locker-stations/{id}`
- `GET /api/locker-stations/{lockerStationId}/compartments`
- `GET /api/locker-compartments/{id}`

No se implementan operaciones de creacion, edicion, borrado, pagos, login, reservas falsas, codigos de acceso ni recibos.

## Pantallas

- `WelcomePage`: entrada full-screen para el kiosco.
- `StationSelectionPage`: seleccion visual de estaciones.
- `CompartmentGridPage`: grid tactil de compartimentos por estacion.
- `CompartmentDetailPage`: detalle read-only del compartimento seleccionado.

## Internacionalizacion

La interfaz usa `vue-i18n` con Espanol como idioma por defecto e Ingles como idioma alternativo. La seleccion del usuario se guarda en `localStorage` con la clave `lockerops.locale`.

## Preparado para fases futuras

La estructura deja separadas las capas de UI, rutas, tipos y API para evolucionar despues hacia:

- Reservations
- PricingPlan
- Payment
- AccessCode
- Receipt

## Nota CORS

Si el backend rechaza peticiones desde `http://localhost:9000`, puede requerir una configuracion CORS temporal en el backend para desarrollo. Este frontend no modifica el backend.

Durante la verificacion local se detecto que el backend respondia correctamente desde el sistema, pero la respuesta directa al navegador no incluia cabeceras CORS y el preflight `OPTIONS` devolvia `403`. Por eso se deja configurado el proxy de desarrollo de Vite.
