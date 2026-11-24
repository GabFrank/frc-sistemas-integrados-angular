import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabData, TabService } from '../../../../layouts/tab/tab.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import {
  GenericListVentaComponent
} from '../../venta/generic-list-venta/generic-list-venta.component';
import { ClienteLote, MovimientoLote } from '../lote.model';
import { LoteService } from '../lote.service';
import { PROPAGAR_ERROR_DE_RED } from '../../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../../shared/services/timeout-link';

/** Lo que el listado manda al abrir la solapa. */
export interface HistorialLoteTabData {
  loteId: number;
  numeroLote: string;
  productoDescripcion: string;
  proveedorNombre?: string;
  fechaVencimientoLabel?: string;
  fechaRetiroLabel?: string;
  estadoLabel?: string;
  /** Sucursal filtrada en el listado, para abrir con el mismo recorte. */
  sucursal?: Sucursal;
}

/**
 * Fila de movimientos. Todo lo derivado se precalcula acá: el template no debe llamar funciones ni
 * comparar, porque Angular reevalúa esas expresiones en cada ciclo de detección de cambios.
 */
interface MovimientoRow {
  fechaLabel: string;
  sucursalNombre: string;
  tipoLabel: string;
  tipoClase: string;
  comprobanteLabel: string;
  cantidadLabel: string;
  cantidadClase: string;
  usuarioNombre: string;
}

/** Fila de clientes: una por venta, con los mismos valores ya resueltos. */
interface ClienteRow {
  clienteNombre: string;
  clienteDocumento: string;
  /** Dónde ubicarlo en un recall. Guion cuando la persona no la tiene cargada. */
  clienteDireccion: string;
  ventaId: number;
  ventaLabel: string;
  sucursalNombre: string;
  cantidadLabel: string;
  fechaLabel: string;
  /** Se guarda aparte del label porque el salto a la venta la necesita: la clave es el par. */
  sucursalId: number;
}

/** Opción del filtro de tipo. El valor viaja crudo al backend, que espera el enum. */
interface OpcionTipo {
  valor: string;
  label: string;
}

