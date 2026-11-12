import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RetiroParaDetalleGQL } from '../graphql/retiroParaDetalle';
import { RetiroVerificacionService } from '../../retiro/verificacion/retiro-verificacion.service';
import { RetiroVerificacion } from '../../retiro/verificacion/retiro-verificacion.model';

export interface DetalleRetiroDialogData {
  retiroId: number;
  sucursalId: number;
  descripcion?: string;
  /** false con el rol acotado: no lee la verificación (es de tesorería) y pedirla solo daría un aviso de rechazo. */
  conVerificacion?: boolean;
}

/** Una moneda del retiro: lo declarado por el cajero y, si se verificó, lo contado. Todo ya formateado. */
interface FilaMonedaRetiro {
  moneda: string;
  declarado: string;
  contado: string;
  diferencia: string;
  colorDiferencia: string;
}

/**
 * Detalle del retiro de PDV que ingresó a la caja mayor (desk #721): sucursal, caja, responsable, monedas declaradas
 * y, si se verificó, lo contado y la diferencia. Es el que explica un ingreso RETIRO_CAJA, el movimiento más común de
 * la caja. La verificación la lee solo tesorería: con el rol acotado se muestra el retiro sin ella.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-detalle-retiro-dialog',
  templateUrl: './detalle-retiro-dialog.component.html',
  styleUrls: ['./detalle-retiro-dialog.component.scss'],
})
export class DetalleRetiroDialogComponent implements OnInit {

  isLoading = true;
  cargaFallo = false;
  sinVerificacion = false;

  sucursal = '';
  caja = '';
  fecha: Date = null;
  responsable = '';
  cajero = '';
  estado = '';
  observacion = '';
  resultado = '';
  verificadoPor = '';
  verificadoEn: Date = null;
  filas: FilaMonedaRetiro[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DetalleRetiroDialogData,
    private retiroGQL: RetiroParaDetalleGQL,
    private verificacionService: RetiroVerificacionService,
  ) {}

  ngOnInit(): void {
    const retiro$ = this.retiroGQL.fetch({ id: this.data.retiroId, sucId: this.data.sucursalId }, {
      fetchPolicy: 'no-cache', errorPolicy: 'all', context: { clientName: 'servidor' }
    }).pipe(map(r => r?.data?.data || null), catchError(() => of(null)));
    // Sin permiso o sin verificación: se muestra igual lo declarado.
    const verificacion$ = this.data.conVerificacion === false ? of(null)
      : this.verificacionService.onGetVerificacion(this.data.retiroId, this.data.sucursalId).pipe(catchError(() => of(null)));
    forkJoin({ retiro: retiro$, verificacion: verificacion$ }).pipe(untilDestroyed(this))
      .subscribe(({ retiro, verificacion }) => {
        this.isLoading = false;
        if (retiro == null) { this.cargaFallo = true; return; }
        this.armar(retiro, verificacion);
      });
  }

  private armar(retiro: any, verificacion: RetiroVerificacion) {
    this.sucursal = retiro.sucursal?.nombre || ('Sucursal ' + (retiro.sucursalId ?? this.data.sucursalId));
    this.caja = retiro.cajaSalida?.id != null ? ('Caja #' + retiro.cajaSalida.id) : '—';
    this.fecha = retiro.creadoEn;
    this.responsable = retiro.responsable?.persona?.nombre || '—';
    this.cajero = retiro.usuario?.persona?.nombre || '—';
    this.estado = retiro.estado || '';
    this.observacion = retiro.observacion || '';

    const declarado = new Map<string, { moneda: any; total: number }>();
    for (const d of (retiro.retiroDetalleList || [])) {
      if (!d?.moneda?.id) continue;
      const k = String(d.moneda.id);
      const actual = declarado.get(k) || { moneda: d.moneda, total: 0 };
      actual.total += d.cantidad || 0;
      declarado.set(k, actual);
    }
    const contado = new Map<string, { moneda: any; contado: number; diferencia: number }>();
    if (verificacion) {
      this.resultado = verificacion.resultado || '';
      this.verificadoPor = verificacion.usuario?.persona?.nombre || '';
      this.verificadoEn = verificacion.creadoEn;
      for (const d of (verificacion.detalles || [])) {
        if (!d?.moneda?.id) continue;
        contado.set(String(d.moneda.id), { moneda: d.moneda, contado: d.contado, diferencia: d.diferencia });
      }
    } else {
      this.sinVerificacion = true;
    }

    // Unión: una moneda no declarada que vino en el sobre (desk #670) aparece solo en la verificación.
    const ids = new Set([...declarado.keys(), ...contado.keys()]);
    this.filas = Array.from(ids).map(id => {
      const dec = declarado.get(id);
      const con = contado.get(id);
      const moneda = dec?.moneda || con?.moneda;
      const decimales = moneda?.decimales ?? 0;
      const fmt = (v: number) => v == null ? '—'
        : `${v.toLocaleString('es-PY', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })} ${moneda?.simbolo || ''}`;
      const dif = con?.diferencia;
      return {
        moneda: moneda?.denominacion || '',
        declarado: fmt(dec?.total ?? 0),
        contado: con ? fmt(con.contado) : '—',
        diferencia: dif == null ? '—' : (dif > 0 ? '+' : '') + fmt(dif),
        // Colores de estado: iguales en los dos modos.
        colorDiferencia: dif == null || Math.abs(dif) < 0.005 ? 'var(--frc-texto-tenue)' : (dif < 0 ? '#ff8a80' : '#64b5f6'),
      };
    });
  }
}
