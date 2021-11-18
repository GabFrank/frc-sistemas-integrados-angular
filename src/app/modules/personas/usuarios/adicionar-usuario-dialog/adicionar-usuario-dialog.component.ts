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

@Component({
  selector: 'app-adicionar-usuario-dialog',
  templateUrl: './adicionar-usuario-dialog.component.html',
  styleUrls: ['./adicionar-usuario-dialog.component.scss']
})
export class AdicionarUsuarioDialogComponent implements OnInit {

  selectedUsuario: Usuario;
  nicknameControl = new FormControl(null, Validators.required)
  passwordControl = new FormControl(null, [Validators.required, Validators.minLength(3)])
  hidePassword = true;
  formGroup: FormGroup;
  isEditing = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarUsuarioDialogData,
    private matDialogRef: MatDialogRef<AdicionarUsuarioDialogComponent>,
    private usuarioService: UsuarioService
  ) { 
    if(data?.usuario != null){
      this.selectedUsuario = data.usuario;
      this.setState('view')
    }
  }

  ngOnInit(): void {
  }

  onSave(){
    let input = new UsuarioInput;
    if(this.selectedUsuario!=null){
      input.id = this.selectedUsuario.id;
      input.creadoEn = this.selectedUsuario.creadoEn;
      input.usuarioId = this.selectedUsuario.usuarioId.id
    }
    input.personaId = this.data.personaId;
    input.nickname = this.nicknameControl.value;
    input.password = this.passwordControl.value;
    this.usuarioService.onSaveUsuario(input).subscribe(res => {
      if(res!=null){
        this.selectedUsuario = res;
        this.matDialogRef.close(this.selectedUsuario)
      }
    })
  }

  onCancel(){
    this.matDialogRef.close();
  }

  setState(state){
    switch (state) {
      case 'view':
        this.isEditing = false;
        this.nicknameControl.disable()
        this.passwordControl.disable()
        this.nicknameControl.setValue(this.selectedUsuario.nickname)
        this.passwordControl.setValue(this.selectedUsuario.password)
        this.hidePassword = true;
        break;
      case 'edit':
        this.isEditing = true;
        this.nicknameControl.enable()
        this.passwordControl.enable()
        this.hidePassword = true;
        break;
      case 'reset':
        this.isEditing = true;
        this.nicknameControl.setValue(null)
        this.passwordControl.setValue(null)
        this.nicknameControl.enable()
        this.passwordControl.enable()
        this.hidePassword = true;
        break;
      default:
        break;
    }
  }

}
