import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";
import { NotificacionSnackbarService } from "../../../../../notificacion-snackbar.service";
import { DevolucionConfiguracion } from "../devolucion-configuracion.model";
import { DevolucionConfiguracionService } from "../devolucion-configuracion.service";

/**
 * Diálogo de configuración del módulo de devoluciones. Carga la fila única,
 * la edita en 4 secciones (dashboard, impresión, merma, alerta) y guarda.
 * Cierra devolviendo la config guardada para que el llamador refresque.
 */
@Component({
  selector: "app-configuracion-devolucion-dialog",
  templateUrl: "./configuracion-devolucion-dialog.component.html",
  styleUrls: ["./configuracion-devolucion-dialog.component.scss"],
})
export class ConfiguracionDevolucionDialogComponent implements OnInit {
  form: FormGroup;
  cargando = true;
  guardando = false;

  rangos = [
    { value: "MES_ACTUAL", label: "Mes actual" },
    { value: "ULTIMOS_30", label: "Últimos 30 días" },
    { value: "MES_ANTERIOR", label: "Mes anterior" },
  ];
  anchos = [
    { value: 58, label: "58 mm" },
    { value: 80, label: "80 mm" },
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ConfiguracionDevolucionDialogComponent>,
    private configService: DevolucionConfiguracionService,
    private notificacionService: NotificacionSnackbarService
  ) {
    this.form = this.fb.group({
      diasEstancada: [30],
      diasEstancadaUrgente: [60],
      rankingTopN: [5],
      dashboardRangoDefault: ["MES_ACTUAL"],
      ticketAnchoMm: [58],
      impresoraTicket: ["TICKET58"],
      comprobanteTitulo: ["COMPROBANTE DE RETIRO"],
      comprobanteTextoFirma: ["Firma del proveedor"],
      mermaRespetaMotivo: [false],
      tipoGastoMerma: ["MERMA/AVERIA DE PRODUCTO"],
      alertaIncluyeRetirado: [false],
      alertaBloqueante: [true],
    });
  }

  ngOnInit(): void {
    this.configService.onGet().subscribe({
      next: (c) => {
        this.cargando = false;
        if (c) this.form.patchValue(c);
      },
      error: () => {
        this.cargando = false;
        this.notificacionService.openAlgoSalioMal(
          "No se pudo cargar la configuración"
        );
      },
    });
  }

  onGuardar(): void {
    if (this.guardando) return;
    this.guardando = true;
    const input: DevolucionConfiguracion = this.form.value;
    this.configService.onGuardar(input).subscribe({
      next: (guardada) => {
        this.guardando = false;
        this.notificacionService.openSucess("Configuración guardada");
        this.dialogRef.close(guardada || input);
      },
      error: () => {
        this.guardando = false;
        this.notificacionService.openAlgoSalioMal(
          "No se pudo guardar la configuración"
        );
      },
    });
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
