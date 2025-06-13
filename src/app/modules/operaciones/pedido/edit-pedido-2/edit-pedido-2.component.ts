import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatStepper } from "@angular/material/stepper";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MatDialog } from "@angular/material/dialog";
import { Tab } from "../../../../layouts/tab/tab.model";
import { MainService } from "../../../../main.service";
import { PedidoService } from "../pedido.service";
import { Pedido, PedidoSummary } from "../edit-pedido/pedido.model";
import { PedidoEstado } from "../edit-pedido/pedido-enums";
import { PedidoItem, PedidoStep } from "../edit-pedido/pedido-item.model";
import { Proveedor } from "../../../personas/proveedor/proveedor.model";
import { Vendedor } from "../../../personas/vendedor/vendedor.model";
import { FormaPago } from "../../../financiero/forma-pago/forma-pago.model";
import { Moneda } from "../../../financiero/moneda/moneda.model";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { AddProductDialogComponent, AddProductDialogData, AddProductDialogResult } from "./detalles-del-pedido/add-product-dialog/add-product-dialog.component";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-edit-pedido-2",
  templateUrl: "./edit-pedido-2.component.html",
  styleUrls: ["./edit-pedido-2.component.scss"],
})
export class EditPedido2Component implements OnInit {
  @ViewChild("stepper") stepper: MatStepper;

  @Input() data: Tab;

  selectedPedido: Pedido | null = null;
  currentStepIndex = 0;
  stepsConfig = [
    {
      label: "Datos del pedido",
      icon: "description",
      completed: false,
      accessible: true,
    },
    {
      label: "Detalles del pedido",
      icon: "list_alt",
      completed: false,
      accessible: false,
    },
    {
      label: "Recepcion de nota",
      icon: "receipt",
      completed: false,
      accessible: false,
    },
    {
      label: "Recepcion de mercaderia",
      icon: "inventory",
      completed: false,
      accessible: false,
    },
    {
      label: "Solicitud de pago",
      icon: "payment",
      completed: false,
      accessible: false,
    },
  ];

  // Properties for template binding to avoid direct function calls
  estadoColor = "primary";
  canAccessStep0 = true;
  canAccessStep1 = false;
  canAccessStep2 = false;
  canAccessStep3 = false;
  canAccessStep4 = false;
  step1FormValid = false;
  
  // New properties for next step conditions
  canGoToRecepcionNota = false;
  canAgregarProducto = false;

  // Computed summary properties for header display (excluding cancelled items)
  computedTotalSinDescuento = 0;
  computedDescuentoTotal = 0;
  computedTotalConDescuento = 0;
  computedCantidadItems = 0;
  computedCantidadItemsCancelados = 0;

  // Dummy step control for simple steps
  dummyStepControl = new FormControl();

  constructor(
    private pedidoService: PedidoService,
    private mainService: MainService,
    private matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadPedidoData();
  }

  loadPedidoData(): void {
    if (this.data?.tabData?.id) {
      this.pedidoService
        .onGetPedidoInfoCompleta(this.data.tabData.id)
        .subscribe((pedido) => {
          this.selectedPedido = pedido;
          this.updateStepAccessibility();
          this.updateEstadoColor();
          this.updateButtonStates();
          
          // Update summary with a small delay to ensure backend changes are reflected
          setTimeout(() => {
            this.updatePedidoSummary();
          }, 100);
          
          // Update step states after pedido is set and give Angular time to update
          setTimeout(() => {
            this.updateStepStates();
          }, 100);
        });
    }
  }

  loadPedidoDataFresh(): void {
    if (this.data?.tabData?.id) {
      this.pedidoService
        .onGetPedidoInfoCompletaFresh(this.data.tabData.id)
        .subscribe((pedido) => {
          this.selectedPedido = pedido;
          this.updateStepAccessibility();
          this.updateEstadoColor();
          this.updateButtonStates();
          
          // Update summary with a small delay to ensure backend changes are reflected
          setTimeout(() => {
            this.updatePedidoSummary();
          }, 100);
          
          // Update step states after pedido is set and give Angular time to update
          setTimeout(() => {
            this.updateStepStates();
          }, 100);
        });
    }
  }

  updateStepStates(): void {
    if (!this.selectedPedido) return;
    
    const estado = this.selectedPedido.estado;
    
    // Only calculate currentStepIndex based on pedido estado
    // Let Angular Material handle step states naturally
    switch (estado) {
      case PedidoEstado.ABIERTO:
        this.currentStepIndex = 0;
        break;
      case PedidoEstado.ACTIVO:
        this.currentStepIndex = 1;
        break;
      case PedidoEstado.EN_RECEPCION_NOTA:
        this.currentStepIndex = 2;
        break;
      case PedidoEstado.EN_RECEPCION_MERCADERIA:
        this.currentStepIndex = 3;
        break;
      case PedidoEstado.CONCLUIDO:
        this.currentStepIndex = 4;
        break;
      default:
        this.currentStepIndex = 0;
        break;
    }

    // Update completed states based on current step
    this.stepsConfig.forEach((step, index) => {
      step.completed = index < this.currentStepIndex;
    });
  }

