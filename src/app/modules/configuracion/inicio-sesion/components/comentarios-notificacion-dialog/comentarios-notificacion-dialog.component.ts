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
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface ComentariosDialogData {
  notificacionId: number;
  notificacion: {
    id: number;
    titulo: string;
  };
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
  
  // Para autocompletado de @menciones
  usuarios: Array<{ id: number; nickname: string; persona?: { id: number; nombre: string } }> = [];
  usuariosFiltrados: Array<{ id: number; nickname: string; persona?: { id: number; nombre: string } }> = [];
  usuariosFiltrados$: Observable<Array<{ id: number; nickname: string; persona?: { id: number; nombre: string } }>>;
  textoBusqueda$ = new BehaviorSubject<string>('');
  mostrarAutocompletado = false;
  posicionCursor = 0;

  // Lista de usuarios destinatarios (para el panel izquierdo tipo WhatsApp)
  usuariosDestinatarios: Array<{ id: number; nickname: string; persona?: { id: number; nombre: string } }> = [];
  cargandoUsuarios = false;
  filtroUsuarios = '';

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
    // Configurar autocompletado de usuarios
    this.usuariosFiltrados$ = this.textoBusqueda$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map((busqueda) => {
        this.usuariosFiltrados = this.filtrarUsuarios(busqueda);
        this.cdr.markForCheck();
        return this.usuariosFiltrados;
      })
    );

    // Suscribirse para actualizar la lista filtrada
    this.usuariosFiltrados$.pipe(untilDestroyed(this)).subscribe();
  }

  ngOnInit(): void {
    this.cargarComentarios();
    this.cargarUsuariosActivos();
    this.cargarUsuariosDestinatarios();
  }

  cargarComentarios(): void {
    this.cargando = true;
    this.cdr.markForCheck();

    this.comentariosService.obtenerComentarios(this.data.notificacionId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (comentarios) => {
          this.comentarios = comentarios;
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargando = false;
          this.cdr.markForCheck();
        }
      });
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

    // Detectar si el usuario está escribiendo @
    const textoAntesCursor = texto.substring(0, this.posicionCursor);
    const ultimoArroba = textoAntesCursor.lastIndexOf('@');
    
    if (ultimoArroba !== -1) {
      const textoDespuesArroba = textoAntesCursor.substring(ultimoArroba + 1);
      // Si no hay espacio después del @, mostrar autocompletado
      // Permitir espacios en el autocompletado para nicknames con espacios
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
      
      // Restaurar el foco y posición del cursor
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

    // Guardar el comentario padre si existe
    const comentarioPadreIdTemp = this.comentarioPadreId;

    // Limpiar el input inmediatamente
    this.nuevoComentario = '';
    this.comentarioPadreId = null;
    this.mostrarAutocompletado = false;
    this.cdr.markForCheck();

    // Crear comentario temporal optimista
    const usuarioActual = this.mainService.usuarioActual;
    if (usuarioActual) {
      const comentarioPadreTemp = comentarioPadreIdTemp 
        ? this.comentarios.find(c => c.id === comentarioPadreIdTemp)
        : undefined;

      const comentarioTemporal: NotificacionComentario = {
        id: -1, // ID temporal
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

      // Agregar el comentario temporal a la lista inmediatamente
      this.comentarios = [...this.comentarios, comentarioTemporal];
      this.cdr.markForCheck();

      // Hacer scroll al final de la lista de comentarios
      setTimeout(() => {
        const comentariosList = document.querySelector('.comentarios-list');
        if (comentariosList) {
          comentariosList.scrollTop = comentariosList.scrollHeight;
        }
      }, 0);
    }

    this.enviando = true;
    this.cdr.markForCheck();

    // Enviar al servidor
    this.comentariosService.crearComentario(
      this.data.notificacionId,
      comentarioTexto,
      comentarioPadreIdTemp || undefined
    ).pipe(untilDestroyed(this))
    .subscribe({
      next: (comentarioReal) => {
        // Reemplazar el comentario temporal con el real
        const indiceTemporal = this.comentarios.findIndex(c => c.id === -1);
        if (indiceTemporal !== -1) {
          this.comentarios[indiceTemporal] = comentarioReal;
        } else {
          // Si no se encontró el temporal, agregar el real al final
          this.comentarios = [...this.comentarios, comentarioReal];
        }
        this.enviando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        // En caso de error, remover el comentario temporal y recargar
        this.comentarios = this.comentarios.filter(c => c.id !== -1);
        this.enviando = false;
        this.cargarComentarios();
        this.cdr.markForCheck();
      }
    });
  }

  responderComentario(comentario: NotificacionComentario): void {
    this.comentarioPadreId = comentario.id;
    this.nuevoComentario = `@${comentario.usuario.nickname} `;
    
    // Enfocar el textarea
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

    // Escapar HTML para seguridad
    const textoEscapado = texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // Reemplazar menciones @usuario con span destacado
    const textoFormateado = textoEscapado.replace(
      /@([a-zA-Z0-9_]+)/g,
      '<span class="mention">@$1</span>'
    );

    // Reemplazar saltos de línea con <br>
    return textoFormateado.replace(/\n/g, '<br>');
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  /**
   * Carga los usuarios con acceso a la notificación (destinatarios directos + usuarios con roles asociados)
   */
  cargarUsuariosDestinatarios(): void {
    this.cargandoUsuarios = true;
    this.cdr.markForCheck();

    this.usuariosConAccesoGQL.fetch({ notificacionId: this.data.notificacionId }, { fetchPolicy: 'network-only' })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (result: any) => {
          if (result.errors) {
            console.error('Errores GraphQL al cargar usuarios:', result.errors);
            this.usuariosDestinatarios = [];
          } else {
            this.usuariosDestinatarios = result.data?.data || [];
          }
          this.cargandoUsuarios = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error al cargar usuarios con acceso:', err);
          this.usuariosDestinatarios = [];
          this.cargandoUsuarios = false;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Filtra los usuarios destinatarios según el texto de búsqueda
   */
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

