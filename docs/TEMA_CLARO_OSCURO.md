# Modo claro y modo oscuro

La app tiene **dos temas**: oscuro (por defecto) y claro. El usuario los alterna con el botón de la luna en
el header y la elección queda guardada en esa PC. Toda pantalla nueva, y toda pantalla que se toque, tiene
que verse bien en los dos.

La regla es una sola: **los colores neutros (fondos, textos, bordes, hover, sombras) se escriben con los
tokens `--frc-*` de `src/styles.scss`, nunca con un gris o un blanco fijo.** Los tokens cambian de valor
según el tema; un `#2d2d2d` o un `rgba(255, 255, 255, 0.6)` no, y la pantalla queda negra en modo claro.

---

## 1. Cómo funciona

- `TemaService` (`src/app/shared/services/tema.service.ts`) pone la clase `darkMode` o `lightMode` en
  `<html>` y guarda la preferencia en `localStorage` (`frc-tema`). Como la clase está en `<html>`, llega
  también a diálogos, menús y selects (el contenedor de overlays cuelga del `body`).
- `src/styles.scss` define:
  - el tema de **Angular Material** para cada modo (claro por defecto, oscuro bajo `.darkMode`);
  - los **tokens `--frc-*`**, con un valor para `:root, .darkMode` y otro para `.lightMode`.
- Los componentes de Material (inputs, tablas, botones, diálogos) cambian solos. Lo que se rompe es el CSS
  propio con colores fijos.

---

## 2. Tokens

Están todos en `src/styles.scss`, bajo el comentario «Tokens de color de la app». Los más usados:

| Token | Para qué | Oscuro | Claro |
|---|---|---|---|
| `--frc-fondo` | fondo de página | `#303030` | `#f4f5f7` |
| `--frc-superficie` | diálogos, cards | `#2d2d2d` | `#ffffff` |
| `--frc-superficie-tabla` | tablas, pies de diálogo | `#333333` | `#ffffff` |
| `--frc-superficie-alta` | tarjeta dentro de un diálogo | `#3a3a3a` | `#f7f8fa` |
| `--frc-superficie-elevada` | tarjeta sobre otra superficie | `#424242` | `#ffffff` |
| `--frc-superficie-baja` | zona hundida | `#222222` | `#eceef1` |
| `--frc-franja` | franja de filtros de las listas | `rgb(32,32,32)` | `#f4f5f7` |
| `--frc-texto-fuerte` | texto principal, valor de un input | `#ffffff` | `#1f1f1f` |
| `--frc-texto` | texto normal | blanco 87 % | negro 87 % |
| `--frc-texto-suave` | texto secundario | blanco 60 % | negro 60 % |
| `--frc-texto-tenue` | placeholder, ayuda | blanco 45 % | negro 45 % |
| `--frc-texto-secundario` / `-terciario` / `-apagado` | grises de texto fijos (`#ccc`, `#bbb`, `#999`) | | |
| `--frc-borde` / `-suave` / `-fuerte` | bordes con transparencia | | |
| `--frc-borde-solido` / `-solido-fuerte` | bordes opacos (`#444`, `#555`) | | |
| `--frc-hover` | fondo de fila o item en hover | | |
| `--frc-relleno-suave` / `-tenue` / `-fuerte` | pastillas, fondos sutiles, deshabilitado | | |
| `--frc-sombra` / `-sombra-suave` | `box-shadow` | | |
| `--frc-tinta` | canal RGB para transparencias (ver abajo) | `255, 255, 255` | `0, 0, 0` |

Hay grupos propios para el menú lateral (`--frc-menu-*`), el encabezado de tablas
(`--frc-encabezado-tabla*`), el paginador, el scroll y los dashboards (`--frc-dash-*`).

**Si falta un token**, se agrega en los **dos** bloques de `styles.scss` (`:root, .darkMode` y
`.lightMode`), con un comentario de para qué sirve. No inventar un gris local en el componente.

### `--frc-tinta`: transparencias

Para `rgba(255, 255, 255, x)` (blanco translúcido sobre oscuro) se usa `rgba(var(--frc-tinta), x)` con el
**mismo alfa**: en oscuro sigue siendo blanco y en claro pasa a negro translúcido.

