# Plan de Pruebas - Tab Recepción Documental

## Pruebas Básicas (Solicitadas)

### 1. Crear una nueva nota con todos los items
**Objetivo:** Verificar que se puede crear una nota asignando todos los items pendientes del pedido.

**Pasos:**
1. Navegar al tab "Recepción Documental" (tab 3)
2. Verificar que hay items pendientes en el panel izquierdo
3. Seleccionar "Seleccionar todos" en el panel de items pendientes
4. Click en "Crear Nueva Nota para Items Seleccionados"
5. En el diálogo de confirmación, seleccionar "Todos" (asignar todos los items)
6. Completar el formulario de la nota:
   - Tipo de Boleta: FACTURA
   - Número: 001-001-0001234
   - Timbrado: 12345678 (opcional)
   - Fecha: Fecha actual
   - Moneda: Seleccionar moneda
   - Cotización: 1
7. Guardar la nota
8. Verificar que:
   - La nota aparece en el panel derecho
   - Los items pendientes desaparecen del panel izquierdo (o muestran cantidad pendiente 0)
   - El monto total de la nota es correcto
   - El contador de notas se actualiza

**Resultado esperado:** Nota creada exitosamente con todos los items asignados.

---

### 2. Eliminar la nota / Desvincular items
**Objetivo:** Verificar que se puede eliminar una nota y que los items se desvinculan correctamente.

**Pasos:**
1. Tener una nota creada con items asignados
2. Click en "Eliminar" en la nota
3. Confirmar eliminación
4. Verificar que:
   - La nota desaparece del panel derecho
   - Los items vuelven a aparecer en el panel izquierdo con su cantidad pendiente restaurada
   - El contador de notas se actualiza
   - El contador de items pendientes se actualiza

**Resultado esperado:** Nota eliminada y items desvinculados correctamente.

---

### 3. Crear una nota con algunos items
**Objetivo:** Verificar que se puede crear una nota asignando solo algunos items seleccionados.

**Pasos:**
1. Navegar al tab "Recepción Documental"
2. Seleccionar algunos items específicos (no todos) en el panel izquierdo
3. Click en "Crear Nueva Nota para Items Seleccionados"
4. En el diálogo de confirmación, seleccionar "Seleccionados" (solo items de la página actual)
5. Completar el formulario de la nota
6. Guardar la nota
7. Verificar que:
   - La nota aparece en el panel derecho
   - Solo los items seleccionados desaparecen del panel izquierdo
   - Los items no seleccionados siguen apareciendo con su cantidad pendiente original
   - El monto total de la nota corresponde solo a los items asignados

**Resultado esperado:** Nota creada con solo los items seleccionados.

---

### 4. Eliminar la nota (con algunos items)
**Objetivo:** Verificar eliminación de nota con items parciales.

**Pasos:**
1. Tener una nota creada con algunos items
2. Eliminar la nota
3. Verificar que los items vuelven al panel izquierdo

**Resultado esperado:** Items restaurados correctamente.

---

### 5. Crear la nota vacía e vincular items uno a uno
**Objetivo:** Verificar flujo de crear nota vacía y luego asignar items individualmente.

**Pasos:**
1. Click en "Crear Nueva Nota" (sin items seleccionados)
2. Completar el formulario de la nota (sin items)
3. Guardar la nota vacía
4. Verificar que la nota aparece en el panel derecho sin items
5. Seleccionar un item en el panel izquierdo
6. Seleccionar la nota en el panel derecho
7. Click en "Asignar Items a la Nota"
8. Verificar que:
   - El item se asigna a la nota
   - El item desaparece del panel izquierdo
   - La nota muestra el item en su lista
   - El monto total de la nota se actualiza
9. Repetir pasos 5-8 para asignar más items uno por uno

**Resultado esperado:** Nota vacía creada y items asignados individualmente correctamente.

---

### 6. Eliminar nota (nota con items asignados uno a uno)
**Objetivo:** Verificar eliminación de nota con items asignados individualmente.

**Pasos:**
1. Tener una nota con items asignados uno por uno
2. Eliminar la nota
3. Verificar que todos los items vuelven al panel izquierdo

**Resultado esperado:** Todos los items restaurados.

---

### 7. Dividir item (crear dos items a partir de uno)
**Objetivo:** Verificar que se puede dividir un item en múltiples items asignados a diferentes notas.

**Pasos:**
1. Tener un item con cantidad pendiente > 0
2. Click en "Dividir Item" en el item
3. En el diálogo:
   - Seleccionar presentación
   - Crear al menos 2 divisiones con diferentes cantidades
   - Asignar cada división a una nota diferente (o la misma)
