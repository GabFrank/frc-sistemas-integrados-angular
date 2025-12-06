import { Component, Inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
import { ComentariosNotificacionService } from '../../../../../services/comentarios-notificacion.service';
import { NotificacionComentario } from '../../graphql/comentariosNotificacion.gql';
import { GetUsuariosActivosGQL } from '../../graphql/getUsuariosActivos.gql';
import { GetUsuariosDestinatariosNotificacionGQL } from '../../graphql/getUsuariosDestinatariosNotificacion.gql';
import { GetUsuariosConAccesoNotificacionGQL } from '../../graphql/getUsuariosConAccesoNotificacion.gql';
import { MainService } from '../../../../../main.service';
import { Observable, BehaviorSubject, combineLatest, interval } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap, startWith, tap } from 'rxjs/operators';

export interface ComentariosDialogData {
  notificacionId: number;
  notificacion: {
    id: number;
    titulo: string;
  };
  comentarioId?: number;
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
    MatTooltipModule
  ],
  templateUrl: './comentarios-notificacion-dialog.component.html',
  styleUrls: ['./comentarios-notificacion-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComentariosNotificacionDialogComponent implements OnInit {
  comentarios: NotificacionComentario[] = [];
  nuevoComentario = '';
  comentarioPadreId: number | null = null;
  cargando = false;
  enviando = false;

  usuarios: Array<{ id: number; nickname: string; persona?: { id: number; nombre: string } }> = [];
  usuariosFiltrados: Array<{ id: number; nickname: string; persona?: { id: number; nombre: string } }> = [];
  usuariosFiltrados$: Observable<Array<{ id: number; nickname: string; persona?: { id: number; nombre: string } }>>;
  textoBusqueda$ = new BehaviorSubject<string>('');
  mostrarAutocompletado = false;
  posicionCursor = 0;

  usuariosDestinatarios: Array<{ id: number; nickname: string; persona?: { id: number; nombre: string } }> = [];
  cargandoUsuarios = false;
  filtroUsuarios = '';

  private ultimoConteoComentarios = 0;

  constructor(
    public dialogRef: MatDialogRef<ComentariosNotificacionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ComentariosDialogData,
    private comentariosService: ComentariosNotificacionService,
    private usuariosActivosGQL: GetUsuariosActivosGQL,
    private usuariosDestinatariosGQL: GetUsuariosDestinatariosNotificacionGQL,
    private usuariosConAccesoGQL: GetUsuariosConAccesoNotificacionGQL,
    private mainService: MainService,
    private cdr: ChangeDetectorRef
  ) {
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

  private scrollAComentario(comentarioId: number): void {
    const element = document.getElementById(`comentario-${comentarioId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Resaltar el comentario
      element.classList.add('highlighted-comment');
      setTimeout(() => {
        element.classList.remove('highlighted-comment');
      }, 3000);
    }
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
            this.comentarios = comentarios;
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
            // Comparar si hay cambios en los comentarios (por ID o cantidad)
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

              this.comentarios = comentarios;
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

    const threshold = 100; // Margen de 100px desde el final
    return comentariosList.scrollHeight - comentariosList.scrollTop - comentariosList.clientHeight < threshold;
  }

  private scrollAlFinal(): void {
    const comentariosList = document.querySelector('.comentarios-list') as HTMLElement;
    if (comentariosList) {
      comentariosList.scrollTop = comentariosList.scrollHeight;
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

  filtrarUsuarios(busqueda: string): Array<{ id: number; nickname: string; persona?: { id: number; nombre: string } }> {
    if (!busqueda || busqueda.length < 1) {
      return [];
    }

    const busquedaLower = busqueda.toLowerCase();
    return this.usuarios.filter(usuario => {
      const nickname = usuario.nickname?.toLowerCase() || '';
      const nombre = usuario.persona?.nombre?.toLowerCase() || '';
      return nickname.includes(busquedaLower) || nombre.includes(busquedaLower);
    }).slice(0, 10);
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

  seleccionarUsuario(usuario: { id: number; nickname: string; persona?: { id: number; nombre: string } }): void {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

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

  obtenerNombreUsuario(usuario: { nickname: string; persona?: { nombre: string } }): string {
    return usuario.persona?.nombre || usuario.nickname || 'Usuario';
  }

  enviarComentario(): void {
    const comentarioTexto = this.nuevoComentario.trim();
    if (!comentarioTexto || this.enviando) {
      return;
    }

    const comentarioPadreIdTemp = this.comentarioPadreId;

    this.nuevoComentario = '';
    this.comentarioPadreId = null;
    this.mostrarAutocompletado = false;
    this.cdr.markForCheck();

    const usuarioActual = this.mainService.usuarioActual;
    if (usuarioActual) {
      const comentarioPadreTemp = comentarioPadreIdTemp
        ? this.comentarios.find(c => c.id === comentarioPadreIdTemp)
        : undefined;

      const comentarioTemporal: NotificacionComentario = {
        id: -1,
        comentario: comentarioTexto,
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

      this.comentarios = [...this.comentarios, comentarioTemporal];
      this.cdr.markForCheck();

      setTimeout(() => {
        const comentariosList = document.querySelector('.comentarios-list');
        if (comentariosList) {
          comentariosList.scrollTop = comentariosList.scrollHeight;
        }
      }, 0);
    }

    this.enviando = true;
    this.cdr.markForCheck();

    this.comentariosService.crearComentario(
      this.data.notificacionId,
      comentarioTexto,
      comentarioPadreIdTemp || undefined
    ).pipe(
      untilDestroyed(this),
      switchMap(() => {
        return this.cargarComentarios(false);
      })
    )
      .subscribe({
        next: (comentarios) => {
          this.comentarios = comentarios;
          this.ultimoConteoComentarios = comentarios.length;
          this.enviando = false;

          this.comentariosService.obtenerConteoComentarios(this.data.notificacionId).subscribe();

          setTimeout(() => {
            this.scrollAlFinal();
          }, 100);

          this.cdr.markForCheck();
        },
        error: () => {
          this.comentarios = this.comentarios.filter(c => c.id !== -1);
          this.enviando = false;
          this.cargarComentarios().subscribe();
          this.cdr.markForCheck();
        }
      });
  }

  responderComentario(comentario: NotificacionComentario): void {
    this.comentarioPadreId = comentario.id;
    this.nuevoComentario = `@${comentario.usuario.nickname} `;

    setTimeout(() => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
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


  formatearComentario(texto: string): string {
    if (!texto) {
      return '';
    }

    const textoEscapado = texto
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
          if (result.errors) {
            this.usuariosDestinatarios = [];
          } else {
            this.usuariosDestinatarios = result.data?.data || [];
          }
          this.cargandoUsuarios = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.usuariosDestinatarios = [];
          this.cargandoUsuarios = false;
          this.cdr.markForCheck();
        }
      });
  }

  obtenerUsuariosDestinatariosFiltrados(): Array<{ id: number; nickname: string; persona?: { id: number; nombre: string } }> {
    if (!this.filtroUsuarios || this.filtroUsuarios.trim() === '') {
      return this.usuariosDestinatarios;
    }

    const filtroLower = this.filtroUsuarios.toLowerCase();
    return this.usuariosDestinatarios.filter(usuario => {
      const nickname = usuario.nickname?.toLowerCase() || '';
      const nombre = usuario.persona?.nombre?.toLowerCase() || '';
      return nickname.includes(filtroLower) || nombre.includes(filtroLower);
    });
  }
}