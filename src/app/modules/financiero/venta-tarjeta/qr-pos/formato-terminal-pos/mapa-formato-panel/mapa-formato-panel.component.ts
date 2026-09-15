import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from '../../../../../../notificacion-snackbar.service';
import { mensajeDeError } from '../../mensaje-error';
import { FormatoTerminalPos } from '../formato-terminal-pos.model';
import { MapaFormatoService } from '../mapa-formato.service';
import {
  CapturaMuestraQr,
  RegionDerivada,
  RegionFormato,
  ResultadoDerivacion,
} from '../mapa-formato.model';

/**
 * Deriva el mapa de un formato a partir de un cupón de muestra.
 *
 * <b>Reemplaza al editor drag-and-drop, y no por ser más barato.</b> El OCR ya devuelve la
 * geometría de cada línea y el `patrón` ya dice qué es cada valor: cruzando las dos cosas la región
 * sale **por construcción**. Determinístico y auditable —si el patrón matcheó, la región es
 * correcta— sin API key, sin costo por llamada, sin alucinación, y sin que nadie arrastre un
 * rectángulo.
 *
 * El ciclo entero corre contra central: la captura, el OCR y la persistencia. No pasa por ningún
 * filial —y no podría, porque la venta con tarjeta se bloquea cuando la terminal no tiene formato,
 * así que antes de configurarlo no hay capturas de ese ticket.
 *
 * <b>Es un panel, no un diálogo.</b> Vive dentro del ABM del formato, en su propia solapa: el mapa
 * es una propiedad del formato como el patrón o el mapeo, y tenerlo en otra ventana obligaba a
 * cerrar una para abrir la otra cuando lo que se está haciendo es lo mismo.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-mapa-formato-panel',
  templateUrl: './mapa-formato-panel.component.html',
  styleUrls: ['./mapa-formato-panel.component.scss'],
})
export class MapaFormatoPanelComponent implements OnInit, OnDestroy {

  /** El formato ya guardado. Sin id no hay dónde colgar las regiones. */
  @Input() formato: FormatoTerminalPos;

  /** Avisa que el mapa se guardó, para que quien lo contenga refresque lo que muestre. */
  @Output() guardado = new EventEmitter<void>();

  /** Cada cuánto se le pregunta a central si ya llegó la foto. */
  private static readonly MS_SONDEO = 2500;

  /** El mapa que el formato ya tiene. Vacío = se guarda sin preguntar. */
  regionesActuales: RegionFormato[] = [];
  tieneMapa = false;
  cuantasManuales = 0;

  lectorDisponible = true;
  cargando = false;
  error: string = null;

  qr: CapturaMuestraQr = null;
  urlQr: string = null;
  esperandoFoto = false;
  textoOcr: string = null;
  msOcr: number = null;

  propuesta: RegionDerivada[] = null;
  derivadas = 0;
  sinRegion = 0;

  guardando = false;
  /** El diff que devolvió el backend cuando se negó a pisar. */
  cambiosPendientes: string[] = null;
  conservadasManuales: string[] = [];

  private sondeo: Subscription = null;

  constructor(
    private service: MapaFormatoService,
    private notificacionSnackbar: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.service.onLectorDisponible().pipe(untilDestroyed(this)).subscribe({
      next: (d) => (this.lectorDisponible = d !== false),
      // Que no se pueda consultar no bloquea: el intento real va a dar el motivo exacto.
      error: () => (this.lectorDisponible = true),
    });

    this.cargarRegiones();
  }

  ngOnDestroy(): void {
    this.detenerSondeo();
    // Libera la muestra en central antes de que venza sola. No es crítico --vence en 20 min-- pero
    // no cuesta nada y evita dejar memoria ocupada del lado del servidor.
    if (this.qr?.token) {
      this.service.onCerrarMuestra(this.qr.token).subscribe({ error: () => {} });
    }
  }

  private cargarRegiones(): void {
    this.service.onGetRegiones(this.formato.id).pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        this.regionesActuales = res ?? [];
        this.tieneMapa = this.regionesActuales.length > 0;
        this.cuantasManuales = this.regionesActuales.filter((r) => r.origen === 'MANUAL').length;
      },
      error: () => {},
    });
  }

  /** Abre la muestra y muestra el QR. */
  onSacarFoto(): void {
    this.cargando = true;
    this.error = null;
    this.propuesta = null;
    this.textoOcr = null;

    this.service.onCrearMuestra(this.formato.id).pipe(untilDestroyed(this)).subscribe({
      next: (qr) => {
        this.cargando = false;
        this.qr = qr;
        // Si el servidor no declaró su dirección pública, se compone con la misma con la que este
        // desktop habla con central: el teléfono debería llegar al mismo host.
        this.urlQr = qr?.url || this.service.urlCentral(qr?.ruta ?? '');
        this.esperandoFoto = true;
        this.sondear(qr.token);
      },
      error: (err) => {
        this.cargando = false;
        this.error = mensajeDeError(err, 'No se pudo abrir la captura de muestra.');
      },
    });
  }

  /**
   * Sube una foto desde el disco.
   *
   * Es el camino que no depende de que el teléfono alcance a central: va por la misma conexión que
   * este navegador ya tiene. En alpha, que vive sin IP pública, puede ser el único que funcione.
   */
  onArchivo(evento: any): void {
    const archivo: File = evento?.target?.files?.[0];
    if (!archivo) return;

    // Si habia un QR esperando, su sondeo se corta ACA. Si no, el token viejo puede resolver
    // despues y pisar el texto que el operador esta revisando con el de la otra foto -- y
    // derivaria sobre una y mostraria la otra.
    this.detenerSondeo();
    this.esperandoFoto = false;
    if (this.qr?.token) {
      this.service.onCerrarMuestra(this.qr.token).subscribe({ error: () => {} });
    }

    this.cargando = true;
    this.error = null;

    // Hace falta un token igual: es lo que identifica la muestra del lado de central.
    this.service.onCrearMuestra(this.formato.id).pipe(
      untilDestroyed(this),
      switchMap((qr) => {
        this.qr = qr;
        return this.service.onSubirFoto(qr.ruta, archivo);
      })
    ).subscribe({
      next: () => {
        this.cargando = false;
        this.consultar(this.qr.token);
      },
      error: (err) => {
        this.cargando = false;
        this.error = mensajeDeError(err, 'No se pudo subir la foto.');
      },
    });
    // El input se limpia para que elegir el MISMO archivo otra vez vuelva a disparar el evento.
    evento.target.value = '';
  }

  private sondear(token: string): void {
    this.detenerSondeo();
    this.sondeo = timer(MapaFormatoPanelComponent.MS_SONDEO, MapaFormatoPanelComponent.MS_SONDEO)
      .pipe(switchMap(() => this.service.onEstadoMuestra(token)), untilDestroyed(this))
      .subscribe({
        next: (m) => {
          if (!m) return;
          if (m.estado === 'ERROR') {
            // No se corta la espera: el token de muestra NO se consume, así que se saca otra foto
            // desde el mismo teléfono.
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
            this.textoOcr = m.textoOcr;
            this.msOcr = m.msOcr;
          }
        },
        error: () => {},
      });
  }

  /** Una sola consulta, para el camino de la subida por archivo. */
  private consultar(token: string): void {
    this.service.onEstadoMuestra(token).pipe(untilDestroyed(this)).subscribe({
      next: (m) => {
        if (!m) return;
        if (m.estado === 'ERROR') {
          this.error = m.error || 'No se pudo leer la foto. Probá con otra.';
          return;
        }
        this.textoOcr = m.textoOcr;
        this.msOcr = m.msOcr;
      },
      error: () => {},
    });
  }

  private detenerSondeo(): void {
    if (this.sondeo) {
      this.sondeo.unsubscribe();
      this.sondeo = null;
    }
  }

  /** Propone el mapa. No guarda nada todavía. */
  onProponer(): void {
    if (!this.qr?.token) return;
    this.cargando = true;
    this.error = null;

    this.service.onDerivar(this.qr.token, this.formato.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.cargando = false;
          this.propuesta = res ?? [];
          this.derivadas = this.propuesta.filter((r) => !r.sinRegion).length;
          this.sinRegion = this.propuesta.length - this.derivadas;
        },
        error: (err) => {
          this.cargando = false;
          this.error = mensajeDeError(err, 'No se pudo derivar el mapa.');
        },
      });
  }

  /**
   * @param confirmar el formato ya tiene mapa y el operador leyó el diff
   * @param desdeCero descarta lo acumulado. Por defecto la derivación **suma**: una segunda foto
   *   ensancha la caja para cubrir también su posición, porque un mismo modelo imprime más de un
   *   layout (en INFONET el ticket con QR tiene dos renglones menos y el monto queda más arriba).
   */
  onGuardar(confirmar = false, desdeCero = false): void {
    if (!this.propuesta?.length || this.guardando) return;
    this.guardando = true;
    this.error = null;

    this.service.onGuardarDerivadas(this.formato.id, this.propuesta, confirmar, desdeCero)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (r: ResultadoDerivacion) => {
          this.guardando = false;
          if (r?.aplicado === false) {
            // No es un error: es una pregunta. El backend se niega a pisar un mapa existente sin
            // confirmación explícita, y devuelve el diff para que se pueda leer antes de decidir.
            this.cambiosPendientes = r.cambios ?? [];
            this.conservadasManuales = r.conservadasManuales ?? [];
            return;
          }
          this.notificacionSnackbar.notification$.next({
            color: NotificacionColor.success,
            texto: `Mapa guardado: ${r?.creadas ?? 0} nuevas, ${r?.actualizadas ?? 0} actualizadas`
              + (r?.eliminadas ? `, ${r.eliminadas} eliminadas` : '')
              + (r?.conservadasManuales?.length
                  ? `. Se conservaron ${r.conservadasManuales.length} corregidas a mano.` : '.'),
            duracion: 7,
          });
          this.propuesta = null;
          this.cambiosPendientes = null;
          this.textoOcr = null;
          this.cargarRegiones();
          this.guardado.emit();
        },
        error: (err) => {
          this.guardando = false;
          this.error = mensajeDeError(err, 'No se pudo guardar el mapa.');
        },
      });
  }

  onCancelarSobrescritura(): void {
    this.cambiosPendientes = null;
  }
}