  updateStepAccessibility(): void {
    if (!this.selectedPedido) return;

    const estado = this.selectedPedido.estado;

    // Reset accessibility
    this.canAccessStep0 = false;
    this.canAccessStep1 = false;
    this.canAccessStep2 = false;
    this.canAccessStep3 = false;
    this.canAccessStep4 = false;

    // Set accessibility based on estado
    switch (estado) {
      case PedidoEstado.CONCLUIDO:
        this.canAccessStep4 = true;
      // fall through
      case PedidoEstado.EN_RECEPCION_MERCADERIA:
        this.canAccessStep3 = true;
      // fall through
      case PedidoEstado.EN_RECEPCION_NOTA:
        this.canAccessStep2 = true;
      // fall through
      case PedidoEstado.ACTIVO:
        this.canAccessStep1 = true;
      // fall through
      case PedidoEstado.ABIERTO:
      default:
        this.canAccessStep0 = true;
        break;
    }

    // Update stepsConfig accessibility
    this.stepsConfig[0].accessible = this.canAccessStep0;
    this.stepsConfig[1].accessible = this.canAccessStep1;
    this.stepsConfig[2].accessible = this.canAccessStep2;
    this.stepsConfig[3].accessible = this.canAccessStep3;
    this.stepsConfig[4].accessible = this.canAccessStep4;
  }

  updateEstadoColor(): void {
    if (!this.selectedPedido) {
      this.estadoColor = "primary";
      return;
    }

    switch (this.selectedPedido.estado) {
      case PedidoEstado.ABIERTO:
        this.estadoColor = "primary";
        break;
      case PedidoEstado.ACTIVO:
        this.estadoColor = "accent";
        break;
      case PedidoEstado.EN_RECEPCION_NOTA:
      case PedidoEstado.EN_RECEPCION_MERCADERIA:
        this.estadoColor = "warn";
        break;
      case PedidoEstado.CONCLUIDO:
        this.estadoColor = "accent";
        break;
      default:
        this.estadoColor = "primary";
        break;
    }
  }

  updateButtonStates(): void {
    if (!this.selectedPedido) {
      this.canGoToRecepcionNota = false;
      this.canAgregarProducto = false;
      return;
    }

    // "Siguiente" button to go to "Recepcion de nota" step is enabled when:
    // 1. Pedido exists (already checked above)
    // 2. Pedido has at least one pedido item created
    // 3. Current estado is ACTIVO (ready to move to EN_RECEPCION_NOTA)
    this.canGoToRecepcionNota = 
      this.selectedPedido.estado === PedidoEstado.ACTIVO &&
      this.selectedPedido.cantPedidoItem &&
      this.selectedPedido.cantPedidoItem > 0;

    // "Agregar producto" button is enabled only when pedido estado is ACTIVO
    this.canAgregarProducto = this.selectedPedido.estado === PedidoEstado.ACTIVO;
  }

  // Navigation methods
  nextStep(): void {
    if (
      this.stepper &&
      this.stepper.selectedIndex < this.stepsConfig.length - 1
    ) {
      this.stepper.next();
    }
  }

  previousStep(): void {
    if (this.stepper && this.stepper.selectedIndex > 0) {
      this.stepper.previous();
    }
  }

  goToStep(stepIndex: number): void {
    if (this.stepsConfig[stepIndex]?.accessible && this.stepper) {
      this.currentStepIndex = stepIndex;
    }
  }

  // New method to open add product dialog with step context
  openAddProductDialog(pedidoItem?: PedidoItem, isEditing = false): void {
    if (!this.selectedPedido) return;
    
    const currentStep = this.pedidoService.getCurrentStepFromPedidoEstado(this.selectedPedido.estado);
    
    const dialogData: AddProductDialogData = {
      pedido: this.selectedPedido,
      pedidoItem: pedidoItem,
      isEditing: isEditing,
      currentStep: currentStep
    };

    const dialogRef = this.matDialog.open(AddProductDialogComponent, {
      data: dialogData,
      width: '90%',
      maxWidth: '1200px',
      height: '80%',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: AddProductDialogResult | undefined) => {
      // Handle the new comprehensive result structure
      if (result && !result.cancelled && result.needsUIRefresh) {
        // Check if changes affect totals and need fresh data
        const needsFreshData = result.productConfigurationChanged || 
                              result.rejectionStatusChanged || 
                              result.itemCancellationChanged ||
                              result.added ||
                              result.updated;
        
        if (needsFreshData) {
          // Use fresh data fetch for changes that affect totals
          console.log('Changes detected that affect totals - using fresh data fetch');
          this.loadPedidoDataFresh();
        } else {
          // Use regular data fetch for other changes
          this.loadPedidoData();
        }
        
        // Show appropriate message based on what changed
        if (result.added) {
          const stepName = this.getStepDisplayName(result.step!);
          console.log(`Item agregado en paso: ${stepName}`);
        }
        
        if (result.updated) {
          const stepName = this.getStepDisplayName(result.step!);
          console.log(`Item actualizado en paso: ${stepName}`);
        }
        
        if (result.productConfigurationChanged) {
          console.log('Product configuration was changed');
        }
        
        if (result.sucursalDistributionChanged) {
          console.log('Sucursal distribution was changed');
        }
        
        if (result.rejectionStatusChanged) {
          console.log('Rejection status was changed');
        }
        
        if (result.itemCancellationChanged) {
          console.log('Item cancellation status was changed - totals will be refreshed');
        }
      } else if (result?.cancelled) {
        console.log('Dialog was cancelled');
      }
    });
  }

