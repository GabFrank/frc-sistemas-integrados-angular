# Historia completa del workflow CI/CD
## De v3.0.9 a v3.1.0 — Gab, MR y DA

**Documento:** Narrativa de referencia del proceso de desarrollo y deploy  
**Versión del sistema al inicio:** 3.0.9 (todos los componentes)  
**Equipo:** Gab (responsable CI/CD), MR (developer), DA (developer)

---

## Índice

1. [Punto de partida](#1-punto-de-partida)
2. [Setup inicial — se hace una sola vez](#2-setup-inicial--se-hace-una-sola-vez)
3. [Apertura de ramas de trabajo](#3-apertura-de-ramas-de-trabajo)
4. [Desarrollo y commits](#4-desarrollo-y-commits)
5. [CI automático en cada Pull Request](#5-ci-automático-en-cada-pull-request)
6. [Code review y aprobación](#6-code-review-y-aprobación)
7. [Merge a develop — versionamiento automático](#7-merge-a-develop--versionamiento-automático)
8. [Deploy automático al entorno alpha](#8-deploy-automático-al-entorno-alpha)
9. [Filiales se actualizan solas](#9-filiales-se-actualizan-solas)
10. [Apps desktop y mobile se distribuyen automáticamente](#10-apps-desktop-y-mobile-se-distribuyen-automáticamente)
11. [Validación en empresa laboratorio](#11-validación-en-empresa-laboratorio)
12. [Rama release — entorno beta](#12-rama-release--entorno-beta)
13. [Merge a main — producción](#13-merge-a-main--producción)
14. [Sincronización final de ramas](#14-sincronización-final-de-ramas)
15. [Consideraciones especiales](#15-consideraciones-especiales)

---

## 1. Punto de partida

El sistema está en producción con la versión **3.0.9** en todos los componentes:

| Componente | Versión | Canal |
|---|---|---|
| Backend cloud | 3.0.9 | production |
| Backend filiales (todas) | 3.0.9 | production |
| App desktop | 3.0.9 | latest |
| App mobile | 3.0.9 | production |

Aparecen tres tareas simultáneas:

- **DA** — Bug en el módulo de cobros: el cálculo de descuento con IVA da un resultado incorrecto.
- **Gab** — Bug en la sincronización bidireccional con filiales: hay duplicación de registros bajo ciertas condiciones de red.
- **MR** — Feature nueva: filtro por rango de fechas en el módulo de reportes diarios.

Antes del CI/CD, este ciclo terminaba con Gab entrando por SSH al droplet, copiando el JAR a mano, rezando para que el servicio levantara, y después conectándose por AnyDesk a cada filial. Ese ciclo termina acá.

---

## 2. Setup inicial — se hace una sola vez

**Actor:** Gab  
**Tipo:** Manual  
**Herramientas:** Husky, Commitlint, semantic-release, GitHub Actions, GitHub Settings

Gab dedica uno o dos días a configurar la infraestructura en los cuatro repositorios. Esta configuración no se repite nunca más.

**Lo que hace Gab:**

Instala **Husky** para activar git hooks locales en cada repositorio. Configura **Commitlint** como hook de `commit-msg`: ningún commit con mensaje inválido puede guardarse, ni siquiera localmente, antes de llegar a GitHub. Instala y configura **semantic-release** con soporte de prereleases para que genere tags, CHANGELOG y GitHub Releases automáticamente al mergear.

Sube los cuatro workflows de **GitHub Actions** a cada repositorio:
- `ci.yml` — corre tests en cada Pull Request
- `deploy-alpha.yml` — corre al hacer merge a `develop`
- `deploy-beta.yml` — corre al hacer push a `release/*`
- `deploy-prod.yml` — corre al hacer merge a `main`

Finalmente, en GitHub Settings → Branches protege las ramas `main` y `develop`: nadie puede hacer push directo, todo debe pasar por un Pull Request con todos los checks en verde.

```bash
# En cada repositorio (una sola vez):
npm install --save-dev husky @commitlint/cli \
  @commitlint/config-conventional semantic-release

npx husky add .husky/commit-msg 'npx commitlint --edit $1'
```

```bash
# Secrets cargados en GitHub (una sola vez, por repositorio):
SSH_PRIVATE_KEY      → clave para deploy SSH al droplet
DROPLET_IP           → IP del servidor cloud
DROPLET_USER         → usuario de deploy (permisos mínimos)
WA_PHONE             → número del grupo de WhatsApp
WA_APIKEY            → clave de API de Callmebot
PLAY_STORE_JSON_KEY  → credenciales de Fastlane para Play Console
CODE_SIGNING_CERT    → certificado de firma para el instalador Windows
```

---

## 3. Apertura de ramas de trabajo

**Actores:** DA, Gab, MR (en paralelo)  
**Tipo:** Manual  
**Herramientas:** Git

Los tres crean sus ramas de trabajo de forma independiente, partiendo siempre desde `develop`:

```bash
# DA:
git checkout develop
git pull origin develop
git checkout -b fix/bug-cobros-descuento

# Gab:
git checkout develop
git pull origin develop
git checkout -b fix/bug-sync-filiales

# MR:
git checkout develop
git pull origin develop
git checkout -b feat/filtro-fecha-reportes
```

Cada rama es un espacio de trabajo completamente aislado. Los tres pueden trabajar en paralelo durante días o semanas sin afectar el trabajo del otro. Los cambios solo se integran cuando cada uno decide abrir su Pull Request. No hay riesgo de que el código de MR rompa el entorno de DA mientras trabajan.

---

## 4. Desarrollo y commits

**Actores:** DA, Gab, MR (cada uno en su rama)  
**Tipo:** Manual (escritura de código) + Automático (validación del commit)  
**Herramientas:** Commitlint, Husky

Cada developer trabaja normalmente en su rama. La única diferencia visible respecto al proceso anterior: los mensajes de commit siguen el estándar **Conventional Commits**.

El prefijo del mensaje es lo que le dice a `semantic-release` qué tipo de cambio es y qué bump de versión corresponde:

| Prefijo | Tipo de cambio | Bump de versión |
|---|---|---|
| `fix:` | Corrección de bug | Patch (3.0.9 → 3.0.10) |
| `feat:` | Nueva funcionalidad | Minor (3.0.9 → 3.1.0) |
| `feat!:` o `BREAKING CHANGE` | Cambio incompatible | Major (3.0.9 → 4.0.0) |
| `chore:`, `docs:`, `test:` | Mantenimiento | Sin bump |

```bash
# DA:
git add .
git commit -m "fix(cobros): corregir cálculo de descuento en ventas con IVA"

# Gab:
git add .
git commit -m "fix(sync): resolver duplicación de registros en sync bidireccional"

# MR:
git add .
git commit -m "feat(reportes): agregar filtro por rango de fechas en reporte diario"
```

**¿Qué pasa si el mensaje está mal escrito?**

Husky intercepta el `git commit` antes de guardarlo y pasa el mensaje por Commitlint. Si no cumple el formato, el commit se rechaza en el momento:

```bash
# DA intenta un atajo:
$ git commit -m "arregle lo del descuento"

[Commitlint] input: arregle lo del descuento
  ERROR: subject may not be empty [subject-empty]
  ERROR: type may not be empty [type-empty]
  2 problems found — commit rejected.

# DA corrige:
$ git commit -m "fix(cobros): corregir cálculo de descuento en ventas con IVA"
[Commitlint] OK — commit accepted.
```

El rechazo es inmediato, completamente local, sin que nadie tenga que revisar nada. La corrección del mensaje en este momento es lo que le permite a `semantic-release` calcular el número de versión correcto más adelante.

---

## 5. CI automático en cada Pull Request

**Actores:** — (ninguno)  
**Tipo:** Completamente automático  
**Herramientas:** GitHub Actions, Maven/Gradle

Cada developer hace push de su rama y abre el Pull Request hacia `develop` en GitHub. En ese instante, sin que nadie haga nada, GitHub Actions detecta el evento y dispara el workflow `ci.yml`.

El workflow compila el proyecto y ejecuta todos los tests. El resultado aparece directamente en el Pull Request:

- Si algún test falla: el PR queda bloqueado con una X roja. No se puede mergear.
- Si todos pasan: el PR queda habilitado con una tilde verde. Ya puede ser revisado.

```yaml
# ci.yml — fragmento del workflow:
on:
  pull_request:
    branches: [develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build y tests
        run: ./mvnw test

# Resultado en los tres PRs:
# [DA]  ci.yml → 47 tests — PASSED — PR habilitado para review
# [Gab] ci.yml → 31 tests — PASSED — PR habilitado para review
# [MR]  ci.yml → 58 tests — PASSED — PR habilitado para review
```

Nadie tuvo que recordar correr los tests. El sistema los corre solo, en cada PR, siempre, sin excepción.

---

## 6. Code review y aprobación

**Actor:** Gab  
**Tipo:** Manual  
**Herramientas:** GitHub, CodeRabbit (opcional)

Los tres PRs tienen el CI en verde, pero eso no significa que el código sea correcto. Gab los revisa: lee los cambios, evalúa la lógica, puede agregar comentarios o pedir ajustes. Esta revisión humana es deliberada e irremplazable.

Si CodeRabbit está instalado como GitHub App, ya habrá dejado comentarios automáticos en cada PR antes de que Gab llegue: detectó un edge case no manejado en el código de DA, sugirió una simplificación en el de MR. Gab los evalúa y decide si aplica las sugerencias o no.

Cuando Gab hace clic en "Approve" en los tres PRs, están listos para mergear. Cada developer puede mergear el suyo propio una vez que tiene la aprobación de Gab.

---

## 7. Merge a develop — versionamiento automático

**Actores:** DA, Gab, MR (cada uno mergea el suyo)  
**Tipo:** Manual (el clic de merge) + Automático (versionamiento)  
**Herramientas:** GitHub, semantic-release

**DA mergea primero** (fix de cobros):

semantic-release entra en acción automáticamente. Lee todos los commits en `develop` desde el último tag `3.0.9`, encuentra un `fix:`, calcula bump patch y genera:

```
v3.0.10-alpha.1 — tag creado
CHANGELOG actualizado
GitHub Release v3.0.10-alpha.1 publicado
```

**Gab mergea su fix** (sync de filiales):

semantic-release corre de nuevo. Nuevo `fix:`, nuevo bump patch:

```
v3.0.10-alpha.2 — tag creado
CHANGELOG actualizado (2 entradas: 2 fixes)
GitHub Release v3.0.10-alpha.2 publicado
```

**MR mergea su feature** (filtro por fechas):

Aquí ocurre algo diferente. semantic-release lee todos los commits desde `3.0.9`: los dos `fix:` de DA y Gab, y ahora un `feat:` de MR. En la jerarquía semántica, una feature supera a un bug fix. Eso dispara un bump **minor**, no patch:

```
Analizando commits desde v3.0.9:
  fix(cobros):    → patch
  fix(sync):      → patch
  feat(reportes): → MINOR  ← gana, supera al patch

Resultado: 3.0.9 → 3.1.0-alpha.1

v3.1.0-alpha.1 — tag creado
CHANGELOG actualizado (3 entradas: 2 fixes + 1 feature)
GitHub Release v3.1.0-alpha.1 publicado
```

Nadie decidió el número `3.1.0`. Salió de los mensajes de commit. El número le comunica a cualquiera que lo vea: esta versión no solo corrige bugs, también agrega funcionalidad nueva.

---

## 8. Deploy automático al entorno alpha

**Actores:** — (ninguno)  
**Tipo:** Completamente automático  
**Herramientas:** GitHub Actions, rsync, SSH, systemctl, Spring Boot Actuator

El tag `v3.1.0-alpha.1` dispara el workflow `deploy-alpha.yml`. Nadie presionó ningún botón. GitHub levanta una máquina virtual limpia en sus servidores y ejecuta la secuencia completa:

```
[1] mvn package → app.jar compilado (12.4 MB)
[2] SSH al droplet: cp app.jar app-previous.jar   ← backup del JAR anterior
[3] Si el JAR incluye migraciones Flyway:
      Flyway migrate contra la BD cloud
      Si falla → abortar deploy, notificar, NO reemplazar JAR
[4] rsync app.jar → droplet:/opt/backend/app.jar
[5] SSH: systemctl restart backend-cloud
[6] GET /actuator/health → espera {"status":"UP"} en 60 segundos
      Si OK  → continuar, notificar éxito por WhatsApp
      Si falla → cp app-previous.jar app.jar + systemctl restart
                  notificar con alerta por WhatsApp
                  el run de Actions queda en rojo con los logs completos
```

El JAR nunca se ejecuta manualmente. El proceso de compilación, transferencia y reinicio corre completamente en los servidores de GitHub y se conecta al droplet a través de las credenciales SSH almacenadas como Secrets cifrados.

```
WhatsApp — notificación automática:
✅ v3.1.0-alpha.1 desplegado en Alpha
Backend cloud: UP (health check OK, 8s)
Ver release: github.com/org/repo/releases/tag/v3.1.0-alpha.1
```

---

## 9. Las filiales se actualizan por push directo vía ZeroTier

**Actores:** — (ninguno)  
**Tipo:** Completamente automático  
**Herramientas:** GitHub Actions, SSH, ZeroTier, script deploy-filiales.sh en el droplet

**Principio clave:** el backend filial es un componente completamente independiente del backend cloud. Tienen repositorios separados, workflows separados, y sus deploys no se conocen entre sí. El hecho de que compartan base de datos replicada es una decisión de negocio, no de infraestructura de deploy.

El mismo workflow `deploy-filial-alpha.yml` que corrió en el paso anterior entra por SSH al droplet y desde ahí ejecuta el script de deploy hacia la filial laboratorio, aprovechando que el droplet ya pertenece a la red ZeroTier:

```
GitHub Actions → SSH → Droplet (jump host ZeroTier)
                           │
                           │ rsync + SSH sobre ZeroTier
                           ▼
                       Filial laboratorio (10.x.x.1)
```

El script ejecuta en la filial la secuencia completa:

```
[1] Backup del JAR activo → app-previous.jar
[2] rsync del nuevo JAR al directorio de staging
[3] Verificar SHA-256 del JAR recibido
[4] Flyway migrate contra la BD local
    Si falla → abortar, el JAR activo no se toca
[5] Reemplazar JAR activo
[6] Reiniciar servicio (systemctl / Winsw)
[7] GET localhost:8080/api/version → espera "3.1.0"
    Si falla en 60s → rollback automático al JAR anterior
[8] Reportar resultado al workflow
```

El workflow recibe la confirmación directa. No hay espera, no hay polling, no hay incertidumbre. El log de Actions muestra en tiempo real el estado de cada filial:

```
→ Desplegando v3.1.0 a filial laboratorio (10.x.x.1)...
  ✅ 10.x.x.1 — v3.1.0 confirmado en 18s

WhatsApp — notificación automática:
✅ v3.1.0-alpha.1 desplegado en Alpha
Backend cloud: UP | Filial laboratorio: OK (18s)
```

---

## 10. Apps desktop y mobile se distribuyen automáticamente

**Actores:** — (ninguno)  
**Tipo:** Completamente automático  
**Herramientas:** electron-builder, electron-updater, Fastlane, Play Store

El mismo workflow del paso 8 también gestionó las apps de cara al usuario. Ningún paso fue manual.

**App desktop:**

`electron-builder --publish always` compiló los instaladores para Linux (`.AppImage`) y Windows (`.exe`) en las máquinas virtuales de GitHub y los subió automáticamente al GitHub Release junto con los archivos de metadatos `latest-alpha.yml`:

```
GitHub Release v3.1.0-alpha.1:
  app-3.1.0-alpha.1-linux.AppImage  [publicado]
  app-3.1.0-alpha.1-win.exe         [publicado]
  latest-alpha.yml                  [publicado]
```

Los clientes desktop configurados en el canal `alpha` detectan la nueva versión automáticamente al iniciar la app. La descarga ocurre en segundo plano. Al próximo reinicio ya están en `3.1.0-alpha.1`. Si la actualización es `mandatory: true`, el reinicio se fuerza inmediatamente sin opción de posponer.

**App mobile:**

```
Fastlane lane :alpha:
  gradle → bundle .aab generado
  supply → Play Store Internal Testing track [OK]
```

El bundle `.aab` llega al track Internal Testing de Play Console automáticamente. El equipo lo recibe en sus dispositivos Android. Sin abrir Android Studio. Sin tocar Play Console manualmente.

---

## 11. Validación en empresa laboratorio

**Actor:** Gab  
**Tipo:** Manual  
**Herramientas:** —

Gab visita o se conecta remotamente a la empresa laboratorio, que ya corre `3.1.0-alpha.1` en todos sus componentes. Esta validación es completamente humana.

Gab prueba:
- El bug de DA: el cálculo de descuentos con IVA ahora da el resultado correcto.
- El bug de Gab: la sincronización bidireccional ya no genera registros duplicados.
- La feature de MR: el filtro por rango de fechas devuelve los datos esperados con los formatos correctos.

También revisa los logs del servidor, verifica que no hay errores nuevos, y confirma que la replicación con la base de datos cloud sigue estable.

Todo en orden. Gab decide que el código está listo para beta. Esta decisión no se puede automatizar.

---

## 12. Rama release — entorno beta

**Actor:** Gab  
**Tipo:** Manual (crear la rama) + Automático (todo lo demás)  
**Herramientas:** Git, GitHub Actions, semantic-release, Fastlane

```bash
git checkout -b release/3.1.0 develop
git push origin release/3.1.0
```

El push dispara `deploy-beta.yml` automáticamente:

```
semantic-release → v3.1.0-beta.1 tag generado
Backend cloud (endpoint beta): desplegado, health check OK
Update server: canal beta → v3.1.0-beta.1 registrado
Filiales canal beta: detectarán en próximo polling
Desktop: canal beta publicado en GitHub Releases
Fastlane → Play Store Beta track [OK]

WhatsApp:
🔵 v3.1.0-beta.1 disponible en Beta
Backend cloud + filiales beta + Desktop + Mobile
```

**Si se encuentra un bug durante los dos días de beta:**

Gab o DA abren una rama desde `release/3.1.0`, no desde `develop`:

```bash
git checkout -b fix/bug-en-beta release/3.1.0
git commit -m "fix(reportes): corregir paginación en filtro de fechas"
# PR → release/3.1.0 → merge → v3.1.0-beta.2 automático
```

El proceso de build y deploy se repite solo. `v3.1.0-beta.2` queda disponible para las empresas beta en minutos. Sin drama y sin intervención manual.

**Si no hay bugs en 48 horas:** se avanza al paso siguiente.

---

## 13. Merge a main — producción

**Actores:** Gab (abre PR), DA (aprueba), Gab (mergea)  
**Tipo:** Manual (tres decisiones humanas deliberadas) + Automático (deploy completo)  
**Herramientas:** GitHub, GitHub Actions, semantic-release, Fastlane, electron-updater

48 horas en beta, sin incidentes.

**Decisiones humanas antes de tocar producción:**

1. Gab abre el PR de `release/3.1.0 → main`.
2. DA lo revisa y aprueba.
3. Gab hace el merge.

Dos personas involucradas. Esta es la última barrera humana antes de producción, y es intencional.

**Después del merge — todo automático:**

```
semantic-release → v3.1.0 (tag limpio, sin alpha ni beta)
CHANGELOG final generado con las 3 entradas: 2 fixes + 1 feature
GitHub Release v3.1.0 publicado
```

```
Backend cloud (producción):
  Flyway migrate → OK
  rsync app.jar → droplet
  systemctl restart
  GET /actuator/health → UP (11s)
  ✅ Backend cloud v3.1.0 en producción

Backend filiales — deploy-filial-prod.yml (independiente del cloud):
  Actions → SSH → Droplet → ZeroTier → cada filial
  Filial A (10.x.x.1): ✅ v3.1.0 OK (22s)
  Filial B (10.x.x.2): ✅ v3.1.0 OK (18s)
  Filial C (10.x.x.3): ⏳ offline — marcada como pendiente
  ...
  Job de reconciliación: reintentará cuando C vuelva a estar disponible

Desktop:
  GitHub Release v3.1.0 publicado con latest.yml
  Clientes canal latest notificados en segundo plano
  Al próximo reinicio: v3.1.0

Mobile:
  Fastlane → Play Store Production, 10% rollout inicial
  (Gab escala al 100% manualmente desde Play Console
   después de confirmar estabilidad en el día)
```

```
WhatsApp — notificación automática:
✅ v3.1.0 en Producción
Backend cloud + filiales (rollout escalonado) + Desktop + Mobile (10% → 100%)
Cambios: fix(cobros), fix(sync), feat(reportes)
Release: github.com/org/repo/releases/tag/v3.1.0
```

**Versiones finales:**

| Componente | Versión | Estado |
|---|---|---|
| Backend cloud | 3.1.0 | ✅ confirmado |
| Backend filiales (online al momento del deploy) | 3.1.0 | ✅ confirmado en segundos |
| Backend filiales (offline al momento del deploy) | 3.1.0 | ⏳ pendiente — reconciliación automática |
| App desktop | 3.1.0 | ✅ disponible para clientes |
| App mobile | 3.1.0 | ✅ 10% rollout → 100% manual |

---

## 14. Sincronización final de ramas

**Actor:** Gab  
**Tipo:** Manual  
**Herramientas:** Git

Si durante la rama `release/3.1.0` se aplicaron fixes (paso 12), esos commits existen en `release/3.1.0` y en `main` pero no en `develop`. Hay que sincronizarlos para que el próximo ciclo de desarrollo parta de un estado consistente:

```bash
git checkout develop
git cherry-pick <hash-del-fix-de-beta>
git push origin develop
```

Esto cierra el ciclo. `develop` queda al día y el equipo puede empezar el siguiente ciclo de trabajo desde un estado limpio.

---

## 15. Consideraciones especiales

### Independencia total de los componentes

**Cada componente se despliega de forma completamente independiente.** Backend cloud, backend filial, app desktop y app mobile tienen sus propios workflows y sus propios ciclos de release. Ninguno sabe nada del estado de los otros. Podés actualizar solo el backend cloud sin tocar las filiales, o actualizar todas las filiales sin tocar el cloud, o publicar una nueva versión del desktop sin que el backend cambie.

| Workflow | Qué despliega | Qué no le importa |
|---|---|---|
| `deploy-cloud.yml` | Backend cloud en el droplet | Si las filiales están actualizadas |
| `deploy-filial-prod.yml` | Backend de cada filial vía ZeroTier | Si el cloud se actualizó |
| `deploy-desktop.yml` | App desktop en GitHub Releases | Si el backend está actualizado |
| `deploy-mobile.yml` | App Android en Play Store | Si el backend está actualizado |

### Releases coordinados (filial + desktop)

Cuando un fix o feature requiere actualizar el backend filial y el desktop en el mismo release, la coordinación vive en el **pipeline de CI/CD**, no en el código de las aplicaciones:

```yaml
# coordinated-release.yml — solo para releases con dependencia explícita
jobs:
  deploy-backend-filiales:
    uses: ./.github/workflows/deploy-filial-prod.yml
    # No termina hasta que todas las filiales confirman la nueva versión

  deploy-desktop:
    needs: deploy-backend-filiales   # espera la confirmación
    uses: ./.github/workflows/deploy-desktop.yml
    # Publica el latest.yml solo cuando los backends están OK
```

Las aplicaciones no se conocen entre sí. La dependencia está expresada en el workflow, no en el código.

### El droplet como jump host — no como orquestador de negocio

El droplet actúa como punto de red para alcanzar las filiales vía ZeroTier. El backend cloud no tiene ningún endpoint relacionado con deploys. Si el backend cloud tiene un problema, la capacidad de deployar filiales no se ve afectada.

### Flyway y el rollback de base de datos

Revertir el JAR es instantáneo. Revertir una migración de base de datos ejecutada no existe en Flyway. La solución es diseñar migraciones compatibles con la versión anterior del JAR.

**Patrón correcto — cambios en dos pasos:**

```sql
-- INCORRECTO: rompe compatibilidad en un solo deploy
ALTER TABLE ventas RENAME COLUMN monto TO monto_total;

-- CORRECTO: dos deploys separados
-- Deploy 1 → V3__agregar_columna_nueva.sql
ALTER TABLE ventas ADD COLUMN monto_total DECIMAL(10,2);
UPDATE ventas SET monto_total = monto;

-- Deploy 2 (próxima versión) → V4__eliminar_columna_vieja.sql
ALTER TABLE ventas DROP COLUMN monto;
```

**Orden en el workflow:** Flyway migrate primero → si falla, abortar sin tocar el JAR → reemplazar JAR → health check → rollback del JAR si falla (la migración ya corrió: alerta urgente al equipo).

### Quién ejecuta qué

| Acción | Quién la ejecuta | Dónde |
|---|---|---|
| `mvn package` (backend cloud o filial) | GitHub Actions | VM de GitHub |
| Deploy backend cloud | GitHub Actions | VM → SSH → Droplet |
| Deploy backend filiales | GitHub Actions | VM → SSH → Droplet → ZeroTier → Filiales |
| Flyway migrate (cloud) | GitHub Actions | VM → BD del Droplet |
| Flyway migrate (filiales) | Script `apply-update.sh` | Servidor de cada filial |
| Reconciliación de filiales offline | Cron job | Droplet |
| `electron-builder --publish always` | GitHub Actions | VM de GitHub |
| `fastlane deploy` | GitHub Actions | VM de GitHub |

### Resumen de qué es manual y qué es automático

| Acción | Tipo | Actor |
|---|---|---|
| Escribir código | Manual | DA / MR / Gab |
| Commit y push | Manual | DA / MR / Gab |
| Validar formato del commit | Automático | Commitlint / Husky |
| Correr tests en el PR | Automático | GitHub Actions |
| Code review y aprobación | Manual | Gab |
| Calcular número de versión | Automático | semantic-release |
| Generar tag y CHANGELOG | Automático | semantic-release |
| Compilar el JAR (cloud o filial) | Automático | GitHub Actions (VM) |
| Deploy backend cloud | Automático | GitHub Actions → SSH → Droplet |
| Deploy backend filiales | Automático | GitHub Actions → Droplet → ZeroTier → Filiales |
| Rollback de JAR ante fallo (cloud) | Automático | GitHub Actions → SSH |
| Rollback de JAR ante fallo (filial) | Automático | Script rollback.sh en la filial |
| Reconciliación de filiales offline | Automático | Cron job en el droplet |
| Compilar instaladores desktop | Automático | GitHub Actions (VM) |
| Compilar bundle mobile | Automático | GitHub Actions (VM) |
| Distribución de app desktop | Automático | electron-updater |
| Subida a Play Store | Automático | Fastlane / GitHub Actions |
| Validar en empresa laboratorio | Manual | Gab |
| Crear rama release | Manual | Gab |
| Abrir PR a main | Manual | Gab |
| Aprobar PR a main | Manual | DA |
| Escalar rollout mobile al 100% | Manual | Gab (Play Console) |
| Sincronizar develop con fixes | Manual | Gab |

---

*Documento actualizado el 2026-03-24. Cambios principales: modelo de filiales migrado de polling a push directo vía ZeroTier con el droplet como jump host; independencia de componentes explicitada; releases coordinados documentados como responsabilidad del pipeline, no de las aplicaciones. Complementa `propuesta-cicd-automatizacion.md` v1.1.0.*
