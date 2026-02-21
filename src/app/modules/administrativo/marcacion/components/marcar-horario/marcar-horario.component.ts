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
import { catchError } from 'rxjs/operators';
import { timeout } from 'rxjs';

import { MainService } from '../../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../../notificacion-snackbar.service';
import { MarcacionService, MarcacionContexto } from '../../service/marcacion.service';
import { Marcacion } from '../../models/marcacion.model';
import { Jornada } from '../../models/jornada.model';
import { Usuario } from '../../../../personas/usuarios/usuario.model';

import { DispositivoService } from '../../../../../shared/services/dispositivo.service';
import { UbicacionService } from '../../../../../shared/services/ubicacion.service';
import { CamaraService } from '../../../../../shared/services/camara.service';
import { UsuarioHelperService } from '../../service/usuario-helper.service';
import { ReconocimientoFacialHelperService } from '../../service/reconocimiento-facial-helper.service';

import { ModoCamara } from '../camara-reconocimiento/camara-reconocimiento.component';
import { EstadoMarcacionComponent } from '../estado-marcacion/estado-marcacion.component';
import { BusquedaUsuarioComponent } from '../busqueda-usuario/busqueda-usuario.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';

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

  private referenciaDescriptor: number[] | null = null;
  private embeddingCapturado: number[] | null = null;

  @ViewChild('estadoRef') estadoRef: EstadoMarcacionComponent;
  @ViewChild('busquedaRef') busquedaRef: BusquedaUsuarioComponent;

  constructor(
    public mainService: MainService,
    private marcacionService: MarcacionService,
    private notificacionService: NotificacionSnackbarService,
    private matDialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private dispositivoService: DispositivoService,
    private ubicacionService: UbicacionService,
    private camaraService: CamaraService,
    private usuarioHelper: UsuarioHelperService,
    private faceHelper: ReconocimientoFacialHelperService
  ) { }

  ngOnInit(): void {
    this.sucursalActualNombre = this.mainService.sucursalActual?.nombre || 'Sin sucursal';
    this.sucursalActualId = this.mainService.sucursalActual?.id;
  }

  ngOnDestroy(): void {
    this.camaraService.detenerCamara();
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
    this.verificarMarcacionActiva();
    this.limpiarEstadosCamara();
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
    this.cdr.markForCheck();
  }

  limpiarEstadosCamara(): void {
    this.reconocimientoExitoso = false;
    this.mostrandoCamara = false;
    this.mensajeErrorFoto = '';
    this.referenciaDescriptor = null;
    this.embeddingCapturado = null;
    this.camaraService.detenerCamara();
  }
  onUsuarioIdentificado(usuario: Usuario): void {
    this.mostrandoCamara = false;
    this.seleccionarUsuario(usuario);
  }

  onIdentidadVerificada(evento: { embedding: number[], snapshotUrl: string }): void {
    this.reconocimientoExitoso = true;
    this.embeddingCapturado = evento.embedding;
    this.cdr.markForCheck();
  }

  async onFotoPerfilGuardada(): Promise<void> {
    if (this.usuarioSeleccionado?.persona) {
      this.usuarioSeleccionado.persona.imagenes = 'captured';
    }
    this.mensajeErrorFoto = '';
    this.mostrandoCamara = false;
    this.cdr.markForCheck();
    await this.iniciarProcesoValidacionFacial(this.usuarioSeleccionado);
  }

  onIniciarReconocimiento(): void {
    this.iniciarReconocimiento();
  }

  onIniciarBusquedaCamara(): void {
    this.mostrandoCamara = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      if (this.busquedaRef?.camaraRef) {
        this.busquedaRef.camaraRef.iniciar();
      }
    });
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
      await this.iniciarProcesoValidacionFacial(this.usuarioSeleccionado);
    }
  }

  async iniciarProcesoValidacionFacial(usuario: Usuario): Promise<void> {
    this.cargando = true;
    const fotoUrl = await this.usuarioHelper.obtenerFotoPerfil(usuario);
    this.cargando = false;

    if (!fotoUrl) {
      this.mensajeErrorFoto = 'Sin foto de perfil';
      this.modoCamara = 'captura-multiple';
      this.mostrandoCamara = true;
      this.cdr.markForCheck();

      setTimeout(() => {
        const camaraRef = this.estadoRef?.camaraRef;
        if (camaraRef) {
          camaraRef.iniciar();
        }
      });
      return;
    }

    this.referenciaDescriptor = await this.faceHelper.obtenerDescriptorReferencia(fotoUrl);
    if (this.referenciaDescriptor) {
      this.modoCamara = 'verificacion';
      this.mostrandoCamara = true;
      this.cdr.markForCheck();

      setTimeout(() => {
        const camaraRef = this.estadoRef?.camaraRef;
        if (camaraRef) {
          camaraRef.iniciar();
        }
      });
    } else {
      this.mensajeErrorFoto = 'Error: No se pudo procesar la foto de perfil para validación.';
    }
    this.cdr.markForCheck();
  }
  verificarMarcacionActiva(): void {
    if (!this.usuarioSeleccionado?.id) return;

    this.cargando = true;
    const { inicio, fin } = this.obtenerRangoHoy();

    this.marcacionService.onGetMarcacionesPorUsuario(
      this.usuarioSeleccionado.id, inicio, fin, 0, 100, true,
      { networkError: { propagate: true, show: false } }
    ).pipe(
      timeout(5000),
      untilDestroyed(this),
      catchError(() => this.marcacionService.onGetMarcacionesPorUsuario(
        this.usuarioSeleccionado.id, inicio, fin, 0, 100, false,
        { networkError: { propagate: true, show: false } }
      ))
    ).subscribe({
      next: (res) => {
        this.cargando = false;
        this.procesarMarcaciones(res?.getContent || []);
        this.consultarJornadaActual();
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al verificar marcación activa', err);
      }
    });
  }

  private consultarJornadaActual(): void {
    if (!this.usuarioSeleccionado?.id) return;
    const { inicio, fin } = this.obtenerRangoHoy();
    this.marcacionService.onGetJornadasPorUsuario(
      this.usuarioSeleccionado.id, inicio, fin, true
    ).pipe(
      untilDestroyed(this),
      catchError(() => {
        return this.marcacionService.onGetJornadasPorUsuario(
          this.usuarioSeleccionado.id, inicio, fin, false
        );
      })
    ).subscribe({
      next: (jornadas: Jornada[]) => {
        if (jornadas && jornadas.length > 0) {
          this.jornadaActual = jornadas[jornadas.length - 1];
        } else {
          this.jornadaActual = null;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.jornadaActual = null;
      }
    });
  }

  private obtenerRangoHoy() {
    const hoy = new Date();
    return {
      inicio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString(),
      fin: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59).toISOString()
    };
  }

  private procesarMarcaciones(marcaciones: Marcacion[]) {
    this.marcacionesHoy = (marcaciones || []).sort((a, b) => new Date(b.fechaEntrada).getTime() - new Date(a.fechaEntrada).getTime());
    const activa = marcaciones?.find(m => m.fechaEntrada && !m.fechaSalida);

    if (activa) {
      this.marcacionActiva = activa;
      this.horaEntrada = new Date(activa.fechaEntrada);
      this.estaEnJornada = true;
    } else {
      this.marcacionActiva = null;
      this.horaEntrada = null;
      this.estaEnJornada = false;
    }
    this.cdr.markForCheck();
  }

  registrarEntrada(): void {
    if (!this.validarRegistro()) return;
    this.ejecutarRegistro(true);
  }

  registrarSalida(): void {
    if (!this.validarRegistro(true)) return;
    const almuerzoCompleto = this.jornadaActual
      && this.jornadaActual.marcacionSalidaAlmuerzo
      && this.jornadaActual.marcacionEntradaAlmuerzo;

    if (almuerzoCompleto) {
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

  private ejecutarRegistro(esEntrada: boolean, esSalidaAlmuerzo?: boolean) {
    this.cargando = true;
    this.ubicacionService.obtenerUbicacionActual().subscribe({
      next: (ubicacion) => {
        const contexto = this.crearContexto(ubicacion);
        if (esSalidaAlmuerzo != null) {
          contexto.esSalidaAlmuerzo = esSalidaAlmuerzo;
        }
        esEntrada ? this.guardarEntrada(contexto) : this.guardarSalida(contexto);
      },
      error: (err) => {
        console.warn('Ubicación no disponible', err);
        const contexto = this.crearContexto(null);
        if (esSalidaAlmuerzo != null) {
          contexto.esSalidaAlmuerzo = esSalidaAlmuerzo;
        }
        esEntrada ? this.guardarEntrada(contexto) : this.guardarSalida(contexto);
      }
    });
  }

  private crearContexto(ubicacion: any): MarcacionContexto {
    return {
      usuarioId: this.usuarioSeleccionado.id,
      sucursalId: this.sucursalActualId,
      latitud: ubicacion?.latitud,
      longitud: ubicacion?.longitud,
      precisionGps: ubicacion?.precision,
      distanciaSucursalMetros: ubicacion ? this.ubicacionService.calcularDistanciaMetros(
        ubicacion.latitud, ubicacion.longitud,
        this.obtenerLatSucursal(), this.obtenerLonSucursal()
      ) : undefined,
      deviceId: this.dispositivoService.obtenerDeviceId(),
      deviceInfo: this.dispositivoService.obtenerInfoDispositivo(),
      embedding: this.embeddingCapturado
    };
  }

  private obtenerLatSucursal(): number {
    if (this.mainService.sucursalActual?.localizacion) {
      const parts = this.mainService.sucursalActual.localizacion.split(/[,;]/);
      if (parts.length > 0) return parseFloat(parts[0]);
    }
    return 0;
  }

  private obtenerLonSucursal(): number {
    if (this.mainService.sucursalActual?.localizacion) {
      const parts = this.mainService.sucursalActual.localizacion.split(/[,;]/);
      if (parts.length > 1) return parseFloat(parts[1]);
    }
    return 0;
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
    if (!this.marcacionActiva?.id) return;
    this.marcacionService.onRegistrarSalida(this.marcacionActiva.id, contexto)
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
    if (tipo === 'Entrada') {
      this.marcacionActiva = marcacion;
      this.horaEntrada = hora;
      this.estaEnJornada = true;
      this.marcacionesHoy = [marcacion, ...this.marcacionesHoy];
    } else {
      const index = this.marcacionesHoy.findIndex(m => m.id === marcacion.id);
      if (index !== -1) {
        const nuevaLista = [...this.marcacionesHoy];
        nuevaLista[index] = marcacion;
        this.marcacionesHoy = nuevaLista;
      }
      this.marcacionActiva = null;
      this.horaEntrada = null;
      this.estaEnJornada = false;
    }

    this.limpiarEstadosCamara();
    this.consultarJornadaActual();
    this.cdr.markForCheck();
  }

  private validarRegistro(esSalida = false): boolean {
    if (esSalida && !this.marcacionActiva?.id) {
      this.notificarError('No hay una entrada activa para registrar salida');
      return false;
    }
    if (!esSalida && !this.usuarioSeleccionado?.id) {
      this.notificarError('Debe seleccionar su usuario primero');
      return false;
    }
    if (!this.sucursalActualId) {
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