  // Helper method to get step display name
  private getStepDisplayName(step: PedidoStep): string {
    switch (step) {
      case PedidoStep.DETALLES_PEDIDO:
        return 'Detalles del Pedido';
      case PedidoStep.RECEPCION_NOTA:
        return 'Recepción de Nota';
      case PedidoStep.RECEPCION_PRODUCTO:
        return 'Recepción de Producto';
      default:
        return 'Desconocido';
    }
  }

  // Method to handle step transitions with data preparation
  goToRecepcionNota(): void {
    if (!this.canGoToRecepcionNota || !this.selectedPedido) {
      return;
    }

    // Update pedido estado to EN_RECEPCION_NOTA and save
    // Note: We don't copy data automatically - it will be copied only when:
    // 1. Items are edited in recepcion nota step
    // 2. Items are assigned to nota recepcion
    this.pedidoService
      .onFinalizarPedido(this.selectedPedido.id, PedidoEstado.EN_RECEPCION_NOTA)
      .pipe(untilDestroyed(this))
      .subscribe(
        (updatedPedido) => {
          this.selectedPedido = updatedPedido;
          this.updateStepStates();
          this.updateStepAccessibility();
          this.updateEstadoColor();
          this.updateButtonStates();
          this.updatePedidoSummary(); // Refresh summary after estado change
          
          // Move to step 2 (Recepcion de nota)
          this.goToStep(2);
        },
        (error) => {
          console.error('Error al finalizar pedido:', error);
          // Handle error - show message to user
        }
      );
  }

  completePedido(): void {}

  onPedidoChange(updatedPedido: Pedido): void {
    this.selectedPedido = updatedPedido;
    this.updateButtonStates();
    this.updatePedidoSummary(); // Refresh summary when pedido changes
  }

  onStep1FormValidChange(isValid: boolean): void {
    this.step1FormValid = isValid;
    this.canAccessStep1 = isValid;
    this.stepsConfig[0].completed = isValid;
  }

  onStep2FormValidChange(isValid: boolean): void {
    this.canAccessStep2 = isValid;
    this.stepsConfig[1].completed = isValid;
  }

  /**
   * Centralized method to update pedido summary calculations
   * Uses backend service to get accurate totals based on pedido estado
   */
  updatePedidoSummary(): void {
    if (!this.selectedPedido?.id) {
      // Reset to zero if no pedido
      this.computedTotalSinDescuento = 0;
      this.computedDescuentoTotal = 0;
      this.computedTotalConDescuento = 0;
      this.computedCantidadItems = 0;
      this.computedCantidadItemsCancelados = 0;
      return;
    }

    // Use backend service to get accurate summary
    this.pedidoService.onGetPedidoSummary(this.selectedPedido.id)
      .pipe(untilDestroyed(this))
      .subscribe(
        (summary) => {
          this.computedTotalSinDescuento = summary.totalSinDescuento || 0;
          this.computedDescuentoTotal = summary.totalDescuento || 0;
          this.computedTotalConDescuento = summary.totalConDescuento || 0;
          this.computedCantidadItems = summary.activeItems || 0;
          this.computedCantidadItemsCancelados = summary.cancelledItems || 0;

          console.log('Pedido Summary Updated from Backend:', {
            totalSinDescuento: this.computedTotalSinDescuento,
            descuentoTotal: this.computedDescuentoTotal,
            totalConDescuento: this.computedTotalConDescuento,
            cantidadItems: this.computedCantidadItems,
            cantidadItemsCancelados: this.computedCantidadItemsCancelados,
            estado: summary.estado
          });
        },
        (error) => {
          console.error('Error loading pedido summary:', error);
          // Fallback to zero values on error
          this.computedTotalSinDescuento = 0;
          this.computedDescuentoTotal = 0;
          this.computedTotalConDescuento = 0;
          this.computedCantidadItems = 0;
          this.computedCantidadItemsCancelados = 0;
        }
      );
  }
}
