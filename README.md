# FRC Sistemas Informaticos - Desktop

Aplicacion de escritorio del sistema FRC (Franco Retail Commerce), un ERP completo para gestion de sucursales comerciales (bodegas, farmacias, etc.). Construido con Angular 15 + Electron 24, se conecta a backends Spring Boot via GraphQL y soporta operacion distribuida con replicacion entre servidor central y filiales.

## Stack tecnologico

| Componente | Tecnologia |
|------------|------------|
| Frontend | Angular 15.1.5 + Angular Material |
| Desktop shell | Electron 24.8.8 |
| Comunicacion con backend | Apollo GraphQL (HTTP + WebSocket) |
| Build & packaging | electron-builder (NSIS para Windows, AppImage para Linux) |
| CI/CD | GitHub Actions + semantic-release |
| Auto-update | electron-updater con canales (alpha/beta/stable) |

## Arquitectura del sistema

Este repositorio es el **frontend desktop** de un sistema distribuido compuesto por:

```
                    +---------------------+
                    |   Central Server    |
                    |  (Spring Boot/PG)   |
                    +----------+----------+
                               |
                    Replicacion logica PG
                               |
          +--------------------+--------------------+
          |                    |                     |
  +-------+-------+   +-------+-------+   +---------+-------+
  |  Filial 1     |   |  Filial 2     |   |  Filial N       |
  | (Spring Boot) |   | (Spring Boot) |   | (Spring Boot)   |
  +-------+-------+   +-------+-------+   +---------+-------+
          |                    |                     |
  +-------+-------+   +-------+-------+   +---------+-------+
  | Desktop App   |   | Desktop App   |   | Desktop App     |
  | (este repo)   |   | (este repo)   |   | (este repo)     |
  +---------------+   +---------------+   +-----------------+
```

Cada sucursal tiene:
- Un servidor filial (Java/Spring Boot + PostgreSQL) con replicacion logica hacia el central
- Una o mas PCs con la app desktop instalada (Linux o Windows)
- La app se conecta al servidor filial local via GraphQL

### Repositorios relacionados

| Repo | Descripcion |
|------|-------------|
| `frc-central-server` | Backend del servidor central |
| `frc-filial-server` | Backend de los servidores filiales |
| `frc-mobile` | App mobile (Capacitor/Ionic) |

## Modulos funcionales

| Modulo | Descripcion |
|--------|-------------|
| `pdv` | Punto de venta (caja, ventas, cobros) |
| `productos` | Catalogo de productos, precios, stock |
| `financiero` | Caja, movimientos financieros, analisis |
| `operaciones` | Entradas, salidas, inventario |
| `transferencias` | Transferencias entre sucursales |
| `personas` | Clientes, proveedores, empleados |
| `administrativo` | Configuracion administrativa |
| `reportes` | Reportes con JasperReports |
| `print` | Impresion de tickets y documentos |

## Requisitos previos

- Node.js >= 18
- npm (no usar yarn - causa problemas con electron-builder)
- Un servidor filial o central corriendo para conectarse

## Instalacion y desarrollo

```bash
# Instalar dependencias del renderer (Angular)
npm install --legacy-peer-deps

# Instalar dependencias del main process (Electron)
cd app/
npm install
cd ..

# Iniciar en modo desarrollo con hot reload
npm start
```

> `--legacy-peer-deps` es necesario por conflicto de peers entre Angular 15 y @angular-devkit/build-angular 16.

## Comandos disponibles

| Comando | Descripcion |
|---------|-------------|
| `npm start` | Desarrollo local con hot reload (Electron + Angular) |
| `npm run build:prod` | Build de produccion de Angular |
| `npm run electron:build` | Empaqueta la app para el SO actual |
| `npm run electron:serve-tsc` | Compila TypeScript del main process |
| `npm run check` | Build AOT de produccion (verificacion pre-push) |

## Estructura del proyecto

```
app/                    # Electron main process
  main.ts               # Entry point, IPC handlers, auto-updater
  installer.nsh          # NSIS custom installer script (Windows)
  package.json           # Dependencias del main process
src/                    # Angular renderer process
  app/
    modules/             # Modulos funcionales (pdv, productos, etc.)
    shared/              # Servicios compartidos, componentes comunes
    commons/             # Servicios core (electron, auth, etc.)
electron-builder.json   # Configuracion de empaquetado
.github/workflows/      # CI/CD pipelines
.releaserc.json         # Configuracion de semantic-release
```

## CI/CD y releases

El proyecto usa semantic-release con 3 canales:

| Branch | Canal | Ejemplo de version |
|--------|-------|--------------------|
| `develop` | alpha | 3.1.0-alpha.12 |
| `release/*` | beta | 3.1.0-beta.1 |
| `master` | stable | 3.1.0 |

### Workflow de desarrollo

1. Crear feature branch desde `develop`
2. Abrir PR hacia `develop`
3. CI corre build en Linux + Windows
4. Merge genera release alpha automatico
5. Promover a `release/*` para beta, luego a `master` para stable

### Auto-update

La app usa electron-updater con manifiestos por canal (`alpha.yml`, `beta.yml`, `latest.yml`). El canal se configura desde la app en Configuracion del Sistema.

## Configuracion de la app

Al primer inicio, la app solicita:
1. **IP y puerto del servidor** filial/central
2. **Canal de actualizacion** (alpha/beta/stable/desarrollo)

La configuracion se guarda en `%APPDATA%/frc-sistemas-informaticos/config/config-backup.json` (Windows) o `~/.config/frc-sistemas-informaticos/config/config-backup.json` (Linux).

## Plataformas soportadas

| Plataforma | Formato | Notas |
|------------|---------|-------|
| Windows x64 | NSIS installer | Instalacion per-user en AppData |
| Linux x64 | AppImage | Probado en Fedora |
