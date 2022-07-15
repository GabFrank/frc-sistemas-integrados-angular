import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UsuarioInput } from '../usuario-input.model';
import { Usuario } from '../usuario.model';
import { UsuarioService } from '../usuario.service';

export class AdicionarUsuarioDialogData {
  persona: Persona;
  usuario: Usuario;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Persona } from '../../persona/persona.model';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-adicionar-usuario-dialog',
  templateUrl: './adicionar-usuario-dialog.component.html',
  styleUrls: ['./adicionar-usuario-dialog.component.scss']
})
export class AdicionarUsuarioDialogComponent implements OnInit {

  selectedUsuario = new Usuario;
  selectedPersona: Persona;
  nicknameControl = new FormControl(null, Validators.required)
  activoControl = new FormControl(true)
  formGroup: FormGroup;
  isEditting = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: AdicionarUsuarioDialogData,
    private dialogRef: MatDialogRef<AdicionarUsuarioDialogComponent>,
    private usuarioService: UsuarioService
  ) { }

  ngOnInit(): void {
    console.log(this.data);
    
    this.formGroup = new FormGroup({
      nickname: this.nicknameControl,
      activo: this.activoControl
    })

    if (this.data.usuario != null) {
      Object.assign(this.selectedUsuario, this.data.usuario)
      this.selectedPersona = this.selectedUsuario.persona;
      this.cargarDatos()
    } else {
      this.isEditting = true
    }
  }

  cargarDatos() {
    this.nicknameControl.setValue(this.selectedUsuario.nickname)
    this.activoControl.setValue(this.selectedUsuario.activo)
    this.formGroup.disable()
  }

  onCancel() {
    this.dialogRef.close(null)
  }

  onSave() {
    this.selectedUsuario.nickname = this.nicknameControl.value
    this.selectedUsuario.activo = this.activoControl.value
    this.selectedUsuario.persona = this.selectedPersona;
    this.selectedUsuario.password = '123';
    this.usuarioService.onSaveUsuario(this.selectedUsuario.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.dialogRef.close(res)
        }
      })
  }

}
