import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import {
  ESTADO_LOTE_LABELS,
  EstadoLote,
  Lote
} from '../../../operaciones/lote/lote.model';
import { LoteService } from '../../../operaciones/lote/lote.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { Producto } from '../producto.model';
import { avisoTrasMutacion, erroresDeRechazo, RECARGA_TRAS_CORTE_MS } from '../../../../commons/core/utils/graphqlErrorUtils';

export interface LotesProductoDialogData {
  producto: Producto;
}

/**
 * Fila de la tabla. Los campos derivados se precalculan acá y no en el template, porque Angular
 * reevalúa las expresiones del template en cada ciclo de detección de cambios.
 */
interface LoteRow {
  id: number;
  numeroLote: string;
  fechaVencimiento: Date;
  fechaRetiro: Date;
  estado: EstadoLote;
  estadoLabel: string;
  estadoClase: string;
  proveedorNombre: string;
  observacion: string;
  /** Saldo en toda la red. Null si el central todavía no informa gestión de lotes. */
  saldoTotal: number | null;
  saldoLabel: string;
  archivado: boolean;
  /** Archivar exige saldo 0 en toda la red (el central lo vuelve a validar). */
  puedeArchivar: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-lotes-producto-dialog',
  templateUrl: './lotes-producto-dialog.component.html',
  styleUrls: ['./lotes-producto-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LotesProductoDialogComponent implements OnInit, OnDestroy {
  private recargasTrasCorte = new Set<any>();
  private destruido = false;

  displayedColumns = ['numeroLote', 'fechaVencimiento', 'fechaRetiro', 'proveedor', 'saldo', 'estado', 'acciones'];

  /** Sin permiso la columna no tiene nada que mostrar: se saca entera, encabezado incluido. */
  private static readonly COLUMNAS_SIN_ACCIONES =
    ['numeroLote', 'fechaVencimiento', 'fechaRetiro', 'proveedor', 'saldo', 'estado'];

  lotes: LoteRow[] = [];
  cargando = false;
  cargaFallo = false;
  sinLotes = false;
  descripcionProducto = '';

  readonly estados = [EstadoLote.LIBERADO, EstadoLote.CUARENTENA, EstadoLote.BLOQUEADO];
  readonly estadoLabels = ESTADO_LOTE_LABELS;

  /**
   * Mismo permiso que en la pantalla de stock por lotes: cambiar el estado saca mercadería de
   * circulación en toda la red. Sin él el menú de acciones no se muestra, porque es lo único que
   * tiene adentro.
   */
  puedeCambiarEstado = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: LotesProductoDialogData,
    private dialogRef: MatDialogRef<LotesProductoDialogComponent>,
    private loteService: LoteService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    private mainService: MainService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.puedeCambiarEstado =
      this.mainService.usuarioActual?.roles?.includes(ROLES.ADMIN) ||
      this.mainService.usuarioActual?.roles?.includes(ROLES.EDITAR_PRODUCTOS) ||
      false;

    if (!this.puedeCambiarEstado) {
      this.displayedColumns = LotesProductoDialogComponent.COLUMNAS_SIN_ACCIONES;
    }

    this.descripcionProducto = this.data?.producto?.descripcion || '';
    this.cargarLotes();
  }

