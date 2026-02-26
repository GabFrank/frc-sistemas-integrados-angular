import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NotificacionesTableroService } from '../../services/notificaciones-tablero.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UsuarioSearchGQL } from '../../../personas/usuarios/graphql/usuarioSearch';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { Usuario } from '../../../personas/usuarios/usuario.model';

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
    FlexLayoutModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './notificacion-personalizada.component.html',
  styleUrls: ['./notificacion-personalizada.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificacionPersonalizadaComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<NotificacionPersonalizadaComponent>);
  private readonly notificacionesService = inject(NotificacionesTableroService);
  private readonly snackbarService = inject(NotificacionSnackbarService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly usuarioSearchGQL = inject(UsuarioSearchGQL);
  private readonly dialog = inject(MatDialog);

  tipoEnvio: 'todos' | 'especificos' = 'todos';
  titulo: string = '';
  mensaje: string = '';

  selectedUsuarios: Usuario[] = [];

  enviando: boolean = false;
  botonEnviarDeshabilitado: boolean = true;

  ngOnInit(): void {
  }

  onBuscarUsuario() {
    let tableData: TableData[] = [
      {
        id: 'id',
        nombre: 'Id',
        width: '50px'
      },
      {
        id: 'nickname',
        nombre: 'Usuario'
      },
      {
        id: 'nombre',
        nombre: 'Nombre',
        nested: true,
        nestedId: 'persona'
      }
    ];

    let data: SearchListtDialogData = {
      titulo: 'Buscar usuario',
      tableData: tableData,
      query: this.usuarioSearchGQL,
      search: true,
      isServidor: true
    };

    this.dialog.open(SearchListDialogComponent, {
      data: data,
      width: '60%',
      height: '80%'
    }).afterClosed().subscribe((res: Usuario) => {
      if (res != null) {
        // Verificar si ya está seleccionado
        if (!this.selectedUsuarios.some(u => u.id === res.id)) {
          this.selectedUsuarios = [...this.selectedUsuarios, res];
          this.validarFormulario();
          this.cdr.markForCheck();
        } else {
          this.snackbarService.openWarn('El usuario ya ha sido seleccionado.');
        }
      }
    });
  }

  removerUsuario(usuario: Usuario): void {
    this.selectedUsuarios = this.selectedUsuarios.filter(u => u.id !== usuario.id);
    this.validarFormulario();
    this.cdr.markForCheck();
  }

  onCancelar(): void {
    this.dialogRef.close();
  }

  validarFormulario(): void {
    const tituloValido = this.titulo && this.titulo.trim().length > 0;
    const mensajeValido = this.mensaje && this.mensaje.trim().length > 0;
    const destinatariosValidos = this.tipoEnvio === 'todos' ||
      (this.tipoEnvio === 'especificos' && this.selectedUsuarios.length > 0);

    this.botonEnviarDeshabilitado = !(tituloValido && mensajeValido && destinatariosValidos) || this.enviando;
    this.cdr.markForCheck();
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

    if (this.tipoEnvio === 'especificos' && this.selectedUsuarios.length === 0) {
      this.snackbarService.openWarn('Debe seleccionar al menos un usuario');
      return;
    }

    this.enviando = true;
    this.validarFormulario();

    const usuariosIds = this.tipoEnvio === 'especificos' ? this.selectedUsuarios.map(u => u.id) : null;

    this.notificacionesService
      .enviarNotificacionPersonalizada(this.titulo.toUpperCase(), this.mensaje, this.tipoEnvio, usuariosIds)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (result) => {
          this.enviando = false;
          this.validarFormulario();
          if (result) {
            const cantidadUsuarios = this.tipoEnvio === 'todos'
              ? 'todos los usuarios'
              : `${this.selectedUsuarios.length} usuario(s)`;
            this.snackbarService.openSucess(`Notificación enviada a ${cantidadUsuarios}`);
            this.dialogRef.close({ success: true });
          } else {
            this.snackbarService.openAlgoSalioMal('No se pudo enviar la notificación');
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.enviando = false;
          this.validarFormulario();
          console.error('Error al enviar notificación:', error);
          this.snackbarService.openAlgoSalioMal('Error al enviar la notificación');
          this.cdr.markForCheck();
        }
      });
  }
}