# SolicitudPago List Component

This component displays a list of SolicitudPago entities with filtering and pagination capabilities.

## Features

- Filter by ID or reference
- Filter by Estado (PENDIENTE, PARCIAL, CONCLUIDO, CANCELADO)
- Filter by Tipo (COMPRA, GASTO, RRHH) 
- Pagination support
- Action menu for each row with options to edit and view details

## Implementation Notes

1. **Filters**: The component includes filters for:
   - Text search: Search by ID or reference
   - Estado dropdown: Filter by payment request status
   - Tipo dropdown: Filter by payment request type

2. **Data Loading**: The component uses debounced search to avoid excessive API calls when users type in the search box.

3. **Pagination**: Uses Material's MatPaginator to handle loading data in pages.

4. **Styling**: Includes basic styling and could be extended to add status-specific colors.

## Usage Instructions

### Adding to a Module

1. Import the component in your module:
```typescript
import { ListSolicitudPagoComponent } from './list-solicitud-pago/list-solicitud-pago.component';

@NgModule({
  declarations: [
    ListSolicitudPagoComponent,
    // other components
  ],
  // other module configuration
})
export class OperacionesModule { }
```

### Adding to Routing

Add a route for this component in your routing module:

```typescript
const routes: Routes = [
  {
    path: 'solicitud-pago',
    component: ListSolicitudPagoComponent
  },
  // other routes
];
```

### Service Implementation

For this component to work properly, you should extend the `SolicitudPagoService` with a method to search with filters:

```typescript
onSearchConFiltros(term, estado, tipo, pageIndex, pageSize): Observable<PageInfo<SolicitudPago>> {
  // Implement search functionality
}
```

## Future Enhancements

1. Implement edit dialog component
2. Add detail view functionality
3. Implement date range filters for creadoEn field
4. Add sorting capabilities
5. Create export to CSV/Excel functionality 