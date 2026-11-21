import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import {
  SearchListDialogComponent,
  SearchListtDialogData,
} from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from '../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component';
import { UsuariosSearchPaginatedGQL } from '../../../personas/usuarios/graphql/usuarioSearchPaginated';
import { ModificacionesService } from '../modificaciones.service';
import { FiltrosHistorialCambios, HistorialCambio, HistorialCambioCategoria } from '../modificaciones.models';

/**
 * Historial de cambios del sistema para administrativos: quién cambió qué y cuándo («Cambió el precio de
 * COCA COLA 2L · UNIDAD: 96.000 → 98.000»). Los textos y la paginación vienen del central.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'modificaciones',
  templateUrl: './modificaciones.component.html',
  styleUrls: ['./modificaciones.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ModificacionesComponent implements OnInit {
  today = new Date();
  fechaInicioControl = new FormControl<Date>(null);
  fechaFinalControl = new FormControl<Date>(null);
  fechaFormGroup = new FormGroup({ inicio: this.fechaInicioControl, fin: this.fechaFinalControl });
  categoriaControl = new FormControl<string>(null);
  categorias: HistorialCambioCategoria[] = [];

  productoTexto: string = null;
  private productoId: number = null;
  usuarioTexto: string = null;
  private usuarioId: number = null;

  displayedColumns = ['fecha', 'usuario', 'accion', 'objeto', 'resumen', 'categoria', 'expandir'];
  expandido: HistorialCambio = null;

  /** Filtros del último «Filtrar»: el cambio de página los repite aunque el formulario haya cambiado. */
  private filtrosAplicados: FiltrosHistorialCambios;

  pag: PaginacionLista<HistorialCambio> = new PaginacionLista<HistorialCambio>({
    cargar: (page, size) => this.service.onHistorialCambios(this.filtrosAplicados, page, size),
    pageSize: 25,
  });

  constructor(
    private service: ModificacionesService,
    private dialog: MatDialog,
    private usuarioSearch: UsuariosSearchPaginatedGQL
  ) { }

  ngOnInit(): void {
    this.fechasPorDefecto();
    this.service.onCategorias()
      .pipe(untilDestroyed(this))
      .subscribe((res) => this.categorias = res ?? []);
    this.onFiltrar();
  }

  private fechasPorDefecto(): void {
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 7);
    this.fechaInicioControl.setValue(inicio);
    this.fechaFinalControl.setValue(new Date());
  }

  onFiltrar(): void {
    const inicio = this.fechaInicioControl.value ? new Date(this.fechaInicioControl.value) : null;
    const fin = this.fechaFinalControl.value ? new Date(this.fechaFinalControl.value) : null;
    inicio?.setHours(0, 0, 0, 0);
    fin?.setHours(23, 59, 59, 0);
    this.filtrosAplicados = {
      fechaInicio: dateToString(inicio),
      fechaFin: dateToString(fin),
      usuarioId: this.usuarioId,
      productoId: this.productoId,
      categoria: this.categoriaControl.value,
    };
    this.expandido = null;
    this.pag.filtrar();
  }

  onLimpiar(): void {
    this.fechasPorDefecto();
    this.categoriaControl.setValue(null);
    this.onQuitarProducto(false);
    this.onQuitarUsuario(false);
    this.onFiltrar();
  }

  onExpandir(fila: HistorialCambio): void {
    this.expandido = this.expandido === fila ? null : fila;
  }

  onBuscarProducto(): void {
    const data: PdvSearchProductoData = {
      texto: null,
      cantidad: 1,
      mostrarOpciones: false,
      mostrarStock: false,
      conservarUltimaBusqueda: true,
    };
    this.dialog
      .open(PdvSearchProductoDialogComponent, { data, height: '80%' })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: PdvSearchProductoResponseData) => {
        const producto = res?.producto;
        if (producto?.id != null) {
          this.productoId = +producto.id;
          this.productoTexto = producto.descripcion;
          this.onFiltrar();
        }
      });
  }

  onQuitarProducto(filtrar = true): void {
    this.productoId = null;
    this.productoTexto = null;
    if (filtrar) this.onFiltrar();
  }

  onBuscarUsuario(): void {
    const data: SearchListtDialogData = {
      titulo: 'Buscar usuario',
      query: this.usuarioSearch,
      tableData: [
        { id: 'id', nombre: 'Id', width: '10%' },
        { id: 'nickname', nombre: 'Usuario', width: '30%' },
        { id: 'persona.nombre', nombre: 'Nombre', width: '60%' },
      ],
      search: true,
      inicialSearch: true,
      paginator: true,
    };
    this.dialog
      .open(SearchListDialogComponent, { data, height: '80%', width: '60%' })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res?.id != null) {
          this.usuarioId = +res.id;
          this.usuarioTexto = res.persona?.nombre || res.nickname;
          this.onFiltrar();
        }
      });
  }

  onQuitarUsuario(filtrar = true): void {
    this.usuarioId = null;
    this.usuarioTexto = null;
    if (filtrar) this.onFiltrar();
  }
}
