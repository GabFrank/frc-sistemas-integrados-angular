import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
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

export interface DerivarMapaData {
  formato: FormatoTerminalPos;
}

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
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-derivar-mapa-dialog',
  templateUrl: './derivar-mapa-dialog.component.html',
  styleUrls: ['./derivar-mapa-dialog.component.scss'],
})
export class DerivarMapaDialogComponent implements OnInit, OnDestroy {

  /** Cada cuánto se le pregunta a central si ya llegó la foto. */
  private static readonly MS_SONDEO = 2500;

  titulo = '';
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
    @Inject(MAT_DIALOG_DATA) public data: DerivarMapaData,
    public dialogRef: MatDialogRef<DerivarMapaDialogComponent>,
    private service: MapaFormatoService,
    private notificacionSnackbar: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.titulo = this.data?.formato?.nombre ?? 'Formato';

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
    this.service.onGetRegiones(this.data.formato.id).pipe(untilDestroyed(this)).subscribe({
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

    this.service.onCrearMuestra(this.data.formato.id).pipe(untilDestroyed(this)).subscribe({
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

    this.cargando = true;
    this.error = null;

    // Hace falta un token igual: es lo que identifica la muestra del lado de central.
    this.service.onCrearMuestra(this.data.formato.id).pipe(
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
    this.sondeo = timer(DerivarMapaDialogComponent.MS_SONDEO, DerivarMapaDialogComponent.MS_SONDEO)
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

    this.service.onDerivar(this.qr.token, this.data.formato.id)
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

  onGuardar(confirmar = false): void {
    if (!this.propuesta?.length || this.guardando) return;
    this.guardando = true;
    this.error = null;

    this.service.onGuardarDerivadas(this.data.formato.id, this.propuesta, confirmar)
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
          this.dialogRef.close(true);
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

  onCerrar(): void {
    this.dialogRef.close();
  }
}
