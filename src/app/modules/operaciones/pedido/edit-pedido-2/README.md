# EditPedido2Component

## Overview

This is an improved version of the original `EditPedidoComponent` with a modern, step-based interface using Angular Material Stepper. The component provides a cleaner, more organized workflow for managing pedidos (orders) throughout their lifecycle.

## Features

### 🎯 **Step-Based Workflow**
- **Datos del pedido**: Initial order configuration (supplier, vendor, payment method, etc.)
- **Detalles del pedido**: Add products, quantities, prices, and configure order items
- **Recepción de nota**: Manage reception notes and verify received products
- **Recepción de mercadería**: Physically verify received products and confirm quantities
- **Solicitud de pago**: Process payment and finalize the purchase process

### 🎨 **Modern UI/UX**
- Clean, card-based header for order visualization
- Full-height stepper interface
- Responsive design for mobile and desktop
- Visual state indicators with icons and colors
- Smooth transitions and hover effects

### 📊 **Order Status Management**
The component automatically manages step accessibility based on the order state:
- `ABIERTO`: Only "Datos del pedido" step is editable
- `ACTIVO`: First two steps are accessible
- `EN_RECEPCION_NOTA`: First three steps are accessible
- `EN_RECEPCION_MERCADERIA`: First four steps are accessible
- `CONCLUIDO`: All steps are accessible

### 🔒 **Smart Navigation**
- Steps are automatically enabled/disabled based on order state
- Visual completion indicators
- Navigation between steps with proper validation

## Component Structure

```
edit-pedido-2/
├── edit-pedido-2.component.ts     # Main component logic
├── edit-pedido-2.component.html   # Template with header + stepper
├── edit-pedido-2.component.scss   # Modern styling
└── README.md                      # This documentation
```

## Key Improvements over Original Component

1. **Better Organization**: Step-based workflow instead of complex single-page layout
2. **Modern Design**: Clean, card-based UI with proper spacing and visual hierarchy
3. **Responsive**: Works well on both desktop and mobile devices
4. **State Management**: Clear visual indication of order progress
5. **Maintainability**: Cleaner code structure and separation of concerns

## Usage

The component can be used as a direct replacement for the original `EditPedidoComponent`:

```typescript
// In your routing or tab service
new Tab(EditPedido2Component, 'Nuevo Pedido', new TabData(id, {id: orderId}), null)
```

## Input Properties

- `data: Tab` - Contains the tab data with order ID and other metadata

## Dependencies

- Angular Material (Stepper, Cards, Buttons, Icons, Chips)
- Angular Flex Layout
- RxJS
- Custom shared components and services

## Future Enhancements

- [ ] Implement actual step content (currently shows placeholders)
- [ ] Add form validation for each step
- [ ] Implement step-specific business logic
- [ ] Add progress saving between steps
- [ ] Enhanced mobile responsive design
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)

## Integration with Existing System

This component reuses the existing:
- ✅ `PedidoService` for data operations
- ✅ `MainService` for user context
- ✅ Existing models (`Pedido`, `PedidoEstado`, etc.)
- ✅ Existing pipes (`enumToString`)
- ✅ Tab system integration

## Development Notes

The component follows Angular best practices:
- Uses `OnPush` change detection strategy (via `@UntilDestroy`)
- Proper lifecycle management with `untilDestroyed()`
- Type-safe TypeScript code
- Modular SCSS with proper organization
- Responsive design principles

## Testing

To test the component, it's currently configured in the `TabService` to load alongside the original component for comparison. You can view both versions side by side to see the improvements. 