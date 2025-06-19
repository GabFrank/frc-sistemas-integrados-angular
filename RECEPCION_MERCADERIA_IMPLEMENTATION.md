# Recepción de Mercadería - Implementation Specification

## Overview
The Recepción de Mercadería step is where physical products are delivered by suppliers and verified. This step generates stock movements (`MovimientoStock`) and updates prices (`PrecioPorSucursal`) while providing clean interfaces for product verification and distribution management.

## Business Context

### Workflow Position
1. **Creación** (Steps 0-1): Pedido creation
2. **Recepción de Nota** (Step 2): Document reception
3. **Recepción de Mercadería** (Step 3): Physical product reception ← **Current Focus**
4. **Solicitud de Pago** (Step 4): Payment processing

### Key Requirements
- **Physical Verification**: Verify actual received products vs expected
- **Multi-Sucursal Distribution**: Products delivered to different branches
- **Stock Impact**: Generate `MovimientoStock` per `sucursalEntrega`
- **Price Updates**: Create/update `PrecioPorSucursal` when needed
- **Mobile-First**: Primary interface mobile app, desktop for completion
- **Quality Control**: Track condition, expiration, compliance

## Technical Architecture

### Data Models

#### Core Fields (PedidoItem)
```typescript
verificadoRecepcionProducto: boolean         // Primary verification flag
cantidadRecepcionProducto: number           // Final verified quantity  
precioUnitarioRecepcionProducto: number     // Final verified price
vencimientoRecepcionProducto: Date          // Final expiration
presentacionRecepcionProducto: Presentacion // Final presentation
usuarioRecepcionProducto: Usuario           // Verifying user
obsRecepcionProducto: string                // Reception notes
motivoRechazoRecepcionProducto: string      // Rejection reason
```

#### Data Flow Logic
1. **Initialization**: Copy from RecepcionNota → RecepcionProducto fields
2. **Verification**: User confirms/modifies product details
3. **Distribution**: Validate against `PedidoItemSucursal.sucursalEntrega`
4. **Stock Generation**: Create `MovimientoStock` per distribution
5. **Price Updates**: Update `PrecioPorSucursal` if changed

### Backend Requirements

#### New GraphQL Operations
```graphql
# Queries
pedidoRecepcionMercaderiaSummary(id: ID!): RecepcionMercaderiaSummary
pedidoItemsParaRecepcion(pedidoId: ID!, groupBy: String): [ItemGroup]

# Mutations  
verificarRecepcionProducto(pedidoItemId: ID!, verificar: Boolean!): PedidoItem
finalizarRecepcionMercaderia(pedidoId: ID!): Pedido
generarMovimientosStock(pedidoId: ID!): [MovimientoStock]

# New Types
type RecepcionMercaderiaSummary {
    totalItems: Int
    verifiedItems: Int
    pendingItems: Int
    totalSucursales: Int
    canComplete: Boolean
}

type ItemGroup {
    groupKey: String    # NotaRecepcion ID or Producto ID
    groupName: String   # Display name
    items: [PedidoItem]
    totalQuantity: Float
    verifiedQuantity: Float
}
```

### Frontend Implementation

#### Component Structure
```
recepcion-mercaderia/
├── recepcion-mercaderia.component.ts
├── item-verification-card/
├── sucursal-distribution/
├── verification-dialog/
└── graphql/
```

#### Key UI Elements
1. **Step Status Card**: Initiation button, progress tracking
2. **Summary Dashboard**: Progress per sucursal, completion %
3. **Grouping Controls**: By NotaRecepcion/Producto, filters
4. **Verification Cards**: Product info, status, actions
5. **Distribution Panel**: Clear quantity per sucursal visibility

## Business Rules

### Core Rules
1. **Initiation**: Previous step completed, copy RecepcionNota→RecepcionProducto
2. **Verification**: Cannot modify base quantity/presentation, can reject with reason
3. **Distribution**: Must match `PedidoItemSucursal.sucursalEntrega`, total = verified quantity
4. **Completion**: All non-cancelled items verified + distributed

### Validation Hierarchy
- **Pre-Step**: Estado = `EN_RECEPCION_MERCADERIA`, previous step complete
- **During**: Quantities ≤ verified, valid sucursales, future expiration dates
- **Completion**: All verified, complete distribution, stock movements ready

