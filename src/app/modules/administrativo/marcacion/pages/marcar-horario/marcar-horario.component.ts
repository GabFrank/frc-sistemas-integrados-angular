import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs';

import { MainService } from '../../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../../notificacion-snackbar.service';
import { MarcacionService, MarcacionContexto } from '../../service/marcacion.service';
import { Marcacion } from '../../models/marcacion.model';
import { Jornada } from '../../models/jornada.model';
import { EstadoJornada } from '../../enums/estado-jornada.enum';
import { TipoMarcacion } from '../../enums/tipo-marcacion.enum';
import { AccionMarcacionPendiente } from '../../enums/accion-marcacion-pendiente.enum';
import { Usuario } from '../../../../personas/usuarios/usuario.model';

import { DispositivoService } from '../../../../../shared/services/dispositivo.service';
import { CamaraService } from '../../../../../shared/services/camara.service';
import { UsuarioHelperService } from '../../service/usuario-helper.service';
import { ReconocimientoFacialHelperService } from '../../service/reconocimiento-facial-helper.service';
import { EmbeddingGaleria } from '../../models/embedding-galeria.model';
import { UsuarioService } from '../../../../personas/usuarios/usuario.service';

import { ModoCamara } from '../../components/camara-reconocimiento/camara-reconocimiento.component';
import { EstadoMarcacionComponent } from '../../components/estado-marcacion/estado-marcacion.component';
import { BusquedaUsuarioComponent } from '../../components/busqueda-usuario/busqueda-usuario.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { cloudConnectionStatusSub } from '../../../../../shared/services/graphql-connection.service';

