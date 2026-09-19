import { Component, Inject, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotaCreditoService } from '../nota-credito.service';
import { MOTIVOS_NOTA_CREDITO, MotivoEmisionNotaCredito } from '../nota-credito.model';

export interface AddNotaCreditoDialogData {
  facturaLegalId: number;
  sucursalId: number;
  /** Solo para mostrar; lo fiscal sale de la factura en el central. */
  numeroFactura?: number;
  /** Sucursal que emitió la factura: es la que emite la nota (alta desde el buscador). */
  sucursal?: string;
  cliente?: string;
  totalFactura?: number;
  moneda?: string;
}

/**
 * Emite la nota de crédito TOTAL de una factura. Los ítems y los totales los copia el central desde
 * la factura: acá no se editan (la NC parcial queda para una entrega posterior).
 */
@UntilDestroy()
@Component({
  selector: 'app-add-nota-credito-dialog',
  templateUrl: './add-nota-credito-dialog.component.html',
  styleUrls: ['./add-nota-credito-dialog.component.scss']
})
export class AddNotaCreditoDialogComponent implements OnInit {

  motivos = MOTIVOS_NOTA_CREDITO;
  motivo: MotivoEmisionNotaCredito = MotivoEmisionNotaCredito.DEVOLUCION;
  descripcionMotivo = '';
  emitiendo = false;

  constructor(
    private service: NotaCreditoService,
    private mainService: MainService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    private dialogRef: MatDialogRef<AddNotaCreditoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddNotaCreditoDialogData
  ) {}

  ngOnInit(): void {}

  emitir(): void {
    if (!this.motivo) {
      this.notificacionService.openWarn('Falta el motivo de la nota de crédito');
      return;
    }
    this.emitiendo = true;
    this.service.onCrearDesdeFactura(
      this.data.facturaLegalId,
      this.data.sucursalId,
      this.motivo,
      this.descripcionMotivo,
      this.mainService.usuarioActual?.id
    ).pipe(untilDestroyed(this)).subscribe(nota => {
      this.emitiendo = false;
      if (!nota) return;
      this.dialogosService.confirm(
        'Nota de crédito creada',
        `Quedó con el número ${nota.numeroNotaCredito}.`,
        '¿Enviarla a SIFEN ahora?'
      ).pipe(untilDestroyed(this)).subscribe(confirmado => {
        if (!confirmado) {
          this.dialogRef.close(nota);
          return;
        }
        this.service.onGenerarYEnviar(nota.id, nota.sucursalId)
          .pipe(untilDestroyed(this))
          .subscribe(de => {
            if (de?.cdc) {
              this.notificacionService.openSucess(`Enviada a SIFEN. CDC ${de.cdc}`, 5);
            }
            this.dialogRef.close(nota);
          });
      });
    });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
