import { Component, Inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpEventType, HttpClientModule } from '@angular/common/http';
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
import { UsuariosDestinatariosNotificacionGQL } from '../../graphql/usuariosDestinatariosNotificacion.gql';
import { UsuariosConAccesoNotificacionGQL } from '../../graphql/usuariosConAccesoNotificacion.gql';
import { Observable, BehaviorSubject, combineLatest, interval, of } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap, startWith, tap, catchError, filter } from 'rxjs/operators';

export interface ComentariosDialogData {
  notificacionId: number;
  notificacion: {
    id: number;
    titulo: string;
  };
  comentarioId?: number;
}

interface UsuarioExtendido {
  id: number;
  nickname: string;
  persona?: { id: number; nombre: string; imagenes?: string };
  initials: string;
  color: string;
  color2: string;
  avatarUrl: string;
}

interface ComentarioExtendido extends NotificacionComentario {
  initials: string;
  color: string;
  color2: string;
  lightColor: string;
  formattedText: string;
  isSameAuthor: boolean;
  replyColor?: string;
  replyLightColor?: string;
  avatarUrl: string;
  mediaUrl?: string;
}



@UntilDestroy()
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
    MatTooltipModule,
    HttpClientModule
  ],
  templateUrl: './comentarios-notificacion-dialog.component.html',
  styleUrls: ['./comentarios-notificacion-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComentariosNotificacionDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ComentariosNotificacionDialogComponent>);
  public readonly data = inject<ComentariosDialogData>(MAT_DIALOG_DATA);
  private readonly comentariosService = inject(ComentariosNotificacionService);
  private readonly usuariosActivosGQL = inject(UsuariosActivosGQL);
  private readonly usuariosDestinatariosGQL = inject(UsuariosDestinatariosNotificacionGQL);
  private readonly usuariosConAccesoGQL = inject(UsuariosConAccesoNotificacionGQL);
  private readonly mainService = inject(MainService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly http = inject(HttpClient);

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



  usuarios: Array<{ id: number; nickname: string; persona?: { id: number; nombre: string } }> = [];
  usuariosFiltrados: UsuarioExtendido[] = [];
  usuariosFiltrados$: Observable<UsuarioExtendido[]>;
  textoBusqueda$ = new BehaviorSubject<string>('');
  mostrarAutocompletado = false;
  posicionCursor = 0;

  usuariosDestinatarios: UsuarioExtendido[] = [];
  usuariosDestinatariosFiltrados: UsuarioExtendido[] = [];
  filtroUsuarios: string = '';
  cargandoUsuarios = false;

  private userColorsCache = new Map<number, string>();
  private userLightColorsCache = new Map<number, string>();
  private userInitialsCache = new Map<string, string>();

  private ultimoConteoComentarios = 0;

  constructor() {
    this.usuariosFiltrados$ = this.textoBusqueda$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map((busqueda) => {
        this.usuariosFiltrados = this.filtrarUsuarios(busqueda);
        this.cdr.markForCheck();
        return this.usuariosFiltrados;
      })
    );

    this.usuariosFiltrados$.pipe(untilDestroyed(this)).subscribe();
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

  private getUserColor(usuarioId: number): string {
    if (!this.userColorsCache.has(usuarioId)) {
      const colors = [
        '#f44336', '#43a047', '#e53935', '#66bb6a', '#d32f2f', '#388e3c',
        '#ef5350', '#81c784', '#c62828', '#2e7d32', '#ff5252', '#4caf50',
        '#b71c1c', '#1b5e20', '#ff1744', '#00e676',
      ];
      this.userColorsCache.set(usuarioId, colors[usuarioId % colors.length]);
    }
    return this.userColorsCache.get(usuarioId)!;
  }

  private getUserLightColor(usuarioId: number): string {
    if (!this.userLightColorsCache.has(usuarioId)) {
      const baseColor = this.getUserColor(usuarioId);
      const hex = baseColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      this.userLightColorsCache.set(usuarioId, `rgba(${r}, ${g}, ${b}, 0.15)`);
    }
    return this.userLightColorsCache.get(usuarioId)!;
  }

  private getUserInitials(usuario: { nickname: string; persona?: { nombre?: string } }): string {
    const key = `${usuario.nickname}-${usuario.persona?.nombre || ''}`;
    if (!this.userInitialsCache.has(key)) {
      const nombre = usuario.persona?.nombre || usuario.nickname || 'U';
      const partes = nombre.trim().split(' ').filter(p => p.length > 0);
      let initials: string;
      if (partes.length >= 2) {
        initials = (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
      } else {
        initials = nombre.substring(0, Math.min(2, nombre.length)).toUpperCase();
      }
      this.userInitialsCache.set(key, initials);
    }
    return this.userInitialsCache.get(key)!;
  }

  private formatearComentario(comentario: string): string {
    if (!comentario) {
      return '';
    }

    const textoEscapado = comentario
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const textoFormateado = textoEscapado.replace(
      /@([a-zA-Z0-9_]+)/g,
      '<span class="mention">@$1</span>'
    );

    return textoFormateado.replace(/\n/g, '<br>');
  }

  private obtenerAvatar(usuario: any): string {
    return usuario?.persona?.imagenes || `https://ui-avatars.com/api/?name=${usuario?.nickname}&background=random`;
  }

  private mapComentario(c: NotificacionComentario, index: number, array: NotificacionComentario[]): ComentarioExtendido {
    const isSameAuthor = index > 0 && array[index - 1].usuario.id === c.usuario.id;
    const color = this.getUserColor(c.usuario.id);
    const color2 = this.getUserColor(c.usuario.id + 1);
    const lightColor = this.getUserLightColor(c.usuario.id);
    const initials = this.getUserInitials(c.usuario);
    const formattedText = this.formatearComentario(c.comentario);
    const avatarUrl = this.obtenerAvatar(c.usuario);

    let replyColor: string | undefined;
    let replyLightColor: string | undefined;

    if (c.comentarioPadre) {
      replyColor = this.getUserColor(c.comentarioPadre.usuario.id);
      replyLightColor = this.getUserLightColor(c.comentarioPadre.usuario.id);
    }

    return {
      ...c,
      initials,
      color,
      color2,
      lightColor,
      formattedText,
      isSameAuthor,
      replyColor,
      replyLightColor,
      avatarUrl
    };
  }

  private mapUsuario(u: { id: number; nickname: string; persona?: { id: number; nombre: string; imagenes?: string } }): UsuarioExtendido {
    return {
      ...u,
      initials: this.getUserInitials(u),
      color: this.getUserColor(u.id),
      color2: this.getUserColor(u.id + 1),
      avatarUrl: this.obtenerAvatar(u)
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

    const textoAntesCursor = texto.substring(0, this.posicionCursor);
    const ultimoArroba = textoAntesCursor.lastIndexOf('@');

    if (ultimoArroba !== -1) {
      const textoDespuesArroba = textoAntesCursor.substring(ultimoArroba + 1);
      if (!textoDespuesArroba.includes('\n') && !textoDespuesArroba.endsWith(' ')) {
        this.mostrarAutocompletado = true;
        this.textoBusqueda$.next(textoDespuesArroba);
        this.cdr.markForCheck();
        return;
      }
    }

    this.mostrarAutocompletado = false;
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

  uploadFile(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'frc-sistemas-informaticos');

    this.isUploading = true;
    this.uploadProgress = 0;
    this.cdr.markForCheck();

    return this.http.post<any>('https://api.cloudinary.com/v1_1/daf3cny90/auto/upload', formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress) {
          if (event.total) {
            this.uploadProgress = Math.round(100 * event.loaded / event.total);
            this.cdr.markForCheck();
          }
        } else if (event.type === HttpEventType.Response) {
          return event.body.secure_url;
        }
        return null;
      }),
      filter((url): url is string => !!url),
      tap(() => {
        this.isUploading = false;
        this.cdr.markForCheck();
      }),
      catchError(error => {
        this.isUploading = false;
        console.error('Error uploading to Cloudinary', error);
        if (error.error) {
          console.error('Cloudinary detailed error:', error.error);
        }
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
      this.uploadFile(this.selectedFile).subscribe({
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
    const commentaire = comentarioTexto || (mediaUrl ? 'Adjunto archivo multimedia' : '');
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
}