/**
 * "Historial del lote": de dónde vino, a dónde fue y a quién se le vendió.
 *
 * Es la contraparte del bloqueo por recall. Sacar el lote de circulación se resuelve con
 * cambiarEstadoLote desde el listado; para avisar hace falta poder recorrer la compra que lo trajo,
 * las transferencias que lo repartieron y las ventas que lo sacaron.
 *
 * Va en solapa y no en diálogo porque son dos listados paginados con filtros propios: en un
 * diálogo compiten por un alto que no tienen.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-historial-lote',
  templateUrl: './historial-lote.component.html',
  styleUrls: ['./historial-lote.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistorialLoteComponent implements OnInit {

  /** Solapa que carga este componente. La arma el listado con addTab. */
  @Input() data: Tab;

  columnasMovimientos = ['fecha', 'sucursal', 'tipo', 'comprobante', 'cantidad', 'usuario'];
  columnasClientes = ['cliente', 'documento', 'direccion', 'venta', 'sucursal', 'cantidad', 'fecha'];

  /**
   * Los tipos que puede tener un movimiento de stock. Se ofrecen todos y no solo los que hoy
   * tocan lotes: la lista de tipos usados cambia con el uso del sistema, y un filtro que devuelve
   * vacío informa igual que uno ausente.
   */
  readonly opcionesTipo: OpcionTipo[] = [
    { valor: 'COMPRA', label: 'Compra' },
    { valor: 'VENTA', label: 'Venta' },
    { valor: 'TRANSFERENCIA', label: 'Transferencia' },
    { valor: 'DEVOLUCION', label: 'Devolución' },
    { valor: 'DESCARTE', label: 'Descarte' },
    { valor: 'AJUSTE', label: 'Ajuste' },
    { valor: 'ENTRADA', label: 'Entrada' },
    { valor: 'SALIDA', label: 'Salida' },
    { valor: 'CALCULO', label: 'Cálculo' }
  ];

  loteId: number = null;
  numeroLote = '';
  productoDescripcion = '';
  proveedorNombre = '-';
  fechaVencimientoLabel = '-';
  fechaRetiroLabel = '-';
  estadoLabel = '-';

  sucursales: Sucursal[] = [];
  /** Vive en la cabecera porque recorta las dos solapas a la vez. */
  sucursalControl = new FormControl<Sucursal>(null);
  /** Solo aplica a movimientos: la solapa de clientes son todas ventas por definición. */
  tipoControl = new FormControl<string>(null);

  /**
   * Las dos solapas paginan en el central (#772): gana la última página pedida. Si una carga falla, la tabla se
   * oculta y queda «Reintentar», que repite la última página que cargó (#390).
   */
  movPag: PaginacionLista<MovimientoRow> = new PaginacionLista<MovimientoRow>({
    cargar: (page, size) => this.conAviso(
      this.loteService.onMovimientosPorLote(this.loteId, this.sucursalControl.value?.id, this.tipoControl.value, page, size),
      'No se pudo consultar el historial del lote: el servidor no responde.',
      (item) => this.mapearMovimiento(item)
    ),
    pageSize: 20,
    pageSizeOptions: [20, 50, 100],
  });
  cliPag: PaginacionLista<ClienteRow> = new PaginacionLista<ClienteRow>({
    cargar: (page, size) => this.conAviso(
      this.loteService.onClientesPorLote(this.loteId, this.sucursalControl.value?.id, this.rastreableControl.value, page, size),
      'No se pudieron consultar los clientes del lote: el servidor no responde.',
      (item) => this.mapearCliente(item)
    ),
    pageSize: 20,
    pageSizeOptions: [20, 50, 100],
  });

  /**
   * Marcado (el default) trae las ventas con cliente identificado, que son las que se pueden
   * llamar. Desmarcado, las de mostrador: no dicen a quién, pero se pueden abrir para ver qué se
   * vendió. Nunca los dos conjuntos juntos, porque el mostrador es la abrumadora mayoría y
   * taparía a los clientes reales.
   */
  rastreableControl = new FormControl<boolean>(true);

  constructor(
    private loteService: LoteService,
    private sucursalService: SucursalService,
    private notificacionService: NotificacionSnackbarService,
    private tabService: TabService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const tabData: HistorialLoteTabData = this.data?.tabData?.data;
    this.loteId = tabData?.loteId ?? this.data?.tabData?.id ?? null;
    this.numeroLote = tabData?.numeroLote || '';
    this.productoDescripcion = tabData?.productoDescripcion || '';
    this.proveedorNombre = tabData?.proveedorNombre || '-';
    this.fechaVencimientoLabel = tabData?.fechaVencimientoLabel || '-';
    this.fechaRetiroLabel = tabData?.fechaRetiroLabel || '-';
    this.estadoLabel = tabData?.estadoLabel || '-';
    // Abre con el mismo recorte que traía el listado: si el operador venía mirando una sucursal,
    // el historial no debería contradecir lo que tenía en pantalla.
    this.sucursalControl.setValue(tabData?.sucursal || null);

    this.cargarSucursales();
    this.buscarMovimientos();
    this.buscarClientes();
  }

  private cargarSucursales(): void {
    this.sucursalService.onGetAllSucursales(true, PROPAGAR_ERROR_DE_RED,
      { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true })
      .pipe(untilDestroyed(this))
      .subscribe({ error: () => this.notificacionService.openWarn('No se pudieron cargar las sucursales del filtro: el servidor no responde.', 4), next: (res) => {
        if (res) {
          this.sucursales = res.filter((sucursal) => sucursal.activo !== false);
          this.cdr.markForCheck();
        }
      } });
  }

  /** La sucursal recorta las dos solapas, así que las rehace a las dos. */
  onSucursalChange(): void {
    this.buscarMovimientos();
    this.buscarClientes();
  }

  onTipoChange(): void {
    this.buscarMovimientos();
  }

  /** Cambia el conjunto entero, así que vuelve a la primera página. */
  onRastreableChange(): void {
    this.buscarClientes();
  }

  private buscarMovimientos(): void {
    if (this.loteId != null) this.movPag.filtrar();
  }

  private buscarClientes(): void {
    if (this.loteId != null) this.cliPag.filtrar();
  }

  reintentarMovimientos(): void {
    this.movPag.recargar();
  }

  reintentarClientes(): void {
    this.cliPag.recargar();
  }

  /** null = error GraphQL (el servicio ya avisó); sin respuesta, se avisa acá. */
  private conAviso<T, F>(consulta: Observable<{ getContent?: T[]; getTotalElements?: number } | null>, aviso: string,
                         mapear: (item: T) => F) {
    return consulta.pipe(
      catchError(() => {
        this.notificacionService.openWarn(aviso, 4);
        return of(null);
      }),
      map((res) => res && { getTotalElements: res.getTotalElements, getContent: (res.getContent || []).map(mapear) })
    );
  }

  private mapearMovimiento(item: MovimientoLote): MovimientoRow {
    const cantidad = item.cantidad || 0;
    return {
      fechaLabel: item.fecha ? dateToString(item.fecha, 'dd/MM/yyyy HH:mm') : '-',
      sucursalNombre: (item.sucursalNombre || this.referenciaSinNombre(item.sucursalId)).toUpperCase(),
      tipoLabel: item.tipoMovimiento || 'SIN TIPO',
      tipoClase: this.claseSegunTipo(item.tipoMovimiento),
      comprobanteLabel: this.etiquetaComprobante(item),
      // El signo se muestra siempre: la lectura del historial es "entró / salió", no "cuánto".
      cantidadLabel: `${cantidad > 0 ? '+' : ''}${cantidad}`,
      cantidadClase: cantidad < 0 ? 'cantidad-salida' : 'cantidad-entrada',
      usuarioNombre: item.usuarioNombre || '-'
    };
  }

  /**
   * El comprobante se nombra por lo que es, para que el operador sepa dónde ir a buscarlo. Sin
   * documentoId queda en "-": mostrar la referencia cruda sería mandarlo a buscar el id de un
   * ítem en la tabla del documento, donde no existe.
   */
  private etiquetaComprobante(item: MovimientoLote): string {
    if (item.documentoId == null) {
      return '-';
    }
    if (item.tipoMovimiento === 'VENTA') return `Venta #${item.documentoId}`;
    if (item.tipoMovimiento === 'COMPRA') return `Recepción #${item.documentoId}`;
    if (item.tipoMovimiento === 'TRANSFERENCIA') return `Transf. #${item.documentoId}`;
    return `#${item.documentoId}`;
  }

  private mapearCliente(item: ClienteLote): ClienteRow {
    return {
      clienteNombre: (item.clienteNombre || this.referenciaSinNombre(item.clienteId)).toUpperCase(),
      clienteDocumento: item.clienteDocumento || '-',
      clienteDireccion: item.clienteDireccion ? item.clienteDireccion.toUpperCase() : '-',
      ventaId: item.ventaId,
      ventaLabel: item.ventaId != null ? `#${item.ventaId}` : '-',
      sucursalId: item.sucursalId,
      sucursalNombre: (item.sucursalNombre || this.referenciaSinNombre(item.sucursalId)).toUpperCase(),
      cantidadLabel: `${item.cantidad || 0}`,
      fechaLabel: item.fecha ? dateToString(item.fecha, 'dd/MM/yyyy HH:mm') : '-'
    };
  }

  /**
   * Abre el buscador de ventas ya filtrado en esta venta puntual.
   *
   * Van el número y la sucursal porque la clave de venta es el par: filtrar solo por número
   * traería la venta homónima de cada sucursal.
   */
  onVerVenta(fila: ClienteRow): void {
    if (fila.ventaId == null) {
      return;
    }
    this.tabService.addTab(new Tab(
      GenericListVentaComponent,
      `Venta ${fila.ventaId}`,
      new TabData(fila.ventaId, {
        ventaId: fila.ventaId,
        sucursalId: fila.sucursalId
      }),
      HistorialLoteComponent
    ));
  }

  private referenciaSinNombre(id: number): string {
    return id != null ? `#${id}` : '-';
  }

  private claseSegunTipo(tipo: string): string {
    if (tipo === 'COMPRA') return 'tipo-compra';
    if (tipo === 'VENTA') return 'tipo-venta';
    if (tipo === 'TRANSFERENCIA') return 'tipo-transferencia';
    if (tipo === 'AJUSTE') return 'tipo-ajuste';
    return 'tipo-desconocido';
  }
}
