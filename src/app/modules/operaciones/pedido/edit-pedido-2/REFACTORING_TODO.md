# REFACTORING TODO - EditPedido2Component

## 🚨 PROBLEMAS CRÍTICOS DE RENDIMIENTO

### 1. **Llamadas a funciones en templates (CRÍTICO)**
- **Ubicación**: Verificación del template HTML muestra que BUENA PRÁCTICA ya implementada - se usan propiedades en lugar de funciones
- **Propiedades críticas en template**:
  - `currentStepTrackingInfo` (línea 37-45 HTML)
  - `recepcionNotaStepInfo`, `isRecepcionNotaActive` (líneas 292-294 HTML)
  - `nextButtonTooltip` (línea 315 HTML)
  - `recepcionMercaderiaButtonTooltip` (línea 383 HTML)
- **Problema**: Estas propiedades se recalculan en múltiples métodos, generando over-computation
- **Solución**: Implementar memoization/caching para estas computed properties críticas
- **Prioridad**: ALTA

### 2. **Múltiples setTimeout anidados (RACE CONDITIONS)**
- **Ubicación**: 
  - `loadPedidoData()` líneas ~245-255
  - `fixStepperDisplay()` líneas ~196-208
  - `loadPedidoDataFresh()` líneas ~320-330
- **Problema**: Race conditions, timing impredecible, posibles memory leaks
- **Solución**: Usar `Observables` con `switchMap`, `debounceTime`, y `distinctUntilChanged`
- **Prioridad**: ALTA

### 3. **Change Detection Manual Excessive**
- **Ubicación**: Múltiples llamadas a `cdr.detectChanges()` 
- **Problema**: Fuerza change detection innecesariamente, reduce performance
- **Solución**: Usar `OnPush` change detection strategy y reactive patterns
- **Prioridad**: MEDIA

### 4. **Over-computation de propiedades computed**
- **Ubicación**: `updateComputedProperties()` líneas ~603-650
- **Problema**: Se ejecuta en múltiples eventos, recalculando las mismas propiedades
- **Propiedades afectadas**: 
  - `recepcionNotaStepInfo` recalculada 8+ veces por operación
  - `currentStepTrackingInfo` recalculada en cada cambio de estado
- **Solución**: Implementar caching con invalidación inteligente
- **Prioridad**: ALTA

### 5. **Binding de objetos complejos en template**
- **Ubicación**: Template líneas 37-158 (header con información del pedido)
- **Problema**: Múltiples property accesses anidados (`selectedPedido?.proveedor?.persona?.nombre`)
- **Impacto**: Change detection debe verificar toda la cadena en cada ciclo
- **Solución**: Pre-computar valores del header y usar ChangeDetectionStrategy.OnPush
- **Prioridad**: MEDIA

## 🔄 RACE CONDITIONS IDENTIFICADAS

### 1. **Data Loading Conflicts (CRÍTICO)**
- **Problema**: `loadPedidoData()` y `loadPedidoDataFresh()` pueden ejecutarse simultáneamente
- **Ubicación**: Líneas ~214-255 vs ~287-330
- **Escenario crítico**: User clicks rapidly entre steps while data is loading
- **Consecuencias**: Estado inconsistente, data corruption, UI flickering
- **Evidencia**: Múltiples `setTimeout` chains ejecutándose paralelamente
- **Solución**: Implementar loading state management con cancelación de requests previos usando `switchMap`
- **Prioridad**: ALTA

### 2. **Stepper Display Race**
- **Problema**: `fixStepperDisplay()` con setTimeout anidados puede causar estados inconsistentes
- **Ubicación**: Líneas ~196-208
- **Solución**: Usar `AfterViewChecked` lifecycle hook con debounce
- **Prioridad**: MEDIA

### 3. **Step State Updates**
- **Problema**: Múltiples métodos actualizando step state simultáneamente
- **Ubicación**: `updateStepStates()`, `updateStepAccessibility()`, `updateButtonStates()`
- **Solución**: Centralizar en un solo método con state management reactivo
- **Prioridad**: MEDIA

