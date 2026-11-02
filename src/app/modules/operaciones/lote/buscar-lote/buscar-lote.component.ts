import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabData, TabService } from '../../../../layouts/tab/tab.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { Producto } from '../../../productos/producto/producto.model';
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData
} from '../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component';
import { HistorialLoteComponent, HistorialLoteTabData } from '../historial-lote/historial-lote.component';
import {
  ESTADO_LOTE_LABELS,
  LoteEncontrado,
  ResultadoBusquedaLote,
  StockLoteSucursal,
  TrazabilidadProducto
} from '../lote.model';
import { LoteService } from '../lote.service';

/** Etiquetas de los tipos de movimiento que pueden entrar sin lote. */
const TIPO_MOVIMIENTO_LABELS: { [k: string]: string } = {
  COMPRA: 'Compras',
  TRANSFERENCIA: 'Transferencias recibidas',
  AJUSTE: 'Ajustes',
  DEVOLUCION: 'Devoluciones',
  ENTRADA: 'Entradas',
  CALCULO: 'Recálculos'
};

/** Qué puede afirmar la pantalla cuando no hay registro del lote. */
export type NivelSinRegistro = 'sin-producto' | 'producto-sin-control' | 'con-huecos' | 'completo';

/**
 * "Buscar lote" (#429 fase 2, entrega 1): responde un reclamo del tipo "¿este lote lo vendieron
 * ustedes?".
 *
 * Busca en el maestro de lotes, así que encuentra también un lote vendido entero (saldo 0) o
 * archivado, que en "Stock por lotes" no aparece. Si no hay registro, NUNCA dice "nunca entró":
 * dice "No hay registro" y muestra desde cuándo se controla el lote del producto y qué entró sin
 * lote desde entonces. La frase fuerte solo sale si no hay ningún hueco.
 */
@UntilDestroy()
@Component({
  selector: 'app-buscar-lote',
  templateUrl: './buscar-lote.component.html',
  styleUrls: ['./buscar-lote.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuscarLoteComponent implements OnInit {
  numeroControl = new FormControl<string>('');
  producto: Producto = null;

  buscando = false;
  resultado: ResultadoBusquedaLote = null;
  /** Mensaje cuando el central no tiene la consulta (central viejo) u otro error. */
  error: string = null;

  /** Desglose por sucursal, por lote, cargado al expandir. */
  sucursalesPorLote: { [loteId: number]: StockLoteSucursal[] } = {};
  expandido: number = null;

  puedeVer = false;

  constructor(
    private loteService: LoteService,
    private mainService: MainService,
    private tabService: TabService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const roles = this.mainService.usuarioActual?.roles || [];
    // Lo mismo que valida el central: ver productos y además análisis de caja o de venta.
    this.puedeVer = roles.includes(ROLES.ADMIN) || (
      roles.includes(ROLES.VER_PRODUCTOS) &&
      (roles.includes(ROLES.ANALISIS_DE_CAJA) || roles.includes(ROLES.ANALISIS_DE_VENTA)));
  }

  onElegirProducto(): void {
    const data: PdvSearchProductoData = { mostrarOpciones: false, mostrarStock: false };
    this.dialog.open(PdvSearchProductoDialogComponent, {
      data, width: '75%', height: '85%', maxWidth: '95vw'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe((res: PdvSearchProductoResponseData) => {
      if (res?.producto) {
        this.producto = res.producto;
        this.cdr.markForCheck();
      }
    });
  }

  onQuitarProducto(): void {
    this.producto = null;
    this.cdr.markForCheck();
  }

  onBuscar(): void {
    const numero = (this.numeroControl.value || '').trim();
    if (!numero || !this.puedeVer) return;
    this.buscando = true;
    this.error = null;
    this.resultado = null;
    this.expandido = null;
    this.sucursalesPorLote = {};
    this.cdr.markForCheck();
    this.loteService.onBuscarLotePorNumero(numero, this.producto?.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.resultado = res ?? null;
          this.buscando = false;
          if (res?.lotes?.length === 1) this.onExpandir(res.lotes[0]);
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.buscando = false;
          this.error = BuscarLoteComponent.mensajeError(e);
          this.cdr.markForCheck();
        }
      });
  }

  /** Central sin la fase 2: la consulta no existe. No rompe, avisa. */
  static mensajeError(e: any): string {
    const texto = JSON.stringify(e?.graphQLErrors ?? e?.message ?? e ?? '');
    if (/buscarLotePorNumero|FieldUndefined|Validation error/i.test(texto)) {
      return 'Esta búsqueda requiere actualizar el servidor central.';
    }
    if (/No autorizado/i.test(texto)) {
      return 'No tenés permiso para consultar lotes.';
    }
    return 'No se pudo hacer la búsqueda. Probá de nuevo.';
  }

  onExpandir(lote: LoteEncontrado): void {
    if (this.expandido === lote.loteId) {
      this.expandido = null;
      this.cdr.markForCheck();
      return;
    }
    this.expandido = lote.loteId;
    this.cdr.markForCheck();
    if (this.sucursalesPorLote[lote.loteId]) return;
    this.loteService.onStockLotePorSucursal(lote.loteId).pipe(untilDestroyed(this)).subscribe({
      next: (items) => {
        this.sucursalesPorLote = {
          ...this.sucursalesPorLote,
          [lote.loteId]: (items || []).filter(i => (i.cantidadDisponible ?? 0) !== 0)
        };
        this.cdr.markForCheck();
      },
      error: () => {
        this.sucursalesPorLote = { ...this.sucursalesPorLote, [lote.loteId]: [] };
        this.cdr.markForCheck();
      }
    });
  }

  onVerHistorial(lote: LoteEncontrado): void {
    const tabData: HistorialLoteTabData = {
      loteId: lote.loteId,
      numeroLote: lote.numeroLote,
      productoDescripcion: lote.productoDescripcion,
      proveedorNombre: lote.proveedorNombre,
      fechaVencimientoLabel: this.fecha(lote.fechaVencimiento),
      estadoLabel: this.estado(lote)
    };
    this.tabService.addTab(new Tab(
      HistorialLoteComponent,
      `Historial lote ${lote.numeroLote}`,
      new TabData(lote.loteId, tabData),
      BuscarLoteComponent
    ));
  }

  /** Qué se puede afirmar cuando no hay registro. */
  nivelSinRegistro(t: TrazabilidadProducto): NivelSinRegistro {
    if (!t) return 'sin-producto';
    if (!t.trazadoDesde) return 'producto-sin-control';
    return t.todasLasEntradasConLote ? 'completo' : 'con-huecos';
  }

  tipoMovimiento(tipo: string): string {
    return TIPO_MOVIMIENTO_LABELS[tipo] || tipo;
  }

  estado(lote: LoteEncontrado): string {
    const base = lote.estado ? (ESTADO_LOTE_LABELS[lote.estado] || lote.estado) : '-';
    return lote.archivado ? `${base} (archivado)` : base;
  }

  /** dd/MM/yyyy sin correr el día: una fecha "yyyy-MM-dd" se arma a mano, no como UTC. */
  fecha(valor: string | Date): string {
    if (!valor) return '-';
    if (typeof valor === 'string') {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
      if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    }
    const d = new Date(valor as any);
    return isNaN(d.getTime()) ? '-' : dateToString(d, 'dd/MM/yyyy');
  }

  trackLote(_: number, l: LoteEncontrado): number {
    return l.loteId;
  }
}
