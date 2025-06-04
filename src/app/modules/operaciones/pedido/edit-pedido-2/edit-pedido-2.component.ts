import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatStepper } from "@angular/material/stepper";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Tab } from "../../../../layouts/tab/tab.model";
import { MainService } from "../../../../main.service";
import { PedidoService } from "../pedido.service";
import { Pedido } from "../edit-pedido/pedido.model";
import { PedidoEstado } from "../edit-pedido/pedido-enums";
import { Proveedor } from "../../../personas/proveedor/proveedor.model";
import { Vendedor } from "../../../personas/vendedor/vendedor.model";
import { FormaPago } from "../../../financiero/forma-pago/forma-pago.model";
import { Moneda } from "../../../financiero/moneda/moneda.model";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";

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

  constructor(
    private pedidoService: PedidoService,
    private mainService: MainService
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
          this.updateStepStates();
          this.updateStepAccessibility();
          this.updateEstadoColor();
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
        setTimeout(() => {
          this.currentStepIndex = 0;
        }, 1000);
        break;
      case PedidoEstado.ACTIVO:
        setTimeout(() => {
          this.currentStepIndex = 1;
        }, 1000);
        break;
      case PedidoEstado.EN_RECEPCION_NOTA:
        setTimeout(() => {
          this.currentStepIndex = 2;
        }, 1000);
        break;
      case PedidoEstado.EN_RECEPCION_MERCADERIA:
        setTimeout(() => {
          this.currentStepIndex = 3;
        }, 1000);
        break;
      case PedidoEstado.CONCLUIDO:
        setTimeout(() => {
          this.currentStepIndex = 4;
        }, 1000);
        break;
      default:
        setTimeout(() => {
          this.currentStepIndex = 0;
        }, 1000);
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
      this.stepper.selectedIndex = stepIndex;
    }
  }

  completePedido(): void {}

  onPedidoChange(pedido: Pedido): void {
    this.selectedPedido = pedido;
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
}
