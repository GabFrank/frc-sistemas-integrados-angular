import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { stringToLocalDate } from '../../../../commons/core/utils/dateUtils';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { Sorteo, SorteoParticipacion, SorteoResumenSucursal } from '../sorteo.model';
import { SorteoService } from '../sorteo.service';

export interface SorteoParticipacionesDialogData {
  sorteo: Sorteo;
}

/** Fila ya resuelta: el template no llama funciones (regla del repo). */
type FilaParticipacion = SorteoParticipacion & { fecha: string };

@UntilDestroy()
@Component({
  selector: 'app-sorteo-participaciones-dialog',
  templateUrl: './sorteo-participaciones-dialog.component.html',
  styleUrls: ['./sorteo-participaciones-dialog.component.scss'],
})
export class SorteoParticipacionesDialogComponent implements OnInit {
  displayedColumns = ['codigo', 'sucursal', 'venta', 'cliente', 'tickets', 'fecha', 'estado'];
  dataSource = new MatTableDataSource<FilaParticipacion>([]);
  resumen: SorteoResumenSucursal[] = [];
  resumenFallo = false;
  sucursalControl = new FormControl<number>(null);
  codigoControl = new FormControl<string>('');
  /** Código con el que se está filtrando; vacío = listado normal. */
  codigoBuscado = '';
  mensajeCodigo = '';
  pageIndex = 0;
  pageSize = 20;
  total = 0;
  listaFallo = false;
  cargando = false;
  private carga = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SorteoParticipacionesDialogData,
    private service: SorteoService,
    private notificacionService: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.cargarResumen();
    this.cargar();
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

  cargar(): void {
    const carga = ++this.carga;
    this.cargando = true;
    const fallo = () => {
      if (carga !== this.carga) return;
      this.cargando = false;
      if (!this.listaFallo) this.notificacionService.openWarn('No se pudieron cargar las participaciones: volvé a intentar.', 5);
      this.listaFallo = true;
    };
    const params: any = { sorteoId: this.data.sorteo.id, page: this.pageIndex, size: this.pageSize };
    if (this.sucursalControl.value != null) params.sucursalId = Number(this.sucursalControl.value);
    if (this.codigoBuscado) params.codigo = this.codigoBuscado;
    this.service.onParticipaciones(params).pipe(untilDestroyed(this)).subscribe({ error: fallo, next: (res) => {
      if (carga !== this.carga) return;
      if (!res) {
        fallo();
        return;
      }
      this.cargando = false;
      this.listaFallo = false;
      this.total = res.getTotalElements ?? 0;
      this.dataSource.data = (res.getContent ?? []).map((p) => ({
        ...p,
        fecha: p.creadoEn ? stringToLocalDate(p.creadoEn).toLocaleDateString('es-PY') : '',
      }));
      this.actualizarMensajeCodigo();
    } });
  }

  private actualizarMensajeCodigo(): void {
    if (!this.codigoBuscado) {
      this.mensajeCodigo = '';
      return;
    }
    const filas = this.dataSource.data;
    if (!filas.length) this.mensajeCodigo = 'No existe ningún ticket con ese código.';
    else if (filas.some((f) => f.anulada)) this.mensajeCodigo = 'Ojo: ese ticket está ANULADO. No participa del sorteo.';
    else this.mensajeCodigo = 'El ticket es válido.';
  }

  onFiltrar(): void {
    this.pageIndex = 0;
    this.cargar();
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

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargar();
  }
}
