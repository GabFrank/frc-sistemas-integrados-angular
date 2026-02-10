import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  ViewChild,
  ElementRef
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
import { Usuario } from '../../../../personas/usuarios/usuario.model';

import { DispositivoService } from '../../../../../shared/services/dispositivo.service';
import { UbicacionService } from '../../../../../shared/services/ubicacion.service';
import { CamaraService } from '../../../../../shared/services/camara.service';
import { UsuarioHelperService } from '../../service/usuario-helper.service';
import { ReconocimientoFacialHelperService } from '../../service/reconocimiento-facial-helper.service';

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

  horaActual: Date = new Date();
  private clockInterval: any;

  @ViewChild('video') videoElement: ElementRef<HTMLVideoElement>;

  reconocimientoExitoso = false;
  mostrandoCamara = false;
  mensajeReconocimiento = '';
  mensajeErrorFoto = '';
  private referenciaDescriptor: number[] | null = null;
  private embeddingCapturado: number[] | null = null;
  private detecting = false;

  marcacionesHoy: Marcacion[] = [];

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

    this.clockInterval = setInterval(() => {
      this.horaActual = new Date();
      this.cdr.markForCheck();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
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
      this.usuarioHelper.abrirBuscador(this.matDialog)
        .pipe(untilDestroyed(this))
        .subscribe(usuario => {
          if (usuario) {
            this.seleccionarUsuario(usuario);
          }
        });
    }
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
    this.cdr.markForCheck();
  }

  limpiarEstadosCamara(): void {
    this.reconocimientoExitoso = false;
    this.mostrandoCamara = false;
    this.mensajeReconocimiento = '';
    this.mensajeErrorFoto = '';
    this.referenciaDescriptor = null;
    this.embeddingCapturado = null;
    this.detecting = false;
    this.camaraService.detenerCamara();
  }

  async iniciarProcesoValidacionFacial(usuario: Usuario): Promise<void> {
    this.cargando = true;
    const fotoUrl = await this.usuarioHelper.obtenerFotoPerfil(usuario);
    this.cargando = false;

    if (!fotoUrl) {
      this.mensajeErrorFoto = 'Primera vez marcando. Se capturará su foto de perfil.';
      await this.capturarYGuardarFotoPerfil();
      return;
    }

    this.referenciaDescriptor = await this.faceHelper.obtenerDescriptorReferencia(fotoUrl);
    if (this.referenciaDescriptor) {
      this.iniciarCamaraParaVerificacion();
    } else {
      this.mensajeErrorFoto = 'Error: No se pudo procesar la foto de perfil para validación.';
    }
    this.cdr.markForCheck();
  }

  async capturarYGuardarFotoPerfil(): Promise<void> {
    this.mostrandoCamara = true;
    this.mensajeReconocimiento = 'Capturando foto de perfil. Mire a la cámara...';
    try {
      const stream = await this.camaraService.iniciarCamara();
      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = stream;
        this.videoElement.nativeElement.onloadedmetadata = async () => {
          this.videoElement.nativeElement.play();
          // Esperar un momento a que estabilice
          await new Promise(resolve => setTimeout(resolve, 2000));

          const exito = await this.faceHelper.capturarYGuardarFotoPerfil(this.usuarioSeleccionado.id, this.videoElement.nativeElement);
          if (exito) {
            if (this.usuarioSeleccionado.persona) this.usuarioSeleccionado.persona.imagenes = 'captured';
            this.mensajeErrorFoto = '';
            await this.iniciarProcesoValidacionFacial(this.usuarioSeleccionado);
          } else {
            this.mensajeErrorFoto = 'Error al capturar o guardar foto.';
          }
          this.cdr.markForCheck();
        }
      }
    } catch (e) {
      this.mensajeReconocimiento = 'No se pudo acceder a la cámara.';
    }
  }

  async iniciarCamaraParaVerificacion(): Promise<void> {
    this.mostrandoCamara = true;
    this.mensajeReconocimiento = 'Iniciando cámara...';
    try {
      const stream = await this.camaraService.iniciarCamara();
      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = stream;
        this.videoElement.nativeElement.onloadedmetadata = () => {
          this.videoElement.nativeElement.play();
          this.detecting = true;
          this.bucleDeteccion();
        }
      }
    } catch (e) {
      this.mensajeReconocimiento = 'Error al acceder a la cámara';
      this.mostrandoCamara = false;
    }
    this.cdr.markForCheck();
  }

  async bucleDeteccion() {
    if (!this.detecting || !this.videoElement || !this.referenciaDescriptor) return;

    const video = this.videoElement.nativeElement;
    if (video.paused || video.ended) {
      setTimeout(() => this.bucleDeteccion(), 100);
      return;
    }

    const resultado = await this.faceHelper.procesarFrame(video, this.referenciaDescriptor);

    this.mensajeReconocimiento = resultado.mensaje;

    if (resultado.exito && resultado.embedding) {
      this.reconocimientoExitoso = true;
      this.embeddingCapturado = resultado.embedding;
      this.detecting = false;
      video.pause();
      this.cdr.markForCheck();
      return; // Terminamos el bucle
    }

    this.cdr.markForCheck();
    requestAnimationFrame(() => this.bucleDeteccion());
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
      next: (marcaciones) => {
        this.cargando = false;
        this.procesarMarcaciones(marcaciones);
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al verificar marcación activa', err);
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
    this.ejecutarRegistro(false);
  }

  private ejecutarRegistro(esEntrada: boolean) {
    this.cargando = true;
    this.ubicacionService.obtenerUbicacionActual().subscribe({
      next: (ubicacion) => {
        const contexto = this.crearContexto(ubicacion);
        esEntrada ? this.guardarEntrada(contexto) : this.guardarSalida(contexto);
      },
      error: (err) => {
        console.warn('Ubicación no disponible', err);
        const contexto = this.crearContexto(null); // Contexto sin ubicación
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
