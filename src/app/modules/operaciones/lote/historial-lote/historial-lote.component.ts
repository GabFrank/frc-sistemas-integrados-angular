import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { PageInfo } from '../../../../app.component';
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
  columnasClientes = ['cliente', 'documento', 'venta', 'sucursal', 'cantidad', 'fecha'];

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

  movimientos: MovimientoRow[] = [];
  movPageIndex = 0;
  movPageSize = 20;
  movTotalElements = 0;
  movCargando = false;
  movSinResultados = false;

  clientes: ClienteRow[] = [];
  cliPageIndex = 0;
  cliPageSize = 20;
  cliTotalElements = 0;
  cliCargando = false;
  cliSinResultados = false;

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
    this.sucursalService.onGetAllSucursales()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.sucursales = res.filter((sucursal) => sucursal.activo !== false);
          this.cdr.markForCheck();
        }
      });
  }

  /** La sucursal recorta las dos solapas, así que las rehace a las tres consultas. */
  onSucursalChange(): void {
    this.movPageIndex = 0;
    this.cliPageIndex = 0;
    this.buscarMovimientos();
    this.buscarClientes();
  }

  onTipoChange(): void {
    this.movPageIndex = 0;
    this.buscarMovimientos();
  }

  onMovimientosPage(event: PageEvent): void {
    this.movPageIndex = event.pageIndex;
    this.movPageSize = event.pageSize;
    this.buscarMovimientos();
  }

  onClientesPage(event: PageEvent): void {
    this.cliPageIndex = event.pageIndex;
    this.cliPageSize = event.pageSize;
    this.buscarClientes();
  }

  /** Cambia el conjunto entero, así que vuelve a la primera página. */
  onRastreableChange(): void {
    this.cliPageIndex = 0;
    this.buscarClientes();
  }

  private buscarMovimientos(): void {
    if (this.loteId == null) {
      return;
    }
    this.movCargando = true;
    this.loteService
      .onMovimientosPorLote(
        this.loteId,
        this.sucursalControl.value?.id,
        this.tipoControl.value,
        this.movPageIndex,
        this.movPageSize
      )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res: PageInfo<MovimientoLote>) => {
          const contenido = res?.getContent || [];
          this.movTotalElements = res?.getTotalElements || 0;
          this.movimientos = contenido.map((item) => this.mapearMovimiento(item));
          this.movSinResultados = contenido.length === 0;
          this.movCargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.movCargando = false;
          this.notificacionService.openAlgoSalioMal('Error al consultar el historial del lote');
          this.cdr.markForCheck();
        }
      });
  }

  private buscarClientes(): void {
    if (this.loteId == null) {
      return;
    }
    this.cliCargando = true;
    this.loteService
      .onClientesPorLote(
        this.loteId,
        this.sucursalControl.value?.id,
        this.rastreableControl.value,
        this.cliPageIndex,
        this.cliPageSize
      )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res: PageInfo<ClienteLote>) => {
          const contenido = res?.getContent || [];
          this.cliTotalElements = res?.getTotalElements || 0;
          this.clientes = contenido.map((item) => this.mapearCliente(item));
          this.cliSinResultados = contenido.length === 0;
          this.cliCargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cliCargando = false;
          this.notificacionService.openAlgoSalioMal('Error al consultar los clientes del lote');
          this.cdr.markForCheck();
        }
      });
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