4. Guardar
5. Verificar que:
   - El item original muestra cantidad pendiente reducida
   - Se crean nuevos NotaRecepcionItem en las notas seleccionadas
   - La suma de las cantidades divididas no excede la cantidad pendiente original
   - Si se excede, debe mostrar advertencia

**Resultado esperado:** Item dividido correctamente en múltiples items.

---

### 8. Rechazar item
**Objetivo:** Verificar que se puede rechazar un item creando una nota de rechazo.

**Pasos:**
1. Tener un item con cantidad pendiente > 0
2. Click en "Rechazar Item"
3. En el diálogo:
   - Seleccionar nota de recepción (o crear nueva)
   - Ingresar motivo de rechazo (requerido)
   - Ingresar observaciones (opcional)
   - Seleccionar cantidad a rechazar
   - Seleccionar presentación
4. Guardar
5. Verificar que:
   - Se crea/actualiza una nota de rechazo (esNotaRechazo = true)
   - El item muestra cantidad pendiente reducida
   - El item rechazado tiene estado RECHAZADO
   - La nota de rechazo no es editable

**Resultado esperado:** Item rechazado correctamente con nota de rechazo.

---

### 9. Editar una nota
**Objetivo:** Verificar que se puede editar los datos de una nota de recepción.

**Pasos:**
1. Tener una nota creada (no de rechazo)
2. Click en "Editar" en la nota
3. Modificar campos editables:
   - Número
   - Timbrado
   - Tipo de Boleta
   - Fecha
   - Moneda
   - Cotización
4. Guardar cambios
5. Verificar que:
   - Los cambios se guardan correctamente
   - La nota actualizada aparece en el panel derecho
   - El monto total se recalcula si es necesario
   - Los items de la nota no se pierden

**Resultado esperado:** Nota editada exitosamente.

---

## Pruebas Críticas Adicionales

### 10. Validación de campos requeridos en nota
**Objetivo:** Verificar que los campos requeridos se validan correctamente.

**Pasos:**
1. Click en "Crear Nueva Nota"
2. Intentar guardar sin completar campos requeridos:
   - Tipo de Boleta (requerido)
   - Número (requerido)
   - Fecha (requerido)
   - Moneda (requerido)
   - Cotización (requerido, mínimo 0)
3. Verificar que se muestran mensajes de error apropiados
4. Completar campos uno por uno y verificar que los errores desaparecen

**Resultado esperado:** Validaciones funcionan correctamente.

---

### 11. Asignación de items con errores parciales
**Objetivo:** Verificar manejo de errores cuando algunos items no se pueden asignar.

**Pasos:**
1. Crear una nota
2. Intentar asignar items que ya están asignados completamente a otra nota
3. Verificar que:
   - Se muestra mensaje de error para items que no se pudieron asignar
   - Los items que sí se pudieron asignar se asignan correctamente
   - Se muestra resumen de errores

**Resultado esperado:** Manejo correcto de errores parciales.

---

### 12. Finalizar conciliación con validaciones
**Objetivo:** Verificar que se puede finalizar la conciliación solo cuando se cumplen las condiciones.

**Pasos:**
1. Verificar condiciones para finalizar:
   - Debe haber al menos una nota registrada
   - La etapa debe ser RECEPCION_NOTA con estado EN_PROCESO
2. Intentar finalizar sin notas:
   - Verificar que el botón está deshabilitado o muestra error
3. Crear al menos una nota
4. Verificar que el botón se habilita
5. Click en "Finalizar Conciliación"
6. Confirmar
7. Verificar que:
   - La etapa avanza a RECEPCION_MERCADERIA
   - El tab de Recepción de Mercadería se habilita
   - Se muestra mensaje de éxito
   - El estado del pedido se actualiza

**Resultado esperado:** Finalización de conciliación con validaciones correctas.

---

### 13. Notas de rechazo (no editables)
**Objetivo:** Verificar que las notas de rechazo no son editables.

**Pasos:**
1. Crear una nota de rechazo (rechazando un item)
2. Intentar editar la nota de rechazo
3. Verificar que:
   - El botón "Editar" no está disponible o muestra error
   - Si se intenta editar, muestra mensaje "Las notas de rechazo no son editables"

**Resultado esperado:** Notas de rechazo protegidas contra edición.

---

### 14. Paginación en items pendientes y notas
**Objetivo:** Verificar que la paginación funciona correctamente.

**Pasos:**
1. Tener más de 10 items pendientes
2. Verificar que aparece paginador
3. Navegar entre páginas
4. Verificar que:
   - Los items se cargan correctamente en cada página
   - La selección se mantiene o se resetea según el diseño
   - El contador de items totales es correcto
5. Repetir para el panel de notas (si hay más de 10 notas)

**Resultado esperado:** Paginación funciona correctamente.

---

