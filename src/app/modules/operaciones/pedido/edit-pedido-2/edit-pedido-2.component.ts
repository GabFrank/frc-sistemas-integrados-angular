import { Component, Input, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatStepper } from "@angular/material/stepper";
import { UntilDestroy } from "@ngneat/until-destroy";
import { MatDialog } from "@angular/material/dialog";
import { Tab } from "../../../../layouts/tab/tab.model";
import { MainService } from "../../../../main.service";
import { PedidoService } from "../pedido.service";
import { Pedido } from "../edit-pedido/pedido.model";
import { PedidoItem } from "../edit-pedido/pedido-item.model";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { FinalizacionDialogComponent, FinalizacionDialogResult } from "./finalizacion-dialog/finalizacion-dialog.component";
import { SolicitudPagoComponent } from "./solicitud-pago/solicitud-pago.component";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { NotificacionSnackbarService, NotificacionColor } from "../../../../notificacion-snackbar.service";
import { ProcesoEtapa } from "../proceso-etapa/proceso-etapa.model"; // Importar ProcesoEtapa

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
  isDataLoaded = false;
  
  // Controles de acceso a los pasos, ahora manejados por `updateProcesoEtapaStatus`
  canAccessStep0 = true;
  canAccessStep1 = false;
  canAccessStep2 = false;
  canAccessStep3 = false;
  canAccessStep4 = false;

  // Propiedades para validación de formularios en cada paso
  step1FormValid = false;

  currentUser: Usuario | null = null;
  
  constructor(
    private pedidoService: PedidoService,
    private mainService: MainService,
    private matDialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacionService: NotificacionSnackbarService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.mainService.usuarioActual;
    this.loadPedidoData();
  }

  ngAfterViewInit(): void {
    // La lógica de `fixStepperDisplay` podría necesitar ajustes, pero la dejamos por ahora.
  }

  private fixStepperDisplay(): void {
    // ... (lógica existente, puede que se simplifique)
  }

  loadPedidoData(): void {
    if (this.data?.tabData?.id) {
      this.isDataLoaded = false;
      this.pedidoService
        .onGetPedidoInfoCompleta(this.data.tabData.id)
        .subscribe((pedido) => {
          this.selectedPedido = pedido;
          this.updateProcesoEtapaStatus();
          this.isDataLoaded = true;
          this.cdr.detectChanges();
        });
    } else {
      this.initializeNewPedido();
    }
  }

  private initializeNewPedido(): void {
    this.selectedPedido = null;
    this.updateProcesoEtapaStatus();
    this.isDataLoaded = true;
  }

  loadPedidoDataFresh(): void {
    if (this.data?.tabData?.id) {
      this.isDataLoaded = false;
      this.pedidoService
        .onGetPedidoInfoCompletaFresh(this.data.tabData.id)
        .subscribe((pedido) => {
          this.selectedPedido = pedido;
          this.updateProcesoEtapaStatus();
          this.isDataLoaded = true;
          this.cdr.detectChanges();
        });
    }
  }

  updateProcesoEtapaStatus(): void {
    const isNewPedido = !this.selectedPedido || !this.selectedPedido.procesoEtapaList;
    if (isNewPedido) {
      this.canAccessStep1 = this.selectedPedido?.id != null;
      this.canAccessStep2 = false;
      this.canAccessStep3 = false;
      this.canAccessStep4 = false;
      this.stepper.selectedIndex = (this.selectedPedido?.id == null) ? 0 : 1;
      return;
    }

    const etapaCreacion = this.selectedPedido.procesoEtapaList.find(e => e.tipoEtapa === 'CREACION');
    const etapaRecepcionNota = this.selectedPedido.procesoEtapaList.find(e => e.tipoEtapa === 'RECEPCION_NOTA');
    const etapaRecepcionMercaderia = this.selectedPedido.procesoEtapaList.find(e => e.tipoEtapa === 'RECEPCION_MERCADERIA');
    // const etapaSolicitudPago = this.selectedPedido.procesoEtapaList.find(e => e.tipoEtapa === 'PAGO');

    const isCreacionFinalizada = etapaCreacion?.estadoEtapa === 'FINALIZADA';
    const isRecepcionNotaFinalizada = etapaRecepcionNota?.estadoEtapa === 'FINALIZADA';
    
    this.canAccessStep1 = true;
    this.canAccessStep2 = isCreacionFinalizada;
    this.canAccessStep3 = isRecepcionNotaFinalizada;
    this.canAccessStep4 = etapaRecepcionMercaderia?.estadoEtapa === 'FINALIZADA';

    if (this.stepper) {
        if(!isCreacionFinalizada) this.stepper.selectedIndex = 1;
        else if(!isRecepcionNotaFinalizada) this.stepper.selectedIndex = 2;
        else this.stepper.selectedIndex = 3;
    }
  }

  onStep1FormValidChange(isValid: boolean): void {
    this.step1FormValid = isValid;
  }

  finalizarCreacionPedido(): void {
    if (!this.step1FormValid) {
      this.notificacionService.openWarn('Por favor, complete todos los campos obligatorios en "Datos del pedido".');
      this.stepper.selectedIndex = 0;
      return;
    }

    const dialogRef = this.matDialog.open(FinalizacionDialogComponent, {
      width: "500px", data: { pedido: this.selectedPedido }, disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result: FinalizacionDialogResult) => {
      if (result?.confirmed) {
        this.ejecutarFinalizacionCreacion();
      }
    });
  }

  private ejecutarFinalizacionCreacion(): void {
    this.pedidoService.onFinalizarCreacionPedido(this.selectedPedido.id).subscribe({
      next: () => {
        this.notificacionService.openSucess('La etapa de creación del pedido ha sido finalizada exitosamente.');
        this.loadPedidoDataFresh();
      },
      error: (error) => {
        console.error("Error al finalizar la creación del pedido", error);
      }
    });
  }
}
