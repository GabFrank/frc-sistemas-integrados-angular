import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
import { PROPAGAR_ERROR_DE_RED, TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../../generics/generic-crud.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { PrecioEspecialSucursal } from '../precio-especial.model';
import { PrecioEspecialService } from '../precio-especial.service';
import {
  detalleAlCortar, ESTADO_PRECIO_ESPECIAL_TEXTO, EstadoPrecioEspecial, esPrecioInactivo, estadoPrecioEspecial, textoVigencia,
} from '../precio-especial.util';

/** Fila ya resuelta: el template no llama funciones (regla del repo). */
interface FilaPrecioEspecial {
  especial: PrecioEspecialSucursal;
  presentacion: string;
  vigencia: string;
  estado: EstadoPrecioEspecial;
  estadoTexto: string;
  /** El precio global no rige en ninguna sucursal: solo la promoción lo habilita. */
  precioInactivo: boolean;
}

@UntilDestroy()
@Component({
  selector: 'app-list-precio-especial',
  templateUrl: './list-precio-especial.component.html',
  styleUrls: ['./list-precio-especial.component.scss'],
})
export class ListPrecioEspecialComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  dataSource = new MatTableDataSource<FilaPrecioEspecial>([]);
  displayedColumns = ['id', 'sucursal', 'producto', 'presentacion', 'tipoPrecio', 'global', 'precio', 'vigencia', 'estado', 'usuario', 'acciones'];
  selectedPageInfo: PageInfo<PrecioEspecialSucursal>;
  pageIndex = 0;
  pageSize = 15;
  sucursalIdControl = new FormControl<number>(null);
  textoControl = new FormControl<string>(null);
  soloVigentesControl = new FormControl<boolean>(true);
  sucursales: Sucursal[] = [];
  sucursalesFallo = false;
  /** La última consulta falló: la grilla vacía no significa «sin promociones» (#390). */
  listaFallo = false;
  /** Descarta respuestas de una consulta anterior. */
  private carga = 0;
  /** Página a la vista (la última que respondió bien): a esa se vuelve si falla un cambio de página. */
  private paginaMostrada = { pageIndex: 0, pageSize: 15 };

  constructor(
    private service: PrecioEspecialService,
    private sucursalService: SucursalService,
    private dialogosService: DialogosService,
    private notificacionService: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.cargarSucursales();
    this.onGetData();
  }

  cargarSucursales(): void {
    this.sucursalesFallo = false;
    this.sucursalService
      .onGetAllSucursales(true, PROPAGAR_ERROR_DE_RED, { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true })
      .pipe(untilDestroyed(this))
      .subscribe({ error: () => {
        this.sucursalesFallo = true;
        this.notificacionService.openWarn('No se pudieron cargar las sucursales del filtro: usá «Reintentar».', 5);
      }, next: (res) => {
        if (res == null) {
          this.sucursalesFallo = true; // error del servidor: ya se avisó
          return;
        }
        this.sucursales = res.filter((s) => Number(s.id) !== 0);
      } });
  }

  /**
   * `filtro` (por defecto): si falla, la grilla se vacía (lo anterior ya no corresponde a los filtros a la vista).
   * `pagina`: cambio de página; si falla se conserva la página a la vista. `releer`: tras cortar; si falla se
   * conservan las filas con el cartel de que pueden no reflejar el cambio.
   */
  onGetData(modo: 'filtro' | 'pagina' | 'releer' = 'filtro'): void {
    const carga = ++this.carga;
    const fallo = () => {
      if (carga !== this.carga) return;
      if (modo === 'releer' && !this.listaFallo) {
        this.listaFallo = true;
        this.notificacionService.openWarn('No se pudo actualizar la lista: puede no reflejar el último cambio.', 6);
        return;
      }
      if (modo === 'pagina' && !this.listaFallo) {
        this.pageIndex = this.paginaMostrada.pageIndex;
        this.pageSize = this.paginaMostrada.pageSize;
        if (this.paginator) {
          this.paginator.pageIndex = this.pageIndex;
          this.paginator.pageSize = this.pageSize;
        }
        this.notificacionService.openWarn('No se pudo cambiar de página: volvé a intentar.', 5);
        return;
      }
      // Filtro nuevo: lo anterior ya no corresponde a los filtros a la vista
      this.listaFallo = true;
      this.selectedPageInfo = null;
      this.dataSource.data = [];
      this.notificacionService.openWarn('No se pudieron cargar las promociones: volvé a intentar.', 5);
    };
    const params: any = { page: this.pageIndex, size: this.pageSize, soloVigentes: !!this.soloVigentesControl.value };
    if (this.sucursalIdControl.value != null) params.sucursalId = Number(this.sucursalIdControl.value);
    if (this.textoControl.value) params.texto = this.textoControl.value;
    this.service.onFiltrar(params).pipe(untilDestroyed(this)).subscribe({ error: fallo, next: (res) => {
      if (carga !== this.carga) return; // respuesta de un filtro o una página anterior
      if (!res) {
        fallo();
        return;
      }
      this.listaFallo = false;
      this.paginaMostrada = { pageIndex: this.pageIndex, pageSize: this.pageSize };
      this.selectedPageInfo = res;
      const hoy = new Date();
      this.dataSource.data = (res.getContent ?? []).map((e) => {
        const p = e.precioPorSucursal?.presentacion;
        const estado = estadoPrecioEspecial(e, hoy);
        return {
          especial: e,
          presentacion: (p?.descripcion || `x${p?.cantidad ?? ''}`).toUpperCase(),
          vigencia: textoVigencia(e),
          estado,
          estadoTexto: ESTADO_PRECIO_ESPECIAL_TEXTO[estado],
          precioInactivo: esPrecioInactivo(e.precioPorSucursal),
        };
      });
    } });
  }

  onFilter(): void {
    this.pageIndex = 0;
    if (this.paginator) this.paginator.pageIndex = 0;
    this.onGetData();
  }

  onLimpiarFiltros(): void {
    this.sucursalIdControl.setValue(null);
    this.textoControl.setValue(null);
    this.soloVigentesControl.setValue(true);
    this.onFilter();
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onGetData('pagina');
  }

  onCortar(fila: FilaPrecioEspecial): void {
    const e = fila.especial;
    this.dialogosService
      .confirm('Cortar promoción', `¿Cortar la promoción de ${e.sucursal?.nombre}?`,
        detalleAlCortar(fila.precioInactivo))
      .pipe(untilDestroyed(this))
      .subscribe((ok) => {
        // También en error: pudo haberse aplicado (onSaveCustom ya avisó), y la lista lo aclara
        if (ok) this.service.onCortar(e.id).pipe(untilDestroyed(this)).subscribe({ next: () => this.onGetData('releer'), error: () => this.onGetData('releer') });
      });
  }
}
