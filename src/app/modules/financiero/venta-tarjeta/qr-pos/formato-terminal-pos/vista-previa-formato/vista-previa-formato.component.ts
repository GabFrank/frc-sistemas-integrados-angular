import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MapaFormatoService } from '../mapa-formato.service';
import { MuestraGuardada, RegionFormato } from '../mapa-formato.model';

/** Un campo dibujado sobre el ticket, ya en porcentaje del alto y del ancho. */
export interface CampoDibujado {
  campo: string;
  etiqueta: string;
  valor: string;
  tipo: string;
  /** Todo en %, para que el mismo dato sirva sobre la foto y sobre el sintético. */
  izq: number;
  arriba: number;
  ancho: number;
  alto: number;
  /** La región no tiene caja: el campo se resuelve por patrón, sin restricción espacial. */
  sinCaja: boolean;
}

/**
 * Lo que el PDV va a leer de un cupón de este formato, al lado del cupón que lo produjo.
 *
 * <b>Por qué la foto real y el sintético juntos.</b> El mapa es difícil de evaluar en abstracto: una
 * lista de campos con coordenadas no dice si la región quedó sobre el importe o sobre el renglón de
 * al lado. Puestos uno al lado del otro, un mapa torcido se ve torcido.
 *
 * El sintético no es un dibujo libre: <b>cada campo se ubica en SU región mapeada</b>, con las
 * mismas coordenadas normalizadas que el filial usa para acotar el OCR. Es el mapa, renderizado.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-vista-previa-formato',
  templateUrl: './vista-previa-formato.component.html',
  styleUrls: ['./vista-previa-formato.component.scss'],
})
export class VistaPreviaFormatoComponent implements OnChanges, OnDestroy {

  /** Proporción de un cupón térmico, para cuando todavía no hay ninguna foto que la dé. */
  private static readonly PROPORCION_TERMICO = 1.9;

  @Input() formatoId: number;
  @Input() patron: string;
  @Input() mapeo: string;
  @Input() ejemplo: string;

  muestras: MuestraGuardada[] = [];
  seleccionada: MuestraGuardada = null;
  /**
   * La foto como `SafeUrl`.
   *
   * Angular sanea el `[src]` de un `img` y marca las `blob:` como `unsafe:`, asi que la imagen no
   * carga --queda en 0x0, sin error--. Se marca confiable a mano: la URL la creamos nosotros con
   * `URL.createObjectURL` sobre un blob que bajamos del propio servidor, no viene de ningun lado
   * que haya que desconfiar.
   */
  urlFoto: SafeUrl = null;
  cargandoFoto = false;
  errorFoto: string = null;

  regiones: RegionFormato[] = [];
  campos: CampoDibujado[] = [];
  sinCaja = 0;

  /** alto / ancho del ticket dibujado. Sale de la foto elegida; si no hay, del térmico típico. */
  proporcion = VistaPreviaFormatoComponent.PROPORCION_TERMICO;

  /** Las object URL creadas, para revocarlas: si no, cada foto mirada queda en memoria. */
  private urlsCreadas: string[] = [];

  constructor(private service: MapaFormatoService, private sanitizer: DomSanitizer) {}

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios.formatoId && this.formatoId) {
      this.cargarMuestras();
      this.cargarRegiones();
    }
    // El patrón y el mapeo se editan en otras solapas y esta tiene que reflejarlo al volver.
    if (cambios.patron || cambios.mapeo || cambios.ejemplo || cambios.formatoId) {
      this.recalcular();
    }
  }

  ngOnDestroy(): void {
    this.urlsCreadas.forEach((u) => URL.revokeObjectURL(u));
    this.urlsCreadas = [];
  }

  /**
   * Vuelve a pedir las fotos y el mapa.
   *
   * <p>Lo llama el diálogo al entrar a esta solapa. Hace falta porque el componente se construye
   * una vez y sus `@Input` no cambian: sin esto, una foto sacada en la solapa del mapa no aparece
   * acá hasta cerrar y volver a abrir el formato — que es exactamente el viaje que esta solapa
   * vino a evitar.
   */
  recargar(): void {
    if (!this.formatoId) return;
    this.cargarMuestras();
    this.cargarRegiones();
  }

  onElegir(m: MuestraGuardada): void {
    if (!m || m.id === this.seleccionada?.id) return;
    this.seleccionada = m;
    this.ajustarProporcion();
    this.cargarFoto(m);
  }

  private cargarMuestras(): void {
    this.service.onGetMuestras(this.formatoId).pipe(untilDestroyed(this)).subscribe({
      next: (ms) => {
        this.muestras = ms ?? [];
        // Se suelta la eleccion anterior a proposito: `onElegir` corta cuando le pasan la misma
        // muestra, asi que sin esto una recarga conserva lo que hubiera --incluido un error de
        // hace un rato-- y la foto no se vuelve a pedir nunca.
        this.seleccionada = null;
        this.urlFoto = null;
        this.errorFoto = null;
        if (this.muestras.length) this.onElegir(this.muestras[0]);
      },
      error: () => (this.muestras = []),
    });
  }

  private cargarRegiones(): void {
    this.service.onGetRegiones(this.formatoId).pipe(untilDestroyed(this)).subscribe({
      next: (rs) => {
        this.regiones = rs ?? [];
        this.recalcular();
      },
      error: () => (this.regiones = []),
    });
  }

  private cargarFoto(m: MuestraGuardada): void {
    this.cargandoFoto = true;
    this.errorFoto = null;
    this.service.onGetImagenMuestra(m.id).pipe(untilDestroyed(this)).subscribe({
      next: (blob) => {
        this.cargandoFoto = false;
        const url = URL.createObjectURL(blob);
        this.urlsCreadas.push(url);
        this.urlFoto = this.sanitizer.bypassSecurityTrustUrl(url);
      },
      error: () => {
        this.cargandoFoto = false;
        this.urlFoto = null;
        // El archivo se puede haber purgado aunque la fila siga: la purga borra los dos, pero un
        // backup restaurado de la base sin las imágenes deja exactamente este caso.
        this.errorFoto = 'La foto ya no está en el disco del servidor.';
      },
    });
  }

  private ajustarProporcion(): void {
    const m = this.seleccionada;
    if (m?.ancho && m?.alto) this.proporcion = m.alto / m.ancho;
  }

  /**
   * Cruza el patrón con la cadena de ejemplo y ubica cada valor en su región.
   *
   * Es el mismo cruce que hace la derivación en el servidor —grupo del patrón → campo del mapeo—
   * pero acá no se inventa nada: si el patrón no matchea el ejemplo, no hay nada que mostrar.
   */
  private recalcular(): void {
    this.campos = [];
    this.sinCaja = 0;
    if (!this.patron || !this.ejemplo) return;

    let grupos: { [k: string]: string } = {};
    try {
      const m = new RegExp(this.patron).exec(this.ejemplo);
      grupos = (m as any)?.groups ?? {};
    } catch {
      return;                                   // patrón inválido: lo dice la solapa del patrón
    }

    const porCampo = this.camposDelMapeo();
    for (const r of this.regiones) {
      const grupo = porCampo[r.campo];
      const valor = grupo ? grupos[grupo] : undefined;
      const tieneCaja = r.x1 != null && r.y1 != null && r.x2 != null && r.y2 != null;
      if (!tieneCaja) this.sinCaja++;
      this.campos.push({
        campo: r.campo,
        etiqueta: r.etiqueta || null,
        valor: valor ?? '—',
        tipo: r.tipo || null,
        izq: tieneCaja ? r.x1 * 100 : 0,
        arriba: tieneCaja ? r.y1 * 100 : 0,
        ancho: tieneCaja ? (r.x2 - r.x1) * 100 : 0,
        alto: tieneCaja ? (r.y2 - r.y1) * 100 : 0,
        sinCaja: !tieneCaja,
      });
    }
  }

  /** campo del mapeo → grupo del patrón. Mismo parseo que el backend, sin inventar. */
  private camposDelMapeo(): { [campo: string]: string } {
    const out: { [campo: string]: string } = {};
    if (!this.mapeo) return out;
    try {
      const o = JSON.parse(this.mapeo);
      for (const campo of Object.keys(o || {})) {
        const de = o[campo]?.de;
        if (typeof de === 'string') out[campo] = de;
      }
    } catch {
      // Mapeo a medio escribir. La solapa del mapeo ya lo marca; acá no se rompe nada.
    }
    return out;
  }
}
