import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { DialogosService } from '../../../../../../shared/components/dialogos/dialogos.service';
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from '../../../../../../notificacion-snackbar.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { mensajeDeError } from '../../mensaje-error';
import { MapaFormatoService } from '../mapa-formato.service';
import { MuestraGuardada, RegionFormato } from '../mapa-formato.model';

function acotar(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Tres decimales: es la precisión con la que se guardan las coordenadas normalizadas. */
function redondear(v: number): number {
  return Math.round(v * 1000) / 1000;
}

/** Un campo dibujado sobre el ticket, ya en porcentaje del alto y del ancho. */
export interface CampoDibujado {
  /** id de la región guardada. Null = el campo todavía no tiene región. */
  id: number;
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
  /** La corrigió una persona. La derivación no la pisa nunca. */
  manual: boolean;
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

  /** id de muestra -> su miniatura. Es la misma imagen: el navegador la sirve de su cache. */
  miniaturas: { [id: number]: SafeUrl } = {};

  /** id de la muestra que se esta borrando, para no disparar dos veces. */
  eliminando: number = null;

  // ---- Edición del mapa a mano ----------------------------------------------------------

  /**
   * Modo edición.
   *
   * <p>Lo que se guarda desde acá queda con {@code origen = MANUAL}, y <b>la derivación no pisa
   * una MANUAL nunca</b>, ni con la confirmación. Por eso corregir a mano tiene sentido: no se lo
   * lleva puesto la próxima foto.
   */
  editando = false;

  /**
   * Cuanto se agranda el cupon en edicion.
   *
   * <p>La caja queda de visor y el contenido crece adentro, con scroll: agrandar el ancho no
   * alcanza porque la foto de un ticket sacada con el telefono es mucho mas alta que ancha --el
   * papel ocupa un tercio del cuadro y el resto es la mesa-- asi que al ancho lo limita el alto
   * disponible, no el del dialogo.
   *
   * <p>Las regiones van en % del lienzo, asi que crecen con el: el zoom no cambia lo que se guarda.
   */
  zoom = 1;

  private static readonly ZOOMS = [1, 1.5, 2, 3, 4];

  /** El campo que se está arrastrando, y desde dónde. */
  private arrastre: {
    campo: CampoDibujado;
    modo: 'mover' | 'redimensionar';
    xIni: number;
    yIni: number;
    izq: number;
    arriba: number;
    ancho: number;
    alto: number;
  } = null;

  guardandoRegion = false;

  /** Campos del mapeo que todavía no tienen región: se les puede dibujar una. */
  camposSinRegion: string[] = [];
  cargandoFoto = false;
  errorFoto: string = null;

  /**
   * La foto elegida no es de este formato: su texto no lo reconoce el patron.
   *
   * <p>Sin esto, elegir un cupon de OTRO modelo de aparato dibuja las regiones de este formato
   * sobre una foto que no tiene nada que ver, y parece que el mapa quedo torcido. No lo esta: es
   * la foto la que no corresponde. Pasa apenas se prueban dos proveedores.
   */
  fotoDeOtroFormato = false;

  regiones: RegionFormato[] = [];
  campos: CampoDibujado[] = [];
  sinCaja = 0;

  /** alto / ancho del ticket dibujado. Sale de la foto elegida; si no hay, del térmico típico. */
  proporcion = VistaPreviaFormatoComponent.PROPORCION_TERMICO;

  /** Las object URL creadas, para revocarlas: si no, cada foto mirada queda en memoria. */
  private urlsCreadas: string[] = [];

  constructor(
    private service: MapaFormatoService,
    private sanitizer: DomSanitizer,
    private dialogosService: DialogosService,
    private notificacionSnackbar: NotificacionSnackbarService
  ) {}

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios.formatoId && this.formatoId) {
      this.cargarMuestras();
      this.cargarRegiones();
    }
    // El patrón y el mapeo se editan en otras solapas y esta tiene que reflejarlo al volver.
    if (cambios.patron || cambios.mapeo || cambios.ejemplo || cambios.formatoId) {
      this.recalcular();
      this.revisarSiEsDeEsteFormato();
    }
  }

  ngOnDestroy(): void {
    this.urlsCreadas.forEach((u) => URL.revokeObjectURL(u));
    this.urlsCreadas = [];
    this.miniaturas = {};
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

  /**
   * Borra una foto de muestra.
   *
   * <p>Se pregunta antes: la foto es la evidencia de con que cupon se configuro este formato, y no
   * se puede recuperar --el archivo se borra del disco--.
   */
  onEliminar(m: MuestraGuardada): void {
    if (!m?.id || this.eliminando) return;
    this.dialogosService
      .confirm(
        'Atención',
        '¿Borrar esta foto de cupón?',
        'Se borra la imagen del servidor y no se puede recuperar. El mapa que se derivó de ella no'
          + ' se toca: las regiones ya guardadas siguen como están.'
      )
      .pipe(untilDestroyed(this))
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.eliminando = m.id;
        this.service.onEliminarMuestra(m.id).pipe(untilDestroyed(this)).subscribe({
          next: () => {
            this.eliminando = null;
            delete this.miniaturas[m.id];
            this.cargarMuestras();
            this.notificacionSnackbar.openSucess('Foto borrada');
          },
          error: () => {
            this.eliminando = null;
            this.notificacionSnackbar.notification$.next({
              color: NotificacionColor.danger,
              texto: 'No se pudo borrar la foto.',
              duracion: 5,
            });
          },
        });
      });
  }

  onElegir(m: MuestraGuardada): void {
    if (!m || m.id === this.seleccionada?.id) return;
    this.seleccionada = m;
    this.ajustarProporcion();
    this.revisarSiEsDeEsteFormato();
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
        if (this.muestras.length) {
          this.onElegir(this.muestras[0]);
          this.cargarMiniaturas();
        }
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

  /**
   * Baja las miniaturas de la fila.
   *
   * <p>Es la imagen completa, no una versión reducida: el servidor no genera thumbnails y
   * fabricarlos costaría una segunda copia en disco. Con el ancho al que se muestran --56px-- y
   * una foto de cupón de ~200 KB, bajar unas pocas no se nota; si algún formato junta decenas,
   * el paso siguiente es generar la miniatura en el servidor, no cambiar esta pantalla.
   */
  private cargarMiniaturas(): void {
    for (const m of this.muestras) {
      if (this.miniaturas[m.id]) continue;
      this.service.onGetImagenMuestra(m.id).pipe(untilDestroyed(this)).subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          this.urlsCreadas.push(url);
          this.miniaturas[m.id] = this.sanitizer.bypassSecurityTrustUrl(url);
        },
        error: () => {},
      });
    }
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

  /**
   * Prueba el patron del formato contra el texto que el OCR leyo de ESTA foto.
   *
   * <p>Es el mismo chequeo que hace la derivacion antes de proponer nada, y aca sirve para lo
   * mismo: decir que la foto y el mapa no son del mismo mundo.
   */
  private revisarSiEsDeEsteFormato(): void {
    this.fotoDeOtroFormato = false;
    const texto = this.seleccionada?.textoOcr;
    if (!texto || !this.patron) return;
    try {
      this.fotoDeOtroFormato = !new RegExp(this.patron).test(texto);
    } catch {
      // Patron invalido: ya lo dice la solapa del patron, aca no se agrega ruido.
    }
  }

  onEditar(): void {
    this.editando = true;
    this.calcularCamposSinRegion();
  }

  onZoom(hacia: 1 | -1): void {
    const zs = VistaPreviaFormatoComponent.ZOOMS;
    const i = zs.indexOf(this.zoom);
    const siguiente = zs[Math.max(0, Math.min(zs.length - 1, (i < 0 ? 0 : i) + hacia))];
    this.zoom = siguiente;
  }

  onTerminarEdicion(): void {
    this.editando = false;
    this.arrastre = null;
    this.zoom = 1;
  }

  private calcularCamposSinRegion(): void {
    const conRegion = new Set(this.campos.map((c) => c.campo));
    this.camposSinRegion = Object.keys(this.camposDelMapeo()).filter((c) => !conRegion.has(c));
  }

  /**
   * Dibuja una región nueva para un campo que no la tenía.
   *
   * <p>Aparece en el medio del cupón a propósito: es el único lugar que no depende de dónde esté
   * el campo, y lo primero que se hace es arrastrarla al suyo.
   */
  onAgregarRegion(campo: string): void {
    this.campos.push({
      id: null,
      campo,
      etiqueta: null,
      valor: '—',
      // El tipo lo declara el mapeo, no el dibujo: una region a mano tiene que llevar el mismo que
      // llevaria una derivada, o el filial deja de validar ese campo sin que nadie lo haya decidido.
      tipo: this.tiposDelMapeo()[campo] ?? null,
      izq: 35,
      arriba: 45,
      ancho: 30,
      alto: 4,
      sinCaja: false,
      manual: true,
    });
    this.calcularCamposSinRegion();
  }

  /** Empieza a mover o a redimensionar. El lienzo da la escala: todo se guarda en %. */
  onArrastreIni(evento: PointerEvent, campo: CampoDibujado, modo: 'mover' | 'redimensionar'): void {
    if (!this.editando) return;
    evento.preventDefault();
    evento.stopPropagation();
    (evento.target as HTMLElement).setPointerCapture?.(evento.pointerId);
    this.arrastre = {
      campo, modo,
      xIni: evento.clientX, yIni: evento.clientY,
      izq: campo.izq, arriba: campo.arriba, ancho: campo.ancho, alto: campo.alto,
    };
  }

  onArrastreMueve(evento: PointerEvent, lienzo: HTMLElement): void {
    const a = this.arrastre;
    if (!a || !lienzo) return;
    const caja = lienzo.getBoundingClientRect();
    // En % del lienzo, que es como se guardan las coordenadas: normalizadas 0..1 contra la foto.
    const dx = ((evento.clientX - a.xIni) / caja.width) * 100;
    const dy = ((evento.clientY - a.yIni) / caja.height) * 100;

    if (a.modo === 'mover') {
      a.campo.izq = acotar(a.izq + dx, 0, 100 - a.campo.ancho);
      a.campo.arriba = acotar(a.arriba + dy, 0, 100 - a.campo.alto);
    } else {
      // Mínimo 1%: una caja de alto cero no acota nada y el backend la rechaza.
      a.campo.ancho = acotar(a.ancho + dx, 1, 100 - a.campo.izq);
      a.campo.alto = acotar(a.alto + dy, 1, 100 - a.campo.arriba);
    }
  }

  onArrastreFin(): void {
    this.arrastre = null;
  }

  /** Guarda una región tal como quedó dibujada. */
  onGuardarRegion(c: CampoDibujado): void {
    if (this.guardandoRegion) return;
    this.guardandoRegion = true;
    this.service
      .onGuardarRegion({
        id: c.id ?? undefined,
        formatoTerminalPosId: this.formatoId,
        campo: c.campo,
        etiqueta: c.etiqueta,
        posicion: c.etiqueta ? 'DENTRO' : null,
        // Del MAPEO y no de lo que tenga la región. El tipo es una declaración del formato --misma
        // regla que aplica `unirEn` en el servidor-- así que una región vieja sin tipo lo recupera
        // al guardarse, y una que quedó con un tipo que el mapeo ya no declara lo pierde.
        tipo: this.tiposDelMapeo()[c.campo] ?? null,
        x1: redondear(c.izq / 100),
        y1: redondear(c.arriba / 100),
        x2: redondear((c.izq + c.ancho) / 100),
        y2: redondear((c.arriba + c.alto) / 100),
      } as any)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (guardada) => {
          this.guardandoRegion = false;
          if (guardada?.id) c.id = guardada.id;
          c.tipo = guardada?.tipo ?? null;
          c.manual = true;
          this.notificacionSnackbar.openSucess(
            `Región de "${c.campo}" guardada a mano. La derivación ya no la va a pisar.`
          );
        },
        error: (err) => {
          this.guardandoRegion = false;
          this.notificacionSnackbar.notification$.next({
            color: NotificacionColor.danger,
            texto: mensajeDeError(err, 'No se pudo guardar la región.'),
            duracion: 8,
          });
        },
      });
  }

  /** Borra la región de un campo. El campo pasa a resolverse por patrón, sin restricción espacial. */
  onBorrarRegion(c: CampoDibujado): void {
    if (!c.id) {                                  // nunca se guardó: alcanza con sacarla de la vista
      this.campos = this.campos.filter((x) => x !== c);
      this.calcularCamposSinRegion();
      return;
    }
    this.dialogosService
      .confirm('Atención', `¿Borrar la región de "${c.campo}"?`,
        'El campo pasa a resolverse por patrón, sin restricción espacial. Se sigue leyendo.')
      .pipe(untilDestroyed(this))
      .subscribe((ok) => {
        if (!ok) return;
        this.service.onBorrarRegion(c.id).pipe(untilDestroyed(this)).subscribe({
          next: () => {
            this.campos = this.campos.filter((x) => x !== c);
            this.calcularCamposSinRegion();
            this.notificacionSnackbar.openSucess('Región borrada');
          },
          error: () => this.notificacionSnackbar.notification$.next({
            color: NotificacionColor.danger, texto: 'No se pudo borrar la región.', duracion: 5,
          }),
        });
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
        id: r.id ?? null,
        campo: r.campo,
        etiqueta: r.etiqueta || null,
        valor: valor ?? '—',
        tipo: r.tipo || null,
        izq: tieneCaja ? r.x1 * 100 : 0,
        arriba: tieneCaja ? r.y1 * 100 : 0,
        ancho: tieneCaja ? (r.x2 - r.x1) * 100 : 0,
        alto: tieneCaja ? (r.y2 - r.y1) * 100 : 0,
        sinCaja: !tieneCaja,
        manual: r.origen === 'MANUAL',
      });
    }
  }

  /** campo del mapeo → TEXTO | NUMERO | FECHA, si lo declara. */
  private tiposDelMapeo(): { [campo: string]: string } {
    const out: { [campo: string]: string } = {};
    if (!this.mapeo) return out;
    try {
      const o = JSON.parse(this.mapeo);
      for (const campo of Object.keys(o || {})) {
        const t = o[campo]?.tipo;
        if (typeof t === 'string') out[campo] = t.toUpperCase();
      }
    } catch {
      // Mapeo a medio escribir: la solapa del mapeo ya lo marca.
    }
    return out;
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
