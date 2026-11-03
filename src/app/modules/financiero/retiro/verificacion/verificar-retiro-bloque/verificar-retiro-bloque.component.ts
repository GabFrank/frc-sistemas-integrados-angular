import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CurrencyMaskInputMode } from 'ngx-currency';
import { Retiro } from '../../retiro.model';
import { RetiroDetalle } from '../../retiro-detalle.model';
import { Moneda } from '../../../moneda/moneda.model';
import { RetiroVerificacionService } from '../retiro-verificacion.service';
import {
  BorradorVerificacion, CATEGORIA_LABEL, CategoriaDiferenciaRetiro, ConteoRetiroMonedaInput,
} from '../retiro-verificacion.model';

/** Una moneda del retiro: lo declarado, lo contado (null = sin contar) y la diferencia. */
interface FilaMoneda {
  moneda: Moneda;
  declarado: number;
  /** null = sin contar. Un 0 es un conteo: el sobre llegó vacío. */
  contado: number | null;
  /** null mientras no se contó. */
  diferencia: number | null;
  categoria: CategoriaDiferenciaRetiro;
  decimales: number;
  /** digitsInfo del pipe number: decimales fijos de la moneda (-10,00 R$; 3.000.000 Gs). */
  formato: string;
  /** Opciones de la máscara del input, precalculadas (no se llaman funciones desde el HTML). */
  opts: any;
  /** Etiqueta y color de la diferencia, precalculados. */
  etiqueta: string;
  color: string;
  /** La grilla de esta moneda no pudo cargar sus denominaciones. */
  grillaNoCargo?: boolean;
}

/**
 * El conteo de un retiro dentro de la verificación: sus filas de la tabla (una por moneda), con lo
 * declarado, el contado editable, la diferencia y su motivo. El diálogo arma la tabla y apila un bloque
 * por retiro: este componente se dibuja con `display: contents`, así sus celdas caen en la grilla del
 * diálogo.
 *
 * El contado se tipea, se copia de lo declarado, o sale de la grilla de billetes. Vacío no es 0: una
 * moneda sin contar bloquea la confirmación.
 *
 * El conteo se guarda en un borrador local a cada cambio. Contar plata se interrumpe —entra
 * alguien, suena el teléfono, se cierra el diálogo— y volver a empezar de cero es la forma más
 * rápida de que nadie cuente en serio.
 */
/** Cuánto queda a la vista el aviso de borrador recuperado si nadie toca el conteo. */
export const AVISO_BORRADOR_MS = 15000;

@Component({
  selector: 'app-verificar-retiro-bloque',
  templateUrl: './verificar-retiro-bloque.component.html',
  styleUrls: ['./verificar-retiro-bloque.component.scss'],
})
export class VerificarRetiroBloqueComponent implements OnInit, OnDestroy {

  @Input() retiro: Retiro;
  /** Con varios retiros la tabla lleva la columna Retiro. */
  @Input() conEncabezado = false;

  filas: FilaMoneda[] = [];
  observacion = '';
  verObservacion = false;
  hayDiferencia = false;
  huboBorrador = false;

  /** Moneda cuya grilla está abierta. Una sola a la vez: la grilla necesita ancho. */
  monedaAbierta: Moneda = null;

  /** Billetes contados por moneda y valor: { monedaId: { valorBillete: cantidad } }. */
  cantidades: { [monedaId: string]: { [valor: string]: number } } = {};
  /** Monto tipeado o tomado de lo declarado, por moneda. Si la moneda tiene billetes, mandan los billetes. */
  montos: { [monedaId: string]: number } = {};

  categorias = Object.keys(CATEGORIA_LABEL).map(k => ({ value: k, label: CATEGORIA_LABEL[k] }));

  private timerAviso: any;

  constructor(private service: RetiroVerificacionService) {}

  ngOnInit(): void {
    const borrador = this.service.leerBorrador(this.retiro.id, this.retiro.sucursalId);
    if (borrador) {
      this.cantidades = borrador.cantidades || {};
      this.montos = borrador.montos || {};
      this.observacion = borrador.observacion || '';
      this.verObservacion = !!this.observacion;
      this.huboBorrador = this.service.hayBorrador(this.retiro.id, this.retiro.sucursalId);
      // El aviso es para el que vuelve a abrir: no hace falta que quede ocupando una fila de la tabla.
      if (this.huboBorrador) this.timerAviso = setTimeout(() => this.ocultarAviso(), AVISO_BORRADOR_MS);
    }
    this.armarFilas();
  }

  ngOnDestroy(): void {
    clearTimeout(this.timerAviso);
  }

  /** El aviso de borrador recuperado se va solo o apenas se toca un contado de este retiro. */
  ocultarAviso() {
    if (!this.huboBorrador) return;
    this.huboBorrador = false;
    clearTimeout(this.timerAviso);
  }

  /** Lo declarado sale del retiro_detalle, agrupado por moneda. Es inmutable. */
  private armarFilas() {
    const porMoneda = new Map<number, FilaMoneda>();
    const detalles: RetiroDetalle[] = this.retiro?.retiroDetalleList || [];
    for (const d of detalles) {
      if (!d?.moneda?.id) continue;
      const dec = d.moneda.decimales != null
        ? d.moneda.decimales
        : ((d.moneda.denominacion || '').toUpperCase().includes('GUARAN') ? 0 : 2);
      const fila = porMoneda.get(d.moneda.id) || {
        moneda: d.moneda, declarado: 0, contado: null, diferencia: null, categoria: null,
        decimales: dec, formato: `1.${dec}-${dec}`, opts: opcionesMonto(dec), etiqueta: '', color: '',
      };
      fila.declarado += d.cantidad || 0;
      porMoneda.set(d.moneda.id, fila);
    }
    this.filas = Array.from(porMoneda.values());
    // Del borrador: si hay billetes mandan los billetes, si no el monto, y si no queda sin contar.
    this.filas.forEach(f => f.contado = this.contadoGuardado(f.moneda.id));
    this.recalcular();
  }