## 🏗️ MEJORAS DE ARQUITECTURA

### 1. **Métodos Extremadamente Largos**
- **updateStepTrackingInfo()**: 150+ líneas, hace demasiadas cosas
- **getStepInfo()**: Lógica compleja con múltiples responsabilidades
- **updateComputedProperties()**: Maneja múltiples concerns
- **Solución**: Aplicar Single Responsibility Principle, extraer a servicios/utilities
- **Prioridad**: ALTA

### 2. **Estado Complejo y Fragmentado**
- **Problema**: 20+ propiedades booleanas que manejan estado de steps
- **Variables**: `canAccessStep0-5`, `step1-5Valid`, `isRecepcionNotaActive`, etc.
- **Solución**: Implementar state machine o reducer pattern para step management
- **Prioridad**: ALTA

### 3. **Duplicación de Código**
- **Ubicación**: Lógica similar en múltiples métodos de step management
- **Ejemplo**: `beginRecepcionNotaStep()`, `beginRecepcionMercaderiaStep()`, `beginSolicitudPagoStep()`
- **Solución**: Crear métodos genéricos y configuraciones declarativas
- **Prioridad**: MEDIA

## 📊 OPTIMIZACIONES ESPECÍFICAS

### 1. **Memory Management**
- **Problema**: `Map<PedidoStepType, StepInfo>` no se limpia apropiadamente
- **Ubicación**: `stepInfos` property
- **Solución**: Implementar cleanup en `ngOnDestroy` y weak references donde sea posible
- **Prioridad**: MEDIA

### 2. **Magic Numbers Elimination**
- **Ubicación**: setTimeout con 50, 100, 150, 500, 1000ms
- **Solución**: Crear constantes named con valores y justificación
- **Prioridad**: BAJA

### 3. **Type Safety Improvements**
- **Problema**: Varios métodos sin tipos estrictos o usando `any`
- **Solución**: Agregar interfaces y tipos estrictos
- **Prioridad**: MEDIA

## 🔧 REFACTORING TÉCNICO

### 1. **Service Extraction**
- **Candidatos para extraer**:
  - Step management logic → `PedidoStepService`
  - State calculation logic → `PedidoStateService`
  - Validation logic → `PedidoValidationService`
- **Prioridad**: ALTA

### 2. **Reactive Patterns Implementation**
- **Convertir a Observables**:
  - Step state changes
  - Validation state changes
  - Data loading operations
- **Benefits**: Cancelación automática, mejor error handling, composabilidad
- **Prioridad**: ALTA

### 3. **Component Decomposition**
- **Problema**: Componente con 1600+ líneas, demasiadas responsabilidades
- **Candidatos para extraer**:
  - Step header component
  - Step navigation component
  - Step validation logic
- **Prioridad**: MEDIA

## 🎯 PERFORMANCE OPTIMIZATIONS

### 1. **OnPush Change Detection**
- **Implementar**: `ChangeDetectionStrategy.OnPush`
- **Beneficios**: Reduce change detection cycles significativamente
- **Requerimientos**: Convertir inputs a immutable, usar Observables
- **Prioridad**: ALTA

### 2. **TrackBy Functions**
- **Ubicación**: Si hay *ngFor en templates (verificar)
- **Solución**: Implementar trackBy functions para lists
- **Prioridad**: MEDIA

### 3. **Lazy Loading de Dialogs**
- **Ubicación**: `AddProductDialogComponent`, `FinalizacionDialogComponent`
- **Solución**: Lazy load dialog components
- **Prioridad**: BAJA

## 🧪 TESTING IMPROVEMENTS

### 1. **Unit Test Coverage**
- **Problema**: Component complejo sin tests
- **Solución**: Crear tests para métodos críticos antes del refactoring
- **Prioridad**: ALTA

