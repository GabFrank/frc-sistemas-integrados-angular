import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { enviarEnSerie, resumirLote } from '../enviar-en-serie';
import { CajaVirtual } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { PROPAGAR_ERROR_DE_RED } from '../../../../generics/generic-crud.service';
import { esTimeoutDeLink, TIMEOUT_POR_DEFECTO_MS } from '../../../../shared/services/timeout-link';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { MainService } from '../../../../main.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-transferencia-caja-virtual-dialog',
  templateUrl: './transferencia-caja-virtual-dialog.component.html',
  styleUrls: ['./transferencia-caja-virtual-dialog.component.scss']
})
export class TransferenciaCajaVirtualDialogComponent implements OnInit {

  formGroup: FormGroup;
  cantidadGsControl = new FormControl(null, [Validators.min(0.01)]);
  cantidadRsControl = new FormControl(null, [Validators.min(0.01)]);
  cantidadDsControl = new FormControl(null, [Validators.min(0.01)]);
  cajaDestinoControl = new FormControl(null, Validators.required);
  descripcionControl = new FormControl('');

  monedaGs: Moneda;
  monedaRs: Moneda;
  monedaDs: Moneda;

  currencyOptionsGs: any;
  currencyOptionsRs: any;
  currencyOptionsDs: any;

  cajasList: CajaVirtual[] = [];
  isSaving = false;

  constructor(
    private dialogRef: MatDialogRef<TransferenciaCajaVirtualDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public cajaOrigen: CajaVirtual,
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
      cajaDestinoControl: this.cajaDestinoControl,
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

    const sinCajas = 'No se pudieron cargar las cajas de destino: cerrá y volvé a abrir para reintentar.';
    this.cajaVirtualService.onGetActivas(PROPAGAR_ERROR_DE_RED,
      { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true }).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        if (res == null) { this.notificacion.openWarn(sinCajas, 5); return; }
        this.cajasList = res.filter(c => c.id !== this.cajaOrigen?.id);
      },
      error: () => this.notificacion.openWarn(sinCajas, 5)
    });
  }

  onSave() {
    if (this.formGroup.invalid) return;

    const cajaDestino: CajaVirtual = this.cajaDestinoControl.value;
    const items: { cantidad: number; moneda: Moneda }[] = [];

    const amtGs = this.cantidadGsControl.value;
    const amtRs = this.cantidadRsControl.value;
    const amtDs = this.cantidadDsControl.value;

    if (!amtGs && !amtRs && !amtDs) {
      this.notificacion.openAlgoSalioMal('Debe ingresar al menos un monto a transferir');
      return;
    }

    if (amtGs > 0 && this.monedaGs) items.push({ cantidad: amtGs, moneda: this.monedaGs });
    if (amtRs > 0 && this.monedaRs) items.push({ cantidad: amtRs, moneda: this.monedaRs });
    if (amtDs > 0 && this.monedaDs) items.push({ cantidad: amtDs, moneda: this.monedaDs });

    if (items.length === 0) return;

    this.isSaving = true;
    // Mientras se guarda no se cierra (ni Esc ni clic afuera): quien abrió el diálogo no refrescaría la caja.
    this.dialogRef.disableClose = true;
    enviarEnSerie(items, it => this.createTransferObs(it.cantidad, it.moneda.id, cajaDestino.id))
      .pipe(untilDestroyed(this))
      .subscribe(resultados => {
        this.isSaving = false;
        this.dialogRef.disableClose = false;
        const resumen = resumirLote(resultados, it => it.moneda.denominacion);
        if (resumen.todoOk) {
          this.notificacion.openSucess('Transferencia(s) realizada(s) correctamente');
          this.dialogRef.close(true);
          return;
        }
        // Rechazo de la primera moneda: no se transfirió nada (el motivo ya lo mostró onSaveCustom) y se
        // puede corregir y reintentar.
        if (resumen.nadaCambio) return;
        // Algo se transfirió o quedó en duda: con el formulario abierto, reintentar repetiría lo que ya entró.
        // Se cierra y la caja se relee. Si fue una sola moneda y la cortó el link, su aviso ya lo dijo.
        const soloElCorteDelLink = resultados.length === 1 && esTimeoutDeLink(resultados[0].error);
        if (!soloElCorteDelLink) this.notificacion.openWarn(resumen.texto, 12);
        this.dialogRef.close(true);
      });
  }

  // Cada transferencia del lote va sin «Guardado con éxito»: el aviso agregado lo da onSave.
  createTransferObs(cantidad: number, monedaId: number, cajaDestinoId: number) {
    return this.cajaVirtualService.onRealizarTransferencia(
      this.cajaOrigen.id,
      cajaDestinoId,
      cantidad,
      monedaId,
      this.descripcionControl.value?.toUpperCase() || null,
      this.mainService.usuarioActual?.id,
      { avisarExito: false }
    );
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