@UntilDestroy()
@Component({
  selector: 'marcar-horario',
  templateUrl: './marcar-horario.component.html',
  styleUrls: ['./marcar-horario.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarcarHorarioComponent implements OnInit, OnDestroy {

  empleadoNombreControl = new FormControl();
  empleadoIdControl = new FormControl();

  usuarioSeleccionado: Usuario = null;
  sucursalActualNombre = '';
  sucursalActualId: number = null;

  marcacionActiva: Marcacion = null;
  horaEntrada: Date = null;
  estaEnJornada = false;
  cargando = false;

  reconocimientoExitoso = false;
  mostrandoCamara = false;
  mensajeErrorFoto = '';
  modoCamara: ModoCamara = 'verificacion';

  marcacionesHoy: Marcacion[] = [];
  jornadaActual: Jornada = null;
  accionPendiente: AccionMarcacionPendiente = AccionMarcacionPendiente.ENTRADA;
  similitudInsuficiente = false;
  centralOnline: boolean = false;

  public referenciaGaleria: EmbeddingGaleria | null = null;
  public embeddingCapturado: number[] | null = null;
  public embeddingScoreCapturado: number | null = null;

  @ViewChild('estadoRef') estadoRef: EstadoMarcacionComponent;
  @ViewChild('busquedaRef') busquedaRef: BusquedaUsuarioComponent;

  constructor(
    public mainService: MainService,
    private marcacionService: MarcacionService,
    private notificacionService: NotificacionSnackbarService,
    private matDialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private dispositivoService: DispositivoService,
    private camaraService: CamaraService,
    private usuarioHelper: UsuarioHelperService,
    private faceHelper: ReconocimientoFacialHelperService,
    private usuarioService: UsuarioService
  ) { }

  ngOnInit(): void {
    this.sucursalActualNombre = this.mainService.sucursalActual?.nombre || 'Sin sucursal';
    this.sucursalActualId = this.mainService.sucursalActual?.id;

    cloudConnectionStatusSub.pipe(untilDestroyed(this)).subscribe(status => {
      this.centralOnline = !!status;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.camaraService.detenerCamara();
  }

  private async iniciarCamaraEnEstado(): Promise<void> {
    this.cdr.detectChanges();
    for (let i = 0; i < 25; i++) {
      const camaraRef = this.estadoRef?.camaraRef;
      if (camaraRef) {
        await camaraRef.iniciar();
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
      this.cdr.detectChanges();
    }
    console.warn('No se pudo iniciar la cámara: componente no disponible');
  }

  private async iniciarCamaraEnBusqueda(): Promise<void> {
    this.cdr.detectChanges();
    for (let i = 0; i < 25; i++) {
      const camaraRef = this.busquedaRef?.camaraRef;
      if (camaraRef) {
        await camaraRef.iniciar();
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
      this.cdr.detectChanges();
    }
    console.warn('No se pudo iniciar la cámara de búsqueda: componente no disponible');
  }
  buscarEmpleado(): void {
    const valor = this.empleadoIdControl.value;
    if (valor && !isNaN(valor)) {
      this.usuarioHelper.buscarUsuarioPorId(valor)
        .pipe(untilDestroyed(this))
        .subscribe(usuario => {
          if (usuario) {
            this.seleccionarUsuario(usuario);
          }
          this.cdr.markForCheck();
        });
    } else {
      this.abrirBuscadorManual();
    }
  }

  abrirBuscadorManual(): void {
    this.usuarioHelper.abrirBuscador(this.matDialog)
      .pipe(untilDestroyed(this))
      .subscribe(usuario => {
        if (usuario) {
          this.mostrandoCamara = false;
          this.seleccionarUsuario(usuario);
        }
        this.cdr.markForCheck();
      });
  }

  async seleccionarUsuario(usuario: Usuario): Promise<void> {
    this.usuarioSeleccionado = usuario;
    this.empleadoNombreControl.setValue(usuario.persona?.nombre);
    this.empleadoIdControl.setValue(usuario.id);
    this.reiniciarEstadosReconocimiento();
    await this.verificarMarcacionActivaAsync();
    await this.iniciarProcesoValidacionFacial(usuario);
    this.cdr.markForCheck();
  }

  limpiarEmpleado(): void {
    this.limpiarEstadosCamara();
    this.usuarioSeleccionado = null;
    this.empleadoNombreControl.setValue(null);
    this.empleadoIdControl.setValue(null);
    this.marcacionActiva = null;
    this.horaEntrada = null;
    this.estaEnJornada = false;
    this.marcacionesHoy = [];
    this.jornadaActual = null;
    this.accionPendiente = AccionMarcacionPendiente.ENTRADA;
    this.cdr.markForCheck();
  }

  limpiarEstadosCamara(): void {
    this.reiniciarEstadosReconocimiento();
    this.mostrandoCamara = false;
  }

  private reiniciarEstadosReconocimiento(): void {
    this.reconocimientoExitoso = false;
    this.mensajeErrorFoto = '';
    this.referenciaGaleria = null;
    this.embeddingCapturado = null;
    this.embeddingScoreCapturado = null;
    this.similitudInsuficiente = false;
    this.camaraService.detenerCamara();
  }
  onUsuarioIdentificado(usuario: Usuario): void {
    this.mostrandoCamara = false;
    this.seleccionarUsuario(usuario);
  }

  onIdentidadVerificada(evento: { embedding: number[], snapshotUrl: string, score: number }): void {
    this.reconocimientoExitoso = true;
    this.embeddingCapturado = evento.embedding;
    this.embeddingScoreCapturado = evento.score;
    this.cdr.markForCheck();
  }

  async onFotoPerfilGuardada(): Promise<void> {
    if (this.usuarioSeleccionado) {
      this.usuarioSeleccionado.avatar = null;
    }
    this.mensajeErrorFoto = '';
    this.mostrandoCamara = false;
    this.cdr.markForCheck();
    await this.iniciarProcesoValidacionFacial(this.usuarioSeleccionado, true);
  }

  onIniciarReconocimiento(): void {
    this.iniciarReconocimiento();
  }

  onIniciarBusquedaCamara(): void {
    this.mostrandoCamara = true;
    this.cdr.markForCheck();
    void this.iniciarCamaraEnBusqueda();
  }

  onCerrarCamara(): void {
    this.mostrandoCamara = false;
    this.camaraService.detenerCamara();
    this.cdr.markForCheck();
  }
  async iniciarReconocimiento(): Promise<void> {
    if (this.usuarioSeleccionado) {
      this.reconocimientoExitoso = false;
      this.embeddingCapturado = null;
    this.embeddingScoreCapturado = null;
      await this.iniciarProcesoValidacionFacial(this.usuarioSeleccionado);
    }
  }

  async iniciarProcesoValidacionFacial(usuario: Usuario, forzarRecargaFoto = false): Promise<void> {
    let usuarioActual = usuario;

    if (forzarRecargaFoto && usuario?.id) {
      try {
        const usuarioRecargado = await firstValueFrom(
          this.usuarioService.onGetUsuario(usuario.id, true).pipe(timeout(10000))
        );
        if (usuarioRecargado) {
          usuarioActual = usuarioRecargado;
          this.usuarioSeleccionado = usuarioRecargado;
        }
      } catch (error) {
        console.warn('No se pudo recargar usuario para galería facial', error);
      }
    }

    const galeria = await this.faceHelper.obtenerGaleriaReferencia(usuarioActual);

    if (galeria) {
      this.referenciaGaleria = galeria;
      this.modoCamara = 'verificacion';
      this.mensajeErrorFoto = '';
      this.mostrandoCamara = true;
      this.cdr.markForCheck();
      await this.iniciarCamaraEnEstado();
      return;
    }

    this.mensajeErrorFoto = 'Sin registro facial. Complete el enrollment de 3 fotos.';
    this.modoCamara = 'captura-multiple';
    this.mostrandoCamara = true;
    this.cdr.markForCheck();
    await this.iniciarCamaraEnEstado();
  }
  verificarMarcacionActiva(): void {
    void this.verificarMarcacionActivaAsync();
  }

  private async verificarMarcacionActivaAsync(): Promise<void> {
    if (!this.usuarioSeleccionado?.id) return;

    this.jornadaActual = null;
    this.accionPendiente = AccionMarcacionPendiente.ENTRADA;
    this.cargando = true;
    this.cdr.markForCheck();
    const { inicio, fin } = this.obtenerRangoMarcacion();

    try {
      const res = await firstValueFrom(
        this.marcacionService.onGetMarcacionesPorUsuario(
          this.usuarioSeleccionado.id, inicio, fin, 0, 100, true,
          { networkError: { propagate: true, show: false } }
        ).pipe(timeout(5000))
      );
      this.procesarMarcaciones(res?.getContent || []);
      await this.consultarJornadaActualAsync();
    } catch (err) {
      console.error('Error al verificar marcación activa', err);
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  private async consultarJornadaActualAsync(): Promise<void> {
    if (!this.usuarioSeleccionado?.id) return;
    const { inicio, fin } = this.obtenerRangoMarcacion();

    try {
      const jornadas = await firstValueFrom(
        this.marcacionService.onGetJornadasPorUsuario(
          this.usuarioSeleccionado.id, inicio, fin, true
        )
      );
      this.jornadaActual = this.seleccionarJornadaRelevante(jornadas || []);
      this.sincronizarEstadoDesdeJornada();
      this.actualizarAccionPendiente();
    } catch {
      this.jornadaActual = null;
    }
  }

  private consultarJornadaActual(): void {
    void this.consultarJornadaActualAsync();
  }

  /** Incluye ayer para jornadas NOCHE/MADRUGADA que cruzan medianoche. */
  private obtenerRangoMarcacion() {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    return {
      inicio: new Date(ayer.getFullYear(), ayer.getMonth(), ayer.getDate()).toISOString(),
      fin: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59).toISOString()
    };
  }

  private seleccionarJornadaRelevante(jornadas: Jornada[]): Jornada | null {
    if (!jornadas.length) {
      return null;
    }
    const abiertas = jornadas.filter(
      j => j.estado === EstadoJornada.INCOMPLETO && j.marcacionEntrada && !j.marcacionSalida
    );
    if (abiertas.length > 0) {
      const nocturnas = abiertas.filter(j => this.cruzaMedianoche(j));
      const candidatas = nocturnas.length > 0 ? nocturnas : abiertas;
      return [...candidatas].sort((a, b) => b.id - a.id)[0];
    }
    return [...jornadas].sort((a, b) => a.id - b.id)[jornadas.length - 1];
  }

  private cruzaMedianoche(j: Jornada): boolean {
    const turno = (j.turno || '').toUpperCase();
    return turno === 'NOCHE' || turno === 'MADRUGADA';
  }

  private sincronizarEstadoDesdeJornada(): void {
    const j = this.jornadaActual;
    if (!j?.marcacionEntrada || j.marcacionSalida) {
      return;
    }
    const hoy = this.fechaLocal(new Date());
    const fechaJornada = this.fechaLocal(j.fecha);
    const activa = fechaJornada >= hoy
      || (this.cruzaMedianoche(j) && j.estado === EstadoJornada.INCOMPLETO);
    if (activa) {
      this.marcacionActiva = j.marcacionEntrada;
      this.horaEntrada = new Date(j.marcacionEntrada.fechaEntrada);
      this.estaEnJornada = true;
    }
  }

  /** Determina el siguiente paso según el estado de la jornada (entrada, almuerzo, retorno, salida). */
  private actualizarAccionPendiente(): void {
    const j = this.jornadaActual;
    if (!j || !this.esJornadaActiva(j) || j.estado === EstadoJornada.NORMAL || j.marcacionSalida) {
      this.accionPendiente = AccionMarcacionPendiente.ENTRADA;
      this.estaEnJornada = false;
      return;
    }

    if (!j.marcacionEntrada) {
      this.accionPendiente = AccionMarcacionPendiente.ENTRADA;
      this.estaEnJornada = false;
      return;
    }

    if (!j.marcacionSalidaAlmuerzo) {
      this.accionPendiente = AccionMarcacionPendiente.SALIDA;
      this.estaEnJornada = true;
      return;
    }

    if (!j.marcacionEntradaAlmuerzo) {
      this.accionPendiente = AccionMarcacionPendiente.RETORNO_ALMUERZO;
      this.estaEnJornada = true;
      return;
    }

    this.accionPendiente = AccionMarcacionPendiente.SALIDA_DEFINITIVA;
    this.estaEnJornada = true;
  }

  private esJornadaActiva(j: Jornada): boolean {
    const hoy = this.fechaLocal(new Date());
    const fechaJornada = this.fechaLocal(j.fecha);
    if (fechaJornada >= hoy) {
      return true;
    }
    return this.cruzaMedianoche(j)
      && j.estado === EstadoJornada.INCOMPLETO
      && !j.marcacionSalida
      && !!j.marcacionEntrada;
  }

  private fechaLocal(valor: Date | string): string {
    const date = typeof valor === 'string'
      ? new Date(valor.length <= 10 ? `${valor}T12:00:00` : valor)
      : valor;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private procesarMarcaciones(marcaciones: Marcacion[]) {
    const list = [...(marcaciones || [])];

    // Extraemos fecha unificada para cada registro y ordenamos cronológicamente (más antiguo a más nuevo)
    const sorted = list.map(m => {
      const time = new Date(m.fechaEntrada || m.fechaSalida || 0).getTime();
      return { m, time };
    }).sort((a, b) => a.time - b.time);

    const visualList: Marcacion[] = [];
    let currentRaw: Marcacion = null;

    for (const item of sorted) {
      const m = item.m;
      // "ENTRADA" o entrada sin salir (por compatibilidad hacia atrás)
      if (m.tipo === TipoMarcacion.ENTRADA || (m.fechaEntrada && !m.fechaSalida)) {
        currentRaw = m;
        visualList.push(Object.assign(new Marcacion(), m));
      } else if (m.tipo === TipoMarcacion.SALIDA || m.fechaSalida) {
        if (currentRaw) {
          // Si había una entrada pendiente, le acoplamos la salida
          visualList[visualList.length - 1].fechaSalida = m.fechaSalida;
          currentRaw = null;
        } else {
          // Si no, la agregamos huérfana
          visualList.push(Object.assign(new Marcacion(), m));
        }
      }
    }

    // Invertimos nuevamente para que el frontend muestre la última arriba
    this.marcacionesHoy = visualList.reverse();

    if (!this.jornadaActual) {
      if (currentRaw) {
        this.marcacionActiva = currentRaw;
        this.horaEntrada = new Date(currentRaw.fechaEntrada);
        this.estaEnJornada = true;
        this.accionPendiente = AccionMarcacionPendiente.SALIDA;
      } else {
        this.marcacionActiva = null;
        this.horaEntrada = null;
        this.estaEnJornada = false;
        this.accionPendiente = AccionMarcacionPendiente.ENTRADA;
      }
    }
    this.cdr.markForCheck();
  }

  registrarEntrada(): void {
    if (!this.validarRegistro()) return;
    this.ejecutarRegistro(true);
  }

  registrarRetornoAlmuerzo(): void {
    if (!this.validarRegistro()) return;
    this.ejecutarRegistro(true);
  }

  registrarSalida(): void {
    if (!this.validarRegistro(true)) return;

    if (this.accionPendiente === AccionMarcacionPendiente.SALIDA_DEFINITIVA) {
      this.ejecutarRegistro(false, false);
      return;
    }

    const dialogRef = this.matDialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Tipo de Salida',
        message: '¿Es horario de almuerzo?',
        confirmText: 'Sí, es almuerzo',
        cancelText: 'No, salida definitiva'
      }
    });

    dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(esAlmuerzo => {
      if (esAlmuerzo === null || esAlmuerzo === undefined) return;
      this.ejecutarRegistro(false, esAlmuerzo);
    });
  }

  private crearContexto(ubicacion: any): MarcacionContexto {
    return {
      usuarioId: this.usuarioSeleccionado.id,
      sucursalId: this.sucursalActualId,
      deviceId: this.dispositivoService.obtenerDeviceId(),
      deviceInfo: this.dispositivoService.obtenerInfoDispositivo(),
      embedding: this.embeddingCapturado
    };
  }

  private ejecutarRegistro(esEntrada: boolean, esSalidaAlmuerzo?: boolean) {
    this.cargando = true;
    const contexto = this.crearContexto(null);
    if (esSalidaAlmuerzo != null) {
      contexto.esSalidaAlmuerzo = esSalidaAlmuerzo;
    }
    esEntrada ? this.guardarEntrada(contexto) : this.guardarSalida(contexto);
  }

  private guardarEntrada(contexto: MarcacionContexto) {
    this.marcacionService.onRegistrarEntrada(contexto)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => this.finalizarRegistro(res, 'Entrada'),
        error: () => { this.cargando = false; this.cdr.markForCheck(); }
      });
  }

  private guardarSalida(contexto: MarcacionContexto) {
    this.marcacionService.onRegistrarSalida(contexto)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => this.finalizarRegistro(res, 'Salida'),
        error: () => { this.cargando = false; this.cdr.markForCheck(); }
      });
  }

  private finalizarRegistro(marcacion: Marcacion, tipo: 'Entrada' | 'Salida') {
    this.cargando = false;
    const hora = tipo === 'Entrada' ? new Date(marcacion.fechaEntrada) : new Date(marcacion.fechaSalida);

    this.notificacionService.notification$.next({
      texto: `${tipo} registrada exitosamente a las ${hora.toLocaleTimeString()}`,
      color: NotificacionColor.success,
      duracion: 4
    });

    if (this.usuarioSeleccionado?.id && this.embeddingCapturado && this.embeddingScoreCapturado != null) {
      void this.faceHelper.actualizarGaleriaPostMarcacion(
        this.usuarioSeleccionado.id,
        this.embeddingCapturado,
        this.embeddingScoreCapturado
      );
    }

    this.limpiarEstadosCamara();
    this.verificarMarcacionActiva();
  }

  private validarRegistro(esSalida = false): boolean {
    if (esSalida && !this.marcacionActiva) {
      this.notificarError('No hay una entrada activa para registrar salida');
      return false;
    }
    if (!esSalida && !this.usuarioSeleccionado?.id) {
      this.notificarError('Debe seleccionar su usuario primero');
      return false;
    }
    if (this.sucursalActualId == null) {
      this.notificarError('No se pudo determinar la sucursal actual', NotificacionColor.danger);
      return false;
    }
    if (!this.reconocimientoExitoso) {
      this.notificarError('Debe verificar su identidad con reconocimiento facial primero');
      return false;
    }
    return true;
  }

  private notificarError(texto: string, color: NotificacionColor = NotificacionColor.warn) {
    this.notificacionService.notification$.next({ texto, color, duracion: 3 });
  }
}
