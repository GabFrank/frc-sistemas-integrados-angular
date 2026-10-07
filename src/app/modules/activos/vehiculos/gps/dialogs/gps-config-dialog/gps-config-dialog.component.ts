import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Gps } from '../../models/gps.model';
import { GpsService } from '../../service/gps.service';
import { take, startWith, map } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, defer, merge } from 'rxjs';
import { ContextoConsulta, QueryError } from '../../../../../../generics/generic-crud.service';
import { TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../../../../generics/generic-crud.constantes';
import { esRechazoDelServidor } from '../../../../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../../../../shared/services/timeout-link';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../../../shared/components/dialogos/dialogos.service';

interface LoadingState {
  motor: boolean;
  sleep: boolean;
  interval: boolean;
  apn: boolean;
  alertaVelocidad: boolean;
  alertaVibracion: boolean;
  alertaBateriaBaja: boolean;
  alertaAcc: boolean;
}

type ClaveComando = 'motor' | 'sleep' | 'interval' | 'apn';

/**
 * Lo que consta en el servidor para cada comando. Es «lo último enviado o confirmado por el equipo», nunca «falló»:
 * el central lo marca al enviar y no lo revierte. `null` es «sin dato» (no «encendido» ni 30 s).
 */
interface EstadoServidor {
  motorBloqueado: boolean | null;
  modoSueno: boolean | null;
  intervaloReporte: number | null;
}

/** Las alertas tal como están guardadas: se mandan siempre las cinco juntas, y juntas se revierten. */
interface AlertasGuardadas {
  alertaVelocidad: boolean;
  velocidadLimite: number;
  alertaVibracion: boolean;
  alertaBateriaBaja: boolean;
  alertaAcc: boolean;
}

type ClaveAlerta = 'alertaVelocidad' | 'alertaVibracion' | 'alertaBateriaBaja' | 'alertaAcc';

/** Corte de un comando al GPS: lo hace el link, que cancela la espera y avisa que pudo haberse aplicado. */
const TIMEOUT_COMANDO_MS = 20000;
const INTERVALO_POR_DEFECTO = 30;
const VELOCIDAD_LIMITE_POR_DEFECTO = 100;

const LECTURA_GPS: QueryError = {
  networkError: { propagate: true, show: false },
  graphError: { propagate: true, show: false },
};
const CONSULTA_GPS: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };

