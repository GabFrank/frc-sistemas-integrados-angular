import { Component, Input, OnInit } from '@angular/core';
import { Retiro } from '../../retiro.model';
import { RetiroDetalle } from '../../retiro-detalle.model';
import { Moneda } from '../../../moneda/moneda.model';
import { RetiroVerificacionService } from '../retiro-verificacion.service';
import {
  BorradorVerificacion, CATEGORIA_LABEL, CategoriaDiferenciaRetiro, ConteoRetiroMonedaInput,
} from '../retiro-verificacion.model';

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
  /** La grilla de esta moneda no pudo cargar sus denominaciones: su 0 no es un conteo (#390). */
  grillaNoCargo?: boolean;
}

/**
 * El conteo de un retiro dentro de la verificación: lo declarado por moneda, la grilla de billetes,
 * la diferencia y su motivo. El diálogo apila uno por retiro y los confirma juntos.
 *
 * El conteo se guarda en un borrador local a cada cambio. Contar plata se interrumpe —entra
 * alguien, suena el teléfono, se cierra el diálogo— y volver a empezar de cero es la forma más
 * rápida de que nadie cuente en serio.
 */
@Component({
  selector: 'app-verificar-retiro-bloque',
  templateUrl: './verificar-retiro-bloque.component.html',
  styleUrls: ['./verificar-retiro-bloque.component.scss'],
})
export class VerificarRetiroBloqueComponent implements OnInit {

  @Input() retiro: Retiro;
  /** Con varios retiros apilados cada bloque lleva su encabezado. */
  @Input() conEncabezado = false;

  filas: FilaMoneda[] = [];
  observacion = '';
  hayDiferencia = false;
  huboBorrador = false;

  /** Moneda cuya grilla está abierta. Una sola a la vez: la grilla necesita ancho. */
  monedaAbierta: Moneda = null;

  /** Cantidades por moneda y valor de billete, para la grilla y para el borrador. */
  cantidades: { [monedaId: string]: { [valor: string]: number } } = {};

  categorias = Object.keys(CATEGORIA_LABEL).map(k => ({ value: k, label: CATEGORIA_LABEL[k] }));

  constructor(private service: RetiroVerificacionService) {}

  ngOnInit(): void {
    const borrador = this.service.leerBorrador(this.retiro.id, this.retiro.sucursalId);
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
    const detalles: RetiroDetalle[] = this.retiro?.retiroDetalleList || [];
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
    this.service.guardarBorrador(this.retiro.id, this.retiro.sucursalId, borrador);
  }

  onObservacionChange() {
    this.guardarBorrador();
  }

  /** Motivo por el que este retiro no se puede confirmar todavía, o null. */
  motivoParaNoConfirmar(): string | null {
    // Sin lo declarado no hay contra qué contar: confirmar mandaría conteos vacíos, que el central
    // tomaría como faltante de todo el retiro.
    if (!this.filas.length) {
      return `No se pudo leer lo declarado del retiro #${this.retiro.id}: cerrá y volvé a abrirlo.`;
    }
    // Una moneda cuya grilla no cargó y que quedó en 0 no fue contada: acreditar ese 0 abriría un caso por
    // todo lo declarado. «Usar declarado» sigue valiendo, porque ahí el contado deja de ser 0.
    const sinContar = this.filas.find(f => f.grillaNoCargo && !(f.contado > 0) && f.declarado > 0);
    if (sinContar != null) {
      return `No se pudieron cargar las denominaciones de ${sinContar.moneda?.denominacion || 'una moneda'} `
        + `del retiro #${this.retiro.id}: reintentá la carga o usá lo declarado antes de confirmar.`;
    }
    return null;
  }

  conteos(): ConteoRetiroMonedaInput[] {
    return this.filas.map(f => ({
      monedaId: f.moneda.id,
      contado: f.contado || 0,
      categoria: f.categoria || null,
    }));
  }

  /**
   * true cuando no se contó ninguna denominación: el operador aceptó lo declarado. Se marca a
   * propósito — si más adelante aparece una diferencia, hay que poder saber que ese retiro nunca
   * se contó billete por billete.
   */
  esRapida(): boolean {
    return Object.keys(this.cantidades).every(k => Object.keys(this.cantidades[k] || {}).length === 0);
  }

  /**
   * Las diferencias formateadas: el confirm no pasa por pipes y un "-100000" pelado se lee mal justo
   * cuando el operador tiene que decidir si está de acuerdo con la diferencia.
   */
  resumenDiferencias(): string {
    return this.filas
      .filter(f => Math.abs(f.diferencia) > 0.005)
      .map(f => {
        const dec = f.formato.endsWith('-0') ? 0 : 2;
        const monto = f.diferencia.toLocaleString('es-PY', { maximumFractionDigits: dec });
        return `${f.moneda.denominacion}: ${f.diferencia > 0 ? '+' : ''}${monto} ${f.moneda.simbolo}`;
      })
      .join(' · ');
  }
}