### 2. **Integration Tests**
- **Solución**: Tests para workflows completos de step management
- **Prioridad**: MEDIA

## 📋 PLAN DE IMPLEMENTACIÓN SUGERIDO

### Fase 1 (CRÍTICA - Semana 1)
1. Crear tests para comportamiento actual
2. Extraer step management a service
3. Implementar state machine para steps
4. Eliminar race conditions en data loading

### Fase 2 (ALTA - Semana 2)
1. Implementar OnPush change detection
2. Convertir a reactive patterns
3. Optimizar computed properties
4. Cleanup de setTimeout chains

### Fase 3 (MEDIA - Semana 3)
1. Decomposición de componente
2. Implementar type safety
3. Memory management improvements
4. Performance monitoring

### Fase 4 (BAJA - Semana 4)
1. Magic numbers cleanup
2. Dialog lazy loading
3. Final optimizations
4. Documentation

## 🔬 ANÁLISIS ESPECÍFICO DE PROBLEMAS CRÍTICOS

### 1. **Cascading Updates Problem (CRÍTICO)**
- **Ubicación**: `onPedidoChange()` línea ~1544 → triggers multiple update cycles
- **Chain reaction**: 
  1. `updateStepStates()` → `updateStepAccessibility()` → `updateButtonStates()` → `updatePedidoSummary()` → `updateStepTrackingInfo()`
  2. Each method triggers `cdr.detectChanges()` or component updates
- **Impacto**: Single pedido change triggers 15+ method calls and 5+ change detection cycles
- **Solución**: Batch updates usando `scheduleMicroTask` o RxJS operators
- **Prioridad**: CRÍTICA

### 2. **Memory Leak Vectors**
- **setTimeout chains sin cleanup**: Si component se destruye durante setTimeout execution
- **Map objects**: `stepInfos: Map<PedidoStepType, StepInfo>` grows pero nunca se limpia
- **Subscription handling**: Aunque usa `untilDestroyed`, algunos async operations pueden escape
- **Dialog references**: MatDialog refs pueden no limpiarse apropiadamente
- **Prioridad**: ALTA

### 3. **State Synchronization Issues**
- **Problema**: 25+ boolean flags que deben mantenerse sincronizados
- **Ejemplo crítico**: `isRecepcionNotaActive` vs `recepcionNotaStepInfo.status` vs `selectedPedido.estado`
- **Failure scenarios**: Pueden diverger cuando updates fallan o hay race conditions
- **Debugging complexity**: Difficult to trace which flag is causing UI issues
- **Solución**: Single source of truth con state derivation
- **Prioridad**: ALTA

### 4. **Performance Anti-patterns Identificados**
- **Heavy computation in getters** (aunque no detectado en template, presente en código)
- **Repeated object creation**: `new Pedido()` en múltiples métodos sin pooling
- **Unnecessary array operations**: En `updatePedidoSummary()` calls
- **Excessive DOM manipulation**: `stepper.selectedIndex` assignments múltiples
- **Prioridad**: MEDIA

### 5. **Error Handling Gaps**
- **Silent failures**: Muchos métodos no manejan errores apropiadamente
- **Partial state updates**: Si un método falla mid-execution, state queda inconsistente
- **User experience**: No loading states para operations largas
- **Network failures**: No retry logic para failed API calls
- **Prioridad**: MEDIA

## 🔍 MÉTRICAS DE ÉXITO

- **Performance**: Reducir tiempo de change detection en 70%
- **Maintainability**: Reducir complejidad ciclomática de 25+ a <10 por método
- **Reliability**: Eliminar 100% de race conditions identificadas
- **Code Quality**: Aumentar test coverage a 80%+
- **Bundle Size**: Reducir tamaño de component bundle en 30%

## ⚠️ RIESGOS Y CONSIDERACIONES

