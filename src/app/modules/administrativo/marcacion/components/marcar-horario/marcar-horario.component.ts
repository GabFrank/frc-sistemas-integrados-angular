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
import { MatTableDataSource } from '@angular/material/table';
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
  mostrarInputBusquedaID = false;

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
  @ViewChild('snapshotCanvas') snapshotCanvas: ElementRef<HTMLCanvasElement>;

  reconocimientoExitoso = false;
  mostrandoCamara = false;
  mensajeReconocimiento = '';
  mensajeErrorFoto = '';
  private referenciaDescriptor: number[] | null = null;
  private embeddingCapturado: number[] | null = null;
  detecting = false;
  private lastCheckTime = 0;
  esperandoCapturaPerfil = false;
  searchPaused = false;
  countdownSegundos: number = 0;
  private countdownInterval: any;
  fotoCapturada = false;
  snapshotDataUrl: string | null = null;
  private snapshotEmbedding: number[] | null = null;
  buscandoAutomaticamente = false;
  private autoSearchInterval: any;
  intentosBusqueda = 0;
  maxIntentosBusqueda = 10;
  private excludedUserIds: number[] = [];
  capturaMultiplePaso = 0;
  capturaMultipleFotos: Array<{ imageBase64: string; embedding: number[]; score: number }> = [];
  capturaMultipleMensajes = [
    '',
    'Paso 1/3: Gire su rostro ligeramente a la IZQUIERDA',
    'Paso 2/3: Gire su rostro ligeramente a la DERECHA',
    'Paso 3/3: Mire de FRENTE a la cámara'
  ];

  marcacionesHoy: Marcacion[] = [];
  dataSource = new MatTableDataSource<Marcacion>([]);
  displayedColumns: string[] = ['id', 'usuario', 'entrada', 'salida'];

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
    this.excludedUserIds = [];
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
    this.detenerCountdown();
    this.detenerAutoSearch();
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
    this.dataSource.data = [];
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
    this.esperandoCapturaPerfil = false;
    this.fotoCapturada = false;
    this.snapshotDataUrl = null;
    this.snapshotEmbedding = null;
    this.buscandoAutomaticamente = false;
    this.intentosBusqueda = 0;
    this.countdownSegundos = 0;
    this.excludedUserIds = [];
    this.capturaMultiplePaso = 0;
    this.capturaMultipleFotos = [];
    this.detenerCountdown();
    this.detenerAutoSearch();
    this.camaraService.detenerCamara();
  }

  async iniciarReconocimiento(): Promise<void> {
    if (this.usuarioSeleccionado) {
      await this.iniciarCamaraParaVerificacion();
    } else {
      await this.iniciarCamaraBusqueda();
    }
  }
  async iniciarCamaraBusqueda(): Promise<void> {
    if (this.usuarioSeleccionado) return;
    this.limpiarEstadosCamara();
    this.mostrandoCamara = true;
    this.searchPaused = false;
    this.fotoCapturada = false;
    this.snapshotDataUrl = null;
    this.mensajeReconocimiento = 'Iniciando cámara...';
    this.cdr.detectChanges();

    try {
      const stream = await this.camaraService.iniciarCamara();
      for (let i = 0; i < 5; i++) {
        if (this.videoElement) break;
        await new Promise(resolve => setTimeout(resolve, 100));
        this.cdr.detectChanges();
      }

      if (!this.videoElement) {
        throw new Error('No se encontró el elemento de video');
      }

      const video = this.videoElement.nativeElement;
      video.srcObject = stream;

      await new Promise<void>((resolve) => {
        video.onloadedmetadata = async () => {
          await video.play().catch(err => console.error('Error al reproducir:', err));
          resolve();
        };
      });
      this.iniciarCountdown(3);
      this.cdr.markForCheck();

    } catch (e) {
      console.error('Error en iniciarCamaraBusqueda:', e);
      this.mensajeReconocimiento = 'Error al acceder a la cámara.';
      this.mostrandoCamara = false;
      this.detecting = false;
      this.camaraService.detenerCamara();
      this.cdr.markForCheck();
    }
  }

  private iniciarCountdown(segundos: number): void {
    this.countdownSegundos = segundos;
    this.mensajeReconocimiento = `Captura automática en ${this.countdownSegundos}s - Posicione su rostro`;
    this.cdr.markForCheck();

    this.countdownInterval = setInterval(() => {
      this.countdownSegundos--;
      if (this.countdownSegundos <= 0) {
        this.detenerCountdown();
        this.capturarSnapshotAutomatico();
      } else {
        this.mensajeReconocimiento = `Captura automática en ${this.countdownSegundos}s - Posicione su rostro`;
        this.cdr.markForCheck();
      }
    }, 1000);
  }

  private detenerCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private detenerAutoSearch(): void {
    this.buscandoAutomaticamente = false;
    if (this.autoSearchInterval) {
      clearTimeout(this.autoSearchInterval);
      this.autoSearchInterval = null;
    }
  }

  async capturarSnapshotAutomatico(): Promise<void> {
    if (!this.videoElement || !this.mostrandoCamara) return;
    const video = this.videoElement.nativeElement;

    this.snapshotDataUrl = this.camaraService.capturarFoto(video);

    video.pause();
    this.fotoCapturada = true;
    this.searchPaused = true;
    this.detecting = true;
    this.mensajeReconocimiento = 'Foto capturada. Analizando rostro...';
    this.cdr.markForCheck();

    this.camaraService.detenerCamara();

    try {
      this.snapshotEmbedding = await this.faceHelper.obtenerDescriptorReferencia(this.snapshotDataUrl);

      if (!this.snapshotEmbedding) {
        this.mensajeReconocimiento = 'No se detectó rostro en la foto. Intente nuevamente.';
        this.detecting = false;
        this.cdr.markForCheck();
        return;
      }
      this.iniciarBusquedaAutomatica();
    } catch (e) {
      console.error('Error al procesar snapshot:', e);
      this.mensajeReconocimiento = 'Error al procesar la captura.';
      this.detecting = false;
      this.cdr.markForCheck();
    }
  }

  private async iniciarBusquedaAutomatica(): Promise<void> {
    if (!this.snapshotEmbedding || !this.fotoCapturada) return;

    this.buscandoAutomaticamente = true;
    this.intentosBusqueda = 0;
    this.ejecutarBusquedaConSnapshot();
  }

  private async ejecutarBusquedaConSnapshot(): Promise<void> {
    if (!this.buscandoAutomaticamente || !this.snapshotEmbedding) return;

    this.intentosBusqueda++;
    this.detecting = true;
    this.mensajeReconocimiento = `Buscando persona... (intento ${this.intentosBusqueda}/${this.maxIntentosBusqueda})`;
    this.cdr.markForCheck();

    try {
      const resultado = await this.faceHelper.buscarUsuarioPorEmbedding(this.snapshotEmbedding, this.excludedUserIds);

      if (resultado && resultado.confiable) {
        // ¡Encontrado!
        this.buscandoAutomaticamente = false;
        const pct = (resultado.similitudBackend * 100).toFixed(0);
        this.mensajeReconocimiento = `✓ Identificado: ${resultado.usuario.persona?.nombre} (${pct}%)`;
        this.detecting = false;
        this.cdr.markForCheck();

        setTimeout(() => {
          this.mostrandoCamara = false;
          this.fotoCapturada = false;
          this.snapshotDataUrl = null;
          this.seleccionarUsuario(resultado.usuario);
        }, 1200);
        return;
      }

      if (resultado && !resultado.confiable) {
        // Validación local falló → excluir este usuario y reintentar inmediatamente
        const userId = resultado.usuario.id;
        this.excludedUserIds.push(userId);
        console.log(`Descartado: ${resultado.usuario.persona?.nombre} (backend: ${(resultado.similitudBackend * 100).toFixed(0)}%, local: ${(resultado.similitudLocal * 100).toFixed(0)}%). Excluidos: [${this.excludedUserIds}]`);
        this.mensajeReconocimiento = `${resultado.usuario.persona?.nombre} descartado. Buscando siguiente...`;
        this.cdr.markForCheck();

        // Reintentar inmediatamente con la lista actualizada
        if (this.intentosBusqueda < this.maxIntentosBusqueda) {
          this.autoSearchInterval = setTimeout(() => {
            this.ejecutarBusquedaConSnapshot();
          }, 500);
          return;
        }
      }

      // No se encontró a nadie o se agotaron los intentos
      if (this.intentosBusqueda >= this.maxIntentosBusqueda || !resultado) {
        this.buscandoAutomaticamente = false;
        this.detecting = false;
        this.mensajeReconocimiento = 'No se encontró coincidencia. Intente con nueva foto.';
        this.cdr.markForCheck();
        return;
      }

      // Sin resultado del backend → reintentar
      this.mensajeReconocimiento = `Sin coincidencia. Reintentando... (${this.intentosBusqueda}/${this.maxIntentosBusqueda})`;
      this.cdr.markForCheck();

      this.autoSearchInterval = setTimeout(() => {
        this.ejecutarBusquedaConSnapshot();
      }, 3000);

    } catch (e) {
      console.error('Error en búsqueda automática:', e);
      this.buscandoAutomaticamente = false;
      this.detecting = false;
      this.mensajeReconocimiento = 'Error en la búsqueda. Intente nuevamente.';
      this.cdr.markForCheck();
    }
  }

  detenerAutoSearchPublic(): void {
    this.detenerAutoSearch();
    this.detecting = false;
    this.mensajeReconocimiento = 'Búsqueda detenida. Intente con nueva foto.';
    this.cdr.markForCheck();
  }

  async retomarCamara(): Promise<void> {
    // Reiniciar todo el flujo: nueva captura
    this.detenerAutoSearch();
    this.fotoCapturada = false;
    this.snapshotDataUrl = null;
    this.snapshotEmbedding = null;
    this.detecting = false;
    this.searchPaused = false;
    this.intentosBusqueda = 0;
    this.excludedUserIds = [];
    this.mostrandoCamara = false;
    this.cdr.markForCheck();

    // Reiniciar cámara desde cero
    await this.iniciarCamaraBusqueda();
  }

  async reintentarCaptura(): Promise<void> {
    if (!this.videoElement || !this.mostrandoCamara) return;

    const video = this.videoElement.nativeElement;
    this.detecting = true;
    this.mensajeReconocimiento = 'Capturando rostro...';
    this.cdr.markForCheck();

    await new Promise(r => setTimeout(r, 500));

    const embedding = await this.faceHelper.obtenerEmbeddingFrame(video);

    if (!embedding) {
      this.mensajeReconocimiento = 'No se detectó rostro. Presione para reintentar.';
      this.detecting = false;
      this.cdr.markForCheck();
      return;
    }

    this.mensajeReconocimiento = 'Verificando identidad...';
    this.cdr.markForCheck();

    const resultado = await this.faceHelper.buscarYValidarUsuario(embedding, video);

    if (resultado && resultado.confiable) {
      const pct = (resultado.similitudBackend * 100).toFixed(0);
      this.mensajeReconocimiento = `Identificado: ${resultado.usuario.persona?.nombre} (${pct}%)`;
      this.detecting = false;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.camaraService.detenerCamara();
        this.mostrandoCamara = false;
        this.seleccionarUsuario(resultado.usuario);
      }, 800);
    } else if (resultado && !resultado.confiable) {
      this.mensajeReconocimiento = `Match insuficiente: ${resultado.usuario.persona?.nombre} (${(resultado.similitudBackend * 100).toFixed(0)}%). Presione para reintentar.`;
      this.detecting = false;
      this.cdr.markForCheck();
    } else {
      this.mensajeReconocimiento = 'No se encontró coincidencia. Presione para reintentar.';
      this.detecting = false;
      this.cdr.markForCheck();
    }
  }

  activarBusquedaManual(): void {
    this.usuarioHelper.abrirBuscador(this.matDialog)
      .pipe(untilDestroyed(this))
      .subscribe(usuario => {
        if (usuario) {
          this.mostrandoCamara = false;
          this.fotoCapturada = false;
          this.snapshotDataUrl = null;
          this.seleccionarUsuario(usuario);
        }
        this.cdr.markForCheck();
      });
  }

  cancelarBusquedaManual(): void {
    this.mostrarInputBusquedaID = false;
    this.cdr.markForCheck();
  }

  async iniciarProcesoValidacionFacial(usuario: Usuario): Promise<void> {
    this.cargando = true;
    const fotoUrl = await this.usuarioHelper.obtenerFotoPerfil(usuario);
    this.cargando = false;

    if (!fotoUrl) {
      this.mensajeErrorFoto = 'Sin foto de perfil';
      await this.capturarYGuardarFotoPerfilMultiple();
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
    this.esperandoCapturaPerfil = true;
    this.mensajeReconocimiento = 'Posicione su rostro y presione "Guardar Foto"';
    this.cdr.detectChanges();

    try {
      const stream = await this.camaraService.iniciarCamara();
      for (let i = 0; i < 5; i++) {
        if (this.videoElement) break;
        await new Promise(resolve => setTimeout(resolve, 100));
        this.cdr.detectChanges();
      }

      if (this.videoElement) {
        const video = this.videoElement.nativeElement;
        video.srcObject = stream;
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = async () => {
            await video.play().catch(err => console.error('Error playing video:', err));
            resolve();
          };
        });
      }
      this.cdr.markForCheck();
    } catch (e) {
      console.error('Error en capturarYGuardarFotoPerfil:', e);
      this.mensajeReconocimiento = 'No se pudo acceder a la cámara.';
      this.esperandoCapturaPerfil = false;
      this.cdr.markForCheck();
    }
  }

  async tomarFotoPerfil(): Promise<void> {
    if (!this.videoElement || !this.usuarioSeleccionado) return;

    const video = this.videoElement.nativeElement;
    this.esperandoCapturaPerfil = false;
    this.detecting = true;
    this.mensajeReconocimiento = 'Capturando foto...';
    this.cdr.markForCheck();

    const exito = await this.faceHelper.capturarYGuardarFotoPerfil(this.usuarioSeleccionado.id, video);
    this.detecting = false;

    if (exito) {
      if (this.usuarioSeleccionado.persona) this.usuarioSeleccionado.persona.imagenes = 'captured';
      this.mensajeErrorFoto = '';
      this.camaraService.detenerCamara();
      this.mostrandoCamara = false;
      this.cdr.markForCheck();
      await this.iniciarProcesoValidacionFacial(this.usuarioSeleccionado);
    } else {
      this.mensajeErrorFoto = 'Error al capturar. Intente de nuevo.';
      this.esperandoCapturaPerfil = true;
      this.mensajeReconocimiento = 'Posicione su rostro y presione "Guardar Foto"';
      this.cdr.markForCheck();
    }
  }

  async capturarYGuardarFotoPerfilMultiple(): Promise<void> {
    this.mostrandoCamara = true;
    this.capturaMultiplePaso = 1;
    this.capturaMultipleFotos = [];
    this.mensajeReconocimiento = this.capturaMultipleMensajes[1];
    this.cdr.detectChanges();

    try {
      const stream = await this.camaraService.iniciarCamara();
      for (let i = 0; i < 5; i++) {
        if (this.videoElement) break;
        await new Promise(resolve => setTimeout(resolve, 100));
        this.cdr.detectChanges();
      }

      if (this.videoElement) {
        const video = this.videoElement.nativeElement;
        video.srcObject = stream;
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = async () => {
            await video.play().catch(err => console.error('Error playing video:', err));
            resolve();
          };
        });
      }
      this.cdr.markForCheck();
    } catch (e) {
      console.error('Error en capturarYGuardarFotoPerfilMultiple:', e);
      this.mensajeReconocimiento = 'No se pudo acceder a la cámara.';
      this.capturaMultiplePaso = 0;
      this.cdr.markForCheck();
    }
  }

  async tomarFotoPerfilMultiple(): Promise<void> {
    if (!this.videoElement || !this.usuarioSeleccionado || this.capturaMultiplePaso === 0) return;

    const video = this.videoElement.nativeElement;
    this.detecting = true;
    this.mensajeReconocimiento = 'Capturando foto...';
    this.cdr.markForCheck();

    const resultado = await this.faceHelper.capturarFrameConScore(video);
    this.detecting = false;

    if (!resultado) {
      this.mensajeReconocimiento = `No se detectó rostro. ${this.capturaMultipleMensajes[this.capturaMultiplePaso]}`;
      this.cdr.markForCheck();
      return;
    }

    console.log(`Captura paso ${this.capturaMultiplePaso}: score=${resultado.score.toFixed(4)}`);
    this.capturaMultipleFotos.push(resultado);

    if (this.capturaMultiplePaso < 3) {
      this.capturaMultiplePaso++;
      this.mensajeReconocimiento = this.capturaMultipleMensajes[this.capturaMultiplePaso];
      this.cdr.markForCheck();
      return;
    }
    this.mensajeReconocimiento = 'Procesando embedding maestro...';
    this.cdr.markForCheck();

    const embeddingMaestro = this.faceHelper.fusionarEmbeddings(this.capturaMultipleFotos);
    if (!embeddingMaestro) {
      this.mensajeReconocimiento = 'Las fotos capturadas no tienen calidad suficiente. Intente de nuevo.';
      this.capturaMultiplePaso = 1;
      this.capturaMultipleFotos = [];
      this.cdr.markForCheck();
      return;
    }
    const fotoFrontal = this.capturaMultipleFotos[this.capturaMultipleFotos.length - 1].imageBase64;
    const exito = await this.faceHelper.guardarFotoPerfilConEmbeddingMaestro(
      this.usuarioSeleccionado.id,
      fotoFrontal,
      embeddingMaestro
    );

    if (exito) {
      if (this.usuarioSeleccionado.persona) this.usuarioSeleccionado.persona.imagenes = 'captured';
      this.mensajeErrorFoto = '';
      this.camaraService.detenerCamara();
      this.mostrandoCamara = false;
      this.capturaMultiplePaso = 0;
      this.capturaMultipleFotos = [];
      this.cdr.markForCheck();
      await this.iniciarProcesoValidacionFacial(this.usuarioSeleccionado);
    } else {
      this.mensajeErrorFoto = 'Error al guardar. Intente de nuevo.';
      this.capturaMultiplePaso = 1;
      this.capturaMultipleFotos = [];
      this.mensajeReconocimiento = this.capturaMultipleMensajes[1];
      this.cdr.markForCheck();
    }
  }

  async iniciarCamaraParaVerificacion(): Promise<void> {
    this.mostrandoCamara = true;
    this.mensajeReconocimiento = 'Iniciando cámara...';
    this.cdr.detectChanges();

    try {
      const stream = await this.camaraService.iniciarCamara();
      for (let i = 0; i < 5; i++) {
        if (this.videoElement) break;
        await new Promise(resolve => setTimeout(resolve, 100));
        this.cdr.detectChanges();
      }

      if (this.videoElement) {
        const video = this.videoElement.nativeElement;
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play().catch(err => console.error('Error al reproducir:', err));
          this.detecting = true;
          this.bucleDeteccion();
        };
      } else {
        throw new Error('No se encontró el elemento de video');
      }
    } catch (e) {
      console.error('Error en iniciarCamaraParaVerificacion:', e);
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
      return;
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
    this.dataSource.data = this.marcacionesHoy;
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
        const contexto = this.crearContexto(null);
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
      this.dataSource.data = this.marcacionesHoy;
    } else {
      const index = this.marcacionesHoy.findIndex(m => m.id === marcacion.id);
      if (index !== -1) {
        const nuevaLista = [...this.marcacionesHoy];
        nuevaLista[index] = marcacion;
        this.marcacionesHoy = nuevaLista;
        this.dataSource.data = this.marcacionesHoy;
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
