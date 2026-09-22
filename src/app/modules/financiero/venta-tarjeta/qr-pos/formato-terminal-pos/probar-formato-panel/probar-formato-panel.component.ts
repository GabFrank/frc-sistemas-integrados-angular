import { Component, Input, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { mensajeDeError } from '../../mensaje-error';
import { FormatoTerminalPos } from '../formato-terminal-pos.model';
import { MapaFormatoService } from '../mapa-formato.service';
import { CapturaMuestraQr, ResultadoPruebaFormato } from '../mapa-formato.model';

/** Marca el corte por formulario incompleto, que ya se avisó por snackbar y no se repite. */
export const ERROR_FORMULARIO_INCOMPLETO = 'FORMULARIO_INCOMPLETO';

/**
 * Prueba el formato contra un cupón real, sin cobrarle a nadie.
 *
 * <b>Por qué existe.</b> Hasta acá la única forma de saber si un patrón aguantaba un cupón de
 * verdad era guardarlo y esperar: el siguiente cliente que pagaba con tarjeta era el ensayo, y un
 * patrón frágil costaba una venta interrumpida con el cliente delante. Cada formato nuevo se
 * estrenaba en producción.
 *
 * <b>Es el mismo gesto del PDV</b>, a propósito: se abre un QR, se escanea o se fotografía un
 * ticket de papel, y la pantalla dice pasa o no pasa. No es un banco de textos guardados —probar
 * contra un texto viejo es probar contra el pasado, y está medido que el OCR devuelve un texto
 * distinto en cada lectura del mismo papel.
 *
 * <b>Corre contra el formato guardado.</b> Es lo que las 24 filiales van a recibir; probar el
 * borrador diría algo que no es cierto de nada desplegado. Por eso «Probar» guarda primero si hay
 * cambios: el ciclo real es tocar el patrón y volver a probar, y exigir un Guardar manual en el
 * medio sólo consigue que alguien lo saltee.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-probar-formato-panel',
  templateUrl: './probar-formato-panel.component.html',
  styleUrls: ['./probar-formato-panel.component.scss'],
})
export class ProbarFormatoPanelComponent implements OnDestroy {

  /** MAQUINA se prueba con una foto; los demás, con la cadena que escupe el lector. */
  @Input() esMaquina = false;

  /**
   * Deja guardado lo que hay en el formulario y devuelve el formato persistido.
   *
   * Lo provee el ABM que contiene este panel. No se llama desde la plantilla: se invoca al apretar
   * «Probar», una vez.
   */
  @Input() asegurarGuardado: () => Observable<FormatoTerminalPos>;

  /** Cada cuánto se le pregunta a central si ya llegó la foto. Igual que el panel del mapa. */
  private static readonly MS_SONDEO = 2500;

  cargando = false;
  error: string = null;

  qr: CapturaMuestraQr = null;
  urlQr: string = null;
  /** El QR apunta a `localhost`, que desde el teléfono es el teléfono mismo. */
  qrInalcanzable = false;
  esperandoFoto = false;

  /** La cadena del lector, para los formatos que no son MAQUINA. */
  cadenaControl = new FormControl('');

  resultado: ResultadoPruebaFormato = null;
  verTexto = false;

  private sondeo: Subscription = null;

  constructor(
    private service: MapaFormatoService
  ) {}

  ngOnDestroy(): void {
    this.detenerSondeo();
    if (this.qr?.token) {
      this.service.onCerrarMuestra(this.qr.token).subscribe({ error: () => {} });
    }
  }

  /** El camino de los formatos MAQUINA: QR en pantalla, foto desde el teléfono. */
  onProbarConFoto(): void {
    if (this.ocupado()) return;
    this.preparar();
    this.guardarYSeguir((formato) => this.abrirCaptura(formato.id));
  }

  /** Una foto del disco, para cuando el teléfono no alcanza a central (alpha, sin IP pública). */
  onArchivo(evento: any): void {
    const archivo: File = evento?.target?.files?.[0];
    evento.target.value = '';
    if (!archivo || this.ocupado()) return;

    this.preparar();
    this.guardarYSeguir((formato) => {
      this.cargando = true;
      this.service.onCrearMuestra(formato.id).pipe(
        untilDestroyed(this),
        switchMap((qr) => {
          this.qr = qr;
          return this.service.onSubirFoto(qr.ruta, archivo);
        })
      ).subscribe({
        next: () => {
          this.cargando = false;
          this.probar(formato.id, { token: this.qr?.token });
        },
        error: (err) => {
          this.cargando = false;
          this.error = mensajeDeError(err, 'No se pudo subir la foto.');
        },
      });
    });
  }

  /** El camino de los formatos de lector: la cadena entra por el input. */
  onProbarCadena(): void {
    // ⚠️ La guarda importa ACÁ más que en los botones: el input se dispara con `keyup.enter` y el
    // lector manda su propio Enter --a veces más de uno-- así que sin esto salen dos pruebas en
    // paralelo escribiendo el mismo `resultado`, con dos diálogos de "Buscando…" encimados.
    if (this.ocupado()) return;
    const texto = (this.cadenaControl.value || '').trim();
    if (!texto) {
      this.error = 'Escaneá el cupón: el campo está vacío.';
      return;
    }
    this.preparar();
    this.guardarYSeguir((formato) => this.probar(formato.id, { texto }));
  }

  /** Hay algo en vuelo: una prueba corriendo o un QR esperando su foto. */
  private ocupado(): boolean {
    return this.cargando || this.esperandoFoto;
  }

  private preparar(): void {
    this.detenerSondeo();
    // La muestra anterior se cierra en central en vez de quedar ocupando memoria hasta vencer.
    // Pasa cada vez que se cambia de camino a mitad: QR esperando la foto y el operador decide
    // subir un archivo.
    if (this.qr?.token) {
      this.service.onCerrarMuestra(this.qr.token).subscribe({ error: () => {} });
      this.qr = null;
      this.urlQr = null;
    }
    this.esperandoFoto = false;
    this.error = null;
    this.resultado = null;
    this.verTexto = false;
  }

  /**
   * Guarda primero, prueba después.
   *
   * Si el formulario no está completo, `asegurarGuardado` ya avisó y llevó a la solapa del hueco:
   * acá no se agrega otro aviso encima.
   */
  private guardarYSeguir(seguir: (formato: FormatoTerminalPos) => void): void {
    const guardar = this.asegurarGuardado;
    if (!guardar) {
      this.error = 'No se puede guardar el formato desde esta pantalla.';
      return;
    }
    this.cargando = true;
    guardar().pipe(untilDestroyed(this)).subscribe({
      next: (formato) => {
        this.cargando = false;
        if (!formato?.id) {
          this.error = 'El formato no se guardó, así que no hay nada contra qué probar.';
          return;
        }
        seguir(formato);
      },
      error: (err) => {
        this.cargando = false;
        // El guardado incompleto ya avisó por snackbar y llevó a la solapa del hueco; ese caso
        // llega con un Error propio y no se repite acá. Cualquier otro --nombre repetido, red
        // caída-- sólo lo vería quien apretó Guardar a mano, y este camino se quedaba mudo.
        if (err?.message !== ERROR_FORMULARIO_INCOMPLETO) {
          this.error = mensajeDeError(err, 'No se pudo guardar el formato antes de probar.');
        }
      },
    });
  }

  private abrirCaptura(formatoId: number): void {
    this.cargando = true;
    this.service.onCrearMuestra(formatoId).pipe(untilDestroyed(this)).subscribe({
      next: (qr) => {
        this.cargando = false;
        this.qr = qr;
        this.urlQr = qr?.url || this.service.urlCentral(qr?.ruta ?? '');
        this.qrInalcanzable = !this.service.qrEsAlcanzable(this.urlQr);
        this.esperandoFoto = true;
        this.sondear(formatoId, qr.token);
      },
      error: (err) => {
        this.cargando = false;
        this.error = mensajeDeError(err, 'No se pudo abrir la captura.');
      },
    });
  }

  private sondear(formatoId: number, token: string): void {
    this.detenerSondeo();
    this.sondeo = timer(ProbarFormatoPanelComponent.MS_SONDEO, ProbarFormatoPanelComponent.MS_SONDEO)
      .pipe(switchMap(() => this.service.onEstadoMuestra(token)), untilDestroyed(this))
      .subscribe({
        next: (m) => {
          if (!m) return;
          if (m.estado === 'ERROR') {
            // No se corta la espera: el token NO se consume, así que se saca otra foto desde el
            // mismo teléfono sin volver a pedir un QR.
            this.error = m.error || 'No se pudo leer la foto. Sacá otra.';
            return;
          }
          if (m.estado === 'VENCIDA') {
            this.detenerSondeo();
            this.esperandoFoto = false;
            this.error = 'El código venció. Pedí uno nuevo.';
            return;
          }
          if (m.estado === 'LISTO') {
            this.detenerSondeo();
            this.esperandoFoto = false;
            this.error = null;
            this.probar(formatoId, { token });
          }
        },
        error: () => {},
      });
  }

  private probar(formatoId: number, origen: { token?: string; texto?: string }): void {
    this.cargando = true;
    this.service.onProbarFormato(formatoId, origen).pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        this.cargando = false;
        // `onCustomQuery` convierte el error de GraphQL en `next(null)` --ya mostró su snackbar--
        // así que sin esto la pantalla se quedaba sin resultado y sin explicación.
        if (!res) {
          this.error = 'El servidor no devolvió un resultado. Revisá el formato y probá de nuevo.';
          return;
        }
        this.resultado = res;
      },
      error: (err) => {
        this.cargando = false;
        this.error = mensajeDeError(err, 'No se pudo probar el formato.');
      },
    });
  }

  private detenerSondeo(): void {
    if (this.sondeo) {
      this.sondeo.unsubscribe();
      this.sondeo = null;
    }
  }
}
