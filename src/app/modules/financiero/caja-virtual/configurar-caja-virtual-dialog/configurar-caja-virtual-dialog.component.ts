import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { forkJoin } from 'rxjs';
import { CajaVirtual, CajaVirtualConfiguracion } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { CuentaBancariaService } from '../../cuenta-bancaria/cuenta-bancaria.service';
import { CuentaBancaria } from '../../cuenta-bancaria/cuenta-bancaria.model';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';

interface CuentaOpcion {
  cuenta: CuentaBancaria;
  visible: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-configurar-caja-virtual-dialog',
  templateUrl: './configurar-caja-virtual-dialog.component.html',
  styleUrls: ['./configurar-caja-virtual-dialog.component.scss']
})
export class ConfigurarCajaVirtualDialogComponent implements OnInit {

  cajaVirtual: CajaVirtual;
  cuentas: CuentaOpcion[] = [];
  mostrarCpp = false;
  mostrarCpc = false;
  operacionesHabilitado = true;

  loading = false;
  guardando = false;

  constructor(
    private dialogRef: MatDialogRef<ConfigurarCajaVirtualDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cajaVirtual: CajaVirtual },
    private cajaVirtualService: CajaVirtualService,
    private cuentaBancariaService: CuentaBancariaService,
    private notificacion: NotificacionSnackbarService,
  ) {
    this.cajaVirtual = data?.cajaVirtual;
  }

  ngOnInit(): void {
    this.loading = true;
    forkJoin({
      cuentas: this.cuentaBancariaService.onGetAllOperables(),
      config: this.cajaVirtualService.onGetConfiguracion(this.cajaVirtual.id)
    }).pipe(untilDestroyed(this)).subscribe(({ cuentas, config }) => {
      this.loading = false;
      this.aplicarConfig(cuentas || [], config);
    });
  }

  private aplicarConfig(cuentas: CuentaBancaria[], config: CajaVirtualConfiguracion) {
    const visiblesIds = new Set<number>((config?.cuentasBancariasVisibles || []).map(c => c.id));
    const orden = this.parseOrden(config?.cuentasBancariasOrden);
    let opciones: CuentaOpcion[] = cuentas.map(c => ({ cuenta: c, visible: visiblesIds.has(c.id) }));
    // Ordenar según el orden persistido; las que no están, al final por id.
    opciones = opciones.sort((a, b) => {
      const ia = orden.indexOf(a.cuenta.id);
      const ib = orden.indexOf(b.cuenta.id);
      if (ia < 0 && ib < 0) return a.cuenta.id - b.cuenta.id;
      if (ia < 0) return 1;
      if (ib < 0) return -1;
      return ia - ib;
    });
    this.cuentas = opciones;
    this.mostrarCpp = !!config?.mostrarCuentasPorPagar;
    this.mostrarCpc = !!config?.mostrarCuentasPorCobrar;
    this.operacionesHabilitado = config ? (config.operacionesFinancierasHabilitado !== false) : true;
  }

  private parseOrden(json?: string): number[] {
    if (!json) return [];
    try {
      const arr = JSON.parse(json);
      return Array.isArray(arr) ? arr.map((x: any) => Number(x)) : [];
    } catch {
      return [];
    }
  }

  drop(event: CdkDragDrop<CuentaOpcion[]>) {
    moveItemInArray(this.cuentas, event.previousIndex, event.currentIndex);
  }

  toggleTodas(valor: boolean) {
    this.cuentas.forEach(c => (c.visible = valor));
  }

  guardar() {
    this.guardando = true;
    const visibles = this.cuentas.filter(c => c.visible);
    const ids = visibles.map(c => c.cuenta.id);
    this.cajaVirtualService.onSaveConfiguracion({
      cajaVirtualId: this.cajaVirtual.id,
      mostrarCuentasPorPagar: this.mostrarCpp,
      mostrarCuentasPorCobrar: this.mostrarCpc,
      operacionesFinancierasHabilitado: this.operacionesHabilitado,
      cuentasBancariasVisiblesIds: ids,
      cuentasBancariasOrden: JSON.stringify(ids),
    }).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        this.guardando = false;
        if (res != null) {
          this.notificacion.notification$.next({ texto: 'Configuración guardada', color: NotificacionColor.success, duracion: 3 });
          this.dialogRef.close(true);
        }
      },
      error: err => {
        this.guardando = false;
        const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'No se pudo guardar la configuración';
        this.notificacion.notification$.next({ texto: msg, color: NotificacionColor.warn, duracion: 5 });
      }
    });
  }

  cancelar() {
    this.dialogRef.close(false);
  }
}
