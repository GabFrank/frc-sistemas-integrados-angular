import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NotificacionesTableroService } from '../../../services/notificaciones-tablero.service';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'notificacion-personalizada',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './notificacion-personalizada.component.html',
  styleUrls: ['./notificacion-personalizada.component.scss']
})
export class NotificacionPersonalizadaComponent implements OnInit {
  tipoEnvio: 'todos' | 'especificos' = 'todos';
  titulo: string = '';
  mensaje: string = '';
  usuariosSeleccionados: number[] = [];
  usuariosDisponibles: any[] = [];
  usuariosFiltrados: any[] = [];
  busquedaUsuario: string = '';
  enviando: boolean = false;
  cargandoUsuarios: boolean = false;
  botonEnviarDeshabilitado: boolean = true;

  constructor(
    public dialogRef: MatDialogRef<NotificacionPersonalizadaComponent>,
    private notificacionesService: NotificacionesTableroService,
    private snackbarService: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }
  cargarUsuarios(): void {
    this.cargandoUsuarios = true;
    this.notificacionesService
      .obtenerUsuariosActivos()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (usuarios) => {
          this.usuariosDisponibles = usuarios;
          this.usuariosFiltrados = usuarios;
          this.cargandoUsuarios = false;
        },
        error: () => {
          this.snackbarService.openAlgoSalioMal('No se pudieron cargar los usuarios');
          this.cargandoUsuarios = false;
        }
      });
  }

  filtrarUsuarios(): void {
    if (!this.busquedaUsuario || this.busquedaUsuario.trim().length === 0) {
      this.usuariosFiltrados = this.usuariosDisponibles;
      return;
    }

    const termino = this.busquedaUsuario.toLowerCase().trim();
    this.usuariosFiltrados = this.usuariosDisponibles.filter(usuario => {
      const nickname = usuario.nickname ? usuario.nickname.toLowerCase() : '';
      const nombre = usuario.persona?.nombre ? usuario.persona.nombre.toLowerCase() : '';
      return nickname.includes(termino) || nombre.includes(termino);
    });
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
  validarFormulario(): void {
    const tituloValido = this.titulo && this.titulo.trim().length > 0;
    const mensajeValido = this.mensaje && this.mensaje.trim().length > 0;
    const destinatariosValidos = this.tipoEnvio === 'todos' || 
      (this.tipoEnvio === 'especificos' && this.usuariosSeleccionados.length > 0);
    
    this.botonEnviarDeshabilitado = !(tituloValido && mensajeValido && destinatariosValidos) || this.enviando;
  }

  onEnviar(): void {
    if (!this.titulo || this.titulo.trim().length === 0) {
      this.snackbarService.openWarn('El título no puede estar vacío');
      return;
    }

    if (!this.mensaje || this.mensaje.trim().length === 0) {
      this.snackbarService.openWarn('El mensaje no puede estar vacío');
      return;
    }

    if (this.tipoEnvio === 'especificos' && this.usuariosSeleccionados.length === 0) {
      this.snackbarService.openWarn('Debe seleccionar al menos un usuario');
      return;
    }

    this.enviando = true;
    this.validarFormulario();

    const usuariosIds = this.tipoEnvio === 'especificos' ? this.usuariosSeleccionados : null;

    this.notificacionesService
      .enviarNotificacionPersonalizada(this.titulo, this.mensaje, this.tipoEnvio, usuariosIds)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (result) => {
          this.enviando = false;
          this.validarFormulario();
          if (result) {
            const cantidadUsuarios = this.tipoEnvio === 'todos' 
              ? 'todos los usuarios' 
              : `${this.usuariosSeleccionados.length} usuario(s)`;
            this.snackbarService.openSucess(`Notificación enviada a ${cantidadUsuarios}`);
            this.dialogRef.close({ success: true });
          } else {
            this.snackbarService.openAlgoSalioMal('No se pudo enviar la notificación');
          }
        },
        error: (error) => {
          this.enviando = false;
          this.validarFormulario();
          console.error('Error al enviar notificación:', error);
          this.snackbarService.openAlgoSalioMal('Error al enviar la notificación');
        }
      });
  }
}
