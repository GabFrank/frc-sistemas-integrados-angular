import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComentariosNotificacionService } from '../../services/comentarios-notificacion.service';
import { NotificacionComentario } from '../../graphql/comentariosNotificacion.gql';
import { MainService } from '../../../../main.service';
import { UsuariosActivosGQL } from '../../graphql/usuariosActivos.gql';
import { UsuariosConAccesoNotificacionGQL } from '../../graphql/usuariosConAccesoNotificacion.gql';
import { Observable, interval, of } from 'rxjs';
import { switchMap, tap, catchError, map } from 'rxjs/operators';
import { MediaUploadService } from '../../../../shared/services/media-upload.service';
import { AudioRecordingService, EstadoGrabacion } from '../../../../shared/services/audio-recording.service';
import { AvatarService } from '../../../../shared/services/avatar.service';
import { MediaTypeService } from '../../../../shared/services/media-type.service';
import { TextFormatterService } from '../../../../shared/services/text-formatter.service';
import { MencionUsuarioService } from '../../../../shared/services/mencion-usuario.service';
import { ComentariosDialogData, UsuarioExtendido, ComentarioExtendido } from './comentarios.models';

export { ComentariosDialogData } from './comentarios.models';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-comentarios-notificacion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './comentarios-notificacion-dialog.component.html',
  styleUrls: ['./comentarios-notificacion-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComentariosNotificacionDialogComponent implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<ComentariosNotificacionDialogComponent>);
  public readonly data = inject<ComentariosDialogData>(MAT_DIALOG_DATA);
  private readonly comentariosService = inject(ComentariosNotificacionService);
  private readonly usuariosActivosGQL = inject(UsuariosActivosGQL);
  private readonly usuariosConAccesoGQL = inject(UsuariosConAccesoNotificacionGQL);
  private readonly mainService = inject(MainService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly mediaUploadService = inject(MediaUploadService);
  private readonly audioRecordingService = inject(AudioRecordingService);
  private readonly avatarService = inject(AvatarService);
  private readonly mediaTypeService = inject(MediaTypeService);
  private readonly textFormatterService = inject(TextFormatterService);
  private readonly mencionService = inject(MencionUsuarioService);

  @ViewChild('mensajeTextarea') mensajeTextarea?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  comentarios: ComentarioExtendido[] = [];
  nuevoComentario = '';
  comentarioPadreId: number | null = null;
  cargando = false;
  enviando = false;

  selectedFile: File | null = null;
  filePreview: string | null = null;
  isUploading = false;
  uploadProgress = 0;

  readonly estadoGrabacion$ = this.audioRecordingService.estado$;
  readonly duracionFormateada$ = this.audioRecordingService.duracionFormateada$;

  usuarios: Array<{ id: number; nickname: string; persona?: { id: number; nombre: string } }> = [];
  usuariosFiltrados: UsuarioExtendido[] = [];
  mostrarAutocompletado = false;
  posicionCursor = 0;

  usuariosDestinatarios: UsuarioExtendido[] = [];
  usuariosDestinatariosFiltrados: UsuarioExtendido[] = [];
  filtroUsuarios: string = '';
  cargandoUsuarios = false;

  private ultimoConteoComentarios = 0;
  audioWaveformBars = Array.from({ length: 30 }, () => Math.floor(Math.random() * 20) + 4);

  constructor() {
    this.mencionService.textoBusqueda$.pipe(
      untilDestroyed(this),
      map(busqueda => {
        this.usuariosFiltrados = this.filtrarUsuarios(busqueda);
        this.cdr.markForCheck();
        return this.usuariosFiltrados;
      })
    ).subscribe();
  }

  ngOnInit(): void {
    this.cargarComentarios().subscribe(() => {
      if (this.data.comentarioId) {
        setTimeout(() => {
          this.scrollAComentario(this.data.comentarioId!);
        }, 500);
      }
    });
    this.cargarUsuariosActivos();
    this.cargarUsuariosDestinatarios();
    this.iniciarPollingComentarios();
  }

  private formatearComentario(comentario: string): string {
    return this.textFormatterService.formatearComentario(comentario);
  }

  private mapComentario(c: NotificacionComentario, index: number, array: NotificacionComentario[]): ComentarioExtendido {
    const isSameAuthor = index > 0 && array[index - 1].usuario.id === c.usuario.id;
    const datosAvatar = this.avatarService.calcularDatosAvatar(c.usuario);
    const formattedText = this.formatearComentario(c.comentario);
    const tipoMedia = c.mediaUrl ? this.mediaTypeService.obtenerTipoMedia(c.mediaUrl) : 'desconocido';
    const nombreArchivo = c.mediaUrl ? this.mediaTypeService.obtenerNombreArchivo(c.mediaUrl) : '';

    let replyColor: string | undefined;
    let replyLightColor: string | undefined;

    if (c.comentarioPadre) {
      replyColor = this.avatarService.obtenerColor(c.comentarioPadre.usuario.id);
      replyLightColor = this.avatarService.obtenerColorClaro(c.comentarioPadre.usuario.id);
    }

    return {
      ...c,
      initials: datosAvatar.iniciales,
      color: datosAvatar.color,
      color2: this.avatarService.obtenerColor(c.usuario.id + 1),
      lightColor: datosAvatar.colorClaro,
      formattedText,
      isSameAuthor,
      replyColor,
      replyLightColor,
      avatarUrl: datosAvatar.avatarUrl,
      tipoMedia,
      nombreArchivo
    };
  }

  private mapUsuario(u: { id: number; nickname: string; persona?: { id: number; nombre: string; imagenes?: string } }): UsuarioExtendido {
    const datosAvatar = this.avatarService.calcularDatosAvatar(u);
    return {
      ...u,
      initials: datosAvatar.iniciales,
      color: datosAvatar.color,
      color2: this.avatarService.obtenerColor(u.id + 1),
      avatarUrl: datosAvatar.avatarUrl
    };
  }

  cargarComentarios(mostrarCargando: boolean = true): Observable<NotificacionComentario[]> {
    if (mostrarCargando) {
      this.cargando = true;
      this.cdr.markForCheck();
    }

    return this.comentariosService.obtenerComentarios(this.data.notificacionId)
      .pipe(
        untilDestroyed(this),
        tap({
          next: (comentarios) => {
            this.comentarios = comentarios.map((c, i) => this.mapComentario(c, i, comentarios));
            this.ultimoConteoComentarios = comentarios.length;
            this.cargando = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.cargando = false;
            this.cdr.markForCheck();
          }
        })
      );
  }

  iniciarPollingComentarios(): void {
    setTimeout(() => {
      interval(3000)
        .pipe(
          switchMap(() => this.comentariosService.obtenerComentarios(this.data.notificacionId)),
          untilDestroyed(this)
        )
        .subscribe({
          next: (comentarios) => {
            const hayCambios = comentarios.length !== this.ultimoConteoComentarios ||
              comentarios.some((c, index) => {
                const comentarioAnterior = this.comentarios[index];
                return !comentarioAnterior ||
                  comentarioAnterior.id !== c.id ||
                  comentarioAnterior.actualizadoEn !== c.actualizadoEn;
              });

            if (hayCambios) {
              const conteoAnterior = this.ultimoConteoComentarios;
              const habiaComentarios = this.comentarios.length > 0;
              const estabaAlFinal = this.estaAlFinalDelScroll();

              this.comentarios = comentarios.map((c, i) => this.mapComentario(c, i, comentarios));
              this.ultimoConteoComentarios = comentarios.length;

              if (habiaComentarios && comentarios.length > conteoAnterior && estabaAlFinal) {
                setTimeout(() => {
                  this.scrollAlFinal();
                }, 100);
              }

              this.cdr.markForCheck();
            }
          },
          error: () => {
          }
        });
    }, 1000);
  }

  private estaAlFinalDelScroll(): boolean {
    const comentariosList = document.querySelector('.comentarios-list') as HTMLElement;
    if (!comentariosList) return false;

    const threshold = 100;
    return comentariosList.scrollHeight - comentariosList.scrollTop - comentariosList.clientHeight < threshold;
  }

  private scrollAlFinal(): void {
    const comentariosList = document.querySelector('.comentarios-list') as HTMLElement;
    if (comentariosList) {
      comentariosList.scrollTop = comentariosList.scrollHeight;
    }
  }

  private scrollAComentario(comentarioId: number): void {
    const element = document.getElementById(`comentario-${comentarioId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlighted-comment');
      setTimeout(() => {
        element.classList.remove('highlighted-comment');
      }, 3000);
    }
  }

  cargarUsuariosActivos(): void {
    this.usuariosActivosGQL.fetch({}, { fetchPolicy: 'cache-first' })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (result: any) => {
          this.usuarios = result.data?.data || [];
          this.cdr.markForCheck();
        }
      });
  }

  filtrarUsuarios(busqueda: string): UsuarioExtendido[] {
    if (!busqueda || busqueda.length < 1) {
      return [];
    }

    const busquedaLower = busqueda.toLowerCase();
    return this.usuarios.filter(usuario => {
      const nickname = usuario.nickname?.toLowerCase() || '';
      const nombre = usuario.persona?.nombre?.toLowerCase() || '';
      return nickname.includes(busquedaLower) || nombre.includes(busquedaLower);
    }).slice(0, 10)
      .map(u => this.mapUsuario(u));
  }

  onTextareaInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const texto = textarea.value;
    this.posicionCursor = textarea.selectionStart;

    this.mostrarAutocompletado = this.mencionService.detectarMencion(texto, this.posicionCursor);
    this.cdr.markForCheck();
  }

  adjustTextareaHeight(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      setTimeout(() => {
        this.adjustTextareaHeight(event);
      }, 0);
    }
  }

  onFiltroUsuariosChange(value: string): void {
    this.filtroUsuarios = value;
    this.actualizarUsuariosDestinatariosFiltrados();
    this.cdr.markForCheck();
  }

  actualizarUsuariosDestinatariosFiltrados(): void {
    const filtro = this.filtroUsuarios.toLowerCase().trim();
    if (!filtro) {
      this.usuariosDestinatariosFiltrados = this.usuariosDestinatarios;
      return;
    }
    this.usuariosDestinatariosFiltrados = this.usuariosDestinatarios.filter(usuario => {
      const nickname = usuario.nickname?.toLowerCase() || '';
      const nombre = usuario.persona?.nombre?.toLowerCase() || '';
      return nickname.includes(filtro) || nombre.includes(filtro);
    });
  }

  seleccionarUsuario(usuario: UsuarioExtendido): void {
    if (!this.mensajeTextarea) return;
    const textarea = this.mensajeTextarea.nativeElement;

    const texto = textarea.value;
    const textoAntesCursor = texto.substring(0, this.posicionCursor);
    const ultimoArroba = textoAntesCursor.lastIndexOf('@');

    if (ultimoArroba !== -1) {
      const textoAntesArroba = texto.substring(0, ultimoArroba);
      const textoDespuesCursor = texto.substring(this.posicionCursor);
      const nickname = usuario.nickname || '';

      this.nuevoComentario = textoAntesArroba + '@' + nickname + ' ' + textoDespuesCursor;
      this.mostrarAutocompletado = false;

      setTimeout(() => {
        textarea.focus();
        const nuevaPosicion = ultimoArroba + 1 + nickname.length + 1;
        textarea.setSelectionRange(nuevaPosicion, nuevaPosicion);
      }, 0);

      this.cdr.markForCheck();
    }
  }

  triggerFileInput(): void {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = () => {
        this.filePreview = reader.result as string;
        this.cdr.markForCheck();
      };

      reader.readAsDataURL(this.selectedFile);
      this.cdr.markForCheck();
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.filePreview = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    this.cdr.markForCheck();
  }

  subirArchivo(archivo: File): Observable<string> {
    this.isUploading = true;
    this.uploadProgress = 0;
    this.cdr.markForCheck();

    this.mediaUploadService.progreso$.pipe(
      untilDestroyed(this)
    ).subscribe(progreso => {
      this.uploadProgress = progreso.progreso;
      this.isUploading = progreso.estado === 'subiendo';
      this.cdr.markForCheck();
    });

    return this.mediaUploadService.subirArchivo(archivo).pipe(
      tap(() => {
        this.isUploading = false;
        this.cdr.markForCheck();
      }),
      catchError(error => {
        this.isUploading = false;
        this.cdr.markForCheck();
        throw error;
      })
    );
  }

  enviarComentario(): void {
    const comentarioTexto = this.nuevoComentario.trim();
    if ((!comentarioTexto && !this.selectedFile) || this.enviando || this.isUploading) {
      return;
    }

    this.enviando = true;

    if (this.selectedFile) {
      this.subirArchivo(this.selectedFile).subscribe({
        next: (url) => {
          this.procesarEnvioComentario(comentarioTexto, url);
          this.removeFile();
        },
        error: () => {
          this.enviando = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.procesarEnvioComentario(comentarioTexto);
    }
  }

  private procesarEnvioComentario(comentarioTexto: string, mediaUrl?: string): void {
    const commentaire = comentarioTexto || (mediaUrl ? 'Adjunto archivo' : '');
    const comentarioPadreIdTemp = this.comentarioPadreId;

    this.nuevoComentario = '';
    this.comentarioPadreId = null;
    this.mostrarAutocompletado = false;

    if (this.mensajeTextarea) {
      this.mensajeTextarea.nativeElement.style.height = '20px';
    }

    this.cdr.markForCheck();

    const usuarioActual = this.mainService.usuarioActual;

    if (usuarioActual) {
      const comentarioPadreTemp = comentarioPadreIdTemp
        ? this.comentarios.find(c => c.id === comentarioPadreIdTemp)
        : undefined;

      const comentarioTemporalRaw: NotificacionComentario = {
        id: -1,
        comentario: commentaire,
        mediaUrl: mediaUrl,
        creadoEn: new Date().toISOString(),
        actualizadoEn: new Date().toISOString(),
        usuario: {
          id: usuarioActual.id,
          nickname: usuarioActual.nickname || '',
          persona: usuarioActual.persona ? {
            id: usuarioActual.persona.id,
            nombre: usuarioActual.persona.nombre || ''
          } : undefined
        },
        comentarioPadre: comentarioPadreTemp ? {
          id: comentarioPadreTemp.id,
          usuario: {
            id: comentarioPadreTemp.usuario.id,
            nickname: comentarioPadreTemp.usuario.nickname
          }
        } : undefined
      };

      const comentarioTemporal = this.mapComentario(comentarioTemporalRaw, this.comentarios.length, [...this.comentarios, comentarioTemporalRaw]);
      this.comentarios = [...this.comentarios, comentarioTemporal];
      this.cdr.markForCheck();

      setTimeout(() => {
        this.scrollAlFinal();
      }, 0);
    }

    this.comentariosService.crearComentario(
      this.data.notificacionId,
      commentaire,
      comentarioPadreIdTemp || undefined,
      mediaUrl
    ).pipe(
      untilDestroyed(this),
      switchMap(() => {
        return this.cargarComentarios(false);
      }),
      catchError(() => {
        this.comentarios = this.comentarios.filter(c => c.id !== -1);
        this.enviando = false;
        this.cargarComentarios().subscribe();
        this.cdr.markForCheck();
        return of([]);
      })
    )
      .subscribe({
        next: (comentarios) => {
          if (comentarios.length > 0) {
            this.comentarios = comentarios.map((c, i) => this.mapComentario(c, i, comentarios));
            this.ultimoConteoComentarios = comentarios.length;
            this.enviando = false;
            this.comentariosService.obtenerConteoComentarios(this.data.notificacionId).subscribe();

            setTimeout(() => {
              this.scrollAlFinal();
            }, 100);

            this.cdr.markForCheck();
          }
        }
      });
  }

  responderComentario(comentario: ComentarioExtendido): void {
    this.comentarioPadreId = comentario.id;
    this.nuevoComentario = `@${comentario.usuario.nickname} `;

    setTimeout(() => {
      if (this.mensajeTextarea) {
        const textarea = this.mensajeTextarea.nativeElement;
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    }, 0);

    this.cdr.markForCheck();
  }

  cancelarRespuesta(): void {
    this.comentarioPadreId = null;
    this.cdr.markForCheck();
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  cargarUsuariosDestinatarios(): void {
    this.cargandoUsuarios = true;
    this.cdr.markForCheck();

    this.usuariosConAccesoGQL.fetch({ notificacionId: this.data.notificacionId }, { fetchPolicy: 'network-only' })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (result: any) => {
          const rawUsuarios = result.errors ? [] : result.data?.data || [];
          this.usuariosDestinatarios = rawUsuarios.map(u => this.mapUsuario(u));
          this.actualizarUsuariosDestinatariosFiltrados();
          this.cargandoUsuarios = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.usuariosDestinatarios = [];
          this.usuariosDestinatariosFiltrados = [];
          this.cargandoUsuarios = false;
          this.cdr.markForCheck();
        }
      });
  }

  descargarMedia(url: string): void {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = url.split('/').pop() || 'archivo';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async startRecording(): Promise<void> {
    await this.audioRecordingService.iniciarGrabacion();
    this.cdr.markForCheck();
  }

  stopRecording(): void {
    this.audioRecordingService.detenerGrabacion();
    this.cdr.markForCheck();
  }

  cancelRecording(): void {
    this.audioRecordingService.cancelarGrabacion();
    this.cdr.markForCheck();
  }

  removeRecordedAudio(): void {
    this.audioRecordingService.eliminarAudioGrabado();
    this.cdr.markForCheck();
  }

  sendAudioMessage(): void {
    const estado = this.audioRecordingService.obtenerEstadoActual();
    if (!estado.audioGrabado || this.enviando || this.isUploading) {
      return;
    }

    this.enviando = true;
    const audioFile = new File([estado.audioGrabado], `audio_${Date.now()}.webm`, { type: 'audio/webm' });

    this.subirArchivo(audioFile).subscribe({
      next: (url) => {
        this.procesarEnvioComentario('Adjunto archivo multimedia', url);
        this.removeRecordedAudio();
      },
      error: () => {
        this.enviando = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleAudioPlay(event: Event): void {
    const button = event.currentTarget as HTMLElement;
    const container = button.closest('.whatsapp-audio-player');
    if (!container) return;

    const audio = container.querySelector('.hidden-audio') as HTMLAudioElement;
    const icon = button.querySelector('mat-icon');
    const durationSpan = container.querySelector('.audio-duration');

    if (!audio) return;

    if (audio.paused) {
      document.querySelectorAll('.hidden-audio').forEach((otherAudio: Element) => {
        const audioEl = otherAudio as HTMLAudioElement;
        if (audioEl !== audio && !audioEl.paused) {
          audioEl.pause();
          const otherBtn = audioEl.closest('.whatsapp-audio-player')?.querySelector('.audio-play-btn mat-icon');
          if (otherBtn) otherBtn.textContent = 'play_arrow';
        }
      });

      audio.play();
      if (icon) icon.textContent = 'pause';
    } else {
      audio.pause();
      if (icon) icon.textContent = 'play_arrow';
    }

    audio.onloadedmetadata = () => {
      if (durationSpan && audio.duration) {
        const mins = Math.floor(audio.duration / 60);
        const secs = Math.floor(audio.duration % 60);
        durationSpan.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      }
    };

    audio.ontimeupdate = () => {
      if (durationSpan) {
        const mins = Math.floor(audio.currentTime / 60);
        const secs = Math.floor(audio.currentTime % 60);
        durationSpan.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      }
    };

    audio.onended = () => {
      if (icon) icon.textContent = 'play_arrow';
      audio.currentTime = 0;
    };
  }

  ngOnDestroy(): void {
    this.audioRecordingService.destruir();
  }
}

