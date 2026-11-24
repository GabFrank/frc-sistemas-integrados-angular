import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs/operators';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { stringToLocalDate } from '../../../../commons/core/utils/dateUtils';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { Sorteo, SorteoParticipacion, SorteoResumenSucursal } from '../sorteo.model';
import { SorteoService } from '../sorteo.service';

export interface SorteoParticipacionesDialogData {
  sorteo: Sorteo;
}

/** Fila ya resuelta: el template no llama funciones (regla del repo). */
type FilaParticipacion = SorteoParticipacion & { fecha: string };

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-sorteo-participaciones-dialog',
  templateUrl: './sorteo-participaciones-dialog.component.html',
  styleUrls: ['./sorteo-participaciones-dialog.component.scss'],
})
export class SorteoParticipacionesDialogComponent implements OnInit {
  displayedColumns = ['codigo', 'sucursal', 'venta', 'cliente', 'tickets', 'fecha', 'estado'];
  resumen: SorteoResumenSucursal[] = [];
  resumenFallo = false;
  sucursalControl = new FormControl<number>(null);
  codigoControl = new FormControl<string>('');
  /** Código con el que se está filtrando; vacío = listado normal. */
  codigoBuscado = '';
  mensajeCodigo = '';
  /** Participaciones paginadas en el central (#772): gana la última página pedida; si falla, vuelve a la anterior. */
  pag: PaginacionLista<FilaParticipacion> = new PaginacionLista<FilaParticipacion>({
    cargar: (page, size) => this.service.onParticipaciones(this.armarParams(page, size)).pipe(
      map(res => res && {
        getTotalElements: res.getTotalElements ?? 0,
        getContent: (res.getContent ?? []).map((p) => ({
          ...p,
          fecha: p.creadoEn ? stringToLocalDate(p.creadoEn).toLocaleDateString('es-PY') : '',
        })),
      })
    ),
    pageSize: 20,
    pageSizeOptions: [20, 50, 100],
    alCargar: () => {
      this.avisoMostrado = false;
      this.actualizarMensajeCodigo();
    },
    alFallar: () => {
      // Un solo aviso hasta que vuelva a cargar bien.
      if (!this.avisoMostrado) this.notificacionService.openWarn('No se pudieron cargar las participaciones: volvé a intentar.', 5);
      this.avisoMostrado = true;
    },
  });
  private avisoMostrado = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SorteoParticipacionesDialogData,
    private service: SorteoService,
    private notificacionService: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.cargarResumen();
    this.pag.filtrar();
  }

  cargarResumen(): void {
    this.resumenFallo = false;
    this.service.onResumen(this.data.sorteo.id).pipe(untilDestroyed(this)).subscribe({
      error: () => (this.resumenFallo = true),
      next: (res) => {
        if (res == null) {
          this.resumenFallo = true;
          return;
        }
        this.resumen = res;
      },
    });
  }

  /** Repite la página a la vista (Reintentar). */
  cargar(): void {
    this.pag.recargar();
  }

  private armarParams(page: number, size: number): any {
    const params: any = { sorteoId: this.data.sorteo.id, page, size };
    if (this.sucursalControl.value != null) params.sucursalId = Number(this.sucursalControl.value);
    if (this.codigoBuscado) params.codigo = this.codigoBuscado;
    return params;
  }

  private actualizarMensajeCodigo(): void {
    if (!this.codigoBuscado) {
      this.mensajeCodigo = '';
      return;
    }
    const filas = this.pag.items;
    if (!filas.length) this.mensajeCodigo = 'No existe ningún ticket con ese código.';
    else if (filas.some((f) => f.anulada)) this.mensajeCodigo = 'Ojo: ese ticket está ANULADO. No participa del sorteo.';
    else this.mensajeCodigo = 'El ticket es válido.';
  }

  onFiltrar(): void {
    this.pag.filtrar();
  }

  onValidar(): void {
    this.codigoBuscado = (this.codigoControl.value || '').trim();
    this.onFiltrar();
  }

  onLimpiarCodigo(): void {
    this.codigoControl.setValue('');
    this.codigoBuscado = '';
    this.onFiltrar();
  }

}
