import { Component, Input, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from "@angular/core";
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
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { Proveedor } from "../../../personas/proveedor/proveedor.model";
import { Vendedor } from "../../../personas/vendedor/vendedor.model";
import { FormaPago } from "../../../financiero/forma-pago/forma-pago.model";
import { Moneda } from "../../../financiero/moneda/moneda.model";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { AddProductDialogComponent, AddProductDialogData, AddProductDialogResult } from "./detalles-del-pedido/add-product-dialog/add-product-dialog.component";
import { FinalizacionDialogComponent, FinalizacionDialogData, FinalizacionDialogResult } from "./finalizacion-dialog/finalizacion-dialog.component";
import { SolicitudPagoComponent } from "./solicitud-pago/solicitud-pago.component";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { NotificacionSnackbarService, NotificacionColor } from "../../../../notificacion-snackbar.service";

// Step tracking enums and interfaces
export enum PedidoStepType {
  CREACION = 'CREACION',
  RECEPCION_NOTA = 'RECEPCION_NOTA', 
  RECEPCION_MERCADERIA = 'RECEPCION_MERCADERIA',
  SOLICITUD_PAGO = 'SOLICITUD_PAGO'
}

export enum StepStatus {
  NOT_STARTED = 'NOT_STARTED',
  AVAILABLE = 'AVAILABLE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface StepInfo {
  stepType: PedidoStepType;
  status: StepStatus;
  assignedUser: Usuario | null;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  canStart: boolean;
  canComplete: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-edit-pedido-2",
  templateUrl: "./edit-pedido-2.component.html",
  styleUrls: ["./edit-pedido-2.component.scss"],
})
export class EditPedido2Component implements OnInit, AfterViewInit {
  @ViewChild("stepper") stepper: MatStepper;
  @ViewChild(SolicitudPagoComponent) solicitudPagoComponent: SolicitudPagoComponent;

  @Input() data: Tab;

  selectedPedido: Pedido | null = null;
  currentStepIndex = 0;
  isDataLoaded = false;
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
  estadoColor = "accent";
  canAccessStep0 = true;
  canAccessStep1 = false;
  canAccessStep2 = false;
  canAccessStep3 = false;
  canAccessStep4 = false;
  canAccessStep5 = false;
  step1FormValid = false;
  
  // New properties for next step conditions
  canGoToRecepcionNota = false;
  canAgregarProducto = false;
  
  // **NEW**: Step validation properties
  step3Valid = false; // Recepcion nota step validation
  step4Valid = false; // Recepcion mercaderia step validation
  step5Valid = false; // Solicitud pago step validation

  // Computed summary properties for header display (excluding cancelled items)
  computedTotalSinDescuento = 0;
  computedDescuentoTotal = 0;
  computedTotalConDescuento = 0;
  computedCantidadItems = 0;
  computedCantidadItemsCancelados = 0;

  // Individual step controls for linear stepper navigation
  step1StepControl = new FormControl(false);
  step2StepControl = new FormControl(false);
  step3StepControl = new FormControl(false);
  step4StepControl = new FormControl(false);
  step5StepControl = new FormControl(false);
  
  // Dummy step control for compatibility (not used)
  dummyStepControl = new FormControl();

  // **NEW**: Step tracking properties
  currentUser: Usuario | null = null;
  stepInfos: Map<PedidoStepType, StepInfo> = new Map();

  // **COMPUTED PROPERTIES**: To avoid function calls in templates (CRITICAL for performance)
  recepcionNotaStepInfo: StepInfo | null = null;
  isRecepcionNotaActive = false;
  nextButtonTooltip = '';
  
  // **NEW**: Current step tracking info for the status card
  currentStepTrackingInfo: StepInfo | null = null;
  
  // **NEW**: Recepcion mercaderia computed properties
  recepcionMercaderiaStepInfo: StepInfo | null = null;
  isRecepcionMercaderiaActive = false;
  recepcionMercaderiaButtonTooltip = '';
  
  // **NEW**: Solicitud pago computed properties
  solicitudPagoStepInfo: StepInfo | null = null;
  isSolicitudPagoActive = false;
  
  // UI stepper index to step type mapping
  private stepperToStepType: Map<number, PedidoStepType> = new Map([
    [0, PedidoStepType.CREACION],     // Datos del pedido
    [1, PedidoStepType.CREACION],     // Detalles del pedido
    [2, PedidoStepType.RECEPCION_NOTA], // Recepcion de nota  
    [3, PedidoStepType.RECEPCION_MERCADERIA], // Recepcion de mercaderia
    [4, PedidoStepType.SOLICITUD_PAGO] // Solicitud de pago
  ]);

  constructor(
    private pedidoService: PedidoService,
    private mainService: MainService,
    private matDialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacionService: NotificacionSnackbarService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getCurrentUser();
    this.loadPedidoData();
  }

  ngAfterViewInit(): void {
    // Fix stepper display issues by ensuring proper initialization after view is ready
    if (this.stepper && this.selectedPedido) {
      this.fixStepperDisplay();
    }
  }

  /**
   * Fix stepper display issues by forcing proper re-rendering
   */
  private fixStepperDisplay(): void {
    if (this.stepper) {
      // Force stepper to re-render its content
      setTimeout(() => {
        const targetIndex = this.currentStepIndex;
        // Reset to step 0 first
        this.stepper.selectedIndex = 0;
        this.cdr.detectChanges();
        
        // Then set to target step
        setTimeout(() => {
          this.stepper.selectedIndex = targetIndex;
          this.cdr.detectChanges();
        }, 50);
      }, 100);
    }
  }

  /**
   * Get current user from main service
   */
  private getCurrentUser(): void {
    this.currentUser = this.mainService.usuarioActual;
  }

