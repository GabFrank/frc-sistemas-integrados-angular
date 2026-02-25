import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { FormaPago } from '../../../financiero/forma-pago/forma-pago.model';
import { SolicitudPagoDetalleInput } from '../../compra/gestion-compras/solicitud-pago.model';
import { SolicitudPagoService } from '../../compra/gestion-compras/solicitud-pago.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

export interface AdicionarFormaPagoDialogData {
  monedaList: Moneda[];
  formaPagoList: FormaPago[];
  proveedorNombre?: string;
  montoSugerido?: number;
  /** Si está en modo edición, se guarda en backend al confirmar. */
  solicitudPagoId?: number;
}

@Component({
  selector: 'app-adicionar-forma-pago-dialog',
  templateUrl: './adicionar-forma-pago-dialog.component.html',
  styleUrls: ['./adicionar-forma-pago-dialog.component.scss']
})
export class AdicionarFormaPagoDialogComponent {
  form: FormGroup;
  monedaList: Moneda[] = [];
  formaPagoList: FormaPago[] = [];
  proveedorNombreDisplay = '';
  mostrarCamposCheque = false;
  mostrarCotizacion = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AdicionarFormaPagoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AdicionarFormaPagoDialogData,
    private solicitudPagoService: SolicitudPagoService,
    private dialogosService: DialogosService,
    private notificacionService: NotificacionSnackbarService
  ) {
    this.monedaList = data?.monedaList || [];
    this.formaPagoList = data?.formaPagoList || [];
    this.proveedorNombreDisplay = (data?.proveedorNombre || '').toString().toUpperCase();
    this.form = this.fb.group({
      monedaId: [null, Validators.required],
      formaPagoId: [null, Validators.required],
      valor: [data?.montoSugerido ?? null, [Validators.required, Validators.min(0.01)]],
      fechaPago: [null],
      observacion: [''],
      cotizacion: [null],
      fechaEmisionCheque: [null],
      portador: [this.proveedorNombreDisplay],
      nominal: [true],
      diferido: [true]
    });
    this.form.get('formaPagoId').valueChanges.subscribe((id) => {
      const fp = this.formaPagoList.find((f) => f.id === id);
      this.mostrarCamposCheque = fp?.descripcion != null && (fp.descripcion + '').toUpperCase().includes('CHEQUE');
    });
    this.form.get('monedaId').valueChanges.subscribe((id) => {
      const m = this.monedaList.find((mo) => mo.id === id);
      const denom = (m?.denominacion || '').toUpperCase();
      this.mostrarCotizacion = denom !== 'GUARANI' && denom !== 'GS' && denom !== '';
    });
  }

  onConfirmar(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogosService
      .confirm('Confirmar forma de pago', '¿Desea agregar esta forma de pago?')
      .subscribe((confirmed) => {
        if (!confirmed) return;
        const detalle = this.buildDetalleFromForm();
        const solicitudPagoId = this.data?.solicitudPagoId;
        if (solicitudPagoId != null) {
          this.solicitudPagoService.onAgregarSolicitudPagoDetalle(solicitudPagoId, detalle).subscribe({
            next: (saved) => {
              if (saved) {
                const row = this.mapSavedToRow(saved);
                this.dialogRef.close(row);
              }
            },
            error: () => {
              this.notificacionService.openAlgoSalioMal('No se pudo guardar la forma de pago');
            }
          });
        } else {
          this.dialogRef.close(detalle);
        }
      });
  }

  private buildDetalleFromForm(): SolicitudPagoDetalleInput {
    const v = this.form.value;
    const valor = Number(v.valor);
    const detalle: SolicitudPagoDetalleInput = {
      monedaId: v.monedaId,
      formaPagoId: v.formaPagoId,
      valor: isNaN(valor) ? 0 : valor,
      observacion: (v.observacion || '').toString().trim().toUpperCase() || undefined,
      nominal: v.nominal,
      diferido: v.diferido
    };
    if (v.fechaPago) {
      const d = v.fechaPago instanceof Date ? v.fechaPago : new Date(v.fechaPago);
      if (!isNaN(d.getTime())) detalle.fechaPago = dateToString(d);
    }
    if (this.mostrarCotizacion && v.cotizacion != null) detalle.cotizacion = Number(v.cotizacion);
    if (this.mostrarCamposCheque) {
      if (v.fechaEmisionCheque) {
        const de = v.fechaEmisionCheque instanceof Date ? v.fechaEmisionCheque : new Date(v.fechaEmisionCheque);
        if (!isNaN(de.getTime())) detalle.fechaEmisionCheque = dateToString(de);
      }
      detalle.portador = (v.portador || '').toString().trim().toUpperCase() || undefined;
    }
    return detalle;
  }

  private mapSavedToRow(saved: any): SolicitudPagoDetalleInput & { id?: number; monedaDenominacion?: string; formaPagoDescripcion?: string } {
    const moneda = saved?.moneda;
    const formaPago = saved?.formaPago;
    return {
      id: saved?.id,
      monedaId: moneda?.id,
      formaPagoId: formaPago?.id,
      valor: saved?.valor,
      fechaPago: saved?.fechaPago,
      observacion: saved?.observacion,
      cotizacion: saved?.cotizacion,
      orden: saved?.orden,
      fechaEmisionCheque: saved?.fechaEmisionCheque,
      portador: saved?.portador,
      nominal: saved?.nominal,
      diferido: saved?.diferido,
      monedaDenominacion: (moneda?.denominacion || '').toString().toUpperCase(),
      formaPagoDescripcion: (formaPago?.descripcion || '').toString().toUpperCase()
    };
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