@UntilDestroy()
@Component({
  selector: 'app-gps-config-dialog',
  templateUrl: './gps-config-dialog.component.html',
  styleUrls: ['./gps-config-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GpsConfigDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly gpsService = inject(GpsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialogRef = inject(MatDialogRef<GpsConfigDialogComponent>);
  private readonly data = inject<Gps>(MAT_DIALOG_DATA);
  private readonly notificacionService = inject(NotificacionSnackbarService);
  private readonly dialogosService = inject(DialogosService);

  configForm: FormGroup;
  // Copia: el diálogo no toca la fila de la lista que lo abrió.
  gps: Gps = { ...this.data };

  // Controles: son lo que se va a ENVIAR, no el estado del equipo (ese va aparte, en `servidor`).
  motorEstadoControl = new FormControl(this.data.motorBloqueado !== true);
  sleepModeControl = new FormControl(this.data.modoSueno === true);
  reportIntervalControl = new FormControl(this.data.intervaloReporte || INTERVALO_POR_DEFECTO);
  // Una alerta sin dato está apagada: el central solo las emite si están en verdadero.
  alertas: AlertasGuardadas = this.alertasDe(this.data);
  velocidadLimiteControl = new FormControl(this.alertas.velocidadLimite);
  alertaVelocidadControl = new FormControl(this.alertas.alertaVelocidad);
  alertaVibracionControl = new FormControl(this.alertas.alertaVibracion);
  alertaBateriaBajaControl = new FormControl(this.alertas.alertaBateriaBaja);
  alertaAccControl = new FormControl(this.alertas.alertaAcc);
  apnNameControl = new FormControl('internet');

  // Observables para el template
  motorLabel$: Observable<string>;
  sleepModeEnabled$: Observable<boolean>;
  reportInterval$: Observable<number>;
  alertaVelocidadEnabled$: Observable<boolean>;
  velocidadLimite$: Observable<number>;
  alertaVibracionEnabled$: Observable<boolean>;
  alertaBateriaBajaEnabled$: Observable<boolean>;
  alertaAccEnabled$: Observable<boolean>;
  apnName$: Observable<string>;

  loading: LoadingState = {
    motor: false,
    sleep: false,
    interval: false,
    apn: false,
    alertaVelocidad: false,
    alertaVibracion: false,
    alertaBateriaBaja: false,
    alertaAcc: false
  };

  servidor: EstadoServidor = this.estadoDe(this.data);
  motorServidorTexto = '';
  sleepServidorTexto = '';
  intervaloServidorTexto = '';
  motorCortadoEnServidor = false;
  /** El control difiere de lo que consta en el servidor: todavía no se envió. */
  sinEnviar = { motor: false, sleep: false, interval: false };
  /**
   * El comando salió y no hubo respuesta (red caída o corte por tiempo): pudo haber llegado al GPS. No se
   * deshabilita (un corte de motor tiene que poder repetirse); reenviarlo pide confirmación.
   */
  sinConfirmar: Record<ClaveComando, boolean> = { motor: false, sleep: false, interval: false, apn: false };
  haySinConfirmar = false;
  actualizandoEstado = false;
  /** La relectura al abrir falló: lo que se muestra es lo que traía la lista. */
  lecturaFallo = false;
  /** Se envió o guardó algo: al cerrar se refresca la lista (lo lee `GpsDialogService`). */
  huboCambios = false;
  /** Envíos y guardados hechos: una lectura que salió antes de uno de ellos trae un estado viejo y se descarta. */
  private envios = 0;
  private confirmando = false;

  ngOnInit(): void {
    this.initForm();
    this.initObservables();
    this.recalcular();
    merge(this.motorEstadoControl.valueChanges, this.sleepModeControl.valueChanges, this.reportIntervalControl.valueChanges)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.recalcular();
        this.cdr.markForCheck();
      });
    this.leerGps(false);
  }

  initForm(): void {
    this.configForm = this.fb.group({
      motorEstado: this.motorEstadoControl,
      sleepMode: this.sleepModeControl,
      reportInterval: this.reportIntervalControl,
      velocidadLimite: this.velocidadLimiteControl,
      alertaVelocidad: this.alertaVelocidadControl,
      alertaVibracion: this.alertaVibracionControl,
      alertaBateriaBaja: this.alertaBateriaBajaControl,
      alertaAcc: this.alertaAccControl,
      apnName: this.apnNameControl
    });
  }

  initObservables(): void {
    this.sleepModeEnabled$ = this.valorActual(this.sleepModeControl);
    this.reportInterval$ = this.valorActual(this.reportIntervalControl);
    this.alertaVelocidadEnabled$ = this.valorActual(this.alertaVelocidadControl);
    this.velocidadLimite$ = this.valorActual(this.velocidadLimiteControl);
    this.alertaVibracionEnabled$ = this.valorActual(this.alertaVibracionControl);
    this.alertaBateriaBajaEnabled$ = this.valorActual(this.alertaBateriaBajaControl);
    this.alertaAccEnabled$ = this.valorActual(this.alertaAccControl);
    this.apnName$ = this.valorActual(this.apnNameControl);

    // La etiqueta del interruptor dice qué se va a enviar; el estado sale de `motorServidorTexto`.
    this.motorLabel$ = this.valorActual<boolean>(this.motorEstadoControl).pipe(
      map(enabled => enabled ? 'A ENVIAR: ENCENDER' : 'A ENVIAR: BLOQUEAR')
    );
  }

  /**
   * Valor del control desde el momento de la suscripción: las pestañas desmontan su contenido al salir, y al volver
   * el `async` se resuscribe (con un `startWith` fijo mostraría el valor de cuando se abrió el diálogo).
   */
  private valorActual<T>(control: FormControl): Observable<T> {
    return defer(() => control.valueChanges.pipe(startWith(control.value)));
  }

  onUpdateMotor(): void {
    const bloquear = !this.motorEstadoControl.value;
    this.enviar('motor', bloquear ? 'MOTOR_OFF' : 'MOTOR_ON', undefined, () => this.servidor.motorBloqueado = bloquear);
  }

  onUpdateSleep(): void {
    const dormir = !!this.sleepModeControl.value;
    this.enviar('sleep', dormir ? 'SLEEP_ON' : 'SLEEP_OFF', undefined, () => this.servidor.modoSueno = dormir);
  }

  onUpdateInterval(): void {
    const intervalo = this.reportIntervalControl.value || INTERVALO_POR_DEFECTO;
    this.enviar('interval', 'INTERVALO', intervalo.toString(), () => this.servidor.intervaloReporte = intervalo);
  }

  onUpdateApn(): void {
    const valor = [this.apnNameControl.value, '', ''].join(',');
    this.enviar('apn', 'APN', valor, () => { });
  }

  /** Relee el GPS. Lo leído es lo que consta en el servidor, no una confirmación del equipo. */
  onActualizarEstado(): void {
    this.leerGps(true);
  }

  /**
   * `pedidaPorElUsuario`: avisa el resultado. Al abrir es silenciosa: si
   * falla queda el cartel de «puede estar desactualizado». Solo se alinean los controles que el usuario no tocó.
   */
  private leerGps(pedidaPorElUsuario: boolean): void {
    if (this.actualizandoEstado) return;
    this.actualizandoEstado = true;
    this.cdr.markForCheck();
    const enviosAlPedir = this.envios;
    this.gpsService.onGetById(this.gps.id, LECTURA_GPS, CONSULTA_GPS, true)
      .pipe(take(1), untilDestroyed(this))
      .subscribe({
        next: (gps) => {
          this.actualizandoEstado = false;
          if (this.envios !== enviosAlPedir) {
            // Se envió o guardó algo mientras se leía: lo leído puede ser anterior y pisaría el resultado.
            this.cdr.markForCheck();
            return;
          }
          this.lecturaFallo = !gps;
          if (gps) {
            this.gps = { ...this.gps, ...gps };
            this.servidor = this.estadoDe(gps);
            this.alertas = this.alertasDe(gps);
            this.alinearControlesSinTocar();
            if (pedidaPorElUsuario) {
              // Leer no confirma nada: los «sin confirmar» siguen hasta que un envío tenga respuesta.
              this.notificacionService.openSucess('Estado leído del servidor: es lo último enviado, no una confirmación del GPS', 4);
            }
            this.recalcular();
          } else if (pedidaPorElUsuario) {
            this.notificacionService.openWarn('No se pudo leer el estado del GPS');
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.actualizandoEstado = false;
          this.lecturaFallo = true;
          if (pedidaPorElUsuario) this.notificacionService.openWarn('No se pudo leer el estado del GPS');
          this.cdr.markForCheck();
        }
      });
  }

  private enviar(clave: ClaveComando, tipo: string, valor: string | undefined, alEnviarse: () => void): void {
    if (this.loading[clave] || this.confirmando) return;
    if (!this.sinConfirmar[clave]) {
      this.ejecutar(clave, tipo, valor, alEnviarse);
      return;
    }
    this.confirmando = true;
    this.dialogosService.confirm(
      'Enviar comando',
      'El último envío de este comando quedó sin confirmar: pudo haber llegado al GPS.',
      '¿Enviar igual?',
      null, true, 'Sí', 'No'
    ).pipe(take(1), untilDestroyed(this)).subscribe(res => {
      this.confirmando = false;
      if (res === true) this.ejecutar(clave, tipo, valor, alEnviarse);
    });
  }

  private ejecutar(clave: ClaveComando, tipo: string, valor: string | undefined, alEnviarse: () => void): void {
    if (this.loading[clave]) return;
    this.loading[clave] = true;
    this.alEmpezarPedido();
    this.cdr.markForCheck();

    this.gpsService.onEnviarComando(this.gps.id, tipo, valor, TIMEOUT_COMANDO_MS)
      .pipe(take(1), untilDestroyed(this))
      .subscribe({
        next: (enviado) => {
          this.loading[clave] = false;
          this.alTerminarPedido();
          if (enviado === true) {
            alEnviarse();
            this.sinConfirmar[clave] = false;
            this.recalcular();
            // Si el usuario movió el control mientras salía el comando, sigue siendo un cambio suyo sin enviar.
            if (clave !== 'apn' && !this.sinEnviar[clave]) this.controlDe(clave).markAsPristine();
            this.recalcular();
            this.notificacionService.openSucess('Comando enviado al GPS');
          } else {
            // false tiene varios motivos en el central (no conectado, inexistente, excepción): no se afirma cuál.
            this.notificacionService.openWarn('El servidor informó que no pudo enviar el comando (el GPS puede no estar conectado)', 5);
            this.revertir(clave);
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.loading[clave] = false;
          this.alTerminarPedido();
          if (esRechazoDelServidor(error)) {
            // El servicio genérico ya mostró el motivo.
            this.revertir(clave);
          } else {
            this.sinConfirmar[clave] = true;
            this.recalcular();
            // El corte del link y la respuesta vacía ya avisaron por su cuenta.
            if (!esTimeoutDeLink(error) && !Array.isArray(error)) {
              this.notificacionService.openWarn('No se pudo confirmar si el comando llegó al GPS', 5);
            }
          }
          this.cdr.markForCheck();
        }
      });
  }

  /** El control vuelve a lo que consta en el servidor (si consta algo). Emite: las etiquetas salen de valueChanges. */
  private revertir(clave: ClaveComando): void {
    const s = this.servidor;
    if (clave === 'motor' && s.motorBloqueado != null) this.motorEstadoControl.setValue(!s.motorBloqueado);
    if (clave === 'sleep' && s.modoSueno != null) this.sleepModeControl.setValue(s.modoSueno);
    if (clave === 'interval' && s.intervaloReporte != null) this.reportIntervalControl.setValue(s.intervaloReporte);
    this.controlDe(clave)?.markAsPristine();
    this.recalcular();
  }

  /** Con un pedido en vuelo el diálogo no se cierra con Esc ni clic afuera: el resultado se perdería sin aviso. */
  private alEmpezarPedido(): void {
    this.envios++;
    this.huboCambios = true;
    this.dialogRef.disableClose = true;
  }

  private alTerminarPedido(): void {
    this.dialogRef.disableClose = Object.values(this.loading).some(v => v);
  }

  private controlDe(clave: ClaveComando): FormControl | null {
    if (clave === 'motor') return this.motorEstadoControl;
    if (clave === 'sleep') return this.sleepModeControl;
    if (clave === 'interval') return this.reportIntervalControl;
    return null;
  }

  private revertirAlertas(): void {
    const a = this.alertas;
    this.alertaVelocidadControl.reset(a.alertaVelocidad);
    this.velocidadLimiteControl.reset(a.velocidadLimite);
    this.alertaVibracionControl.reset(a.alertaVibracion);
    this.alertaBateriaBajaControl.reset(a.alertaBateriaBaja);
    this.alertaAccControl.reset(a.alertaAcc);
  }

  /** Tras releer: lo que el usuario no tocó pasa a mostrar lo leído; lo que tocó queda como «sin enviar». */
  private alinearControlesSinTocar(): void {
    const s = this.servidor;
    const a = this.alertas;
    if (this.motorEstadoControl.pristine && s.motorBloqueado != null) this.motorEstadoControl.setValue(!s.motorBloqueado);
    if (this.sleepModeControl.pristine && s.modoSueno != null) this.sleepModeControl.setValue(s.modoSueno);
    if (this.reportIntervalControl.pristine && s.intervaloReporte != null) this.reportIntervalControl.setValue(s.intervaloReporte);
    if (this.alertaVelocidadControl.pristine) this.alertaVelocidadControl.setValue(a.alertaVelocidad);
    if (this.velocidadLimiteControl.pristine) this.velocidadLimiteControl.setValue(a.velocidadLimite);
    if (this.alertaVibracionControl.pristine) this.alertaVibracionControl.setValue(a.alertaVibracion);
    if (this.alertaBateriaBajaControl.pristine) this.alertaBateriaBajaControl.setValue(a.alertaBateriaBaja);
    if (this.alertaAccControl.pristine) this.alertaAccControl.setValue(a.alertaAcc);
  }

  private alertasDe(gps: Gps): AlertasGuardadas {
    return {
      alertaVelocidad: gps?.alertaVelocidad === true,
      velocidadLimite: gps?.velocidadLimite ?? VELOCIDAD_LIMITE_POR_DEFECTO,
      alertaVibracion: gps?.alertaVibracion === true,
      alertaBateriaBaja: gps?.alertaBateriaBaja === true,
      alertaAcc: gps?.alertaAcc === true
    };
  }

  private estadoDe(gps: Gps): EstadoServidor {
    return {
      motorBloqueado: gps?.motorBloqueado ?? null,
      modoSueno: gps?.modoSueno ?? null,
      intervaloReporte: gps?.intervaloReporte ?? null
    };
  }

  private recalcular(): void {
    const s = this.servidor;
    this.motorServidorTexto = s.motorBloqueado == null ? 'sin dato' : (s.motorBloqueado ? 'motor bloqueado' : 'motor encendido');
    this.sleepServidorTexto = s.modoSueno == null ? 'sin dato' : (s.modoSueno ? 'activado' : 'desactivado');
    this.intervaloServidorTexto = s.intervaloReporte == null ? 'sin dato' : s.intervaloReporte + ' s';
    this.motorCortadoEnServidor = s.motorBloqueado === true;
    this.sinEnviar = {
      // Sin dato en el servidor no hay con qué comparar: es «sin enviar» recién cuando el usuario toca el control.
      motor: s.motorBloqueado == null ? this.motorEstadoControl.dirty : this.motorEstadoControl.value === s.motorBloqueado,
      sleep: s.modoSueno == null ? this.sleepModeControl.dirty : !!this.sleepModeControl.value !== s.modoSueno,
      interval: s.intervaloReporte == null ? this.reportIntervalControl.dirty : this.reportIntervalControl.value !== s.intervaloReporte
    };
    this.haySinConfirmar = Object.values(this.sinConfirmar).some(v => v);
  }

  /** El central solo escribe en la base: repetir el guardado es inocuo. Se mandan las cinco alertas juntas. */
  onGuardarAlerta(tipo: ClaveAlerta): void {
    if (this.loading[tipo]) return;
    this.loading[tipo] = true;
    this.alEmpezarPedido();
    this.cdr.markForCheck();

    this.gpsService.onGuardarConfigAlertas(
      this.gps.id,
      !!this.alertaVelocidadControl.value,
      this.velocidadLimiteControl.value || VELOCIDAD_LIMITE_POR_DEFECTO,
      !!this.alertaVibracionControl.value,
      !!this.alertaBateriaBajaControl.value,
      !!this.alertaAccControl.value,
      TIMEOUT_COMANDO_MS
    )
      .pipe(take(1), untilDestroyed(this))
      .subscribe({
        next: (gpsActualizado) => {
          this.loading[tipo] = false;
          this.alTerminarPedido();
          if (gpsActualizado) {
            this.gps = { ...this.gps, ...gpsActualizado };
            this.alertas = this.alertasDe(this.gps);
            this.revertirAlertas();
            this.notificacionService.openSucess('Alertas guardadas');
          } else {
            // El central devuelve vacío si el GPS ya no existe.
            this.revertirAlertas();
            this.notificacionService.openWarn('No se guardaron las alertas: el servidor no encontró el GPS', 5);
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.loading[tipo] = false;
          this.alTerminarPedido();
          this.revertirAlertas();
          // El rechazo, el corte del link y la respuesta vacía ya avisaron por su cuenta.
          if (!esTimeoutDeLink(error) && !Array.isArray(error)) {
            this.notificacionService.openWarn('No se pudo confirmar si las alertas se guardaron: se muestran las anteriores. Guardalas de nuevo', 6);
          }
          this.cdr.markForCheck();
        }
      });
  }

  onCancel(): void {
    if (this.dialogRef.disableClose) return;
    this.dialogRef.close();
  }
}