1. **Breaking Changes**: Refactoring puede afectar templates y child components
2. **Testing Required**: Extensive testing needed debido a la complejidad del componente
3. **Staging Environment**: Deploy incremental en staging para validar cada fase
4. **Rollback Plan**: Mantener commits granulares para rollback fácil
5. **Performance Monitoring**: Implementar métricas antes y después del refactoring

## ✅ IMPLEMENTACIONES COMPLETADAS

### Backend Enhancements (Implementado)
**Funcionalidad**: Creación automática de PedidoItemSucursal al guardar PedidoItem
- **Archivo modificado**: `frc-central-server/src/main/java/com/franco/dev/service/operaciones/PedidoItemService.java`
- **Descripción**: Implementada lógica automática que crea registros `PedidoItemSucursal` para cada sucursal de influencia cuando se guarda un nuevo `PedidoItem`
- **Reglas implementadas**:
  - Se crea un `PedidoItemSucursal` para cada sucursal de influencia del pedido
  - Si existe solamente una sucursal de influencia y una sucursal de entrega: `cantidadPorUnidad = presentacionCreacion.cantidad * cantidadCreacion`
  - Si no: `cantidadPorUnidad = 0`
  - Si existe solo una sucursal de entrega: se asigna al campo `sucursal_entrega_id`
  - Si existe más de una sucursal de entrega: se deja `sucursal_entrega_id` nulo
- **Beneficios**: Automatiza la distribución inicial por sucursales, reduciendo pasos manuales en el frontend
- **Error handling**: Implementado try-catch para no interrumpir el guardado del PedidoItem principal

## 💡 RECOMENDACIONES ESPECÍFICAS

### Quick Wins (1-2 días)
1. **Implementar constantes para setTimeout**: Reemplazar magic numbers
2. **Agregar proper error handling**: Try-catch en métodos críticos
3. **Cleanup obvio**: Clear unused imports, console.logs
4. **Type annotations**: Agregar return types faltantes

### Medium Impact (1 semana)
1. **Implementar OnPush**: Immediate performance boost
2. **Batch state updates**: Reducir cascading updates
3. **Memoization de computed properties**: Cache con invalidation
4. **Extract step management service**: Reduce component complexity

### High Impact (2-3 semanas)
1. **State machine implementation**: Replace boolean flags maze
2. **Reactive data loading**: Replace setTimeout chains
3. **Component decomposition**: Split into smaller, focused components
4. **Comprehensive testing**: Unit + integration tests

### Critical Infrastructure (3-4 semanas)
1. **Complete reactive patterns**: Full Observable-based architecture
2. **Performance monitoring**: Metrics and alerting
3. **Advanced caching strategies**: For complex computations
4. **CI/CD integration**: Automated performance regression testing

### Backend Integration Improvements (2-3 días)
1. **Validation logic**: Agregar validaciones en PedidoItemService para casos edge
2. **Transaction management**: Asegurar que la creación de PedidoItemSucursal sea transaccional
3. **Logging improvements**: Implementar logging estructurado para debugging
4. **Unit tests**: Crear tests para la nueva funcionalidad de PedidoItemSucursal automático

### Frontend Integration Considerations (1-2 días)
1. **Auto-refresh logic**: El AddProductDialog debe refrescar automáticamente la distribución por sucursales después de agregar un item
2. **User feedback**: Mostrar notificación cuando se crea distribución automática
3. **Distribution preview**: Mostrar preview de distribución calculada automáticamente antes de guardar
4. **Validation sync**: Asegurar que validaciones frontend estén alineadas con lógica backend

### Herramientas Recomendadas
- **Estado**: `@ngrx/component-store` para local component state
- **Performance**: Angular DevTools, Chrome Performance tab
- **Testing**: Jest + Testing Library para better test coverage
- **Bundling**: Webpack Bundle Analyzer para size optimization
- **Monitoring**: Custom performance marks para runtime metrics

---

**Fecha de creación**: $(date)
**Autor**: AI Assistant
**Estimación total**: 4 semanas de desarrollo
**Prioridad general**: ALTA - Component crítico con problemas de performance evidentes 