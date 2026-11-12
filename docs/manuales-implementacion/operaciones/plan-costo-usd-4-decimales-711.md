# Plan — costo en moneda extranjera con hasta 4 decimales (desktop #711)

Rama: `fix/compras-costo-4-decimales` desde `develop` (2eeba330). Solo desktop.

## Qué pasa

Con COMPRAS/COSTOS en Dólar, el precio del ítem del pedido (`add-edit-item-dialog`) y de la nota de
recepción (`edit-nota-recepcion-item-dialog`) usa `MonedaService.currencyOptionsByMoneda(moneda)`:
precisión = decimales de la moneda (2 en USD). No se puede cargar 0,8125. El runbook «Moneda por
módulo» (C2) pide hasta 4 decimales y el costeo ya guarda 4 (`costo_medio_costeo` 0,8378).

Además, el costo sugerido al elegir el producto se redondea a los decimales de la moneda
(`Math.pow(10, moneda.decimales ?? 2)`): 0,8378 entra como 0,84.

## Análisis (paso 3)

- Central: `pedido_item.precio_unitario_*` es `numeric` sin escala; `nota_recepcion_item.precio_unitario_en_nota`
  es `double precision`. Ni `PedidoService` / `NotaRecepcionService` ni las entidades redondean
  (`git grep setScale|Math.round|redonde` → 0). Guardan los 4 decimales sin cambios en el backend.
- Pedido: precio unitario = precio por presentación ÷ cantidad, sin redondeo. Agrandar la máscara alcanza.
- `ngx-currency` 3.0.0 con `inputMode: FINANCIAL` (el del dólar en todo el sistema): con precisión 4,
  «8125» → 0,8125 y 81,25 se escribe «812500».

## Decisión (Franco, 12/11/2026: FINANCIAL con 4 decimales, sin aviso)

FINANCIAL con precisión 4 (mismo modo que hoy, solo más decimales). Riesgo: quien escribe «8125» para
cargar 81,25 obtiene 0,8125. Lo ve en el campo y en el subtotal antes de guardar. Alternativa: NATURAL
(se escribe el separador), que cambiaría la forma de cargar todos los precios en USD del pedido y de la nota.

## Fase 1 — máscara de costo (un commit)

1. `MonedaService.currencyOptionsCostoByMoneda(moneda)`: la máscara de `currencyOptionsByMoneda`,
   con precisión `max(decimales, 4)` cuando la moneda tiene decimales. Guaraní (0) igual que hoy.
2. `add-edit-item-dialog`: `selectedCurrencyOptions` (precio por presentación y unitario) usa la de
   costo; el costo sugerido se redondea a la precisión de esa máscara; el «Precio anterior» se
   muestra con esos decimales (hoy `1.0-0`: 0,8125 USD se ve «1»).
3. `edit-nota-recepcion-item-dialog`: `precioOptions` usa la de costo; costo sugerido igual que (2).
4. Mostrar el costo unitario con hasta 4 decimales donde hoy se corta: columna «Precio» de la lista
   del pedido (`gestion-compras.component.html:972`, formato aparte del de subtotal y total) y el
   precio de `distribute-item-dialog` / `distribute-nota-recepcion-item-dialog` (`html:57`, hoy `1.0-2`).
5. Subtotales y totales: siguen con los decimales de la moneda (son montos, no costos unitarios).

**Tests:** `moneda.service.spec.ts` (Guaraní 0 → igual; USD 2 → 4; moneda con 4 o más → la suya).
El desktop no corre Karma en CI: se ejecuta acotado al spec, como dice la memoria del repo.

## Datos nuevos

Ninguno: no hay columnas, campos ni claves nuevas. Cambia la cantidad de decimales que el desktop
deja escribir y que ya se guardaban.

## Prueba por pantalla (paso 9)

Desktop web local contra central local con un pedido y una nota en USD:
- Pedido → ítem: precio por presentación 0,8125 → guarda 0,8125 (verificar en la base); costo sugerido con 4 decimales.
- Pedido en Gs: la máscara sigue sin decimales.
- Nota de recepción en USD → editar ítem: precio 0,8125 → guarda 0,8125.
- Nota en Gs: sin cambios.

- Editar un ítem existente sin tocar el precio → en la base no cambia (writeValue con 4 decimales).

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| A | La lista del pedido y los diálogos de distribución muestran el costo con 2 decimales (verificado: `gestion-compras.component.html:972`, `.ts:1510`; `distribute-*-dialog.component.html:57`) | Sumado a la fase 1, punto 4 |
| A | Central: `Float` en el schema, `Double` en `NotaRecepcionItem`, `ProrrateoCostoRecepcion` y `RecepcionMercaderiaService` sin redondeo | Confirma que no hace falta tocar el backend |
| A | La comparación de precio de la nota con el pedido tolera 0,001 (`edit-nota-recepcion-item-dialog.ts:393`): una diferencia de 0,0005 no avisa | Se acepta: está por debajo de un centavo |
| B | FINANCIAL ×4 cambia el hábito: «8125» pasa de 81,25 a 0,8125 y un costo 100 veces menor entra al costo medio al recepcionar | **Decisión del usuario** (ver «Decisión a confirmar») |
| B | Revertir el desktop no corrige los costos ya guardados | Detección: pedidos/notas en USD posteriores al despliegue con `precio_unitario` < 10 % del costo medio del producto; se corrigen a mano |
| B | Un desktop viejo, al editar y guardar un ítem de 0,8125, lo redondea a 0,81 sin avisar | Se acepta: los desktops se actualizan solos en ≤5 min |
| B | Objetos de máscara compartidos | La función nueva siempre hace copia (`{...}`), nunca muta `currencyOptionsNoGuarani` |

## Sin verificar / fuera de alcance

- Impresiones y reportes del pedido/nota: no revisados.
- Mobile/PWA: no cargan pedidos en USD con este diálogo.
