import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

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
import { environment } from '../../../../../../environments/environment';

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
  esperandoParaMarcar = false;
  tiempoEspera = 0;
  private delayInterval: any;


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
        this.usuarioService.onGetUsuarioPorPersonaId(valor)
          .pipe(untilDestroyed(this))
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

  abrirBuscadorEmpleado(): void {
    let data: SearchListtDialogData = {
      titulo: "Buscar Empleado",
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
        const images = await this.usuarioService.onGetUsuarioImages(this.usuarioSeleccionado.id, 'perfil').toPromise();
        if (images && images.length > 0) {
          fotoUrl = images[0];
        } else {
          console.log('Image not found in Filial. Fetching from Central...');
          const query = {
            query: `query ($id: ID!, $type: String!) { data: getUsuarioImages(id: $id, type: $type) }`,
            variables: { id: this.usuarioSeleccionado.id, type: 'perfil' }
          };
          const centralUrl = `http://${environment.serverCentralIp}:${environment.serverCentralPort}/graphql`;
          const response: any = await this.http.post(centralUrl, query).toPromise();

          if (response.data && response.data.data && response.data.data.length > 0) {
            const base64 = response.data.data[0];
            await this.usuarioService.onSaveUsuarioImage(this.usuarioSeleccionado.id, 'perfil', base64).toPromise();
            fotoUrl = base64;
          }
        }
      } catch (e) {
        console.error('Error fetching image from central or filial', e);
      }
    }

    if (!fotoUrl) {
      this.mensajeErrorFoto = 'El usuario no tiene una foto de perfil válida para la verificación facial.';
      this.cdr.markForCheck();
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
      console.error('Error getting descriptor from profile photo:', error);
      this.mensajeErrorFoto = 'Error al procesar la foto de perfil.';
      this.cargando = false;
    }
    this.cdr.markForCheck();
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
      console.error('Error accessing camera:', err);
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
        const tensor = detection.face[0].embedding as number[];
        const similarity = this.faceService.similarity(this.referenciaDescriptor, tensor);

        if (similarity > 0.6) {
          this.reconocimientoExitoso = true;
          // this.detenerCamara(); // Keep camera open

          this.esperandoParaMarcar = true;
          this.tiempoEspera = 5;
          this.mensajeReconocimiento = `¡Identidad verificada! Espere ${this.tiempoEspera}s...`;
          this.cdr.markForCheck();

          // Start countdown
          if (this.delayInterval) clearInterval(this.delayInterval);
          this.delayInterval = setInterval(() => {
            if (!this.reconocimientoExitoso) { // If reset happens
              clearInterval(this.delayInterval);
              return;
            }

            this.tiempoEspera--;
            if (this.tiempoEspera <= 0) {
              clearInterval(this.delayInterval);
              this.esperandoParaMarcar = false;
              this.detenerCamara();
            } else {
              this.mensajeReconocimiento = `¡Identidad verificada! Espere ${this.tiempoEspera}s...`;
            }
            this.cdr.markForCheck();
          }, 1000);

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
    this.reconocimientoExitoso = false;
    this.mostrandoCamara = false;
    this.mensajeErrorFoto = '';
    this.esperandoParaMarcar = false;
    this.tiempoEspera = 0;

    this.usuarioSeleccionado = null;
    this.empleadoNombreControl.setValue(null);
    this.empleadoIdControl.setValue(null);
    this.marcacionActiva = null;
    this.horaEntrada = null;
    this.estaEnJornada = false;
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
      finHoy
    ).pipe(untilDestroyed(this))
      .subscribe(marcaciones => {
        this.cargando = false;

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
      null,
      null,
      null,
      null,
      null,
      this.dispositivoInfo,
      true
    ).pipe(untilDestroyed(this))
      .subscribe({
        next: (marcacion) => {
          this.cargando = false;
          this.marcacionActiva = marcacion;
          this.horaEntrada = new Date(marcacion.fechaEntrada);
          this.estaEnJornada = true;
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
      null,
      null,
      null,
      null
    ).pipe(untilDestroyed(this))
      .subscribe({
        next: (marcacion) => {
          this.cargando = false;
          const horaSalida = new Date(marcacion.fechaSalida);

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