```scss
// antes
border: 1px dashed rgba(255, 255, 255, 0.15);
// después
border: 1px dashed rgba(var(--frc-tinta), 0.15);
```

---

## 3. Qué **no** cambia con el tema

- **Colores de marca:** el rojo del header y el degradé violeta.
- **Colores de estado y acento:** verde (`#43a047`, `#4caf50`), naranja (`#f57c00`, `#ffa726`), rojo
  (`#f44336`), azul de info. Se ven bien en los dos fondos y se dejan fijos.
- **Texto sobre un color de estado:** el blanco del texto de un botón verde, o el trazo de un spinner
  dentro de ese botón, queda `white`, porque el fondo verde no cambia.

---

## 4. Pasar un color fijo a token

Equivalencias usadas hasta ahora (el valor oscuro queda igual o a uno o dos tonos):

| Color fijo (modo oscuro) | Token |
|---|---|
| `#202020`, `rgb(32, 32, 32)` | `--frc-franja` |
| `#2d2d2d`, `#2e2e2e` | `--frc-superficie` |
| `#333333` | `--frc-superficie-tabla` |
| `#3a3a3a`, `#3c3c3c` | `--frc-superficie-alta` |
| `#404040`, `#424242`, `#464646` | `--frc-superficie-elevada` |
| `#ffffff`, `white` (texto) | `--frc-texto-fuerte` |
| `#cccccc` / `#bbbbbb` / `#999999` (texto) | `--frc-texto-secundario` / `-terciario` / `-apagado` |
| `rgba(255, 255, 255, x)` | `rgba(var(--frc-tinta), x)` |

Si el SCSS tiene variables al principio (`$superficie: #3a3a3a;`), alcanza con cambiar el valor de la
variable por el token (`$superficie: var(--frc-superficie-alta);`).

### Hover sobre una superficie

Para aclarar un poco una tarjeta en hover, no poner otro gris fijo: superponer un velo con
`background-image`, que funciona en los dos modos.

```scss
&:hover {
    background-image: linear-gradient(var(--frc-relleno-suave), var(--frc-relleno-suave));
}
```

No usar `color-mix()`: Electron 22 trae Chromium 108 y no lo soporta (llega en 111).

---

## 5. Trampas conocidas

- **`panelClass: 'darkMode'` en un diálogo** lo deja oscuro aun en modo claro. No usarlo: el tema ya llega
  desde `<html>`.
- **Estilos compartidos entre componentes.** Un `styleUrls` puede apuntar al SCSS de otro componente (ej.
  `verificar-transporte-dialog` usa `ruta-hoja.component.scss`). Si una pantalla sigue oscura y su SCSS
  está limpio, revisar `styleUrls`.
- **Clases globales en `styles.scss`.** Algunos estilos viven ahí (ej. `transferencia-input-field`, los
  inputs de búsqueda de Compras). Buscar la clase del elemento en `src/styles.scss` antes de tocar el
  componente.
- **Estilos inline en el HTML** (`style="background-color: rgb(70, 70, 70)"`): también cuentan. Pasarlos
  a token o, mejor, al SCSS.
- **Gráficos ECharts.** ECharts dibuja en canvas y no lee variables CSS. Usar `GRAFICO_COLORES` de
  `src/app/shared/utils/grafico-echarts.theme.ts` y mostrar el gráfico con `frc-grafico-shell`, que ya
  aplica `opcionesSegunTema()` y cambia los grises en modo claro. Un gris fuera de `GRAFICO_COLORES` no se
  traduce.
- **Reportes PDF (Jasper) y tickets** no dependen del tema: no aplica.

---

## 6. Checklist antes de dar por terminada una pantalla

1. Buscar en el SCSS, el HTML y los `styleUrls` del componente: `#2`, `#3`, `#4`, `rgb(`, `rgba(255`,
   `white`. Todo lo neutro pasa a token.
2. Abrir la pantalla en **modo claro**: fondos, textos, inputs, diálogos y menús legibles.
3. Volver al **modo oscuro**: se ve igual que antes.
4. `npm run check`.

---

## 7. Estado

El modo claro llegó en 2026-10 y la migración se hace **de a pocas pantallas por tanda**. A esa fecha
quedaban unos 140 archivos de `src/app` con grises o blancos fijos de modo oscuro: cuando se toque uno de
ellos, conviene pasarlo a tokens en el mismo cambio.
