import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs/operators';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
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

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-sorteo',
  templateUrl: './list-sorteo.component.html',
  styleUrls: ['./list-sorteo.component.scss'],
})
export class ListSorteoComponent implements OnInit {
  displayedColumns = ['nombre', 'minimo', 'modo', 'vigencia', 'sucursales', 'estado', 'acciones'];
  textoControl = new FormControl<string>(null);
  soloVigentesControl = new FormControl<boolean>(true);
  /** Sorteos paginados en el central (#772): gana la última página pedida; si falla, vuelve a la anterior. */
  pag: PaginacionLista<FilaSorteo> = new PaginacionLista<FilaSorteo>({
    cargar: (page, size) => {
      const params: any = { page, size, soloVigentes: !!this.soloVigentesControl.value };
      if (this.textoControl.value) params.texto = this.textoControl.value;
      return this.service.onFiltrar(params).pipe(map(res => res && { getTotalElements: res.getTotalElements, getContent: this.aFilas(res.getContent ?? []) }));
    },
    pageSize: 15,
    alCargar: () => this.avisoMostrado = false,
    alFallar: () => {
      // Un solo aviso hasta que vuelva a cargar bien.
      if (!this.avisoMostrado) this.notificacionService.openWarn('No se pudieron cargar los sorteos: volvé a intentar.', 5);
      this.avisoMostrado = true;
    },
  });
  private avisoMostrado = false;

  constructor(
    private service: SorteoService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacionService: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.onGetData();
  }

  /** Repite la página a la vista (al abrir, Reintentar, tras guardar o cortar). */
  onGetData(): void {
    this.pag.recargar();
  }

  private aFilas(sorteos: Sorteo[]): FilaSorteo[] {
    const hoy = new Date();
    return sorteos.map((s) => ({
      sorteo: s,
      modo: MODO_SORTEO_TEXTO[s.modoParticipacion] ?? s.modoParticipacion,
      vigencia: textoVigencia(s),
      sucursales: s.todasSucursales ? 'Todas' : `${s.sucursales?.length ?? 0}`,
      sucursalesDetalle: s.todasSucursales ? 'Todas las sucursales' : (s.sucursales ?? []).map((x) => x.nombre).join(', '),
      estadoTexto: ESTADO_SORTEO_TEXTO[estadoSorteo(s, hoy)],
    }));
  }

  onFilter(): void {
    this.pag.filtrar();
  }

  onLimpiarFiltros(): void {
    this.textoControl.setValue(null);
    this.soloVigentesControl.setValue(true);
    this.onFilter();
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
