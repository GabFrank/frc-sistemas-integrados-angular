import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Retiro } from '../../retiro.model';
import { RetiroDetalle } from '../../retiro-detalle.model';
import { CajaVirtual } from '../../../caja-virtual/caja-virtual.model';
import { Moneda } from '../../../moneda/moneda.model';
import { RetiroVerificacionService } from '../retiro-verificacion.service';
import {
  BorradorVerificacion, CATEGORIA_LABEL, CategoriaDiferenciaRetiro,
  ConteoRetiroMonedaInput, RetiroVerificacion,
} from '../retiro-verificacion.model';
import { DialogosService } from '../../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../../notificacion-snackbar.service';

export interface VerificarRetiroDialogData {
  retiro: Retiro;
  cajaVirtual: CajaVirtual;
}

/** Una moneda del retiro: lo declarado, lo que se va contando y la diferencia. */
interface FilaMoneda {
  moneda: Moneda;
  declarado: number;
  contado: number;
  diferencia: number;
  categoria: CategoriaDiferenciaRetiro;
  /** digitsInfo del pipe number, según los decimales de la moneda. */
  formato: string;
  /** Etiqueta y color de la diferencia, precalculados (no se llaman funciones desde el HTML). */
  etiqueta: string;
  color: string;
}

/**
 * Verificación de un retiro al recibirlo en tesorería.
 *
 * El que recibe cuenta la plata contra lo que declaró el PDV. A la caja mayor entra
 * <b>lo contado</b>: el retiro es inmutable y queda como la declaración del origen.
 *
 * El conteo se guarda en un borrador local a cada cambio. Contar plata se interrumpe —entra
 * alguien, suena el teléfono, se cierra el diálogo— y volver a empezar de cero es la forma más
 * rápida de que nadie cuente en serio.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-verificar-retiro-dialog',
  templateUrl: './verificar-retiro-dialog.component.html',
  styleUrls: ['./verificar-retiro-dialog.component.scss'],
})
export class VerificarRetiroDialogComponent implements OnInit {

  filas: FilaMoneda[] = [];
  observacion = '';
  guardando = false;
  hayDiferencia = false;
  huboBorrador = false;

  /** Moneda cuya grilla está abierta. Una sola a la vez: la grilla necesita ancho. */
  monedaAbierta: Moneda = null;

  /** Cantidades por moneda y valor de billete, para la grilla y para el borrador. */
  cantidades: { [monedaId: string]: { [valor: string]: number } } = {};

  categorias = Object.keys(CATEGORIA_LABEL).map(k => ({ value: k, label: CATEGORIA_LABEL[k] }));

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: VerificarRetiroDialogData,
    private dialogRef: MatDialogRef<VerificarRetiroDialogComponent>,
    private service: RetiroVerificacionService,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService,
  ) {}

  ngOnInit(): void {
    const borrador = this.service.leerBorrador(this.data.retiro.id, this.data.retiro.sucursalId);
    if (borrador) {
      this.cantidades = borrador.cantidades || {};
      this.observacion = borrador.observacion || '';
      this.huboBorrador = true;
    }
    this.armarFilas();
  }

  /** Lo declarado sale del retiro_detalle, agrupado por moneda. Es inmutable. */
  private armarFilas() {
    const porMoneda = new Map<number, FilaMoneda>();
    const detalles: RetiroDetalle[] = this.data.retiro?.retiroDetalleList || [];
    for (const d of detalles) {
      if (!d?.moneda?.id) continue;
      const dec = d.moneda.decimales != null
        ? d.moneda.decimales
        : ((d.moneda.denominacion || '').toUpperCase().includes('GUARAN') ? 0 : 2);
      const fila = porMoneda.get(d.moneda.id) || {
        moneda: d.moneda, declarado: 0, contado: 0, diferencia: 0,
        categoria: null, formato: `1.0-${dec}`, etiqueta: '', color: '#b0bec5',
      };
      fila.declarado += d.cantidad || 0;
      porMoneda.set(d.moneda.id, fila);
    }
    this.filas = Array.from(porMoneda.values());
    // Sembrar lo que haya en el borrador y recalcular.
    this.filas.forEach(f => f.contado = this.totalDe(f.moneda.id));
    this.recalcular();
  }

  private totalDe(monedaId: number): number {
    const porValor = this.cantidades[String(monedaId)] || {};
    return Object.keys(porValor).reduce((acc, valor) => acc + (Number(valor) * porValor[valor]), 0);
  }

  abrirGrilla(fila: FilaMoneda) {
    this.monedaAbierta = this.monedaAbierta?.id === fila.moneda.id ? null : fila.moneda;
  }

  cantidadesDe(monedaId: number): { [valor: string]: number } {
    return this.cantidades[String(monedaId)] || {};
  }

  onCantidadesChange(fila: FilaMoneda, cantidades: { [valor: string]: number }) {
    this.cantidades[String(fila.moneda.id)] = cantidades;
    fila.contado = this.totalDe(fila.moneda.id);
    this.recalcular();
    this.guardarBorrador();
  }

  /** Confirma lo declarado sin contar. Queda marcado como verificación rápida. */
  usarDeclarado(fila: FilaMoneda) {
    this.cantidades[String(fila.moneda.id)] = {};
    fila.contado = fila.declarado;
    this.recalcular();
    this.guardarBorrador();
  }

  private recalcular() {
    this.hayDiferencia = false;
    for (const f of this.filas) {
      f.diferencia = (f.contado || 0) - (f.declarado || 0);
      if (Math.abs(f.diferencia) > 0.005) {
        this.hayDiferencia = true;
        if (!f.categoria) {
          f.categoria = f.diferencia < 0
            ? CategoriaDiferenciaRetiro.FALTANTE
            : CategoriaDiferenciaRetiro.SOBRANTE;
        }
        f.etiqueta = f.diferencia < 0 ? 'Faltante' : 'Sobrante';
        f.color = f.diferencia < 0 ? '#ff8a80' : '#64b5f6';
      } else {
        f.categoria = null;
        f.etiqueta = 'Coincide';
        f.color = '#81c784';
      }
    }
  }

  private guardarBorrador() {
    const borrador: BorradorVerificacion = {
      cantidades: this.cantidades,
      observacion: this.observacion,
      actualizadoEn: new Date().toISOString(),
    };
    this.service.guardarBorrador(this.data.retiro.id, this.data.retiro.sucursalId, borrador);
  }

  onObservacionChange() {
    this.guardarBorrador();
  }

  /**
   * Confirma la verificación.
   *
   * `rapida` es true cuando no se contó ninguna denominación: el operador aceptó lo declarado.
   * Se marca a propósito — si más adelante aparece una diferencia, hay que poder saber que ese
   * retiro nunca se contó billete por billete.
   */
  onConfirmar() {
    if (this.guardando) return;

    const conteos: ConteoRetiroMonedaInput[] = this.filas.map(f => ({
      monedaId: f.moneda.id,
      contado: f.contado || 0,
      categoria: f.categoria || null,
    }));
    const rapida = Object.keys(this.cantidades).every(
      k => Object.keys(this.cantidades[k] || {}).length === 0);

    const seguir = () => this.enviar(conteos, rapida);

    if (this.hayDiferencia) {
      // Formateado: el confirm no pasa por pipes y un "-100000" pelado se lee mal justo
      // cuando el operador tiene que decidir si está de acuerdo con la diferencia.
      const resumen = this.filas
        .filter(f => Math.abs(f.diferencia) > 0.005)
        .map(f => {
          const dec = f.formato.endsWith('-0') ? 0 : 2;
          const monto = f.diferencia.toLocaleString('es-PY', { maximumFractionDigits: dec });
          return `${f.moneda.denominacion}: ${f.diferencia > 0 ? '+' : ''}${monto} ${f.moneda.simbolo}`;
        })
        .join(' · ');
      this.dialogosService.confirm(
        'Confirmar con diferencia',
        'Se va a acreditar lo contado y se abrirá un caso para investigar.',
        resumen, null, true, 'Sí, confirmar', 'No',
      ).pipe(untilDestroyed(this)).subscribe(res => { if (res === true) seguir(); });
      return;
    }
    seguir();
  }

  private enviar(conteos: ConteoRetiroMonedaInput[], rapida: boolean) {
    this.guardando = true;
    this.service.onVerificar(
      this.data.retiro.id, this.data.retiro.sucursalId, this.data.cajaVirtual.id,
      conteos, rapida, this.observacion,
    ).pipe(untilDestroyed(this)).subscribe({
      next: (res: RetiroVerificacion) => {
        this.guardando = false;
        if (res == null) return;
        // El conteo ya quedó en el backend; el borrador solo confundiría al reabrir.
        this.service.borrarBorrador(this.data.retiro.id, this.data.retiro.sucursalId);
        this.dialogRef.close(res);
      },
      error: err => {
        this.guardando = false;
        const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'No se pudo verificar';
        this.notificacion.notification$.next({ texto: msg, color: NotificacionColor.warn, duracion: 5 });
      },
    });
  }

  onCancelar() {
    // No se borra el borrador: cerrar sin confirmar es justamente el caso que resuelve.
    this.dialogRef.close(null);
  }
}
