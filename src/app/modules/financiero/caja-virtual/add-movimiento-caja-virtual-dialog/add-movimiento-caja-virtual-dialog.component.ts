import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { enviarEnSerie, resumirLote } from '../enviar-en-serie';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';
import { CajaVirtual, CajaVirtualTipoMovimiento, MovimientoCajaVirtual } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { MainService } from '../../../../main.service';

export interface MovimientoDialogData {
  cajaVirtual: CajaVirtual;
  tipoMovimiento: CajaVirtualTipoMovimiento;
  // Para AJUSTE: si es un ajuste "de egreso", el monto se envía negativo (el backend
  // respeta el signo del AJUSTE). Ingreso vs egreso del selector define la dirección.
  esEgreso?: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-add-movimiento-caja-virtual-dialog',
  templateUrl: './add-movimiento-caja-virtual-dialog.component.html',
  styleUrls: ['./add-movimiento-caja-virtual-dialog.component.scss']
})
export class AddMovimientoCajaVirtualDialogComponent implements OnInit {

  formGroup: FormGroup;
  cantidadGsControl = new FormControl(null, [Validators.min(0.01)]);
  cantidadRsControl = new FormControl(null, [Validators.min(0.01)]);
  cantidadDsControl = new FormControl(null, [Validators.min(0.01)]);
  descripcionControl = new FormControl('', Validators.required);

  monedaGs: Moneda;
  monedaRs: Moneda;
  monedaDs: Moneda;

  currencyOptionsGs: any;
  currencyOptionsRs: any;
  currencyOptionsDs: any;

  isSaving = false;
  titulo: string = 'Movimiento';

  tipoLabels = {
    [CajaVirtualTipoMovimiento.INGRESO]: 'Ingreso de Efectivo',
    [CajaVirtualTipoMovimiento.EGRESO]: 'Egreso de Efectivo',
    [CajaVirtualTipoMovimiento.AJUSTE]: 'Ajuste de Saldo',
  };

  constructor(
    private dialogRef: MatDialogRef<AddMovimientoCajaVirtualDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MovimientoDialogData,
    private cajaVirtualService: CajaVirtualService,
    private monedaService: MonedaService,
    private notificacion: NotificacionSnackbarService,
    public mainService: MainService
  ) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      cantidadGsControl: this.cantidadGsControl,
      cantidadRsControl: this.cantidadRsControl,
      cantidadDsControl: this.cantidadDsControl,
      descripcionControl: this.descripcionControl,
    });

    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.monedaGs = res.find(m => m.denominacion?.toUpperCase().includes('GUARANI'));
        this.monedaRs = res.find(m => m.denominacion?.toUpperCase().includes('REAL'));
        this.monedaDs = res.find(m => m.denominacion?.toUpperCase().includes('DOLAR'));

        if (this.monedaGs) this.currencyOptionsGs = this.monedaService.currencyOptionsByMoneda(this.monedaGs);
        if (this.monedaRs) this.currencyOptionsRs = this.monedaService.currencyOptionsByMoneda(this.monedaRs);
        if (this.monedaDs) this.currencyOptionsDs = this.monedaService.currencyOptionsByMoneda(this.monedaDs);
      }
    });

    this.titulo = this.tipoLabels[this.data?.tipoMovimiento] || 'Movimiento';
  }

  onSave() {
    if (this.formGroup.invalid) return;

    const items: { cantidad: number; moneda: Moneda }[] = [];

    const amtGs = this.cantidadGsControl.value;
    const amtRs = this.cantidadRsControl.value;
    const amtDs = this.cantidadDsControl.value;

    if (!amtGs && !amtRs && !amtDs) {
      this.notificacion.openAlgoSalioMal('Debe ingresar al menos un monto en alguna moneda');
      return;
    }

    // Verificar límite de Caja Chica si es un ingreso
    if (this.data.tipoMovimiento === CajaVirtualTipoMovimiento.INGRESO && 
        this.data.cajaVirtual.tipo === 'CAJA_CHICA') {
      
      const nuevoSaldoGs = (this.data.cajaVirtual.saldoGs || 0) + (amtGs || 0);
      const limite = this.data.cajaVirtual.limiteGs || 0;

      if (limite > 0 && nuevoSaldoGs > limite) {
        this.notificacion.openWarn(`¡Atención! La caja ha superado el límite de ${limite.toLocaleString('es-PY')} Gs.`, 6);
      }
    }

    if (amtGs > 0 && this.monedaGs) items.push({ cantidad: amtGs, moneda: this.monedaGs });
    if (amtRs > 0 && this.monedaRs) items.push({ cantidad: amtRs, moneda: this.monedaRs });
    if (amtDs > 0 && this.monedaDs) items.push({ cantidad: amtDs, moneda: this.monedaDs });

    if (items.length === 0) return;

    this.isSaving = true;
    // Mientras se guarda no se cierra (ni Esc ni clic afuera): quien abrió el diálogo no refrescaría la caja.
    this.dialogRef.disableClose = true;
    enviarEnSerie(items, it => this.createSaveObs(it.cantidad, it.moneda))
      .pipe(untilDestroyed(this))
      .subscribe(resultados => {
        this.isSaving = false;
        this.dialogRef.disableClose = false;
        const resumen = resumirLote(resultados, it => it.moneda.denominacion);
        if (resumen.todoOk) {
          this.notificacion.openSucess('Movimientos registrados correctamente');
          this.dialogRef.close(true);
          return;
        }
        // Rechazo de la primera moneda: no se registró nada (el motivo ya lo mostró onSaveCustom) y se
        // puede corregir y reintentar.
        if (resumen.nadaCambio) return;
        // Algo se registró o quedó en duda: con el formulario abierto, reintentar repetiría lo que ya entró.
        // Se cierra y la caja se relee. Si fue una sola moneda y la cortó el link, su aviso ya lo dijo.
        const soloElCorteDelLink = resultados.length === 1 && esTimeoutDeLink(resultados[0].error);
        if (!soloElCorteDelLink) this.notificacion.openWarn(resumen.texto, 12);
        this.dialogRef.close(true);
      });
  }

  createSaveObs(cantidad: number, moneda: Moneda) {
    const movimiento = new MovimientoCajaVirtual();
    movimiento.cajaVirtual = this.data.cajaVirtual;
    movimiento.tipoMovimiento = this.data.tipoMovimiento;
    // AJUSTE respeta el signo: un ajuste de egreso resta (monto negativo).
    const esAjusteEgreso = this.data.tipoMovimiento === CajaVirtualTipoMovimiento.AJUSTE && this.data.esEgreso;
    movimiento.cantidad = esAjusteEgreso ? -Math.abs(cantidad) : cantidad;
    movimiento.moneda = moneda;
    movimiento.descripcion = this.descripcionControl.value?.toUpperCase();
    movimiento.usuario = this.mainService.usuarioActual;
    movimiento.activo = true;

    // Cada movimiento del lote va sin «Guardado con éxito»: el aviso agregado lo da onSave.
    return this.cajaVirtualService.onSaveMovimiento(movimiento, { avisarExito: false });
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
