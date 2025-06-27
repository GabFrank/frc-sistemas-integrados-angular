# Integration Example: Recepción de Nota Step

## Current Implementation (Before)

Currently, each step component has its own initialization logic scattered throughout the parent component.

### Parent Component (edit-pedido-2.component.ts)
```typescript
// Multiple computed properties for each step
recepcionNotaStepInfo: StepInfo | null = null;
showRecepcionNotaInitButton = false;
canBeginRecepcionNota = false;
isRecepcionNotaActive = false;
recepcionNotaStatusIcon = '';
recepcionNotaStatusTitle = '';
recepcionNotaStatusSubtitle: string | null = null;

// Individual step methods
beginRecepcionNotaStep(): void {
  this.beginStep(PedidoStepType.RECEPCION_NOTA);
  this.notificacionService.openSucess("Iniciando recepción de nota...");
}
```

### Parent Template (edit-pedido-2.component.html)
```html
<mat-step label="Recepción de Nota">
  <div class="step-content">
    <app-recepcion-nota 
      *ngIf="isRecepcionNotaActive"
      [selectedPedido]="selectedPedido">
    </app-recepcion-nota>
    
    <!-- Custom initiation UI -->
    <div *ngIf="!isRecepcionNotaActive">
      <mat-icon>receipt</mat-icon>
      <p>Haga clic en "Iniciar Recepción de Nota" para comenzar</p>
      <button 
        mat-raised-button 
        (click)="beginRecepcionNotaStep()"
        [disabled]="!canBeginRecepcionNota">
        Iniciar Recepción de Nota
      </button>
    </div>
  </div>
</mat-step>
```

## New Implementation (After)

With the generic step initialization component, the code becomes much cleaner and more maintainable.

### Step Component (recepcion-nota.component.ts)
```typescript
@Component({
  selector: 'app-recepcion-nota',
  template: `
    <div class="recepcion-nota-container">
      
      <!-- Step Initialization (Generic) -->
      <app-step-initialization
        *ngIf="!isStepActive"
        [stepInfo]="stepInfo"
        [isProcessing]="isProcessing"
        (initiateStep)="onInitiateStep()">
      </app-step-initialization>

      <!-- Main Content (Only when active) -->
      <div *ngIf="isStepActive" class="step-main-content">
        <!-- Existing recepcion-nota content -->
        <div class="summary-section">...</div>
        <div class="content-area">...</div>
      </div>

    </div>
  `
})
export class RecepcionNotaComponent {
  @Input() selectedPedido: Pedido;
  @Input() stepInfo: StepInfo | null = null;
  @Input() isStepActive = false;
  @Output() initiateStep = new EventEmitter<void>();
  @Output() stepValidChange = new EventEmitter<boolean>();

  isProcessing = false;

  onInitiateStep(): void {
    this.initiateStep.emit();
  }
}
```

### Parent Component (edit-pedido-2.component.ts) - Simplified
```typescript
// Only need one getter method per step
getRecepcionNotaStepInfo(): StepInfo | null {
  return this.stepInfos.get(PedidoStepType.RECEPCION_NOTA) || null;
}

// Generic step initiation method (already exists)
onRecepcionNotaInitiation(): void {
  this.beginStep(PedidoStepType.RECEPCION_NOTA);
  this.notificacionService.openSucess("Iniciando recepción de nota...");
}
```

### Parent Template (edit-pedido-2.component.html) - Simplified
```html
<mat-step label="Recepción de Nota">
  <app-recepcion-nota
    [selectedPedido]="selectedPedido"
    [stepInfo]="getRecepcionNotaStepInfo()"
    [isStepActive]="isRecepcionNotaActive"
    (initiateStep)="onRecepcionNotaInitiation()"
    (stepValidChange)="onStep3ValidChange($event)">
  </app-recepcion-nota>
</mat-step>
```

## Benefits of the New Approach

### 1. **Code Reduction**
- **Before**: ~50 lines of step-specific properties and methods per step
- **After**: ~5 lines per step (getter method and initiation handler)

### 2. **Consistency**
- All steps use the same UI/UX patterns
- Consistent animations, colors, and interactions
- Standardized status display logic

### 3. **Maintainability**
- Changes to step initialization UI only need to be made in one place
- Less code duplication across step components
- Easier to add new steps following the same pattern

### 4. **Reusability**
- Same component works for all step types
- Customizable action text and messages
- Extensible for future step types

### 5. **Better User Experience**
- Consistent visual feedback across all steps
- Smooth animations and transitions
- Clear status indicators with progress tracking

## Migration Steps

1. **Add the generic component** to your module declarations
2. **Update each step component** to use the new pattern:
   - Add `stepInfo` and `isStepActive` inputs
   - Add `initiateStep` output
   - Replace custom initialization UI with `<app-step-initialization>`
3. **Simplify parent component**:
   - Remove step-specific computed properties
   - Keep only the getter methods and initiation handlers
   - Update templates to pass the required inputs
4. **Test each step** to ensure functionality is preserved

## Result

The codebase becomes more maintainable, consistent, and easier to extend while providing a better user experience across all pedido steps. 