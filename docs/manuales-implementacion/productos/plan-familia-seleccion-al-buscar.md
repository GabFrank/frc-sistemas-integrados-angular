# Plan — Editar producto: buscar o paginar familias no deselecciona la elegida (#588)

## Problema

En `productos/producto/edit-producto/producto.component.ts`, `onSearchFamilia()` y
`onSearchSubfamilia()` limpian la selección (`onFamiliaSelect(null)` / `onSubfamiliaSelect(null)`)
antes de consultar. Las llaman el filtro (Enter), limpiar el filtro, cerrar el filtro
(`onFilterFamilia` / `onFilterSubfamilia`), el paginador (`handle*PageEvent`), `addSubfamilia` y
`nextFamilia`. Resultado: después de mirar otra página o filtrar, «Siguiente» queda deshabilitado
aunque la cabecera siga mostrando la familia elegida.

## Cambio (una fase, solo este componente)

1. `onSearchFamilia()`: no limpiar la selección. Al llegar el resultado:
   - si trae una sola familia, se elige (igual que hoy);
   - si no, y hay una familia elegida, `expandedElementFamilia` se re-apunta a la fila con el mismo
     `id` (o `null` si no está en la página). Hace falta porque el resaltado de la fila compara por
     referencia (`expandedElementFamilia === element`) y cada consulta trae objetos nuevos.
2. `onSearchSubfamilia()`: limpiar la subfamilia **solo si es de otra familia**
   (`selectedSubfamilia?.familia?.id != selectedFamilia.id`). Así paginar o filtrar la conserva, y
   cambiar de familia y pulsar «Siguiente» (`nextFamilia` → `onFilterSubfamilia`) la sigue
   limpiando. La consulta `subfamiliasSearch` y la del producto traen `familia { id }`. Si una
   subfamilia llegara sin `familia`, se limpia: el comportamiento de hoy.
   El resaltado de subfamilia ya compara por `id`; no se toca.
3. Sin familia elegida se mantiene el corte que vacía la lista de subfamilias (se corrige solo el
   comentario, que decía que filtrar familias deselecciona).

Fuera de alcance: la elección automática cuando el filtro deja un solo resultado (se conserva);
saltar de paso por la cabecera del stepper sin «Siguiente» (no cambia).

## Auditoría del plan (paso 5)

- **Eje B — respuestas fuera de orden (aplicado):** una búsqueda de subfamilias de la familia A que
  llega después de cambiar a B con un solo resultado dejaba elegida una subfamilia de A, que
  `onProductoSave` guarda sin cruzar familias. Ya pasaba antes; se cierra en el mismo método: la
  respuesta se descarta si la familia consultada ya no es la elegida. La carrera equivalente en
  familias es visual (la cabecera muestra la elegida) y no se toca.
- **Eje A — llamadores y fuentes (sin cambios):** todos los llamadores quedan bien; toda fuente de
  subfamilia (`subfamiliasSearch`, `saveSubfamilia`, `CONSULTA_PRODUCTO`) trae `familia { id }`;
  ids `ID` de GraphQL, `==` seguro. Deuda preexistente anotada, fuera de alcance: clic en otra
  familia y salto por la cabecera del stepper sin «Siguiente» conserva la subfamilia anterior.

## Datos nuevos

Ninguno: no hay campos, columnas ni claves nuevas.

## Tests

`N/A para desktop porque el CI no corre tests` (ciclo §1 paso 7). Gate: `npm run check`.
Prueba por pantalla (desktop web contra central local), producto nuevo y producto existente:

- elegir familia → página 2 → volver → filtro → limpiar filtro → cerrar filtro: «Siguiente» sigue
  habilitado y la fila se resalta al volver a su página;
- filtro que deja una sola familia: queda elegida esa;
- subfamilia: elegir → paginar/filtrar: se conserva;
- volver a Familia, elegir otra y «Siguiente»: la subfamilia se limpia y la lista es de la nueva;
- producto existente: Atrás hasta Familia, «Siguiente» con la misma familia: la subfamilia se
  conserva (hoy se perdía).

## Sin verificar

Electron (no aplica: no hay IPC en este cambio).
