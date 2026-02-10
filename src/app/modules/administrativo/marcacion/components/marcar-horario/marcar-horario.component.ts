import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { catchError } from 'rxjs/operators';
import { timeout } from 'rxjs';

import { MainService } from '../../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../../notificacion-snackbar.service';
import { MarcacionService } from '../../service/marcacion.service';
import { Marcacion } from '../../models/marcacion.model';
import { Usuario } from '../../../../personas/usuarios/usuario.model';
import { UsuarioSearchGQL } from '../../../../personas/usuarios/graphql/usuarioSearch';
import { PersonaService } from '../../../../personas/persona/persona.service';
import { SearchListDialogComponent, SearchListtDialogData } from '../../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { UsuarioService } from '../../../../personas/usuarios/usuario.service';
import { FaceRecognitionService } from '../../service/face-recognition.service';
import { ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@UntilDestroy()
@Component({
  selector: 'marcar-horario',
  templateUrl: './marcar-horario.component.html',
  styleUrls: ['./marcar-horario.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarcarHorarioComponent implements OnInit {

  empleadoNombreControl = new FormControl();
  empleadoIdControl = new FormControl();

  usuarioSeleccionado: Usuario = null;
  sucursalActualNombre = '';
  sucursalActualId: number = null;

  marcacionActiva: Marcacion = null;
  horaEntrada: Date = null;
  estaEnJornada = false;
  cargando = false;
  dispositivoInfo = '';
  latitud: number = null;
  longitud: number = null;
  precisionGps: number = null;
  deviceId: string = null;
  distanciaSucursal: number = null;

  horaActual: Date = new Date();
  private clockInterval: any;

  @ViewChild('video') videoElement: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasElement: ElementRef<HTMLCanvasElement>;

  reconocimientoExitoso = false;
  mostrandoCamara = false;
  mensajeReconocimiento = '';
  referenciaDescriptor: number[] | null = null;
  stream: MediaStream | null = null;
  detecting = false;
  mensajeErrorFoto = '';
  private delayInterval: any;
  embeddingCapturado: number[] | null = null;


  marcacionesHoy: Marcacion[] = [];

  constructor(
    public mainService: MainService,
    private marcacionService: MarcacionService,
    private notificacionService: NotificacionSnackbarService,
    private matDialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private searchUsuario: UsuarioSearchGQL,
    private personaService: PersonaService,
    private usuarioService: UsuarioService,
    private faceService: FaceRecognitionService,
    private http: HttpClient
  ) { }

  buscarEmpleado(): void {
    const valor = this.empleadoIdControl.value;
    if (valor) {
      if (!isNaN(valor)) {
        this.usuarioService.onGetUsuarioPorPersonaId(valor, true, { networkError: { propagate: true, show: false } })
          .pipe(
            untilDestroyed(this),
            catchError(err => {
              console.warn('Error fetching usuario from central, trying local...', err);
              return this.usuarioService.onGetUsuarioPorPersonaId(valor, false);
            })
          )
          .subscribe(res => {
            if (res) {
              this.seleccionarUsuario(res);
            } else {
              this.mensajeErrorPersona(valor);
            }
            this.cdr.markForCheck();
          });
      } else {
        this.abrirBuscadorEmpleado();
      }
    } else {
      this.abrirBuscadorEmpleado();
    }
  }

  mensajeErrorPersona(id: number): void {
    this.personaService.onGetPersona(id)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.notificacionService.openWarn('La persona encontrada no tiene usuario asociado. Debe crear un usuario para esta persona.');
        } else {
          this.notificacionService.openWarn('No se encontró ninguna persona con ese ID');
        }
        this.empleadoIdControl.setErrors({ invalid: true });
        this.cdr.markForCheck();
      });
  }

  ngOnInit(): void {
    this.sucursalActualNombre = this.mainService.sucursalActual?.nombre || 'Sin sucursal';
    this.sucursalActualId = this.mainService.sucursalActual?.id;
    this.dispositivoInfo = this.obtenerInfoDispositivo();

    this.deviceId = this.obtenerDeviceId();
    this.obtenerUbicacion();

    this.clockInterval = setInterval(() => {
      this.horaActual = new Date();
      this.cdr.markForCheck();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
    if (this.delayInterval) {
      clearInterval(this.delayInterval);
    }
    this.detenerCamara();
  }

  obtenerInfoDispositivo(): string {
    const navegador = navigator.userAgent;
    const plataforma = navigator.platform;
    return `${plataforma} - ${navegador.substring(0, 50)}`;
  }

  obtenerDeviceId(): string {
    let id = localStorage.getItem('device_id');
    if (!id) {
      if (crypto && crypto.randomUUID) {
        id = crypto.randomUUID();
      } else {
        id = Math.random().toString(36).substring(2) + Date.now().toString(36);
      }
      localStorage.setItem('device_id', id);
    }
    return id;
  }

  obtenerUbicacion(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitud = position.coords.latitude;
          this.longitud = position.coords.longitude;
          this.precisionGps = position.coords.accuracy;
          this.calcularDistanciaSucursal();
        },
        (error) => {
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }

  calcularDistanciaSucursal(): void {
    if (this.mainService.sucursalActual?.localizacion && this.latitud && this.longitud) {
      const loc = this.mainService.sucursalActual.localizacion;
      const parts = loc.split(/[,;]/);
      if (parts.length >= 2) {
        const sucLat = parseFloat(parts[0]);
        const sucLon = parseFloat(parts[1]);
        if (!isNaN(sucLat) && !isNaN(sucLon)) {
          this.distanciaSucursal = this.getDistanceFromLatLonInM(this.latitud, this.longitud, sucLat, sucLon);
        }
      }
    }
  }

  getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return Math.floor(d);
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  abrirBuscadorEmpleado(): void {
    let data: SearchListtDialogData = {
      titulo: "Buscar Usuario",
      tableData: [
        { id: "id", nombre: "Id", width: "10%" },
        {
          id: "nombre",
          nombre: "Nombre",
          nested: true,
          nestedId: "persona",
          width: "50%",
        },
        {
          id: "documento",
          nombre: "Documento",
          nested: true,
          nestedId: "persona",
          width: "40%",
        },
      ],
      query: this.searchUsuario,
    };

    this.matDialog
      .open(SearchListDialogComponent, {
        data: data,
        height: "80vh",
        width: "70vw",
        panelClass: 'search-dialog-dark'
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((usuario: Usuario) => {
        if (usuario) {
          this.seleccionarUsuario(usuario);
        }
      });
  }

  seleccionarUsuario(usuario: Usuario): void {
    this.usuarioSeleccionado = usuario;
    this.empleadoNombreControl.setValue(usuario.persona?.nombre);
    this.empleadoIdControl.setValue(usuario.id);
    this.verificarMarcacionActiva();

    this.reconocimientoExitoso = false;
    this.mostrandoCamara = false;
    this.mensajeReconocimiento = '';
    this.mensajeErrorFoto = '';
    this.referenciaDescriptor = null;
    this.embeddingCapturado = null;
    this.detenerCamara();

    this.prepararReconocimiento();

    this.cdr.markForCheck();
  }

  async prepararReconocimiento(): Promise<void> {
    this.mensajeErrorFoto = '';
    let fotoUrl = this.usuarioSeleccionado.avatar;

    let filename = null;
    if (this.usuarioSeleccionado.persona?.imagenes) {
      const imgs = this.usuarioSeleccionado.persona.imagenes.split(',');
      if (imgs.length > 0) filename = imgs[0].trim();
    }

    if (!fotoUrl && filename) {
      try {
        const images = await this.usuarioService.onGetUsuarioImages(
          this.usuarioSeleccionado.id,
          'perfil',
          true,
          { networkError: { propagate: true, show: false } }
        ).toPromise();

        if (images && images.length > 0) {
          fotoUrl = images[0];
        } else {
          const localImages = await this.usuarioService.onGetUsuarioImages(this.usuarioSeleccionado.id, 'perfil', false).toPromise();
          if (localImages && localImages.length > 0) {
            fotoUrl = localImages[0];
          }
        }
      } catch (e) {
        console.warn('Error fetching image from central, trying local...', e);
        try {
          const localImages = await this.usuarioService.onGetUsuarioImages(this.usuarioSeleccionado.id, 'perfil', false).toPromise();
          if (localImages && localImages.length > 0) {
            fotoUrl = localImages[0];
          }
        } catch (e2) {
          console.error('Error fetching image from local', e2);
        }
      }
    }
    if (!fotoUrl) {
      this.mensajeErrorFoto = 'Primera vez marcando. Se capturará su foto de perfil.';
      this.cdr.markForCheck();
      await this.capturarYGuardarFotoPerfil();
      return;
    }

    try {
      this.cargando = true;
      this.referenciaDescriptor = await this.faceService.getDescriptor(fotoUrl);
      this.cargando = false;

      if (!this.referenciaDescriptor) {
        this.mensajeErrorFoto = 'No se pudo detectar un rostro en la foto de perfil del usuario.';
      } else {
        this.iniciarReconocimiento();
      }
    } catch (error) {
      this.mensajeErrorFoto = 'Error al procesar la foto de perfil.';
      this.cargando = false;
    }
    this.cdr.markForCheck();
  }

  async capturarYGuardarFotoPerfil(): Promise<void> {
    this.mostrandoCamara = true;
    this.mensajeReconocimiento = 'Capturando foto de perfil. Mire a la cámara...';
    this.cdr.markForCheck();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
        this.videoElement.nativeElement.onloadedmetadata = async () => {
          this.videoElement.nativeElement.play();

          await new Promise(resolve => setTimeout(resolve, 2000));

          const detection = await this.faceService.detect(this.videoElement.nativeElement);

          if (detection.face && detection.face.length > 0) {
            const canvas = this.canvasElement.nativeElement;
            const video = this.videoElement.nativeElement;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageBase64 = canvas.toDataURL('image/png');

            this.detenerCamara();
            this.mensajeReconocimiento = 'Guardando foto de perfil...';
            this.cargando = true;
            this.cdr.markForCheck();

            try {
              await this.usuarioService.onSaveUsuarioImage(
                this.usuarioSeleccionado.id,
                'perfil',
                imageBase64,
                false
              ).toPromise();

              this.notificacionService.notification$.next({
                texto: 'Foto de perfil guardada exitosamente',
                color: NotificacionColor.success,
                duracion: 3
              });

              if (this.usuarioSeleccionado.persona) {
                this.usuarioSeleccionado.persona.imagenes = 'captured';
              }

              this.cargando = false;
              this.mensajeErrorFoto = '';
              this.cdr.markForCheck();

              await this.prepararReconocimiento();
            } catch (error) {
              this.cargando = false;
              this.mensajeErrorFoto = 'Error al guardar la foto de perfil';
              this.notificacionService.notification$.next({
                texto: 'Error al guardar la foto de perfil',
                color: NotificacionColor.danger,
                duracion: 3
              });
              this.cdr.markForCheck();
            }
          } else {
            this.detenerCamara();
            this.mensajeErrorFoto = 'No se detectó un rostro. Intente nuevamente.';
            this.cdr.markForCheck();
          }
        }
      }
    } catch (err) {
      this.mensajeReconocimiento = 'No se pudo acceder a la cámara.';
      this.mostrandoCamara = false;
      this.cdr.markForCheck();
    }
  }

  async iniciarReconocimiento(): Promise<void> {
    if (!this.referenciaDescriptor) return;

    this.mostrandoCamara = true;
    this.mensajeReconocimiento = 'Iniciando cámara...';
    this.cdr.markForCheck();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
        this.videoElement.nativeElement.onloadedmetadata = () => {
          this.videoElement.nativeElement.play();
          this.detectarBucle();
        }
      }
    } catch (err) {
      this.mensajeReconocimiento = 'No se pudo acceder a la cámara.';
      this.mostrandoCamara = false;
    }
    this.cdr.markForCheck();
  }

  detenerCamara(): void {
    this.detecting = false;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mostrandoCamara = false;
  }

  async detectarBucle(): Promise<void> {
    this.detecting = true;
    this.mensajeReconocimiento = 'Buscando rostro...';
    this.cdr.markForCheck();

    const loop = async () => {
      if (!this.detecting || !this.videoElement || !this.referenciaDescriptor) return;

      if (this.videoElement.nativeElement.paused || this.videoElement.nativeElement.ended) {
        return setTimeout(() => loop());
      }

      const detection = await this.faceService.detect(this.videoElement.nativeElement);

      if (detection.face && detection.face.length > 0) {
        const tensor = Array.from(detection.face[0].embedding);
        const similarity = this.faceService.similarity(this.referenciaDescriptor, tensor);

        if (similarity > 0.6) {
          this.reconocimientoExitoso = true;
          this.embeddingCapturado = tensor;
          this.videoElement.nativeElement.pause();
          this.detecting = false;
          this.cdr.markForCheck();

        } else {
          this.mensajeReconocimiento = `Rostro detectado. Similitud insuficiente (${(similarity * 100).toFixed(0)}%)`;
        }
      } else {
        this.mensajeReconocimiento = 'No se detecta rostro. Centra tu cara.';
      }

      this.cdr.markForCheck();
      if (!this.reconocimientoExitoso) {
        requestAnimationFrame(loop);
      }
    };

    loop();
  }

  limpiarEmpleado(): void {
    if (this.delayInterval) clearInterval(this.delayInterval);
    this.detenerCamara();
    this.referenciaDescriptor = null;
    this.embeddingCapturado = null;
    this.reconocimientoExitoso = false;
    this.mostrandoCamara = false;
    this.mensajeErrorFoto = '';

    this.usuarioSeleccionado = null;
    this.empleadoNombreControl.setValue(null);
    this.empleadoIdControl.setValue(null);
    this.marcacionActiva = null;
    this.horaEntrada = null;
    this.estaEnJornada = false;
    this.marcacionesHoy = [];
    this.cdr.markForCheck();
  }

  verificarMarcacionActiva(): void {
    if (!this.usuarioSeleccionado?.id) return;

    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
    const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59).toISOString();

    this.cargando = true;
    this.marcacionService.onGetMarcacionesPorUsuario(
      this.usuarioSeleccionado.id,
      inicioHoy,
      finHoy,
      0,
      100,
      true,
      { networkError: { propagate: true, show: false } }
    ).pipe(
      timeout(5000),
      untilDestroyed(this),
      catchError(err => {
        return this.marcacionService.onGetMarcacionesPorUsuario(
          this.usuarioSeleccionado.id,
          inicioHoy,
          finHoy,
          0,
          100,
          false,
          { networkError: { propagate: true, show: false } }
        );
      })
    )
      .subscribe({
        next: (marcaciones) => {
          this.cargando = false;
          this.marcacionesHoy = marcaciones || [];

          const marcacionSinSalida = marcaciones?.find(m =>
            m.fechaEntrada && !m.fechaSalida
          );

          if (marcacionSinSalida) {
            this.marcacionActiva = marcacionSinSalida;
            this.horaEntrada = new Date(marcacionSinSalida.fechaEntrada);
            this.estaEnJornada = true;
          } else {
            this.marcacionActiva = null;
            this.horaEntrada = null;
            this.estaEnJornada = false;
          }

          this.cdr.markForCheck();
        },
        error: (err) => {
          this.cargando = false;
          console.error('Error al verificar marcación activa', err);
          this.cdr.markForCheck();
        }
      });
  }

  registrarEntrada(): void {
    if (!this.usuarioSeleccionado?.id) {
      this.notificacionService.notification$.next({
        texto: 'Debe seleccionar su usuario primero',
        color: NotificacionColor.warn,
        duracion: 3
      });
      return;
    }

    if (!this.sucursalActualId) {
      this.notificacionService.notification$.next({
        texto: 'No se pudo determinar la sucursal actual',
        color: NotificacionColor.danger,
        duracion: 3
      });
      return;
    }

    if (!this.reconocimientoExitoso) {
      this.notificacionService.notification$.next({
        texto: 'Debe verificar su identidad con reconocimiento facial primero',
        color: NotificacionColor.warn,
        duracion: 3
      });
      return;
    }

    this.cargando = true;
    this.marcacionService.onRegistrarEntrada(
      this.usuarioSeleccionado.id,
      this.sucursalActualId,
      this.latitud,
      this.longitud,
      this.precisionGps,
      this.distanciaSucursal,
      this.deviceId,
      this.dispositivoInfo,
      this.embeddingCapturado
    ).pipe(untilDestroyed(this))
      .subscribe({
        next: (marcacion) => {
          this.cargando = false;
          this.marcacionActiva = marcacion;
          this.horaEntrada = new Date(marcacion.fechaEntrada);
          this.estaEnJornada = true;

          // Actualizar lista de hoy
          if (this.marcacionesHoy) {
            this.marcacionesHoy = [marcacion, ...this.marcacionesHoy];
          } else {
            this.marcacionesHoy = [marcacion];
          }

          this.cdr.markForCheck();

          this.notificacionService.notification$.next({
            texto: `Entrada registrada exitosamente a las ${this.horaEntrada.toLocaleTimeString()}`,
            color: NotificacionColor.success,
            duracion: 4
          });

          this.reconocimientoExitoso = false;
          this.mostrandoCamara = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargando = false;
          this.cdr.markForCheck();
        }
      });
  }

  registrarSalida(): void {
    if (!this.marcacionActiva?.id) {
      this.notificacionService.notification$.next({
        texto: 'No hay una entrada activa para registrar salida',
        color: NotificacionColor.warn,
        duracion: 3
      });
      return;
    }

    if (!this.sucursalActualId) {
      this.notificacionService.notification$.next({
        texto: 'No se pudo determinar la sucursal actual',
        color: NotificacionColor.danger,
        duracion: 3
      });
      return;
    }

    if (!this.reconocimientoExitoso) {
      this.notificacionService.notification$.next({
        texto: 'Debe verificar su identidad con reconocimiento facial primero',
        color: NotificacionColor.warn,
        duracion: 3
      });
      return;
    }

    this.cargando = true;
    this.marcacionService.onRegistrarSalida(
      this.marcacionActiva.id,
      this.sucursalActualId,
      this.latitud,
      this.longitud,
      this.precisionGps,
      this.distanciaSucursal
    ).pipe(untilDestroyed(this))
      .subscribe({
        next: (marcacion) => {
          this.cargando = false;
          const horaSalida = new Date(marcacion.fechaSalida);

          // Actualizar lista de hoy
          if (this.marcacionesHoy) {
            const index = this.marcacionesHoy.findIndex(m => m.id === marcacion.id);
            if (index !== -1) {
              // Creamos una copia del array para asegurar que Angular detecte el cambio si la estrategia es OnPush
              const nuevaLista = [...this.marcacionesHoy];
              nuevaLista[index] = marcacion;
              this.marcacionesHoy = nuevaLista;
            }
          }

          this.notificacionService.notification$.next({
            texto: `Salida registrada exitosamente a las ${horaSalida.toLocaleTimeString()}`,
            color: NotificacionColor.success,
            duracion: 4
          });

          this.marcacionActiva = null;
          this.horaEntrada = null;
          this.estaEnJornada = false;

          this.reconocimientoExitoso = false;
          this.mostrandoCamara = false;

          this.cdr.markForCheck();
        },
        error: () => {
          this.cargando = false;
          this.cdr.markForCheck();
        }
      });
  }
}