  private cargarLotes(): void {
    const productoId = this.data?.producto?.id;
    if (!productoId) {
      return;
    }
    this.cargando = true;
    this.cargaFallo = false;
    this.loteService
      .onGetLotesPorProducto(productoId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          if (res == null) {
            this.marcarCargaFallida(); // error GraphQL: el servicio ya avisó; no es «sin lotes»
            return;
          }
          this.lotes = (res || []).map((lote) => this.mapearFila(lote));
          this.sinLotes = this.lotes.length === 0;
          this.cargando = false;
          this.cdr.markForCheck();
          this.cargarGestion(productoId);
        },
        error: () => {
          this.notificacionService.openWarn('No se pudieron cargar los lotes del producto: el servidor no responde.', 4);
          this.marcarCargaFallida();
        }
      });
  }

  /** True cuando el central informó saldo y archivado (entrega 5). Sin eso no se ofrece archivar. */
  gestionDisponible = false;

  /**
   * Saldo en la red y archivado de cada lote. Va aparte de la lista: si el central es anterior a la
   * gestión de lotes, la consulta falla y la pantalla sigue igual que antes, sin archivar.
   */
  private cargarGestion(productoId: number): void {
    this.loteService
      .onGestionLotesDeProducto(productoId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (pagina) => {
          const filas: any[] = pagina?.getContent || [];
          if (pagina == null) {
            return;
          }
          const porId = new Map<number, any>();
          filas.forEach((f) => porId.set(+f.loteId, f));
          this.gestionDisponible = true;
          this.lotes = this.lotes.map((fila) => aplicarGestion(fila, porId.get(+fila.id)));
          this.cdr.markForCheck();
        },
        error: () => {
          // Central viejo o sin red: la lista ya está, solo sin saldo ni archivar.
        }
      });
  }

  onArchivar(fila: LoteRow): void {
    if (!this.puedeCambiarEstado || !fila.puedeArchivar) {
      return;
    }
    this.dialogosService
      .confirm(
        'Archivar lote',
        `El lote ${fila.numeroLote} no tiene saldo en ninguna sucursal. Archivado deja de aparecer en los buscadores y selectores.`,
        'No mueve stock ni cambia el estado. Se puede desarchivar después.',
        undefined, true, 'Archivar', 'Cancelar'
      )
      .pipe(untilDestroyed(this))
      .subscribe((confirmado) => {
        if (!confirmado) {
          return;
        }
        this.loteService
          .onArchivarLote(fila.id, 'Lote sin saldo archivado desde Lotes del producto',
            this.mainService.usuarioActual?.id)
          .pipe(untilDestroyed(this))
          .subscribe({
            next: (ok) => {
              if (ok) {
                this.notificacionService.openSucess('Lote archivado');
                this.cargarLotes();
              }
            },
            error: (error) => {
              const aviso = avisoTrasMutacion(error, 'se archivó el lote');
              if (aviso != null) {
                this.notificacionService.openWarn(aviso, 8);
              }
            }
          });
      });
  }

  onDesarchivar(fila: LoteRow): void {
    if (!this.puedeCambiarEstado || !fila.archivado) {
      return;
    }
    this.loteService
      .onDesarchivarLote(fila.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (ok) => {
          if (ok) {
            this.notificacionService.openSucess('Lote desarchivado');
            this.cargarLotes();
          }
        },
        error: (error) => {
          const aviso = avisoTrasMutacion(error, 'se desarchivó el lote');
          if (aviso != null) {
            this.notificacionService.openWarn(aviso, 8);
          }
        }
      });
  }

  /** Antes quedaba «cargando» para siempre o «sin lotes» falso (#390). */
  private marcarCargaFallida(): void {
    this.cargando = false;
    this.cargaFallo = true;
    this.lotes = [];
    this.sinLotes = false;
    this.cdr.markForCheck();
  }

  reintentarLotes(): void {
    this.cargarLotes();
  }

  private mapearFila(lote: Lote): LoteRow {
    return {
      id: lote.id,
      numeroLote: lote.numeroLote,
      fechaVencimiento: lote.fechaVencimiento,
      fechaRetiro: lote.fechaRetiro,
      estado: lote.estado,
      estadoLabel: ESTADO_LOTE_LABELS[lote.estado] || lote.estado,
      estadoClase: this.claseSegunEstado(lote.estado),
      proveedorNombre: lote.proveedor?.persona?.nombre || '-',
      observacion: lote.observacion || '',
      saldoTotal: null,
      saldoLabel: '-',
      archivado: false,
      puedeArchivar: false
    };
  }

  private claseSegunEstado(estado: EstadoLote): string {
    if (estado === EstadoLote.BLOQUEADO) return 'estado-bloqueado';
    if (estado === EstadoLote.CUARENTENA) return 'estado-cuarentena';
    return 'estado-liberado';
  }

  /**
   * Cambia el estado de un lote. Bloquear es una acción con impacto en todas las sucursales,
   * así que se confirma antes.
   */
  onCambiarEstado(fila: LoteRow, estado: EstadoLote): void {
    if (!this.puedeCambiarEstado || fila.estado === estado) {
      return;
    }

    const mensaje = estado === EstadoLote.LIBERADO
      ? `El lote ${fila.numeroLote} vuelve a estar disponible para la venta en todas las sucursales.`
      : `El lote ${fila.numeroLote} dejará de venderse en TODAS las sucursales. El stock físico no se modifica: la mercadería sigue existiendo y se sigue contando en el inventario.`;

    this.dialogosService
      .confirm(
        `Cambiar estado a ${ESTADO_LOTE_LABELS[estado]}`,
        mensaje,
        'Los cambios se replican a las sucursales automáticamente.',
        undefined,
        true,
        'Confirmar',
        'Cancelar'
      )
      .pipe(untilDestroyed(this))
      .subscribe((confirmado) => {
        if (confirmado) {
          this.aplicarCambioDeEstado(fila, estado);
        }
      });
  }

  private aplicarCambioDeEstado(fila: LoteRow, estado: EstadoLote): void {
    this.loteService
      .onCambiarEstadoLote(fila.id, estado, fila.observacion, this.mainService.usuarioActual?.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          if (res) {
            this.notificacionService.openSucess('Estado del lote actualizado');
            this.cargarLotes();
          }
        },
        // En un rechazo el genérico ya mostró el motivo; sin respuesta se avisa y se recarga a los 5 s (#488)
        error: (error) => {
          const aviso = avisoTrasMutacion(error, 'se cambió el estado del lote');
          if (aviso != null) {
            this.notificacionService.openWarn(aviso, 8);
          }
          if (erroresDeRechazo(error) == null) {
            this.programarRecargaTrasFallo(() => this.cargarLotes());
          }
        }
      });
  }

  onCerrar(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.recargasTrasCorte.forEach(timeout => clearTimeout(timeout));
    this.recargasTrasCorte.clear();
  }

  /** Recarga tras un corte: a los 5 s y solo si la pantalla sigue abierta (#488). */
  private programarRecargaTrasFallo(recargar: () => void): void {
    if (this.destruido) {
      return;
    }
    const timeout = setTimeout(() => {
      this.recargasTrasCorte.delete(timeout);
      if (!this.destruido) {
        recargar();
      }
    }, RECARGA_TRAS_CORTE_MS);
    this.recargasTrasCorte.add(timeout);
  }
}

/** Tolerancia al comparar saldos en punto flotante, igual que en el backend. */
const EPSILON_SALDO = 0.0001;

/** Completa la fila con el saldo en la red y el archivado. Pura para poder probarla. */
export function aplicarGestion<T extends { saldoTotal: number | null; saldoLabel: string; archivado: boolean; puedeArchivar: boolean }>(
  fila: T, gestion: { saldoTotal?: number; archivado?: boolean } | undefined
): T {
  if (gestion == null) {
    // El buscador oculta archivados sin saldo solo si no se pide incluirlos; acá se piden todos,
    // así que un lote ausente es un dato que no llegó: no se ofrece archivar.
    return { ...fila, saldoTotal: null, saldoLabel: '-', archivado: false, puedeArchivar: false };
  }
  const saldo = gestion.saldoTotal ?? 0;
  const archivado = gestion.archivado === true;
  return {
    ...fila,
    saldoTotal: saldo,
    saldoLabel: archivado ? `${saldo} (archivado)` : `${saldo}`,
    archivado,
    puedeArchivar: !archivado && Math.abs(saldo) <= EPSILON_SALDO
  };
}
