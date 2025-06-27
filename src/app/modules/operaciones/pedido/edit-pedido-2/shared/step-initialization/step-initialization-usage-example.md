# Step Initialization Component Usage Guide

## Overview

The `StepInitializationComponent` is a generic, reusable component designed to handle step initialization UI across all pedido steps (Recepción de Nota, Recepción de Mercadería, and Solicitud de Pago).

## Component API

### Inputs

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `stepInfo` | `StepInfo \| null` | Yes | Step information object containing status, user, dates, etc. |
| `isProcessing` | `boolean` | No | Whether the step is currently being processed (default: false) |
| `customActionText` | `string` | No | Custom text for the action button (overrides default) |
| `customSuccessMessage` | `string` | No | Custom success message (reserved for future use) |

### Outputs

| Event | Type | Description |
|-------|------|-------------|
| `initiateStep` | `void` | Emitted when user clicks the "Iniciar" button |
| `viewDetails` | `void` | Emitted when user clicks "Ver Detalles" (for completed steps) |

## Usage Examples

### 1. In Recepción de Nota Component

```typescript
// recepcion-nota.component.ts
export class RecepcionNotaComponent {
  @Input() stepInfo: StepInfo | null = null;
  @Output() initiateStep = new EventEmitter<void>();
  
  isProcessing = false;
  
  onStepInitiation(): void {
    this.initiateStep.emit();
  }
}
```

```html
<!-- recepcion-nota.component.html -->
<div class="recepcion-nota-content">
  
  <!-- Step Initialization UI -->
  <app-step-initialization
    [stepInfo]="stepInfo"
    [isProcessing]="isProcessing"
    customActionText="Iniciar Recepción de Nota"
    (initiateStep)="onStepInitiation()">
  </app-step-initialization>
  
  <!-- Main step content (shown when step is active) -->
  <div class="step-content" *ngIf="stepInfo?.status === 'IN_PROGRESS'">
    <!-- Your existing recepcion nota content -->
  </div>
  
</div>
```

### 2. In Parent Component (edit-pedido-2.component)

```typescript
// edit-pedido-2.component.ts
export class EditPedido2Component {
  
  getRecepcionNotaStepInfo(): StepInfo | null {
    return this.stepInfos.get(PedidoStepType.RECEPCION_NOTA) || null;
  }
  
  onRecepcionNotaInitiation(): void {
    this.beginStep(PedidoStepType.RECEPCION_NOTA);
    this.notificacionService.openSucess("Iniciando recepción de nota...");
  }
}
```

```html
<!-- edit-pedido-2.component.html -->
<mat-step label="Recepción de nota">
  <app-recepcion-nota
    [selectedPedido]="selectedPedido"
    [stepInfo]="getRecepcionNotaStepInfo()"
    (initiateStep)="onRecepcionNotaInitiation()"
    (stepValidChange)="onStep3ValidChange($event)">
  </app-recepcion-nota>
</mat-step>
```

### 3. Complete Integration Pattern

```typescript
// Step component interface
interface StepComponent {
  stepInfo: StepInfo | null;
  isStepActive: boolean;
  initiateStep: EventEmitter<void>;
}

// Implementation in step component
@Component({...})
export class RecepcionMercaderiaComponent implements StepComponent {
  @Input() stepInfo: StepInfo | null = null;
  @Input() isStepActive = false;
  @Output() initiateStep = new EventEmitter<void>();
  
  isProcessing = false;
  
  onInitiateStep(): void {
    this.initiateStep.emit();
  }
  
  onViewStepDetails(): void {
    // Handle view details for completed steps
    console.log('Viewing step details...');
  }
}
```

## Step Status Flow

```
NOT_STARTED → AVAILABLE → IN_PROGRESS → COMPLETED
     ↓            ↓           ↓            ↓
  Info card   Init button  Progress     Details button
             (pulsing)    indicator    (view only)
```

## Styling Customization

The component uses CSS custom properties for easy theming:

```scss
// Override in your component styles
.step-initialization-wrapper {
  --primary-color: #2196f3;
  --success-color: #4caf50;
  --warning-color: #ff9800;
  --neutral-color: #9e9e9e;
}
```

## Benefits

1. **Consistency**: All steps have the same UI/UX patterns
2. **Maintainability**: Changes to step initialization logic happen in one place
3. **Reusability**: No code duplication across step components
4. **Accessibility**: Built-in ARIA labels and keyboard navigation
5. **Responsive**: Mobile-friendly design out of the box
6. **Animation**: Smooth transitions and visual feedback
7. **⚡ Performance Optimized**: No function calls in templates - follows critical Angular performance rules

## ⚠️ Critical Performance Rule Compliance

This component strictly follows the **CRITICAL ANGULAR PERFORMANCE RULE**: 
- ✅ **No function calls in HTML templates**
- ✅ **No getters in HTML templates** 
- ✅ **No function calls in *ngIf/*ngFor directives**

All template properties like `statusIconClass`, `showProgressSection`, `progressBarValue`, etc. are pre-computed properties that only update when `stepInfo` changes, not on every change detection cycle. This prevents massive performance problems caused by functions being called repeatedly during change detection.

## Module Declaration

Don't forget to declare the component in your module:

```typescript
@NgModule({
  declarations: [
    StepInitializationComponent,
    // ... other components
  ],
  // ...
})
export class OperacionesModule { } 