  loadPedidoData(): void {
    if (this.data?.tabData?.id) {
      this.isDataLoaded = false;
      this.pedidoService
        .onGetPedidoInfoCompleta(this.data.tabData.id)
        .subscribe((pedido) => {
          this.selectedPedido = pedido;
          this.updateStepAccessibility();
          this.updateEstadoColor();
          this.updateButtonStates();
          this.updateStepTrackingInfo();
          
          // Update summary with a small delay to ensure backend changes are reflected
          setTimeout(() => {
            this.updatePedidoSummary();
          }, 100);
          
          // Update step states after pedido is set and give Angular time to update
          setTimeout(() => {
            this.updateStepStates();
            this.isDataLoaded = true;
            
            // Fix stepper display after data is loaded
            this.fixStepperDisplay();
          }, 150);
        });
    } else {
      // Handle new pedido case (no ID available)
      this.initializeNewPedido();
    }
  }

  /**
   * Initialize component for a new pedido (no existing ID)
   */
  private initializeNewPedido(): void {
    // Reset pedido to null for new pedido
    this.selectedPedido = null;
    
    // Set default values for new pedido
    this.currentStepIndex = 0;
    
    // Initialize step configuration for new pedido
    this.stepsConfig.forEach((step, index) => {
      step.completed = false;
      step.accessible = index === 0; // Only first step accessible for new pedido
    });
    
    // Set accessibility flags
    this.canAccessStep0 = true;
    this.canAccessStep1 = false;
    this.canAccessStep2 = false;
    this.canAccessStep3 = false;
    this.canAccessStep4 = false;
    this.canAccessStep5 = false;
    
    // Reset computed summary values
    this.computedTotalSinDescuento = 0;
    this.computedDescuentoTotal = 0;
    this.computedTotalConDescuento = 0;
    this.computedCantidadItems = 0;
    this.computedCantidadItemsCancelados = 0;
    
    // Reset button states
    this.canGoToRecepcionNota = false;
    this.canAgregarProducto = false;
    
    // Set default estado color
    this.estadoColor = "primary";
    
    // Clear step tracking info
    this.stepInfos.clear();
    this.clearComputedProperties();
    
    // **FIX**: Initialize step controls for new pedido
    this.step1StepControl.setValue(false);
    this.step1StepControl.setErrors({ invalid: true });
    this.step2StepControl.setValue(false);
    this.step2StepControl.setErrors({ invalid: true });
    this.step3StepControl.setValue(false);
    this.step3StepControl.setErrors({ invalid: true });
    this.step4StepControl.setValue(false);
    this.step4StepControl.setErrors({ invalid: true });
    this.step5StepControl.setValue(false);
    this.step5StepControl.setErrors({ invalid: true });
    
    // CRITICAL: Set data loaded to true to hide loading spinner
    this.isDataLoaded = true;
    
    // Trigger change detection
    this.cdr.detectChanges();
  }

  loadPedidoDataFresh(): void {
    if (this.data?.tabData?.id) {
      this.isDataLoaded = false;
      this.pedidoService
        .onGetPedidoInfoCompletaFresh(this.data.tabData.id)
        .subscribe((pedido) => {
          this.selectedPedido = pedido;
          this.updateStepAccessibility();
          this.updateEstadoColor();
          this.updateButtonStates();
          this.updateStepTrackingInfo();
          
          // Update summary with a small delay to ensure backend changes are reflected
          setTimeout(() => {
            this.updatePedidoSummary();
          }, 100);
          
          // Update step states after pedido is set and give Angular time to update
          setTimeout(() => {
            this.updateStepStates();
            this.isDataLoaded = true;
            
            // Fix stepper display after data is loaded
            this.fixStepperDisplay();
          }, 150);
        });
    }
  }

