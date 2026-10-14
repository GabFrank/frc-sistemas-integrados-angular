import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { forkJoin } from 'rxjs';
import { CajaVirtual } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { PROPAGAR_ERROR_DE_RED } from '../../../../generics/generic-crud.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';

export interface SucursalesDeCajaData {
  cajaVirtual: CajaVirtual;
}

interface SucursalFila {
  id: number;
  nombre: string;
  ciudadId: number;
  marcada: boolean;
}

/**
 * Sucursales que cubre una caja además de la propia.
 *
 * <p>Quien opera la caja con el rol acotado ingresa en ella los retiros del PDV de todas las sucursales que
 * cubre: un gerente a cargo de las sucursales de una ciudad usa una sola caja. Lo decide el responsable de
 * la caja (o un ADMIN); el central lo verifica igual.</p>
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-sucursales-de-caja-dialog',
  templateUrl: './sucursales-de-caja-dialog.component.html',
  styleUrls: ['./sucursales-de-caja-dialog.component.scss']
})
export class SucursalesDeCajaDialogComponent implements OnInit {

  isLoading = true;
  /** Llegaron la caja y las sucursales. Sin eso no se ofrece guardar: se guardaría una lista a ciegas. */
  cargado = false;
  isSaving = false;

  propia: Sucursal = null;
  filas: SucursalFila[] = [];
  hayDeLaCiudad = false;

  constructor(
    private dialogRef: MatDialogRef<SucursalesDeCajaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SucursalesDeCajaData,
    private cajaVirtualService: CajaVirtualService,
    private sucursalService: SucursalService,
    private notificacion: NotificacionSnackbarService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.isLoading = true;
    forkJoin([
      this.cajaVirtualService.onGetSucursalesDeCaja(this.data.cajaVirtual.id),
      this.sucursalService.onGetAllSucursales(true, PROPAGAR_ERROR_DE_RED),
    ]).pipe(untilDestroyed(this)).subscribe({
      next: ([caja, sucursales]) => {
        this.isLoading = false;
        if (caja == null || sucursales == null) { this.cargado = false; return; }
        this.propia = caja.sucursal || null;
        const marcadas = new Set((caja.sucursalesAdicionales || []).map(s => Number(s.id)));
        const propiaId = this.propia != null ? Number(this.propia.id) : null;
        this.filas = sucursales
          // La 0 es el servidor; la propia ya está cubierta. Una inactiva solo se muestra si quedó marcada.
          .filter(s => Number(s.id) !== 0 && Number(s.id) !== propiaId)
          .filter(s => s.activo !== false || marcadas.has(Number(s.id)))
          .map(s => ({
            id: Number(s.id),
            nombre: s.nombre,
            ciudadId: s.ciudad?.id != null ? Number(s.ciudad.id) : null,
            marcada: marcadas.has(Number(s.id)),
          }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        const ciudadId = this.ciudadDeLaCaja();
        this.hayDeLaCiudad = ciudadId != null && this.filas.some(f => f.ciudadId === ciudadId);
        this.cargado = true;
      },
      error: () => { this.isLoading = false; this.cargado = false; }
    });
  }

  private ciudadDeLaCaja(): number {
    const id = this.propia?.ciudad?.id;
    return id != null ? Number(id) : null;
  }

  /** Marca las sucursales de la misma ciudad que la de la caja, sin desmarcar las demás. */
  marcarLasDeLaCiudad(): void {
    const ciudadId = this.ciudadDeLaCaja();
    if (ciudadId == null) return;
    this.filas.forEach(f => { if (f.ciudadId === ciudadId) f.marcada = true; });
  }

  guardar(): void {
    if (!this.cargado || this.isSaving) return;
    this.isSaving = true;
    const ids = this.filas.filter(f => f.marcada).map(f => f.id);
    this.cajaVirtualService.onGuardarSucursalesDeCaja(this.data.cajaVirtual.id, ids)
      .pipe(untilDestroyed(this)).subscribe({
        next: res => {
          this.isSaving = false;
          if (res == null) {
            this.notificacion.openWarn('No se pudo confirmar el cambio. Abrí de nuevo «Sucursales que cubre» para ver cómo quedó.', 6);
            return;
          }
          this.notificacion.openSucess(ids.length > 0
            ? `${this.data.cajaVirtual.nombre} cubre ${ids.length + (this.propia ? 1 : 0)} sucursales`
            : `${this.data.cajaVirtual.nombre} cubre solo su sucursal`);
          this.dialogRef.close(res);
        },
        // El rechazo del central ya lo avisó el genérico.
        error: () => { this.isSaving = false; }
      });
  }

  cerrar(): void { this.dialogRef.close(null); }
}
