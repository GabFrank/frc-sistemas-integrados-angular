import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UsuarioInput } from '../usuario-input.model';
import { Usuario } from '../usuario.model';
import { UsuarioService } from '../usuario.service';

export class AdicionarUsuarioDialogData {
  personaId: number;
  usuario: Usuario;
  isEditar = false;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-adicionar-usuario-dialog',
  templateUrl: './adicionar-usuario-dialog.component.html',
  styleUrls: ['./adicionar-usuario-dialog.component.scss']
})
export class AdicionarUsuarioDialogComponent implements OnInit {

  selectedUsuario = new Usuario;
  nicknameControl = new FormControl(null, Validators.required)
  activoControl = new FormControl(true)

  formGroup: FormGroup;
  isEditar = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarUsuarioDialogData,
    private matDialogRef: MatDialogRef<AdicionarUsuarioDialogComponent>,
    private usuarioService: UsuarioService
  ) {

  }

  ngOnInit(): void {

    this.formGroup = new FormGroup({
      'nickname': this.nicknameControl,
      'activo': this.activoControl
    })

    if (this.data?.usuario != null) {
      this.selectedUsuario = this.data.usuario;
    } else if (this.data?.personaId != null) {
      this.usuarioService.onGetUsuarioPorPersonaId(this.data?.personaId)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          console.log(res)
          if (res != null) {
            Object.assign(this.selectedUsuario, res);
            this.cargarDatos()
          }
        })
    }
  }

  cargarDatos() {
    this.nicknameControl.setValue(this.selectedUsuario.nickname)
    this.activoControl.setValue(this.selectedUsuario.activo)
    this.formGroup.disable()
  }

  onSave() {
    this.selectedUsuario.nickname = this.nicknameControl.value
    this.selectedUsuario.activo = this.activoControl.value
    this.usuarioService.onSaveUsuario(this.selectedUsuario.toInput()).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.selectedUsuario = res;
        this.matDialogRef.close(this.selectedUsuario)
      }
    })
  }

  onCancel() {
    this.matDialogRef.close();
  }

  onEnable() {
    this.isEditar = true;
    this.formGroup.enable()
  }

}