  updateStepStates(): void {
    if (!this.selectedPedido) return;
    
    const estado = this.selectedPedido.estado;
    
    // **FIX**: Update step controls based on current pedido state
    this.updateStepControls();
    
    // Calculate currentStepIndex based on pedido estado
    // Note: ABIERTO and ACTIVO both represent creation phase
    switch (estado) {
      case PedidoEstado.ABIERTO:
      case PedidoEstado.ACTIVO:
        // Both represent creation phase - determine step based on pedido completion
        // If pedido has items, user is likely in step 1 (Detalles del pedido)
        // Otherwise, user is in step 0 (Datos del pedido)
        this.currentStepIndex = (this.selectedPedido.cantPedidoItem && this.selectedPedido.cantPedidoItem > 0) ? 1 : 0;
        break;
      case PedidoEstado.EN_RECEPCION_NOTA:
        this.currentStepIndex = 2;
        break;
      case PedidoEstado.EN_RECEPCION_MERCADERIA:
        this.currentStepIndex = 3;
        break;
      case PedidoEstado.EN_SOLICITUD_PAGO:
        this.currentStepIndex = 4;
        break;
      case PedidoEstado.CONCLUIDO:
        this.currentStepIndex = 4; // Show completed solicitud pago step
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
    this.canAccessStep5 = false;

    // Set accessibility based on estado
    // Note: ABIERTO and ACTIVO both represent creation phase and allow access to steps 0 & 1
    switch (estado) {
      case PedidoEstado.CONCLUIDO:
        this.canAccessStep5 = true;
        this.canAccessStep4 = true;
      // fall through
      case PedidoEstado.EN_SOLICITUD_PAGO:
        this.canAccessStep4 = true;
      // fall through
      case PedidoEstado.EN_RECEPCION_MERCADERIA:
        this.canAccessStep3 = true;
      // fall through
      case PedidoEstado.EN_RECEPCION_NOTA:
        this.canAccessStep2 = true;
      // fall through
      case PedidoEstado.ACTIVO:
      case PedidoEstado.ABIERTO:
      default:
        // Both ABIERTO and ACTIVO allow access to creation steps (0)
        this.canAccessStep0 = true;
        // **FIX**: Step 1 (Detalles del pedido) solo accesible si es válido (pedido guardado)
        this.canAccessStep1 = this.step1FormValid;
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
      case PedidoEstado.ACTIVO:
        // Both represent creation phase - use same color
        this.estadoColor = "primary";
        break;
      case PedidoEstado.EN_RECEPCION_NOTA:
      case PedidoEstado.EN_RECEPCION_MERCADERIA:
      case PedidoEstado.EN_SOLICITUD_PAGO:
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

    // Check if pedido is in creation phase (both ABIERTO and ACTIVO represent the same logical state)
    const isInCreationPhase = this.selectedPedido.estado === PedidoEstado.ABIERTO || 
                              this.selectedPedido.estado === PedidoEstado.ACTIVO;

    // "Siguiente" button to go to "Recepcion de nota" step is enabled when:
    // 1. Pedido exists (already checked above)
    // 2. Step 1 (Datos del pedido) is valid (includes pedido.id existence)
    // 3. Step 2 (Detalles del pedido) is valid (has at least one item)
    // 4. Current estado is in creation phase (ABIERTO or ACTIVO)
    this.canGoToRecepcionNota = 
      isInCreationPhase &&
      this.step1FormValid && // **FIX**: Step 1 must be valid (includes pedido saved with ID)
      this.canAccessStep2 && // **FIX**: Step 2 must be valid (has items)
      this.selectedPedido.cantPedidoItem &&
      this.selectedPedido.cantPedidoItem > 0;

    // "Agregar producto" button is enabled when pedido is in creation phase
    this.canAgregarProducto = isInCreationPhase;
  }

  /**
   * Update step controls based on current validation states
   * This ensures linear stepper navigation works correctly
   */
  private updateStepControls(): void {
    // **FIX**: Only update controls if their values actually changed to prevent loops
    if (this.step1StepControl.value !== this.step1FormValid) {
      // Update Step 1 control based on step1FormValid
      this.step1StepControl.setValue(this.step1FormValid);
      if (this.step1FormValid) {
        this.step1StepControl.setErrors(null);
      } else {
        this.step1StepControl.setErrors({ invalid: true });
      }
    }

    // Update Step 2 control based on canAccessStep2
    if (this.step2StepControl.value !== this.canAccessStep2) {
      this.step2StepControl.setValue(this.canAccessStep2);
      if (this.canAccessStep2) {
        this.step2StepControl.setErrors(null);
      } else {
        this.step2StepControl.setErrors({ invalid: true });
      }
    }

    // Update Step 3 control based on step3Valid
    if (this.step3StepControl.value !== this.step3Valid) {
      this.step3StepControl.setValue(this.step3Valid);
      if (this.step3Valid) {
        this.step3StepControl.setErrors(null);
      } else {
        this.step3StepControl.setErrors({ invalid: true });
      }
    }

    // Update Step 4 control based on step4Valid
    if (this.step4StepControl.value !== this.step4Valid) {
      this.step4StepControl.setValue(this.step4Valid);
      if (this.step4Valid) {
        this.step4StepControl.setErrors(null);
      } else {
        this.step4StepControl.setErrors({ invalid: true });
      }
    }

    // Update Step 5 control based on step5Valid
    if (this.step5StepControl.value !== this.step5Valid) {
      this.step5StepControl.setValue(this.step5Valid);
      if (this.step5Valid) {
        this.step5StepControl.setErrors(null);
      } else {
        this.step5StepControl.setErrors({ invalid: true });
      }
    }
  }

  // **NEW**: Step tracking methods
  
  /**
   * Update step tracking information based on pedido data
   */
  updateStepTrackingInfo(): void {
    if (!this.selectedPedido) {
      this.stepInfos.clear();
      this.clearComputedProperties();
      return;
    }

    // Initialize step infos
    this.stepInfos.set(PedidoStepType.CREACION, this.getStepInfo(PedidoStepType.CREACION));
    this.stepInfos.set(PedidoStepType.RECEPCION_NOTA, this.getStepInfo(PedidoStepType.RECEPCION_NOTA));
    this.stepInfos.set(PedidoStepType.RECEPCION_MERCADERIA, this.getStepInfo(PedidoStepType.RECEPCION_MERCADERIA));
    this.stepInfos.set(PedidoStepType.SOLICITUD_PAGO, this.getStepInfo(PedidoStepType.SOLICITUD_PAGO));
    
    // Update computed properties for template
    this.updateComputedProperties();
  }

  /**
   * Update computed properties for template binding
   */
  private updateComputedProperties(): void {
    if (!this.selectedPedido) {
      this.clearComputedProperties();
      return;
    }

    // Get step info first
    this.recepcionNotaStepInfo = this.getRecepcionNotaStepInfo();
    this.recepcionMercaderiaStepInfo = this.getRecepcionMercaderiaStepInfo();
    this.currentStepTrackingInfo = this.getCurrentStepTrackingInfo();

    // Update computed flags for Recepcion Nota step
    if (this.recepcionNotaStepInfo) {
      this.isRecepcionNotaActive = this.recepcionNotaStepInfo.status === StepStatus.IN_PROGRESS || this.recepcionNotaStepInfo.status === StepStatus.COMPLETED;
    } else {
      this.isRecepcionNotaActive = false;
    }

    // **NEW**: Update computed flags for Recepcion Mercaderia step
    if (this.recepcionMercaderiaStepInfo) {
      this.isRecepcionMercaderiaActive = this.recepcionMercaderiaStepInfo.status === StepStatus.IN_PROGRESS || this.recepcionMercaderiaStepInfo.status === StepStatus.COMPLETED;
    } else {
      this.isRecepcionMercaderiaActive = false;
    }

    // Update Next button tooltip for step 3
    if (!this.isRecepcionNotaActive) {
      this.nextButtonTooltip = 'Debe iniciar la recepción de nota antes de continuar';
    } else if (!this.step3Valid) {
      this.nextButtonTooltip = 'Complete la asignación de todos los items y distribución por sucursales antes de continuar';
    } else {
      this.nextButtonTooltip = 'Finalizar recepción de nota y pasar a recepción de mercadería';
    }

    // **NEW**: Update Recepcion Mercaderia button tooltip
    if (!this.canAccessStep3) {
      this.recepcionMercaderiaButtonTooltip = 'Complete la recepción de nota antes de continuar';
    } else if (!this.step4Valid) {
      this.recepcionMercaderiaButtonTooltip = 'Complete la verificación de todos los items antes de finalizar';
    } else {
      this.recepcionMercaderiaButtonTooltip = 'Finalizar recepción de mercadería. Se crearán movimientos de stock y se actualizarán precios si es necesario';
    }

    // **NEW**: Update Solicitud Pago step computed properties
    this.solicitudPagoStepInfo = this.getSolicitudPagoStepInfo();
    if (this.solicitudPagoStepInfo) {
      this.isSolicitudPagoActive = this.solicitudPagoStepInfo.status === StepStatus.IN_PROGRESS || this.solicitudPagoStepInfo.status === StepStatus.COMPLETED;
    } else {
      this.isSolicitudPagoActive = false;
    }
  }

  /**
   * Clear computed properties when no pedido data
   */
  private clearComputedProperties(): void {
    this.recepcionNotaStepInfo = null;
    this.isRecepcionNotaActive = false;
    this.nextButtonTooltip = '';
    this.currentStepTrackingInfo = null;
    this.recepcionMercaderiaStepInfo = null;
    this.isRecepcionMercaderiaActive = false;
    this.recepcionMercaderiaButtonTooltip = '';
    this.solicitudPagoStepInfo = null;
    this.isSolicitudPagoActive = false;
  }

  /**
   * Get current step tracking info based on pedido estado
   */
  private getCurrentStepTrackingInfo(): StepInfo | null {
    if (!this.selectedPedido) {
      return null;
    }

    const estado = this.selectedPedido.estado;

    switch (estado) {
      case PedidoEstado.ABIERTO:
      case PedidoEstado.ACTIVO:
        // Both represent creation phase
        return this.stepInfos.get(PedidoStepType.CREACION) || null;
      case PedidoEstado.EN_RECEPCION_NOTA:
        return this.stepInfos.get(PedidoStepType.RECEPCION_NOTA) || null;
      case PedidoEstado.EN_RECEPCION_MERCADERIA:
        return this.stepInfos.get(PedidoStepType.RECEPCION_MERCADERIA) || null;
      case PedidoEstado.EN_SOLICITUD_PAGO:
        return this.stepInfos.get(PedidoStepType.SOLICITUD_PAGO) || null;
      case PedidoEstado.CONCLUIDO:
        // For completed pedidos, show the last completed step (solicitud pago)
        return this.stepInfos.get(PedidoStepType.SOLICITUD_PAGO) || null;
      default:
        return null;
    }
  }

  /**
   * Get step information for a specific step type
   */
  private getStepInfo(stepType: PedidoStepType): StepInfo {
    if (!this.selectedPedido) {
      return this.createEmptyStepInfo(stepType);
    }

    let assignedUser: Usuario | null = null;
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let progress = 0;

    // Extract data based on step type
    switch (stepType) {
      case PedidoStepType.CREACION:
        assignedUser = this.selectedPedido.usuarioCreacion;
        startDate = this.selectedPedido.fechaInicioCreacion;
        endDate = this.selectedPedido.fechaFinCreacion;
        progress = this.selectedPedido.progresoCreacion || 0;
        break;
      case PedidoStepType.RECEPCION_NOTA:
        assignedUser = this.selectedPedido.usuarioRecepcionNota;
        startDate = this.selectedPedido.fechaInicioRecepcionNota;
        endDate = this.selectedPedido.fechaFinRecepcionNota;
        progress = this.selectedPedido.progresoRecepcionNota || 0;
        break;
      case PedidoStepType.RECEPCION_MERCADERIA:
        assignedUser = this.selectedPedido.usuarioRecepcionMercaderia;
        startDate = this.selectedPedido.fechaInicioRecepcionMercaderia;
        endDate = this.selectedPedido.fechaFinRecepcionMercaderia;
        progress = this.selectedPedido.progresoRecepcionMercaderia || 0;
        break;
      case PedidoStepType.SOLICITUD_PAGO:
        assignedUser = this.selectedPedido.usuarioSolicitudPago;
        startDate = this.selectedPedido.fechaInicioSolicitudPago;
        endDate = this.selectedPedido.fechaFinSolicitudPago;
        progress = this.selectedPedido.progresoSolicitudPago || 0;
        break;
    }

    // Determine step status
    const status = this.getStepStatus(stepType, startDate, endDate);
    const canStart = this.canStartStep(stepType);
    const canComplete = this.canCompleteStep(stepType);

    return {
      stepType,
      status,
      assignedUser,
      startDate,
      endDate,
      progress,
      canStart,
      canComplete
    };
  }

  /**
   * Create empty step info for initialization
   */
  private createEmptyStepInfo(stepType: PedidoStepType): StepInfo {
    return {
      stepType,
      status: StepStatus.NOT_STARTED,
      assignedUser: null,
      startDate: null,
      endDate: null,
      progress: 0,
      canStart: false,
      canComplete: false
    };
  }

  /**
   * Determine step status based on dates and current estado
   */
  private getStepStatus(stepType: PedidoStepType, startDate: Date | null, endDate: Date | null): StepStatus {
    if (endDate) {
      return StepStatus.COMPLETED;
    }
    
    if (startDate) {
      return StepStatus.IN_PROGRESS;
    }

    // Check if step is available based on pedido estado
    if (this.canStartStep(stepType)) {
      return StepStatus.AVAILABLE;
    }

    return StepStatus.NOT_STARTED;
  }

  /**
   * Check if a step can be started
   */
  private canStartStep(stepType: PedidoStepType): boolean {
    if (!this.selectedPedido) return false;

    const estado = this.selectedPedido.estado;

    switch (stepType) {
      case PedidoStepType.CREACION:
        return estado === PedidoEstado.ABIERTO || estado === PedidoEstado.ACTIVO;
            case PedidoStepType.RECEPCION_NOTA:
        return estado === PedidoEstado.EN_RECEPCION_NOTA ||
               estado === PedidoEstado.EN_RECEPCION_MERCADERIA ||
               estado === PedidoEstado.EN_SOLICITUD_PAGO ||
               estado === PedidoEstado.CONCLUIDO;
      case PedidoStepType.RECEPCION_MERCADERIA:
        return estado === PedidoEstado.EN_RECEPCION_MERCADERIA ||
               estado === PedidoEstado.EN_SOLICITUD_PAGO ||
               estado === PedidoEstado.CONCLUIDO;
      case PedidoStepType.SOLICITUD_PAGO:
        return estado === PedidoEstado.EN_SOLICITUD_PAGO ||
               estado === PedidoEstado.CONCLUIDO;
      default:
        return false;
    }
  }

  /**
   * Check if a step can be completed
   */
  private canCompleteStep(stepType: PedidoStepType): boolean {
    if (!this.selectedPedido) return false;

    const stepInfo = this.stepInfos.get(stepType);
    if (!stepInfo || stepInfo.status !== StepStatus.IN_PROGRESS) {
      return false;
    }

    // Add specific completion conditions for each step
    switch (stepType) {
      case PedidoStepType.CREACION:
        return this.selectedPedido.cantPedidoItem > 0;
      case PedidoStepType.RECEPCION_NOTA:
        return this.step3Valid;
      case PedidoStepType.RECEPCION_MERCADERIA:
        // Add specific conditions for mercaderia reception
        return true;
      case PedidoStepType.SOLICITUD_PAGO:
        return this.step5Valid;
      default:
        return false;
    }
  }

  /**
   * Begin work on a step
   */
  beginStep(stepType: PedidoStepType): void {
    if (!this.selectedPedido || !this.currentUser) return;

    const stepInfo = this.stepInfos.get(stepType);
    if (!stepInfo || !stepInfo.canStart || stepInfo.status !== StepStatus.AVAILABLE) {
      return;
    }

    // Update pedido with step start information
    const updatedPedido = new Pedido();
    Object.assign(updatedPedido, this.selectedPedido);
    const now = new Date();

    switch (stepType) {
      case PedidoStepType.CREACION:
        updatedPedido.usuarioCreacion = this.currentUser;
        updatedPedido.fechaInicioCreacion = now;
        updatedPedido.progresoCreacion = 0;
        break;
      case PedidoStepType.RECEPCION_NOTA:
        updatedPedido.usuarioRecepcionNota = this.currentUser;
        updatedPedido.fechaInicioRecepcionNota = now;
        updatedPedido.progresoRecepcionNota = 0;
        break;
      case PedidoStepType.RECEPCION_MERCADERIA:
        updatedPedido.usuarioRecepcionMercaderia = this.currentUser;
        updatedPedido.fechaInicioRecepcionMercaderia = now;
        updatedPedido.progresoRecepcionMercaderia = 0;
        break;
      case PedidoStepType.SOLICITUD_PAGO:
        updatedPedido.usuarioSolicitudPago = this.currentUser;
        updatedPedido.fechaInicioSolicitudPago = now;
        updatedPedido.progresoSolicitudPago = 0;
        break;
    }

    // Save the updated pedido
    this.savePedidoStepInfo(updatedPedido, `Iniciando trabajo en etapa: ${this.getStepDisplayName(stepType)}`);
  }

  /**
   * Complete a step
   */
  completeStep(stepType: PedidoStepType): void {
    if (!this.selectedPedido || !this.currentUser) return;

    const stepInfo = this.stepInfos.get(stepType);
    if (!stepInfo || !stepInfo.canComplete || stepInfo.status !== StepStatus.IN_PROGRESS) {
      return;
    }

    // Update pedido with step completion information
    const updatedPedido = new Pedido();
    Object.assign(updatedPedido, this.selectedPedido);
    const now = new Date();

    switch (stepType) {
      case PedidoStepType.CREACION:
        updatedPedido.fechaFinCreacion = now;
        updatedPedido.progresoCreacion = 100;
        break;
      case PedidoStepType.RECEPCION_NOTA:
        updatedPedido.fechaFinRecepcionNota = now;
        updatedPedido.progresoRecepcionNota = 100;
        break;
      case PedidoStepType.RECEPCION_MERCADERIA:
        updatedPedido.fechaFinRecepcionMercaderia = now;
        updatedPedido.progresoRecepcionMercaderia = 100;
        break;
      case PedidoStepType.SOLICITUD_PAGO:
        updatedPedido.fechaFinSolicitudPago = now;
        updatedPedido.progresoSolicitudPago = 100;
        break;
    }

    // Save the updated pedido
    this.savePedidoStepInfo(updatedPedido, `Completando etapa: ${this.getStepDisplayName(stepType)}`);
  }

  /**
   * Update step progress
   */
  updateStepProgress(stepType: PedidoStepType, progress: number): void {
    if (!this.selectedPedido || progress < 0 || progress > 100) return;

    const stepInfo = this.stepInfos.get(stepType);
    if (!stepInfo || stepInfo.status !== StepStatus.IN_PROGRESS) {
      return;
    }

    // Update pedido with new progress
    const updatedPedido = new Pedido();
    Object.assign(updatedPedido, this.selectedPedido);

    switch (stepType) {
      case PedidoStepType.CREACION:
        updatedPedido.progresoCreacion = progress;
        break;
      case PedidoStepType.RECEPCION_NOTA:
        updatedPedido.progresoRecepcionNota = progress;
        break;
      case PedidoStepType.RECEPCION_MERCADERIA:
        updatedPedido.progresoRecepcionMercaderia = progress;
        break;
      case PedidoStepType.SOLICITUD_PAGO:
        updatedPedido.progresoSolicitudPago = progress;
        break;
    }

    // Save the updated pedido (silent save without notification)
    this.savePedidoStepInfo(updatedPedido, null);
  }

  /**
   * Get step info by stepper index
   */
  getStepInfoByStepperIndex(stepperIndex: number): StepInfo | null {
    const stepType = this.stepperToStepType.get(stepperIndex);
    return stepType ? this.stepInfos.get(stepType) || null : null;
  }

  /**
   * Get step display name for UI
   */
  private getStepDisplayName(stepType: PedidoStepType): string {
    switch (stepType) {
      case PedidoStepType.CREACION:
        return 'Creación';
      case PedidoStepType.RECEPCION_NOTA:
        return 'Recepción de Nota';
      case PedidoStepType.RECEPCION_MERCADERIA:
        return 'Recepción de Mercadería';
      case PedidoStepType.SOLICITUD_PAGO:
        return 'Solicitud de Pago';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Save pedido step information
   */
  private savePedidoStepInfo(updatedPedido: Pedido, successMessage: string | null): void {
    this.pedidoService.onSave(updatedPedido.toInput())
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (savedPedido) => {
          this.selectedPedido = savedPedido;
          this.updateStepTrackingInfo();
          
          if (successMessage) {
            this.notificacionService.openSucess(successMessage);
          }
        },
        error: (error) => {
          console.error('Error saving step information:', error);
          this.notificacionService.openWarn("Error al guardar información de etapa");
        }
      });
  }

  // Navigation methods
  nextStep(): void {
    if (!this.stepper || !this.selectedPedido) {
      return;
    }

    // Special handling for transition from Recepcion de nota (step 3) to Recepcion de mercaderia (step 4)
    if (this.currentStepIndex === 2 && this.selectedPedido.estado === PedidoEstado.EN_RECEPCION_NOTA) {
      this.transitionToRecepcionMercaderia();
      return;
    }

    // Normal step navigation
    if (this.stepper.selectedIndex < this.stepsConfig.length - 1) {
      this.stepper.next();
    }
  }

  /**
   * Handles the transition from Recepcion de nota to Recepcion de mercaderia
   */
  private transitionToRecepcionMercaderia(): void {
    this.finalizarRecepcionNotaConDialog();
  }

  /**
   * Show finalization dialog for Recepcion de Nota step
   */
  finalizarRecepcionNotaConDialog(): void {
    if (!this.selectedPedido) {
      return;
    }

    // Prepare data for the finalization dialog
    const totalItems = this.computedCantidadItems || 0;
    const totalValue = this.computedTotalConDescuento || 0;
    const monedaSymbol = this.selectedPedido.moneda?.simbolo || 'Gs.';
    
    const dialogData: FinalizacionDialogData = {
      titulo: 'Finalizar Recepción de Nota',
      proveedor: this.selectedPedido.proveedor,
      vendedor: this.selectedPedido.vendedor,
      formaPago: this.selectedPedido.formaPago,
      cantidadItems: totalItems,
      totalValue: totalValue,
      monedaSymbol: monedaSymbol
    };

    // Open the finalization dialog
    const dialogRef = this.matDialog.open(FinalizacionDialogComponent, {
      data: dialogData,
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: true,
      autoFocus: false,
      panelClass: ['modern-dialog', 'no-padding-dialog']
    });

    dialogRef.afterClosed().subscribe((result: FinalizacionDialogResult) => {
             if (result?.confirmed) {
         // Proceed with the finalization
         this.finalizarRecepcionNota();
       }
    });
  }

  /**
   * Calls the backend to change pedido estado to EN_RECEPCION_MERCADERIA
   */
  private finalizarRecepcionNota(): void {
    this.pedidoService.onFinalizarPedido(
      this.selectedPedido.id,
      PedidoEstado.EN_RECEPCION_MERCADERIA
    ).pipe(untilDestroyed(this)).subscribe({
      next: (updatedPedido) => {
        if (updatedPedido?.id) {
          // Update the selected pedido with the response
          this.selectedPedido = updatedPedido;
          
          // Update step states and accessibility
          this.updateStepStates();
          this.updateStepAccessibility();
          this.updateEstadoColor();
          this.updateButtonStates();
          
          // CRITICAL: Update step tracking info to refresh step completion and fechaFin fields
          this.updateStepTrackingInfo();
          
          // Update summary with delay to ensure backend changes are reflected
          setTimeout(() => {
            this.updatePedidoSummary();
          }, 500);
          
          // Navigate to next step
          this.stepper.next();
          
          // Show success notification - open sucess
          this.notificacionService.openSucess("Recepción de nota finalizada exitosamente. Ahora puede proceder con la recepción de mercadería.");
          
          // Reload pedido data to get fresh data from backend
          setTimeout(() => {
            this.loadPedidoDataFresh();
          }, 1000);
        }
      },
      error: (error) => {
        console.error('Error al finalizar recepción de nota:', error);
        this.notificacionService.openWarn("Error al finalizar la recepción de nota. Por favor, inténtelo nuevamente.");
      }
    });
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
          this.loadPedidoDataFresh();
        } else {
          // Use regular data fetch for other changes
          this.loadPedidoData();
        }
        
        // Show appropriate message based on what changed
        if (result.added) {
          // Item added successfully
        }
        
        if (result.updated) {
          // Item updated successfully
        }
        
        if (result.productConfigurationChanged) {
        }
        
        if (result.sucursalDistributionChanged) {
        }
        
        if (result.rejectionStatusChanged) {
        }
        
        if (result.itemCancellationChanged) {
        }
      } else if (result?.cancelled) {
      }
    });
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

  /**
   * **NEW**: Method to handle finalizing the creation phase with confirmation dialog
   */
  finalizarCreacionPedido(): void {
    if (!this.canGoToRecepcionNota || !this.selectedPedido) {
      return;
    }

    // Prepare data for the modern finalization dialog
    const totalItems = this.computedCantidadItems || 0;
    const totalValue = this.computedTotalConDescuento || 0;
    const monedaSymbol = this.selectedPedido.moneda?.simbolo || 'Gs.';
    
    const dialogData: FinalizacionDialogData = {
      titulo: 'Finalizar Creación del Pedido',
      proveedor: this.selectedPedido.proveedor,
      vendedor: this.selectedPedido.vendedor,
      formaPago: this.selectedPedido.formaPago,
      cantidadItems: totalItems,
      totalValue: totalValue,
      monedaSymbol: monedaSymbol
    };

    // Open the modern finalization dialog
    const dialogRef = this.matDialog.open(FinalizacionDialogComponent, {
      data: dialogData,
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: true,
      autoFocus: false,
      panelClass: ['modern-dialog', 'no-padding-dialog']
    });

    dialogRef.afterClosed().subscribe((result: FinalizacionDialogResult) => {
      if (result?.confirmed) {
        // Proceed with the finalization
        this.ejecutarFinalizacionCreacion();
      }
    });
  }

  /**
   * Execute the actual finalization after user confirmation
   */
  private ejecutarFinalizacionCreacion(): void {
    this.pedidoService
      .onFinalizarPedido(this.selectedPedido!.id, PedidoEstado.EN_RECEPCION_NOTA)
      .pipe(untilDestroyed(this))
      .subscribe(
        (updatedPedido) => {
          this.selectedPedido = updatedPedido;
          this.updateStepStates();
          this.updateStepAccessibility();
          this.updateEstadoColor();
          this.updateButtonStates();
          this.updatePedidoSummary();
          
          // CRITICAL: Update step tracking info to refresh button visibility
          this.updateStepTrackingInfo();
          
          // Show success notification
          this.notificacionService.openSucess("Creación del pedido finalizada exitosamente. Ahora puede proceder con la recepción de nota.");
          
          // Move to step 2 (Recepcion de nota) - but step will show initiation UI
          this.goToStep(2);
        },
        (error) => {
          console.error('Error al finalizar creación del pedido:', error);
          this.notificacionService.openWarn("Error al finalizar la creación del pedido. Por favor, inténtelo nuevamente.");
        }
      );
  }

  completePedido(): void {
    if (!this.selectedPedido || !this.step5Valid) {
      this.notificacionService.openWarn('Complete todos los pasos antes de finalizar el pedido');
      return;
    }

    if (!this.solicitudPagoComponent) {
      this.notificacionService.openWarn('Error: Componente de solicitud de pago no disponible');
      return;
    }

    // Call the child component's finalization method
    this.solicitudPagoComponent.finalizarSolicitudPago().then((success) => {
      if (success) {
        // Additional completion logic if needed
        console.log('Pedido completado exitosamente');
      }
    }).catch((error) => {
      console.error('Error completing pedido:', error);
      this.notificacionService.openWarn('Error al completar el pedido');
    });
  }

  onPedidoChange(updatedPedido: Pedido): void {
    // **FIX**: Prevent infinite loops by checking if pedido actually changed
    if (this.selectedPedido?.id === updatedPedido?.id && 
        this.selectedPedido?.estado === updatedPedido?.estado) {
      return;
    }
    
    this.selectedPedido = updatedPedido;
    this.updateStepStates();
    this.updateStepAccessibility();
    this.updateEstadoColor();
    this.updateButtonStates();
    this.updatePedidoSummary(); // Refresh summary when pedido changes
    
    // CRITICAL: Update step tracking info to refresh header status
    this.updateStepTrackingInfo();
    
    // CRITICAL: Update step controls after pedido changes (especially for new ID)
    this.updateStepControls();
  }

  onStep1FormValidChange(isValid: boolean): void {
    // **FIX**: Prevent infinite loops by checking if validation state actually changed
    if (this.step1FormValid === isValid) {
      return;
    }
    
    this.step1FormValid = isValid;
    this.canAccessStep1 = isValid;
    this.stepsConfig[0].completed = isValid;
    
    // **FIX**: Update step control for linear stepper navigation
    this.step1StepControl.setValue(isValid);
    if (isValid) {
      this.step1StepControl.setErrors(null);
    } else {
      this.step1StepControl.setErrors({ invalid: true });
    }
    
    // **FIX**: Update button states when step 1 validation changes
    this.updateButtonStates();
  }

  onStep2FormValidChange(isValid: boolean): void {
    this.canAccessStep2 = isValid;
    this.stepsConfig[1].completed = isValid;
    
    // **FIX**: Update step control for linear stepper navigation
    this.step2StepControl.setValue(isValid);
    if (isValid) {
      this.step2StepControl.setErrors(null);
    } else {
      this.step2StepControl.setErrors({ invalid: true });
    }
    
    // **FIX**: Update button states when step 2 validation changes
    this.updateButtonStates();
  }

  onStep3ValidChange(isValid: boolean): void {
    this.step3Valid = isValid;
    // Update step completion status
    this.stepsConfig[2].completed = isValid;
    
    // **FIX**: Update step control for linear stepper navigation
    this.step3StepControl.setValue(isValid);
    if (isValid) {
      this.step3StepControl.setErrors(null);
    } else {
      this.step3StepControl.setErrors({ invalid: true });
    }
    
    // Update computed properties since step3Valid affects nextButtonTooltip
    this.updateComputedProperties();
  }

  onStep4ValidChange(isValid: boolean): void {
    this.step4Valid = isValid;
    // Update step completion status
    this.stepsConfig[3].completed = isValid;
    
    // **FIX**: Update step control for linear stepper navigation
    this.step4StepControl.setValue(isValid);
    if (isValid) {
      this.step4StepControl.setErrors(null);
    } else {
      this.step4StepControl.setErrors({ invalid: true });
    }
    
    // Update computed properties to refresh UI state
    this.updateComputedProperties();
  }

  onStep5ValidChange(isValid: boolean): void {
    this.step5Valid = isValid;
    // Update step completion status
    this.stepsConfig[4].completed = isValid;
    
    // **FIX**: Update step control for linear stepper navigation
    this.step5StepControl.setValue(isValid);
    if (isValid) {
      this.step5StepControl.setErrors(null);
    } else {
      this.step5StepControl.setErrors({ invalid: true });
    }
    
    // Update computed properties to refresh UI state
    this.updateComputedProperties();
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

  // **NEW**: Step-specific methods for the Recepcion Nota step

  /**
   * Get step info for the Recepcion Nota step
   */
  getRecepcionNotaStepInfo(): StepInfo | null {
    return this.stepInfos.get(PedidoStepType.RECEPCION_NOTA) || null;
  }

  /**
   * Get step info for the Recepcion Mercaderia step
   */
  getRecepcionMercaderiaStepInfo(): StepInfo | null {
    return this.stepInfos.get(PedidoStepType.RECEPCION_MERCADERIA) || null;
  }

  /**
   * Get step info for the Solicitud Pago step
   */
  getSolicitudPagoStepInfo(): StepInfo | null {
    return this.stepInfos.get(PedidoStepType.SOLICITUD_PAGO) || null;
  }

  /**
   * Get the status icon for a step
   */
  getStepStatusIcon(stepInfo: StepInfo): string {
    switch (stepInfo.status) {
      case StepStatus.NOT_STARTED:
        return 'radio_button_unchecked';
      case StepStatus.AVAILABLE:
        return 'play_circle_outline';
      case StepStatus.IN_PROGRESS:
        return 'pending';
      case StepStatus.COMPLETED:
        return 'check_circle';
      default:
        return 'radio_button_unchecked';
    }
  }

  /**
   * Get the status title for a step
   */
  getStepStatusTitle(stepInfo: StepInfo): string {
    switch (stepInfo.status) {
      case StepStatus.NOT_STARTED:
        return 'Etapa no iniciada';
      case StepStatus.AVAILABLE:
        return 'Lista para iniciar';
      case StepStatus.IN_PROGRESS:
        return `En progreso (${stepInfo.progress || 0}%)`;
      case StepStatus.COMPLETED:
        return 'Etapa completada';
      default:
        return 'Estado desconocido';
    }
  }

  /**
   * Get the status subtitle for a step
   */
  getStepStatusSubtitle(stepInfo: StepInfo): string | null {
    if (stepInfo.assignedUser && stepInfo.startDate) {
      const userName = stepInfo.assignedUser.persona?.nombre || 'Usuario';
      const startDate = new Date(stepInfo.startDate).toLocaleString();
      return `Iniciado por ${userName} el ${startDate}`;
    } else if (stepInfo.status === StepStatus.AVAILABLE) {
      return 'Haga clic en "Iniciar" para comenzar esta etapa';
    }
    return null;
  }

  /**
   * Check if step action button should be shown
   */
  showStepActionButton(stepInfo: StepInfo): boolean {
    return stepInfo.status === StepStatus.AVAILABLE && stepInfo.canStart;
  }

  /**
   * Check if user can begin the Recepcion Nota step
   */
  canBeginRecepcionNotaStep(): boolean {
    const stepInfo = this.getRecepcionNotaStepInfo();
    return stepInfo?.canStart && stepInfo.status === StepStatus.AVAILABLE;
  }

  /**
   * Begin the Recepcion Nota step
   */
  beginRecepcionNotaStep(): void {
    this.beginStep(PedidoStepType.RECEPCION_NOTA);
    
    // Show success message
    this.notificacionService.openSucess("Iniciando recepción de nota. Ahora puede asignar productos a notas de recepción.");
  }

  /**
   * Begin the Recepcion Mercaderia step
   */
  beginRecepcionMercaderiaStep(): void {
    this.beginStep(PedidoStepType.RECEPCION_MERCADERIA);
    
    // Show success message
    this.notificacionService.openSucess("Iniciando recepción de mercadería. Ahora puede verificar los productos recibidos.");
  }

  /**
   * Begin the Solicitud Pago step
   */
  beginSolicitudPagoStep(): void {
    this.beginStep(PedidoStepType.SOLICITUD_PAGO);
    
    // Show success message
    this.notificacionService.openSucess("Iniciando solicitud de pago. Ahora puede agrupar las notas de recepción para su procesamiento.");
  }

  /**
   * Check if the Recepcion Nota step is currently active
   */
  isRecepcionNotaStepActive(): boolean {
    const stepInfo = this.getRecepcionNotaStepInfo();
    return stepInfo?.status === StepStatus.IN_PROGRESS || stepInfo?.status === StepStatus.COMPLETED;
  }

  /**
   * Get the tooltip for the Next button based on current step state
   */
  getNextButtonTooltip(): string {
    if (!this.isRecepcionNotaStepActive()) {
      return 'Debe iniciar la recepción de nota antes de continuar';
    } else if (!this.step3Valid) {
      return 'Complete la asignación de todos los items y distribución por sucursales antes de continuar';
    } else {
      return 'Finalizar recepción de nota y pasar a recepción de mercadería';
    }
  }

  /**
   * Show confirmation dialog before finalizing recepcion mercaderia step
   */
  finalizarRecepcionMercaderiaConDialog(): void {
    if (!this.selectedPedido || !this.step4Valid) {
      return;
    }

    const message = `¿Está seguro que desea finalizar la recepción de mercadería?\n\n` +
      `Esta acción:\n` +
      `• Creará movimientos de stock para cada producto en cada sucursal\n` +
      `• Modificará precios y costos de productos si es necesario\n` +
      `• Cambiará el estado del pedido a la siguiente etapa\n\n` +
      `Esta operación no se puede deshacer.`;

    this.dialogosService.confirm(
      'Confirmar finalización de recepción de mercadería',
      message
    ).subscribe(result => {
      if (result) {
        this.finalizarRecepcionMercaderia();
      }
    });
  }

  /**
   * Execute recepcion mercaderia finalization
   */
  private finalizarRecepcionMercaderia(): void {
    if (!this.selectedPedido?.id) {
      return;
    }

    // Call backend to finalize pedido and move to next step
    this.pedidoService.onFinalizarPedido(this.selectedPedido.id, PedidoEstado.EN_SOLICITUD_PAGO)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (updatedPedido) => {
          // Update local pedido data
          this.selectedPedido = updatedPedido;
          
          // Refresh all computed properties and step states
          this.updateStepStates();
          this.updateStepAccessibility();
          this.updateEstadoColor();
          this.updateButtonStates();
          this.updatePedidoSummary();
          this.updateStepTrackingInfo();
          
          // Show success notification
          this.notificacionService.openSucess(
            "Recepción de mercadería finalizada exitosamente. Se han creado los movimientos de stock y actualizado precios. Ahora puede proceder con la solicitud de pago."
          );
          
          // Move to next step (Solicitud de pago)
          this.goToStep(4);
        },
        error: (error) => {
          console.error('Error al finalizar recepción de mercadería:', error);
          this.notificacionService.openWarn(
            "Error al finalizar la recepción de mercadería. Por favor, inténtelo nuevamente."
          );
        }
      });
  }
}
