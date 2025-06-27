import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { StepInfo, StepStatus, PedidoStepType } from '../../edit-pedido-2.component';

@Component({
  selector: 'app-step-initialization',
  templateUrl: './step-initialization.component.html',
  styleUrls: ['./step-initialization.component.scss']
})
export class StepInitializationComponent implements OnChanges {
  
  @Input() stepInfo: StepInfo | null = null;
  @Input() isProcessing = false;
  @Input() customActionText?: string; // Optional custom text for the action button
  @Input() customSuccessMessage?: string; // Optional custom success message
  
  @Output() initiateStep = new EventEmitter<void>();
  @Output() viewDetails = new EventEmitter<void>(); // For completed steps

  // Computed properties for template binding
  showInitButton = false;
  canInitiateStep = false;
  stepStatusIcon = '';
  stepStatusTitle = '';
  stepStatusSubtitle: string | null = null;
  statusCardClass = '';
  actionButtonText = '';
  showViewDetailsButton = false;
  
  // **FIX**: Pre-computed properties to avoid function calls in template
  statusIconClass = '';
  showProgressSection = false;
  progressBarValue = 0;
  progressBarColor = '';
  progressText = '';
  showInfoCard = false;

  // Step status enum for template access
  StepStatus = StepStatus;
  PedidoStepType = PedidoStepType;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stepInfo'] || changes['isProcessing']) {
      this.updateComputedProperties();
    }
  }

  private updateComputedProperties(): void {
    if (!this.stepInfo) {
      this.clearProperties();
      return;
    }

    // Button visibility and state
    this.showInitButton = this.stepInfo.status === StepStatus.AVAILABLE && this.stepInfo.canStart && !this.isProcessing;
    this.canInitiateStep = this.stepInfo.canStart && this.stepInfo.status === StepStatus.AVAILABLE && !this.isProcessing;
    this.showViewDetailsButton = this.stepInfo.status === StepStatus.COMPLETED;

    // Status display properties
    this.stepStatusIcon = this.getStatusIcon();
    this.stepStatusTitle = this.getStatusTitle();
    this.stepStatusSubtitle = this.getStatusSubtitle();
    this.statusCardClass = this.getStatusCardClass();
    this.actionButtonText = this.getActionButtonText();
    
    // **FIX**: Pre-compute all template properties to avoid function calls
    this.statusIconClass = 'status-icon'; // Simplified - single class for all icons
    this.showProgressSection = this.stepInfo.status === StepStatus.IN_PROGRESS && (this.stepInfo.progress || 0) > 0;
    this.progressBarValue = this.stepInfo.progress || 0;
    this.progressBarColor = this.stepInfo.status === StepStatus.COMPLETED ? 'accent' : 'primary';
    this.progressText = `${this.progressBarValue}% completado`;
    this.showInfoCard = this.stepInfo.status === StepStatus.NOT_STARTED;
  }

  private clearProperties(): void {
    this.showInitButton = false;
    this.canInitiateStep = false;
    this.stepStatusIcon = '';
    this.stepStatusTitle = '';
    this.stepStatusSubtitle = null;
    this.statusCardClass = '';
    this.actionButtonText = '';
    this.showViewDetailsButton = false;
    this.statusIconClass = '';
    this.showProgressSection = false;
    this.progressBarValue = 0;
    this.progressBarColor = '';
    this.progressText = '';
    this.showInfoCard = false;
  }

  private getStatusIcon(): string {
    if (!this.stepInfo) return 'info_outline';
    
    switch (this.stepInfo.status) {
      case StepStatus.NOT_STARTED:
        return 'radio_button_unchecked';
      case StepStatus.AVAILABLE:
        return 'play_circle_outline';
      case StepStatus.IN_PROGRESS:
        return 'schedule';
      case StepStatus.COMPLETED:
        return 'check_circle';
      default:
        return 'info_outline';
    }
  }

  private getStatusTitle(): string {
    if (!this.stepInfo) return 'Estado no disponible';
    
    const stepName = this.getStepDisplayName();
    
    switch (this.stepInfo.status) {
      case StepStatus.NOT_STARTED:
        return `${stepName} - No iniciada`;
      case StepStatus.AVAILABLE:
        return `${stepName} - Lista para iniciar`;
      case StepStatus.IN_PROGRESS:
        const progress = this.stepInfo.progress || 0;
        return `${stepName} - En progreso (${progress}%)`;
      case StepStatus.COMPLETED:
        return `${stepName} - Completada`;
      default:
        return stepName;
    }
  }

  private getStatusSubtitle(): string | null {
    if (!this.stepInfo) return null;
    
    switch (this.stepInfo.status) {
      case StepStatus.NOT_STARTED:
        return 'Debe completar la etapa anterior para continuar';
      case StepStatus.AVAILABLE:
        return 'Haga clic en "Iniciar" para comenzar esta etapa';
      case StepStatus.IN_PROGRESS:
        if (this.stepInfo.assignedUser && this.stepInfo.startDate) {
          const userName = this.stepInfo.assignedUser.persona?.nombre || this.stepInfo.assignedUser.nickname || 'Usuario';
          const startDate = new Date(this.stepInfo.startDate).toLocaleString('es-PY');
          return `Iniciado por ${userName} el ${startDate}`;
        }
        return 'Etapa en progreso';
      case StepStatus.COMPLETED:
        if (this.stepInfo.assignedUser && this.stepInfo.endDate) {
          const userName = this.stepInfo.assignedUser.persona?.nombre || this.stepInfo.assignedUser.nickname || 'Usuario';
          const endDate = new Date(this.stepInfo.endDate).toLocaleString('es-PY');
          return `Completado por ${userName} el ${endDate}`;
        }
        return 'Etapa completada exitosamente';
      default:
        return null;
    }
  }

  private getStatusCardClass(): string {
    return 'step-status-card'; // Simplified - single class for all states
  }

  private getActionButtonText(): string {
    if (this.customActionText) {
      return this.customActionText;
    }
    
    if (!this.stepInfo) return 'Iniciar';
    
    const stepName = this.getStepDisplayName();
    return `Iniciar ${stepName}`;
  }

  private getStepDisplayName(): string {
    if (!this.stepInfo) return 'Etapa';
    
    switch (this.stepInfo.stepType) {
      case PedidoStepType.CREACION:
        return 'Creación';
      case PedidoStepType.RECEPCION_NOTA:
        return 'Recepción de Nota';
      case PedidoStepType.RECEPCION_MERCADERIA:
        return 'Recepción de Mercadería';
      case PedidoStepType.SOLICITUD_PAGO:
        return 'Solicitud de Pago';
      default:
        return 'Etapa';
    }
  }

  onInitiateStep(): void {
    if (this.canInitiateStep) {
      this.initiateStep.emit();
    }
  }

  onViewDetails(): void {
    this.viewDetails.emit();
  }
} 