### 15. Búsqueda en items pendientes y notas
**Objetivo:** Verificar que la búsqueda filtra correctamente.

**Pasos:**
1. Activar búsqueda en items pendientes
2. Buscar por texto (descripción de producto)
3. Verificar que:
   - Los resultados se filtran correctamente
   - El paginador se resetea
   - La búsqueda es case-insensitive
4. Limpiar búsqueda y verificar que se restauran todos los items
5. Repetir para búsqueda de notas (por número)

**Resultado esperado:** Búsqueda funciona correctamente.

---

### 16. Selección múltiple de items
**Objetivo:** Verificar que la selección múltiple funciona correctamente.

**Pasos:**
1. Seleccionar varios items individualmente
2. Verificar que:
   - Los items seleccionados se marcan visualmente
   - El contador de seleccionados se actualiza
   - Los botones de acción se habilitan
3. Deseleccionar algunos items
4. Verificar que el contador se actualiza
5. Seleccionar "Seleccionar todos"
6. Verificar que todos los items de la página se seleccionan
7. Deseleccionar "Seleccionar todos"
8. Verificar que todos se deseleccionan

**Resultado esperado:** Selección múltiple funciona correctamente.

---

### 17. Estados de items (CONCILIADO, RECHAZADO, etc.)
**Objetivo:** Verificar que los estados de items se muestran y manejan correctamente.

**Pasos:**
1. Crear una nota con items
2. Verificar que los items tienen estado CONCILIADO por defecto
3. Rechazar un item desde dentro de la nota
4. Verificar que:
   - El estado cambia a RECHAZADO
   - Se muestra el motivo de rechazo
   - El item se marca visualmente como rechazado
5. Editar un item y cambiar su estado
6. Verificar que el estado se guarda correctamente

**Resultado esperado:** Estados de items funcionan correctamente.

---

### 18. Edición de items dentro de una nota
**Objetivo:** Verificar que se pueden editar items dentro de una nota.

**Pasos:**
1. Abrir una nota para editar
2. Click en "Editar" en un item de la nota
3. Modificar:
   - Cantidad
   - Precio
   - Presentación
   - Vencimiento
   - Estado
4. Guardar
5. Verificar que:
   - Los cambios se guardan
   - El monto total de la nota se recalcula
   - El item actualizado aparece en la lista

**Resultado esperado:** Edición de items dentro de nota funciona correctamente.

---

### 19. Distribución de items dentro de una nota
**Objetivo:** Verificar que se pueden distribuir items dentro de una nota.

**Pasos:**
1. Abrir una nota para editar
2. Click en "Distribuir" en un item
3. Asignar cantidades a diferentes sucursales
4. Guardar distribución
5. Verificar que:
   - La distribución se guarda
   - El item muestra estado de distribución
   - Las cantidades suman correctamente

**Resultado esperado:** Distribución de items funciona correctamente.

---

### 20. Rechazo de items desde dentro de una nota
**Objetivo:** Verificar que se pueden rechazar items desde el diálogo de edición de nota.

**Pasos:**
1. Abrir una nota para editar
2. Click en "Rechazar" en un item
3. Completar motivo de rechazo y observaciones
4. Guardar
5. Verificar que:
   - El item cambia a estado RECHAZADO
   - Se crea/actualiza nota de rechazo
   - El item se marca visualmente

**Resultado esperado:** Rechazo desde nota funciona correctamente.

---

### 21. Validación de cantidades al dividir items
**Objetivo:** Verificar validaciones de cantidad al dividir items.

**Pasos:**
1. Intentar dividir un item con cantidad pendiente = 5
2. Intentar crear divisiones que sumen más de 5
3. Verificar que:
   - Se muestra advertencia de exceso
   - No permite guardar hasta corregir
4. Crear divisiones que sumen exactamente 5
5. Verificar que permite guardar
6. Crear divisiones que sumen menos de 5
7. Verificar que muestra advertencia pero permite guardar (cantidad restante queda pendiente)

**Resultado esperado:** Validaciones de cantidad funcionan correctamente.

---

### 22. Validación de cantidades al rechazar items
**Objetivo:** Verificar validaciones de cantidad al rechazar items.

**Pasos:**
1. Intentar rechazar más cantidad de la disponible
2. Verificar que muestra error
3. Rechazar cantidad válida
4. Verificar que se guarda correctamente
5. Intentar rechazar el mismo item nuevamente
6. Verificar que la cantidad disponible se actualiza

**Resultado esperado:** Validaciones de cantidad funcionan correctamente.

---

### 23. Manejo de errores en asignación de items
**Objetivo:** Verificar manejo de errores cuando falla la asignación.

**Pasos:**
1. Crear una nota
2. Intentar asignar items que ya están completamente asignados
3. Verificar que:
   - Se muestra mensaje de error específico
   - Los items válidos se asignan
   - Los items inválidos no se asignan
   - Se muestra resumen de errores

