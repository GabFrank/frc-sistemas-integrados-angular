# Propuesta de Automatización: Versionamiento, CI/CD y Deploy — SaaS Multi-Tiendas

**Versión:** 1.1.0  
**Fecha:** 2026-03-24  
**Estado:** Borrador — pendiente de revisión

> **Cambios en v1.1.0:** Se reemplaza el modelo de polling de filiales por push directo vía ZeroTier. Se explicita la independencia de deploy entre componentes. Se agrega la sección de releases coordinados (4.5).

---

## Índice

1. [Contexto y estado actual](#1-contexto-y-estado-actual)
2. [Objetivos](#2-objetivos)
3. [Estrategia de branching y versionamiento](#3-estrategia-de-branching-y-versionamiento)
4. [Pipeline CI/CD por componente](#4-pipeline-cicd-por-componente)
5. [Gestión de entornos y rollout gradual](#5-gestión-de-entornos-y-rollout-gradual)
6. [Herramientas del stack](#6-herramientas-del-stack)
7. [Integración con Jira y notificaciones](#7-integración-con-jira-y-notificaciones)
8. [Hoja de ruta de implementación](#8-hoja-de-ruta-de-implementación)
9. [Integración futura con agentes IA](#9-integración-futura-con-agentes-ia)
10. [Consideraciones de seguridad](#10-consideraciones-de-seguridad)
11. [Riesgos y mitigaciones](#11-riesgos-y-mitigaciones)
12. [Preguntas abiertas](#12-preguntas-abiertas)

> **Secciones clave actualizadas en v1.1.0:** 4.2 (Backend filial — push vía ZeroTier), 4.5 (nueva — Releases coordinados), 5.2 (Flujo de promoción), 6 (Herramientas), 8 Fase 3, 10 (Seguridad), 11 (Riesgos), 12 (Preguntas abiertas).

---

## 1. Contexto y estado actual

### 1.1 Arquitectura del sistema

El sistema es un SaaS multi-tiendas compuesto por los siguientes componentes:

| Componente | Tecnología | Infraestructura |
|---|---|---|
| Servidor cloud | Spring Boot (JAR) | DigitalOcean Droplet vía `systemctl` |
| Servidor filial | Spring Boot (JAR) | Windows (Winsw) / Linux (`systemctl`) — un servidor por tienda |
| Base de datos cloud | PostgreSQL 16 | Mismo droplet, replicación lógica bidireccional hacia filiales |
| Base de datos filial | PostgreSQL | Máquina local de cada tienda — recibe maestros, envía operacionales |
| App desktop | Angular + Electron | `.AppImage` (Linux) / `.exe` (Windows) — distribución manual |
| App mobile | Angular + Ionic | Android — distribución vía Play Store manual |
| App web | — | No implementada aún (objetivo futuro) |

### 1.2 Proceso actual (manual)

- **Backend cloud:** acceso SSH manual al droplet, copia del JAR, reinicio del servicio.
- **Backend filial:** acceso SSH (Linux) o AnyDesk (Windows) a cada servidor de tienda, reemplazo manual del JAR y reinicio.
- **App desktop Linux:** reemplazo manual del `.AppImage`.
- **App desktop Windows:** actualización remota vía AnyDesk.
- **App mobile:** generación manual del bundle en Android Studio, subida manual a Play Console.
- **Versionamiento:** sin versionamiento semántico formal ni automatizado.
- **Repositorios:** cuatro repositorios independientes en GitHub (backend cloud, backend filial, frontend desktop, frontend mobile).
- **Gestión de tareas:** Jira para bugs y features.
- **Comunicación:** grupo de WhatsApp para avances diarios.

### 1.3 Problemas identificados

- Alto riesgo de error humano en cada deploy.
- Tiempo de deploy elevado, especialmente para actualizaciones masivas de filiales.
- Sin trazabilidad automática entre versión desplegada y cambios introducidos.
- Sin proceso formal de validación pre-producción.
- Rollback manual y lento ante incidentes.
- Sin diferenciación de canales de distribución (alpha / beta / producción).

---

## 2. Objetivos

1. Eliminar los deploys manuales en todos los componentes del sistema.
2. Implementar versionamiento semántico automático basado en los mensajes de commit.
3. Establecer un proceso formal de validación con canales alpha, beta y producción.
4. Garantizar rollback automático ante fallos de deploy.
5. Integrar las notificaciones de deploy con los canales de comunicación del equipo.
6. Sentar las bases para la incorporación de agentes IA en el proceso de desarrollo.
7. Utilizar exclusivamente herramientas open source o con planes gratuitos suficientes.

---

## 3. Estrategia de branching y versionamiento

### 3.1 Modelo de ramas

Se adopta una variante de **Git Flow** adaptada para múltiples canales de distribución:

```
feature/* ──► develop ──► release/x.x.x ──► main
                                               ▲
hotfix/* ───────────────────────────────────────┘
              └─► cherry-pick a develop
```

| Rama | Propósito | Dispara deploy a |
|---|---|---|
| `feature/*` | Desarrollo de nuevas funcionalidades | — (solo CI/tests) |
| `develop` | Integración continua | Alpha (empresa laboratorio) |
| `release/x.x.x` | Candidato a lanzamiento | Beta (empresas seleccionadas) |
| `main` | Producción estable | Producción (todas las empresas) |
| `hotfix/*` | Correcciones críticas en producción | Producción + cherry-pick a `develop` |

**Reglas de protección de ramas:**

- `main` y `develop`: requieren PR aprobado + todos los checks de CI en verde.
- `main`: requiere aprobación adicional manual antes del merge (segunda revisión humana).
- No se permiten pushes directos a `main` ni a `develop`.

### 3.2 Versionamiento semántico automático

Se utiliza **Conventional Commits** como contrato de escritura de mensajes de commit, y **semantic-release** como herramienta de automatización.

**Formato de commit:**

```
<tipo>[alcance opcional]: <descripción>

[cuerpo opcional]

[notas al pie opcionales — BREAKING CHANGE, refs JIRA-xxx]
```

**Mapeo de tipo a versión:**

| Prefijo de commit | Cambio de versión | Ejemplo |
|---|---|---|
| `fix:` | Patch (`1.2.3 → 1.2.4`) | `fix: corregir cálculo de descuento en venta` |
| `feat:` | Minor (`1.2.3 → 1.3.0`) | `feat: agregar filtro por fecha en reportes` |
| `feat!:` o `BREAKING CHANGE` | Major (`1.2.3 → 2.0.0`) | `feat!: rediseño de API de sincronización` |
| `chore:`, `docs:`, `test:` | Sin cambio de versión | — |

**Esquema de tags por canal:**

| Canal | Rama origen | Formato de tag | Ejemplo |
|---|---|---|---|
| Alpha | `develop` | `x.x.x-alpha.n` | `1.3.0-alpha.4` |
| Beta | `release/x.x.x` | `x.x.x-beta.n` | `1.3.0-beta.2` |
| Producción | `main` | `x.x.x` | `1.3.0` |

**semantic-release** genera automáticamente al tagear: el número de versión, el `CHANGELOG.md` con la lista de cambios clasificada, y el GitHub Release con los artefactos adjuntos.

### 3.3 Validación de commits

**Commitlint** se instala como hook de pre-push (vía Husky) y como check de CI en cada PR, rechazando commits que no cumplan el estándar de Conventional Commits. Esto asegura que semantic-release siempre tenga información suficiente para determinar el siguiente número de versión.

---

## 4. Pipeline CI/CD por componente

### 4.1 Backend cloud (Spring Boot — DigitalOcean)

**Workflows de GitHub Actions:**

```
ci.yml          → Corre en todo PR hacia develop
                  Steps: checkout → tests (Maven/Gradle) → reporte de cobertura

deploy-alpha.yml → Corre al hacer merge a develop
                   Steps: ci → build JAR → backup JAR anterior → transfer SSH
                          → systemctl restart → health check → notificación

deploy-beta.yml  → Corre al pushear a release/*
                   Steps: idéntico a alpha, apunta al entorno beta

deploy-prod.yml  → Corre al pushear tag x.x.x a main
                   Steps: idéntico + aprobación manual requerida en GitHub
```

**Mecanismo de deploy:**

1. El JAR anterior se respalda como `app-previous.jar` antes de reemplazarlo.
2. El nuevo JAR se transfiere vía `rsync` sobre SSH (más eficiente que `scp` para archivos grandes).
3. Se ejecuta `systemctl restart <servicio>` en el droplet.
4. Se realiza un **health check** al endpoint `GET /actuator/health` (Spring Boot Actuator). Si no responde `{"status":"UP"}` en un timeout de 60 segundos, el workflow ejecuta automáticamente el rollback.

**Rollback automático:**

```bash
# Ejecutado por el workflow ante fallo del health check
cp app-previous.jar app.jar
systemctl restart <servicio>
```

### 4.2 Backend filial (Spring Boot — servidores locales)

> **Principio fundamental:** el backend filial se despliega de forma **completamente independiente** del backend cloud. Cada uno tiene su propio workflow, su propio ciclo de releases y puede actualizarse sin que el otro lo sepa. No existe ningún acoplamiento entre ambos componentes a nivel de deploy.

**Por qué es posible el push directo:**

Las filiales ya están conectadas a la red **ZeroTier** del sistema. El servidor cloud tiene la IP ZeroTier de cada filial almacenada en la base de datos. Esto elimina el problema de alcanzabilidad de red que habría justificado el modelo de polling: el cloud puede conectarse directamente a cada filial en cualquier momento.

**El droplet como jump host — no como orquestador:**

GitHub Actions no puede conectarse a las IPs ZeroTier directamente (son IPs de una red privada virtual). El droplet sí pertenece a esa red. Por eso el workflow entra por SSH al droplet y desde ahí ejecuta los deploys a las filiales. El droplet es un puente de red, no una aplicación de negocio con responsabilidades de orquestación.

```
GitHub Actions
    │
    │  SSH (credencial ya configurada)
    ▼
Droplet (jump host / punto de red ZeroTier)
    │
    │  SSH / rsync sobre ZeroTier
    ├──► Filial A (10.x.x.1)
    ├──► Filial B (10.x.x.2)
    └──► Filial C (10.x.x.3) ...
```

**Workflows de GitHub Actions:**

```
ci.yml             → Corre en todo PR hacia develop
                     Steps: checkout → tests → reporte de cobertura

deploy-filial-alpha.yml → Corre al hacer merge a develop
                          Despliega solo a la filial laboratorio

deploy-filial-beta.yml  → Corre al pushear a release/*
                          Despliega a filiales del canal beta

deploy-filial-prod.yml  → Corre al hacer merge a main
                          Despliega a todas las filiales de producción
```

**Mecanismo de deploy — paso a paso:**

```yaml
# deploy-filial-prod.yml (fragmento)
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build JAR
        run: ./mvnw package -DskipTests

      - name: Copiar JAR al droplet (staging)
        run: |
          rsync filial.jar \
            ${{ secrets.DROPLET_USER }}@${{ secrets.DROPLET_IP }}:/opt/deploy/staging/filial-${{ env.VERSION }}.jar

      - name: Desplegar a todas las filiales vía ZeroTier
        run: |
          ssh ${{ secrets.DROPLET_USER }}@${{ secrets.DROPLET_IP }} \
            'bash /opt/deploy/scripts/deploy-filiales.sh ${{ env.VERSION }} production'
```

**Script de deploy en el droplet** (`/opt/deploy/scripts/deploy-filiales.sh`):

```bash
#!/bin/bash
VERSION=$1
CHANNEL=$2
JAR=/opt/deploy/staging/filial-$VERSION.jar
SHA256=$(sha256sum $JAR | cut -d' ' -f1)

# Leer IPs ZeroTier de las filiales según canal
FILIALES=$(psql $DB_URL -t -c \
  "SELECT zerotier_ip FROM empresas WHERE activa = true AND update_channel = '$CHANNEL'")

TOTAL=0; OK=0; FAIL=0

for IP in $FILIALES; do
  TOTAL=$((TOTAL + 1))
  echo "→ Desplegando v$VERSION a $IP..."

  # Backup + copia del nuevo JAR
  ssh deploy@$IP "cp /opt/filial/app.jar /opt/filial/app-previous.jar"
  rsync $JAR deploy@$IP:/opt/filial/staging/app-new.jar

  # Verificar SHA-256 en la filial antes de continuar
  REMOTE_SHA=$(ssh deploy@$IP "sha256sum /opt/filial/staging/app-new.jar | cut -d' ' -f1")
  if [ "$REMOTE_SHA" != "$SHA256" ]; then
    echo "  ❌ $IP — SHA-256 no coincide, deploy abortado para esta filial"
    FAIL=$((FAIL + 1))
    continue
  fi

  # Flyway migrate + reemplazo + reinicio
  ssh deploy@$IP "bash /opt/filial/scripts/apply-update.sh $VERSION"

  # Verificar que el servicio levantó con la nueva versión
  sleep 15
  RESULT=$(ssh deploy@$IP "curl -sf localhost:8080/api/version | jq -r .version" 2>/dev/null)

  if [ "$RESULT" = "$VERSION" ]; then
    echo "  ✅ $IP — v$VERSION OK"
    OK=$((OK + 1))
  else
    echo "  ❌ $IP — falló (versión activa: $RESULT) — ejecutando rollback"
    ssh deploy@$IP "bash /opt/filial/scripts/rollback.sh"
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "Resultado: $OK/$TOTAL filiales actualizadas — $FAIL fallidas"
```

**Script local en la filial** (`/opt/filial/scripts/apply-update.sh`):

```bash
#!/bin/bash
VERSION=$1

# Flyway migrate — si falla, abortar sin tocar el JAR activo
java -jar /opt/filial/flyway.jar migrate || {
  echo "Flyway falló — deploy abortado, JAR activo no modificado"
  exit 1
}

# Reemplazar JAR y reiniciar
cp /opt/filial/staging/app-new.jar /opt/filial/app.jar

# Linux:
systemctl restart backend-filial

# Windows (Winsw): net stop BackendFilial && net start BackendFilial
```

**Filiales offline al momento del deploy:**

Si una filial no responde durante el deploy (máquina apagada, problema de red), el script la marca como pendiente en la base de datos y continúa con el resto. Un job de reconciliación programado vuelve a intentarlo periódicamente hasta que la filial esté disponible. No se bloquea todo el deploy por una filial offline.

```bash
# Job de reconciliación (cron en el droplet, cada hora)
PENDIENTES=$(psql $DB_URL -t -c \
  "SELECT zerotier_ip FROM filial_deploy_status
   WHERE version = '$VERSION' AND status = 'pending'")

for IP in $PENDIENTES; do
  if ping -c 1 $IP &>/dev/null; then
    bash /opt/deploy/scripts/deploy-single.sh $IP $VERSION
  fi
done
```

### 4.3 App desktop (Angular + Electron)

**Herramienta clave: `electron-updater`** (parte de `electron-builder`).

**Configuración en `package.json`:**

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "tu-org",
      "repo": "desktop-app"
    }
  }
}
```

**Workflow de GitHub Actions:**

```yaml
- name: Build and publish
  run: npx electron-builder --publish always
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    CSC_LINK: ${{ secrets.CERTIFICATE }}         # firma de código Windows
    CSC_KEY_PASSWORD: ${{ secrets.CERT_PASS }}
```

`electron-builder` genera los instaladores y sube automáticamente al GitHub Release los artefactos junto con los archivos `latest.yml`, `latest-linux.yml` (y `latest-mac.yml` si aplica), que `electron-updater` usa en el cliente para detectar nuevas versiones.

**Canales de actualización:**

```javascript
// En el proceso principal de Electron
autoUpdater.channel = 'alpha'    // | 'beta' | 'latest'
```

Cada canal apunta a GitHub Releases con tags del patrón correspondiente. El usuario de producción nunca ve versiones alpha ni beta.

**Experiencia de actualización:**

- La actualización se descarga en segundo plano.
- Al finalizar, se muestra un diálogo: "Nueva versión disponible. ¿Actualizar ahora o en el próximo reinicio?"
- En actualizaciones marcadas como `mandatory: true`, el reinicio es inmediato sin opción de posponer.

### 4.4 App mobile (Angular + Ionic — Android)

**Herramienta clave: Fastlane** con el plugin `supply`.

**Estructura de Fastfile:**

```ruby
lane :alpha do
  gradle(task: "bundle", build_type: "Release")
  upload_to_play_store(track: "internal")
end

lane :beta do
  gradle(task: "bundle", build_type: "Release")
  upload_to_play_store(track: "beta")
end

lane :deploy do
  gradle(task: "bundle", build_type: "Release")
  upload_to_play_store(track: "production", rollout: "0.1")
end
```

**Workflow de GitHub Actions:**

```yaml
- name: Deploy to Play Store
  uses: maierj/fastlane-action@v3
  with:
    lane: ${{ github.ref == 'refs/heads/main' && 'deploy' || 'beta' }}
  env:
    SUPPLY_JSON_KEY: ${{ secrets.PLAY_STORE_JSON_KEY }}
```

**Canales de Play Store:**

| Canal | Track de Play Store | Destinatarios |
|---|---|---|
| Alpha | Internal Testing | Solo el equipo (hasta 100 testers) |
| Beta | Open/Closed Beta | Empresas seleccionadas |
| Producción | Production (10% rollout inicial) | Todos los usuarios |

El rollout de producción arranca en 10% de usuarios y puede escalarse manualmente desde Play Console una vez confirmada la estabilidad.

### 4.5 Releases coordinados — cuando front y back cambian juntos

> Esta sección aplica únicamente a los casos donde un fix o feature requiere actualizar el backend filial y el desktop **en el mismo release**. No es el caso general: la mayoría de los releases son independientes por componente.

**El problema:**

Si el backend filial y el desktop se despliegan de forma independiente (que es lo correcto por defecto), existe una ventana de tiempo donde el desktop nuevo está hablando con el backend viejo o viceversa. Para un fix urgente que toca ambas capas, esa ventana puede ser problemática.

**La regla:** el backend siempre se despliega antes que el desktop. El backend nuevo debe ser compatible hacia atrás con el desktop viejo durante la ventana de transición. El desktop nuevo con el backend viejo es el escenario a evitar.

**La solución: un workflow orquestador en el nivel de CI/CD — no en las aplicaciones:**

La coordinación vive en el pipeline, no en el código de las aplicaciones. Las aplicaciones no se conocen entre sí. Es el workflow quien secuencia los deploys:

```yaml
# coordinated-release.yml
# Solo se usa cuando hay dependencia explícita entre backend-filial y desktop
# Se dispara manualmente o desde un tag especial (ej. "v3.1.0-coordinated")

jobs:
  deploy-backend-filiales:
    uses: ./.github/workflows/deploy-filial-prod.yml
    # El workflow de filiales ya verifica que cada filial confirme la nueva versión
    # Este job no termina hasta que todas las filiales respondan OK

  deploy-desktop:
    needs: deploy-backend-filiales   # ← espera la confirmación de filiales
    uses: ./.github/workflows/deploy-desktop.yml
    # Publica el latest.yml solo después de que los backends están confirmados
    # El desktop se actualiza en los clientes con la garantía de que el backend ya está listo
```

**El workflow de filiales ya garantiza la confirmación** porque el script `deploy-filiales.sh` no termina hasta que cada filial responde con la versión correcta en `/api/version`. Si alguna falla, el job queda en rojo y el desktop no se despliega.

**Tabla de escenarios:**

| Tipo de release | Workflow a usar | Comportamiento |
|---|---|---|
| Fix o feature solo en backend cloud | `deploy-cloud.yml` | Deploy independiente, no afecta filiales ni desktop |
| Fix o feature solo en backend filial | `deploy-filial-prod.yml` | Deploy independiente, no afecta cloud ni desktop |
| Fix o feature solo en desktop | `deploy-desktop.yml` | Deploy independiente, no afecta backends |
| Fix o feature solo en mobile | `deploy-mobile.yml` | Deploy independiente, no afecta nada más |
| Fix que toca backend filial + desktop | `coordinated-release.yml` | Backend primero, desktop espera confirmación |

**Lo que NO se hace:** agregar lógica en el código del desktop para consultar la versión del backend antes de aplicar su propia actualización. Eso crea acoplamiento en runtime entre dos aplicaciones que deben ser independientes. La coordinación es responsabilidad del pipeline de CI/CD, no de las aplicaciones.

---

## 5. Gestión de entornos y rollout gradual

### 5.1 Definición de entornos

| Entorno | Infraestructura | Propósito | Audiencia |
|---|---|---|---|
| Alpha | Backend cloud (endpoint `/alpha`) + empresa laboratorio | Validación interna post-merge | Equipo de desarrollo |
| Beta | Backend cloud (endpoint `/beta`) + filiales seleccionadas | Validación con usuarios reales | 1–3 empresas de baja criticidad |
| Producción | Backend cloud principal + todas las filiales | Operación real | Todas las empresas |

> **Nota:** La separación de entornos en el backend cloud puede implementarse como perfiles de Spring Boot (`@Profile`) servidos en el mismo droplet en puertos distintos, o como droplets separados dependiendo del presupuesto y del nivel de aislamiento requerido.

### 5.2 Flujo de promoción entre entornos

```
1. Developer crea feature/* y abre PR hacia develop
   └─ CI ejecuta tests — debe pasar para poder mergear

2. Merge a develop
   └─ Deploy automático a Alpha
   └─ Tag: 1.3.0-alpha.4
   └─ Cloud: rsync + systemctl restart + health check
   └─ Filial laboratorio: push directo vía ZeroTier → confirmación en segundos
   └─ Equipo valida en empresa laboratorio (tiempo mínimo: definible)

3. Se crea rama release/1.3.0 desde develop
   └─ Deploy automático a Beta
   └─ Tag: 1.3.0-beta.1
   └─ Filiales canal beta: push directo vía ZeroTier
   └─ Empresas beta validan (período sugerido: 24–72 hs)

4. Fixes detectados en beta se agregan a release/1.3.0
   └─ Cada push genera 1.3.0-beta.2, 1.3.0-beta.3, etc.

5. PR de release/1.3.0 → main, aprobación manual requerida
   └─ Deploy automático a Producción
   └─ Tag: 1.3.0
   └─ Filiales producción: push directo vía ZeroTier (en paralelo, con estado en tiempo real)
   └─ Filiales offline: job de reconciliación reintenta cuando vuelven a estar disponibles

6. Cherry-pick de release/1.3.0 a develop para sincronizar fixes
```

### 5.3 Configuración de empresas por canal

La asignación de canal se gestiona en la base de datos cloud:

```sql
-- Tabla de configuración por empresa
CREATE TABLE empresa_config (
  empresa_id    UUID PRIMARY KEY,
  nombre        VARCHAR(255),
  update_channel VARCHAR(20) DEFAULT 'production',  -- alpha | beta | production
  auto_update   BOOLEAN DEFAULT TRUE,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

Esto permite cambiar el canal de una empresa sin tocar configuración local, y crear una interfaz de administración para gestionar el rollout desde el servidor cloud.

---

## 6. Herramientas del stack

| Herramienta | Propósito | Licencia / Costo |
|---|---|---|
| **GitHub Actions** | Motor de CI/CD | Gratuito hasta 2000 min/mes (plan Free); self-hosted runners gratuitos |
| **semantic-release** | Versionamiento automático y generación de CHANGELOG | MIT |
| **Conventional Commits** | Estándar de mensajes de commit | Especificación abierta |
| **Commitlint** | Validación de mensajes de commit en CI y pre-push | MIT |
| **Husky** | Git hooks (pre-push, commit-msg) | MIT |
| **electron-builder** | Build y distribución de app desktop | MIT |
| **electron-updater** | Auto-actualización de app desktop | MIT |
| **Fastlane** | Automatización de build y distribución mobile | MIT |
| **ZeroTier** | Red privada virtual para alcanzar filiales desde el droplet | Gratuito hasta 25 nodos |
| **n8n** (opcional) | Orquestación de workflows y notificaciones | Apache 2.0 (self-hosted gratuito) |

**Dependencias de configuración requeridas:**

- GitHub Secrets por repositorio: credenciales SSH al droplet, credenciales SSH desde el droplet a cada filial, certificado de firma de código, JSON key de Play Store.
- Spring Boot Actuator habilitado en ambos backends para los health checks.
- ZeroTier instalado y configurado en el droplet y en cada servidor filial.
- Usuario de deploy SSH en cada filial con permisos mínimos (solo puede copiar el JAR, ejecutar los scripts de apply-update y rollback, y consultar `/api/version`).
- Endpoint `GET /api/version` en el backend filial para verificación post-deploy.

---

## 7. Integración con Jira y notificaciones

### 7.1 Jira

**Referencia de tickets en commits:**

```
feat(ventas): agregar filtro por sucursal en reporte diario

Closes JIRA-245
Related: JIRA-231
```

**semantic-release** puede configurarse con el plugin `semantic-release-jira-releases` para:
- Crear automáticamente una versión en Jira al tagear.
- Transicionar tickets referenciados en los commits al estado "Done".
- Adjuntar el CHANGELOG generado a la versión de Jira.

### 7.2 Notificaciones al grupo de WhatsApp

Se utiliza la API de **Callmebot** (gratuita) o **Twilio WhatsApp** para notificaciones automáticas desde los workflows de GitHub Actions:

**Step de notificación en el workflow:**

```yaml
- name: Notify WhatsApp
  if: always()
  run: |
    STATUS="${{ job.status }}"
    VERSION="${{ steps.semantic.outputs.new_release_version }}"
    MSG="$( [ "$STATUS" = "success" ] && echo "✅ Deploy exitoso" || echo "❌ Deploy fallido" ) — v${VERSION} en ${{ env.ENVIRONMENT }}. ${{ github.server_url }}/${{ github.repository }}/releases/tag/v${VERSION}"
    curl -s "https://api.callmebot.com/whatsapp.php?phone=${{ secrets.WA_PHONE }}&text=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${MSG}'))")&apikey=${{ secrets.WA_APIKEY }}"
```

**Formato de mensaje sugerido:**

```
✅ v1.3.0 desplegado en Producción
Backend cloud + 12 filiales + Desktop + Mobile
Cambios: feat(ventas), fix(cobros), fix(sync)
Ver release: https://github.com/org/repo/releases/tag/v1.3.0
```

### 7.3 Notificaciones de rollback

En caso de rollback automático, la notificación se marca con urgencia distinta:

```
🔴 ROLLBACK ejecutado — v1.3.0 en Backend Cloud
Causa: health check falló después de 60s
Versión activa restaurada: v1.2.9
Ver logs: <link al run de Actions>
Acción requerida: revisar el run y abrir ticket en Jira
```

---

## 8. Hoja de ruta de implementación

La implementación se divide en cuatro fases para minimizar el riesgo sobre el sistema en producción actual. Cada fase es independiente y entrega valor por sí sola.

### Fase 1 — Normalización (semanas 1–2)

**Objetivo:** Establecer el estándar de commits y versionamiento automático sin tocar el proceso de deploy.

- [ ] Adoptar Conventional Commits en todos los repositorios (acuerdo de equipo).
- [ ] Instalar y configurar Commitlint + Husky en cada repo (hook `commit-msg`).
- [ ] Agregar check de Commitlint en CI (GitHub Actions) para todos los PRs.
- [ ] Instalar y configurar semantic-release en cada repo.
- [ ] Verificar que semantic-release genera correctamente tags, CHANGELOG y GitHub Releases.
- [ ] Configurar reglas de protección de ramas en GitHub (`main`, `develop`).
- [ ] Documentar el flujo de ramas con el equipo.

**Criterio de éxito:** El merge a `develop` genera automáticamente un tag `x.x.x-alpha.n` y un CHANGELOG sin intervención manual.

### Fase 2 — Backend cloud (semanas 3–5)

**Objetivo:** Automatizar completamente el deploy del servidor cloud con rollback.

- [ ] Habilitar Spring Boot Actuator en el backend cloud.
- [ ] Crear usuario SSH dedicado para deploys con permisos mínimos.
- [ ] Configurar GitHub Secrets (SSH key, host, usuario).
- [ ] Implementar workflows: `ci.yml`, `deploy-alpha.yml`, `deploy-prod.yml`.
- [ ] Implementar lógica de backup + health check + rollback en el workflow.
- [ ] Configurar notificaciones WhatsApp desde el workflow.
- [ ] Hacer un primer deploy automatizado en horario de bajo tráfico y validar.

**Criterio de éxito:** Un merge a `develop` despliega el backend cloud automáticamente. Un deploy que falla el health check revierte solo.

### Fase 3 — Backend filial vía ZeroTier (semanas 6–8)

**Objetivo:** Eliminar el acceso manual a cada servidor de tienda mediante push directo desde el droplet como jump host.

- [ ] Verificar que ZeroTier está instalado y activo en el droplet y en todas las filiales.
- [ ] Crear usuario SSH de deploy en cada filial con permisos mínimos.
- [ ] Agregar el endpoint `GET /api/version` al backend filial.
- [ ] Crear los scripts `apply-update.sh` y `rollback.sh` en cada filial.
- [ ] Crear el script `deploy-filiales.sh` en el droplet.
- [ ] Agregar la columna `zerotier_ip` y `update_channel` a la tabla de empresas si no existe.
- [ ] Crear la tabla `filial_deploy_status` para tracking en tiempo real.
- [ ] Implementar los workflows `deploy-filial-alpha.yml`, `deploy-filial-beta.yml`, `deploy-filial-prod.yml`.
- [ ] Implementar el job de reconciliación (cron) para filiales offline.
- [ ] Probar el flujo completo en la empresa laboratorio (canal alpha).
- [ ] Implementar `coordinated-release.yml` para releases que tocan filial + desktop.

**Criterio de éxito:** Un merge a `develop` despliega el backend filial de la empresa laboratorio automáticamente en segundos, con confirmación de versión verificada. Un deploy a producción muestra el estado de cada filial en tiempo real en el log del workflow.

### Fase 4 — Apps desktop y mobile (semanas 9–11)

**Objetivo:** Automatizar la distribución de las apps de cara al usuario.

- [ ] Configurar `electron-updater` en la app desktop.
- [ ] Configurar los tres canales de actualización (`alpha`, `beta`, `latest`).
- [ ] Obtener y configurar el certificado de firma de código para Windows.
- [ ] Implementar el workflow de build y publicación de Electron.
- [ ] Probar la actualización automática en un equipo de prueba (Windows y Linux).
- [ ] Instalar y configurar Fastlane en el repositorio mobile.
- [ ] Crear la Service Account en Google Play Console y obtener el JSON key.
- [ ] Implementar el workflow de deploy mobile con los tres tracks.
- [ ] Probar el flujo completo en el track Internal Testing.

**Criterio de éxito:** Un merge a `main` despliega automáticamente la app desktop (actualización silenciosa en clientes) y sube el AAB a Play Store track de producción.

---

## 9. Integración futura con agentes IA

### 9.1 Revisión de código asistida por IA

**Herramientas recomendadas (integración nativa con GitHub):**

- **CodeRabbit:** Comenta automáticamente en PRs con análisis de calidad, bugs potenciales, sugerencias de tests y resumen de cambios. Plan gratuito disponible.
- **Ellipsis:** Similar a CodeRabbit, con foco en calidad y seguridad. Opción open source disponible.

Ambas herramientas se activan como GitHub Apps y no requieren infraestructura adicional.

### 9.2 Orquestación de workflows con n8n

**n8n** (self-hosted en el droplet existente) como hub de integración entre:

- GitHub webhooks (eventos de deploy, PRs, fallos de CI).
- Jira (apertura y transición automática de tickets).
- WhatsApp / Slack / Discord (notificaciones del equipo).
- Logs de servidores (alertas correlacionadas con versiones).

**Flujo de ejemplo — deploy fallido en producción:**

```
GitHub webhook (workflow_run failed)
  └─► n8n recibe el evento
        ├─► Extrae los logs del run vía API de GitHub
        ├─► Abre ticket en Jira con tipo "Incident" y los logs adjuntos
        ├─► Notifica al grupo de WhatsApp con el enlace al ticket
        └─► Ejecuta el rollback vía SSH si no se activó automáticamente
```

### 9.3 Agente de monitoreo y correlación

En una segunda iteración, un agente basado en **LangGraph** o **Goose** (Block, open source) puede:

- Monitorear continuamente los logs de todos los servidores filiales.
- Detectar patrones de error correlacionados con versiones específicas (ej. "el 80% de las filiales en v1.3.0 reportan el mismo stack trace").
- Abrir automáticamente un PR con el fix sugerido o al menos con el diagnóstico completo.
- Proponer si una versión en beta debería ser retenida antes de llegar a producción.

Este agente actúa como cualquier `feature/*` branch: sus PRs pasan por el mismo pipeline de revisión y aprobación humana, sin saltear el proceso establecido.

### 9.4 Asistente de Conventional Commits

Un script simple (o un agente liviano) que, dado el diff de un commit, sugiere automáticamente el mensaje en formato Conventional Commits correcto. Puede integrarse como:

- Hook de `prepare-commit-msg` en el repositorio local.
- Comentario automático en PRs cuando el mensaje de commit no es suficientemente descriptivo.

---

## 10. Consideraciones de seguridad

- **Secretos:** Todas las credenciales (SSH keys, certificados, JSON keys, tokens de API) se almacenan como **GitHub Secrets** cifrados, nunca en el código fuente.
- **Usuario de deploy en el droplet:** Permisos mínimos — solo puede ejecutar los scripts de deploy hacia filiales. Sin acceso root directo.
- **Usuario de deploy en cada filial:** Permisos mínimos — solo puede escribir en el directorio de staging, ejecutar `apply-update.sh`, `rollback.sh`, y reiniciar el servicio específico. Sin acceso root directo.
- **Integridad de JARs:** El workflow calcula el SHA-256 del JAR antes de transferirlo. El script `apply-update.sh` en la filial verifica el hash antes de reemplazar el JAR activo.
- **ZeroTier como perímetro:** Solo los nodos autorizados en la red ZeroTier pueden conectarse a las filiales. El droplet actúa como único punto de entrada de deploys — ninguna otra máquina tiene acceso SSH a las filiales vía ZeroTier.
- **Firma de código:** La app desktop Windows se firma con un certificado de Code Signing para evitar advertencias del sistema operativo y garantizar la autenticidad.
- **Rotación de secrets:** Definir una política de rotación periódica para las credenciales de deploy (sugerido: cada 90 días).
- **Acceso a Play Console:** La Service Account de Google Play Console se crea con permisos mínimos (solo release manager), no como cuenta de propietario.
- **Independencia de componentes:** El backend cloud no tiene ningún endpoint ni responsabilidad relacionada con el deploy de filiales. Si el backend cloud tiene un problema, la capacidad de deployar filiales no se ve afectada.

---

## 11. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Filial offline al momento del deploy | Alta | Bajo | Job de reconciliación reintenta automáticamente cuando la filial vuelve a estar disponible. El resto de filiales no se ve afectado. |
| Nodo ZeroTier de una filial desconectado | Media | Medio | El script marca la filial como `pending` y continúa. La reconciliación detecta cuando ZeroTier vuelve a estar activo. Alertar al equipo si la filial sigue pendiente después de N horas. |
| Rollback automático falla (JAR anterior también corrupto) | Baja | Alto | Mantener los últimos 3 JARs en el directorio de staging del droplet. El rollback puede copiarse desde el droplet si el local está corrupto. |
| Secrets expuestos accidentalmente en logs de CI | Baja | Alto | GitHub enmascara automáticamente los secrets en los logs. Nunca loguear variables de entorno completas. |
| Release coordinado (filial + desktop) con filiales incompletas | Media | Medio | `coordinated-release.yml` no despliega el desktop hasta que el job de filiales termina con todas en OK. Si alguna falla, el desktop no se actualiza y se notifica al equipo. |
| Certificado de firma de código expirado (Windows) | Baja | Medio | Configurar alerta en el calendario del equipo 60 días antes del vencimiento. |
| Fallo del workflow de Fastlane por cambios en la API de Play Store | Baja | Bajo | Fastlane se mantiene actualizado como parte del proceso de mantenimiento mensual. |

---

## 12. Preguntas abiertas

Estos puntos requieren decisiones del equipo antes de iniciar la implementación:

1. **Separación de entornos backend cloud:** ¿Se usan perfiles de Spring Boot en el mismo droplet o se provisiona un segundo droplet para alpha/beta? La opción de droplet separado tiene mayor costo pero mayor aislamiento.

2. **Usuario SSH en filiales:** ¿Se crea un usuario de deploy dedicado en cada filial manualmente, o se automatiza su creación con un script de onboarding para nuevas filiales?

3. **Actualizaciones obligatorias:** ¿Qué criterio determina que un release es `coordinated-release` (filial + desktop juntos)? ¿Solo los cambios de contrato de API? ¿Cualquier cambio que afecte el modelo de datos compartido?

4. **Canal beta:** ¿Qué empresas se seleccionan inicialmente para el canal beta? ¿Cuál es el período mínimo de validación antes de promover a producción?

5. **Rollout de la app mobile:** ¿Se acepta el rollout inicial del 10% en producción, o se prefiere liberar al 100% desde el primer momento (mayor riesgo)?

6. **Filiales offline — umbral de alerta:** ¿Cuántas horas puede estar una filial con un deploy pendiente antes de que el equipo reciba una alerta por WhatsApp? ¿1 hora? ¿Al inicio del día siguiente?

7. **Estrategia para la app web futura:** ¿Se planifica desde ahora el cuarto workflow de deploy para una futura app web (ej. deploy a DigitalOcean App Platform o Netlify), o se agrega cuando el proyecto comience?

8. **Minutos de GitHub Actions:** Con cuatro repositorios y múltiples deploys diarios, ¿es suficiente el plan Free de GitHub (2000 min/mes) o conviene configurar un self-hosted runner en el droplet existente?

---

## Apéndice — Referencias

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [semantic-release Documentation](https://semantic-release.gitbook.io/)
- [electron-builder — Publish](https://www.electron.build/configuration/publish)
- [electron-updater — Auto Update](https://www.electron.build/auto-update)
- [Fastlane supply — Play Store](https://docs.fastlane.tools/actions/supply/)
- [GitHub Actions — Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/reference/actuator/index.html)
- [n8n Documentation](https://docs.n8n.io/)
- [CodeRabbit](https://coderabbit.ai/)

---

*Documento actualizado el 2026-03-24 (v1.1.0). Cambios principales: modelo de filiales migrado de polling a push directo vía ZeroTier; sección 4.5 de releases coordinados agregada; independencia de componentes explicitada en todas las secciones.*