  private contadoGuardado(monedaId: number): number | null {
    if (this.hayBilletes(monedaId)) return this.totalDe(monedaId);
    const m = this.montos[String(monedaId)];
    return m != null ? m : null;
  }

  private hayBilletes(monedaId: number): boolean {
    return Object.values(this.cantidades[String(monedaId)] || {}).some(c => c > 0);
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

  /**
   * Cambio en la grilla de billetes. Solo esta salida escribe el contado: `totalChange` también se emite
   * al abrir la grilla, y pisaría un monto tipeado con el total de una grilla vacía.
   */
  onCantidadesChange(fila: FilaMoneda, cantidades: { [valor: string]: number }) {
    this.ocultarAviso();
    const id = String(fila.moneda.id);
    this.cantidades[id] = cantidades;
    delete this.montos[id];
    fila.contado = this.totalDe(fila.moneda.id);
    this.recalcular();
    this.guardarBorrador();
  }

  /**
   * Monto tipeado (null = campo vacío). Descarta los billetes de esa moneda, que ya no explican el monto,
   * y cierra su grilla: la grilla guarda sus filas y no se entera de que se vaciaron.
   */
  onContadoChange(fila: FilaMoneda, valor: number | null) {
    this.ocultarAviso();
    const id = String(fila.moneda.id);
    fila.contado = valor != null && !isNaN(valor) ? valor : null;
    delete this.cantidades[id];
    if (fila.contado != null) this.montos[id] = fila.contado;
    else delete this.montos[id];
    if (this.monedaAbierta?.id === fila.moneda.id) this.monedaAbierta = null;
    this.recalcular();
    this.guardarBorrador();
  }

  /** Copia lo declarado sin contar por billetes. */
  usarDeclarado(fila: FilaMoneda) {
    this.onContadoChange(fila, fila.declarado);
  }

  private recalcular() {
    this.hayDiferencia = false;
    for (const f of this.filas) {
      if (f.contado == null) {
        f.diferencia = null;
        f.categoria = null;
        f.etiqueta = 'Sin contar';
        f.color = 'var(--frc-texto-tenue)';
        continue;
      }
      f.diferencia = redondear(f.contado, f.decimales) - redondear(f.declarado, f.decimales);
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
      montos: this.montos,
      observacion: this.observacion,
      actualizadoEn: new Date().toISOString(),
    };
    this.service.guardarBorrador(this.retiro.id, this.retiro.sucursalId, borrador);
  }

  onObservacionChange() {
    this.guardarBorrador();
  }

  /** Motivo por el que este retiro no se puede confirmar todavía, o null. */
  motivoParaNoConfirmar(): string | null {
    // Sin lo declarado no hay contra qué contar: confirmar mandaría conteos vacíos.
    if (!this.filas.length) {
      return `No se pudo leer lo declarado del retiro #${this.retiro.id}: cerrá y volvé a abrirlo.`;
    }
    const sinContar = this.filas.find(f => f.contado == null);
    if (sinContar != null) {
      return `Falta contar el retiro #${this.retiro.id} (${sinContar.moneda?.denominacion || 'una moneda'}).`;
    }
    return null;
  }

  /** Lo que se manda al central: redondeado a los decimales de cada moneda (allá se compara exacto). */
  conteos(): ConteoRetiroMonedaInput[] {
    return this.filas.map(f => {
      // Nunca un 0 por omisión: el diálogo frena antes con motivoParaNoConfirmar.
      if (f.contado == null) throw new Error(`El retiro #${this.retiro.id} tiene una moneda sin contar.`);
      return {
        monedaId: f.moneda.id,
        contado: redondear(f.contado, f.decimales),
        categoria: f.categoria || null,
      };
    });
  }

  /**
   * true cuando no se contó ningún billete en la grilla: el retiro no se contó billete por billete
   * (aunque se haya tipeado el monto). Se marca a propósito, para poder saberlo si después aparece una
   * diferencia.
   */
  esRapida(): boolean {
    return !this.filas.some(f => this.hayBilletes(f.moneda.id));
  }

  /**
   * Las diferencias formateadas: el confirm no pasa por pipes y un "-100000" pelado se lee mal justo
   * cuando el operador tiene que decidir si está de acuerdo con la diferencia.
   */
  resumenDiferencias(): string {
    return this.filas
      .filter(f => f.diferencia != null && Math.abs(f.diferencia) > 0.005)
      .map(f => {
        const monto = f.diferencia.toLocaleString('es-PY', { minimumFractionDigits: f.decimales, maximumFractionDigits: f.decimales });
        return `${f.moneda.denominacion}: ${f.diferencia > 0 ? '+' : ''}${monto} ${f.moneda.simbolo}`;
      })
      .join(' · ');
  }
}

function redondear(valor: number, decimales: number): number {
  const factor = Math.pow(10, decimales);
  return Math.round((valor || 0) * factor) / factor;
}

/**
 * Máscara del contado. No se usan los presets compartidos: traen `nullable: false` (borrar dejaría 0 en vez
 * de «sin contar»), aceptan negativos, y el de moneda extranjera es FINANCIAL («100» se leería 1,00).
 */
function opcionesMonto(decimales: number) {
  return {
    align: 'right', allowNegative: false, allowZero: true, decimal: decimales > 0 ? ',' : '',
    precision: decimales, prefix: '', suffix: '', thousands: '.', nullable: true, min: 0, max: null,
    inputMode: CurrencyMaskInputMode.NATURAL,
  };
}