**Resultado esperado:** Manejo de errores funciona correctamente.

---

### 24. Actualización de monto total después de operaciones
**Objetivo:** Verificar que el monto total se actualiza correctamente.

**Pasos:**
1. Crear una nota con items
2. Verificar monto total inicial
3. Agregar un item a la nota
4. Verificar que el monto total se actualiza
5. Editar cantidad de un item
6. Verificar que el monto total se recalcula
7. Eliminar un item de la nota
8. Verificar que el monto total se actualiza

**Resultado esperado:** Monto total se actualiza correctamente en todas las operaciones.

---

### 25. Sincronización de datos después de operaciones CRUD
**Objetivo:** Verificar que los datos se sincronizan correctamente después de operaciones.

**Pasos:**
1. Realizar cualquier operación CRUD (crear, editar, eliminar nota)
2. Verificar que:
   - Los paneles se actualizan correctamente
   - Los contadores se actualizan
   - Los items pendientes se recalculan
   - El resumen del pedido se actualiza
   - No hay datos duplicados o inconsistentes

**Resultado esperado:** Sincronización de datos funciona correctamente.

---

### 26. Navegación entre tabs después de operaciones
**Objetivo:** Verificar que la navegación entre tabs funciona correctamente.

**Pasos:**
1. En tab Recepción Documental, crear una nota
2. Navegar a otro tab (ej: Items)
3. Volver al tab Recepción Documental
4. Verificar que:
   - Los datos se cargan correctamente
   - La nota creada aparece
   - Los estados se mantienen

**Resultado esperado:** Navegación entre tabs funciona correctamente.

---

### 27. Primera nota del pedido (actualización de etapa)
**Objetivo:** Verificar que al crear la primera nota, se actualiza la etapa del pedido.

**Pasos:**
1. Tener un pedido en etapa CREACION (completada)
2. Navegar a tab Recepción Documental
3. Crear la primera nota
4. Verificar que:
   - La etapa RECEPCION_NOTA cambia a EN_PROCESO
   - El estado del pedido se actualiza
   - Los tabs se habilitan correctamente

**Resultado esperado:** Actualización de etapa funciona correctamente.

---

### 28. Validación de cotización (mínimo 0)
**Objetivo:** Verificar validación de cotización.

**Pasos:**
1. Crear/editar una nota
2. Intentar ingresar cotización negativa
3. Verificar que muestra error
4. Ingresar cotización = 0
5. Verificar que permite guardar
6. Ingresar cotización > 0
7. Verificar que permite guardar

**Resultado esperado:** Validación de cotización funciona correctamente.

---

### 29. Búsqueda y filtrado combinado
**Objetivo:** Verificar que búsqueda y paginación funcionan juntos.

**Pasos:**
1. Activar búsqueda en items pendientes
2. Buscar un término que devuelve múltiples resultados
3. Navegar entre páginas de resultados
4. Cambiar el término de búsqueda
5. Verificar que:
   - La paginación se resetea
   - Los resultados se actualizan
   - No hay conflictos entre búsqueda y paginación

**Resultado esperado:** Búsqueda y paginación funcionan correctamente juntas.

---

### 30. Performance con muchos items/notas
**Objetivo:** Verificar que el componente maneja bien grandes volúmenes de datos.

**Pasos:**
1. Crear un pedido con muchos items (50+)
2. Crear múltiples notas (10+)
3. Verificar que:
   - La carga inicial es aceptable
   - La paginación funciona correctamente
   - Las operaciones CRUD no se vuelven lentas
   - No hay problemas de memoria

**Resultado esperado:** Performance es aceptable con grandes volúmenes.

---

## Checklist de Validación Final

Después de completar todas las pruebas, verificar:

- [ ] Todas las operaciones CRUD funcionan correctamente
- [ ] Las validaciones se aplican correctamente
- [ ] Los mensajes de error son claros y útiles
- [ ] La sincronización de datos es correcta
- [ ] La UI es responsive y funciona bien
- [ ] No hay errores en la consola del navegador
- [ ] Las notificaciones se muestran correctamente
- [ ] La navegación entre tabs funciona
- [ ] Los estados del pedido se actualizan correctamente
- [ ] El monto total se calcula correctamente en todos los casos

---

## Notas Importantes

1. **Backend debe estar compilado y corriendo** para estas pruebas
2. **Usar datos de prueba realistas** para mejor validación
3. **Verificar la consola del navegador** para errores JavaScript
4. **Verificar la consola del backend** para errores de servidor
5. **Documentar cualquier bug encontrado** con pasos para reproducir
6. **Verificar que los cambios persisten** después de recargar la página