## Stock Movement Integration

### MovimientoStock Generation
```typescript
// Per PedidoItemSucursal distribution
{
    sucursalId: sucursalEntrega.id,
    producto: pedidoItem.producto,
    tipoMovimiento: TipoMovimiento.ENTRADA_POR_COMPRA,
    referencia: pedidoItem.id,
    cantidad: cantidadPorUnidad,
    usuario: usuarioRecepcionProducto
}
```

### PrecioPorSucursal Updates
- Create new records for new products
- Update existing if price changed significantly
- Maintain price history
- Handle multiple presentations

## Key Implementation Patterns

### EXPLICIT STEP INITIATION Pattern
- User clicks "Iniciar Recepción de Mercadería"
- Backend copies RecepcionNota→RecepcionProducto fields
- Step shows active interface only after initiation
- Clear audit trail of who started when

### Computed Properties Pattern (CRITICAL)
```typescript
// Avoid functions in templates
isStepActive: boolean;
canCompleteStep: boolean;
verificationProgress: number;
nextButtonTooltip: string;

// Update in response to data changes
updateComputedProperties() {
    this.isStepActive = this.stepInfo?.status === StepStatus.IN_PROGRESS;
    this.canCompleteStep = this.allItemsVerified && this.allDistributionsComplete;
    // ...
}
```

### GenericCrudService Pattern
```typescript
// NEVER direct Apollo calls
❌ this.apollo.mutate(...)
✅ this.genericService.onCustomMutation(this.verificarRecepcionProducto, {pedidoItemId, verificar})
```

## Mobile Integration Strategy

### Data Sync
- Real-time verification status sync
- Offline capability with queue
- Conflict resolution for concurrent edits

### Workflow Division
- **Mobile**: Bulk product verification, photo capture
- **Desktop**: Review, completion, distribution management
- **Both**: Real-time status updates

## Performance Considerations

### Frontend Optimization
- Virtual scrolling for large item lists
- Computed properties vs functions in templates
- OnPush change detection strategy
- Lazy loading heavy components

### Backend Optimization
- Efficient queries with proper joins
- Batch operations for stock movements
- Transaction management for consistency

## Error Handling

### Common Scenarios
1. **Concurrent Edits**: Last-write-wins with notification
2. **Stock Issues**: Allow with warnings/supervisor approval
3. **Network Failures**: Offline queue with sync
4. **Invalid Distributions**: Validation repair workflow

### Recovery Mechanisms
- Auto-save form data periodically
- Rollback capability for verification actions
- Admin override for stuck processes

## Success Criteria

### Functional
- 100% verified items have complete distribution
- 0% data loss during transitions
- <3s response for verification actions
- Complete audit trail

### Business
- 30% faster reception process
- 99% inventory accuracy
- 80% fewer manual errors
- Enhanced compliance tracking

## Critical Anti-Patterns to Avoid

### Technical
1. **Functions in templates** → Use computed properties
2. **Direct Apollo calls** → Use GenericCrudService
3. **Uncontrolled mutations** → Reactive state management
4. **Missing race condition handling** → setTimeout delays after operations

### UX
1. **Information overload** → Progressive disclosure
2. **Unclear state** → Clear visual feedback
3. **Non-mobile-friendly** → Touch-optimized design
4. **Inconsistent patterns** → Follow established patterns

### Business Logic
1. **Validation bypassing** → Enforce all rules
2. **Incomplete audit** → Log all changes
3. **Data inconsistency** → Maintain integrity
4. **Manual stock adjustment** → Automate movements

## Implementation Priority

### Phase 1: Infrastructure
- Backend GraphQL operations
- Step initiation flow
- Basic verification interface

### Phase 2: Core Features  
- Item verification cards
- Distribution management
- Summary dashboard

### Phase 3: Integration
- Stock movement generation
- Price update logic
- Mobile compatibility

### Phase 4: Polish
- Performance optimization
- Error handling refinement
- User acceptance testing

This specification ensures the Recepción de Mercadería step follows established patterns while delivering robust product verification and stock management capabilities. 