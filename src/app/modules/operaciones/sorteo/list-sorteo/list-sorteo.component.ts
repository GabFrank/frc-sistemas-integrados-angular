import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { textoVigencia } from '../../../productos/precio-especial/precio-especial.util';
import { SorteoDialogComponent } from '../sorteo-dialog/sorteo-dialog.component';
import { SorteoParticipacionesDialogComponent } from '../sorteo-participaciones-dialog/sorteo-participaciones-dialog.component';
import { Sorteo } from '../sorteo.model';
import { SorteoService } from '../sorteo.service';
import { ESTADO_SORTEO_TEXTO, estadoSorteo, MODO_SORTEO_TEXTO } from '../sorteo.util';

/** Fila ya resuelta: el template no llama funciones (regla del repo). */
interface FilaSorteo {
  sorteo: Sorteo;
  modo: string;
  vigencia: string;
  sucursales: string;
  sucursalesDetalle: string;
  estadoTexto: string;
}

@UntilDestroy()
@Component({
  selector: 'app-list-sorteo',
  templateUrl: './list-sorteo.component.html',
  styleUrls: ['./list-sorteo.component.scss'],
})
export class ListSorteoComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  dataSource = new MatTableDataSource<FilaSorteo>([]);
  displayedColumns = ['nombre', 'minimo', 'modo', 'vigencia', 'sucursales', 'estado', 'acciones'];
  selectedPageInfo: PageInfo<Sorteo>;
  pageIndex = 0;
  pageSize = 15;
  textoControl = new FormControl<string>(null);
  soloVigentesControl = new FormControl<boolean>(true);
  /** La última consulta falló: la grilla vacía no significa «sin sorteos». */
  listaFallo = false;
  /** Descarta respuestas de una consulta anterior. */
  private carga = 0;

  constructor(
    private service: SorteoService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacionService: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.onGetData();
  }

  onGetData(): void {
    const carga = ++this.carga;
    const fallo = () => {
      if (carga !== this.carga) return;
      if (!this.listaFallo) this.notificacionService.openWarn('No se pudieron cargar los sorteos: volvé a intentar.', 5);
      this.listaFallo = true;
    };
    const params: any = { page: this.pageIndex, size: this.pageSize, soloVigentes: !!this.soloVigentesControl.value };
    if (this.textoControl.value) params.texto = this.textoControl.value;
    this.service.onFiltrar(params).pipe(untilDestroyed(this)).subscribe({ error: fallo, next: (res) => {
      if (carga !== this.carga) return;
      if (!res) {
        fallo();
        return;
      }
      this.listaFallo = false;
      this.selectedPageInfo = res;
      const hoy = new Date();
      this.dataSource.data = (res.getContent ?? []).map((s) => ({
        sorteo: s,
        modo: MODO_SORTEO_TEXTO[s.modoParticipacion] ?? s.modoParticipacion,
        vigencia: textoVigencia(s),
        sucursales: s.todasSucursales ? 'Todas' : `${s.sucursales?.length ?? 0}`,
        sucursalesDetalle: s.todasSucursales ? 'Todas las sucursales' : (s.sucursales ?? []).map((x) => x.nombre).join(', '),
        estadoTexto: ESTADO_SORTEO_TEXTO[estadoSorteo(s, hoy)],
      }));
    } });
  }

  onFilter(): void {
    this.pageIndex = 0;
    if (this.paginator) this.paginator.pageIndex = 0;
    this.onGetData();
  }

  onLimpiarFiltros(): void {
    this.textoControl.setValue(null);
    this.soloVigentesControl.setValue(true);
    this.onFilter();
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onGetData();
  }

  onNuevo(): void {
    this.abrirDialogo(null);
  }

  onEditar(fila: FilaSorteo): void {
    this.abrirDialogo(fila.sorteo);
  }

  private abrirDialogo(sorteo: Sorteo | null): void {
    this.dialog.open(SorteoDialogComponent, { data: { sorteo }, disableClose: true, width: '900px', maxWidth: '95vw' })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((guardado) => guardado && this.onGetData());
  }

  onParticipaciones(fila: FilaSorteo): void {
    this.dialog.open(SorteoParticipacionesDialogComponent, {
      data: { sorteo: fila.sorteo }, width: '1000px', maxWidth: '95vw', maxHeight: '90vh',
    });
  }

  onCortar(fila: FilaSorteo): void {
    const s = fila.sorteo;
    this.dialogosService
      .confirm('Cortar sorteo', `¿Cortar el sorteo «${s.nombre}»?`,
        'Deja de dar tickets desde el próximo escaneo de las cajas. Las participaciones ya registradas se conservan.')
      .pipe(untilDestroyed(this))
      .subscribe((ok) => {
        // También en error: pudo haberse aplicado (onSaveCustom ya avisó), y la lista lo aclara
        if (ok) this.service.onCortar(s.id).pipe(untilDestroyed(this)).subscribe({ next: () => this.onGetData(), error: () => this.onGetData() });
      });
  }
}
