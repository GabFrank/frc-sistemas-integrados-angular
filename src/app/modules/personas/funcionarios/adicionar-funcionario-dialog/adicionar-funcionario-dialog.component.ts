import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { Cargo } from '../../../empresarial/cargo/cargo.model';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { AdicionarPersonaDialogComponent } from '../../persona/adicionar-persona-dialog/adicionar-persona-dialog.component';
import { BuscarPersonaData, BuscarPersonaDialogComponent } from '../../persona/buscar-persona-dialog/buscar-persona-dialog.component';
import { Persona } from '../../persona/persona.model';
import { PersonaComponent } from '../../persona/persona/persona.component';
import { AdicionarUsuarioDialogComponent } from '../../usuarios/adicionar-usuario-dialog/adicionar-usuario-dialog.component';
import { Usuario } from '../../usuarios/usuario.model';
import { UsuarioService } from '../../usuarios/usuario.service';
import { Funcionario } from '../funcionario.model';

export class AdicionarFuncionarioDialogData {
  funcionario: Funcionario;
}
@Component({
  selector: 'app-adicionar-funcionario-dialog',
  templateUrl: './adicionar-funcionario-dialog.component.html',
  styleUrls: ['./adicionar-funcionario-dialog.component.scss']
})
export class AdicionarFuncionarioDialogComponent implements OnInit {

  idControl = new FormControl()
  creditoControl = new FormControl()
  fechaIngresoControl = new FormControl()
  sueldoControl = new FormControl()
  fasePruebaControl = new FormControl()
  diaristaControl = new FormControl()
  creadoEnControl = new FormControl()
  usuarioControl = new FormControl()

  selectedPersona: Persona;
  selectedSucursal: Sucursal;
  selectedCargo: Cargo;
  selectedResponsable: Funcionario;
  selectedUsuario: Usuario;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarFuncionarioDialogData,
    private matDialogRef: MatDialogRef<AdicionarFuncionarioDialogComponent>,
    private matDialog: MatDialog,
    private notificacionBar: NotificacionSnackbarService,
    private usuarioService: UsuarioService
  ) { }

  ngOnInit(): void {
  }

  onSearchPersona(){
    this.matDialog.open(BuscarPersonaDialogComponent, {
      autoFocus: true,
      restoreFocus: true,
      height: '90%',
      width: '100%'
    }).afterClosed().subscribe(res => {
      if(res!=null){
        if(res.isFuncionario){
          this.notificacionBar.notification$.next( {
            texto: 'Esta persona ya está registrada como funcionario',
            color: NotificacionColor.warn,
            duracion: 3
          })
        } else {
          this.selectedPersona = res;
          this.usuarioService.onGetUsuarioPorPersonaId(this.selectedPersona.id).subscribe(res => {
            if(res!=null){
              this.selectedUsuario = res;
              console.log(res)
            }
          })
        }
      } else {
        this.selectedPersona = null;
        this.selectedUsuario = null;
      }
    })
  }

  onAddPersona(){
    this.matDialog.open(AdicionarPersonaDialogComponent, {
      autoFocus: true,
      restoreFocus: true,
      width: '50%'
    }).afterClosed().subscribe(res => {
      if(res!=null){
        this.selectedPersona = res;
        this.usuarioService.onGetUsuarioPorPersonaId(this.selectedPersona.id).subscribe(res => {
          if(res!=null){
            this.selectedUsuario = res;
            console.log(res)
          }
        })
      } else {
        this.selectedPersona = null;
        this.selectedUsuario = null;
      }
    })
  }

  onAddUsuario(){
    console.log(this.selectedUsuario)
    this.matDialog.open(AdicionarUsuarioDialogComponent, {
      data: {
        personaId: this.selectedPersona.id,
        usuario: this.selectedUsuario
      },
      autoFocus: true,
      restoreFocus: true,
      width: '30%'
    }).afterClosed().subscribe(res => {
      if(res!=null){
        this.selectedUsuario = res;
      }
    })
  }

  onSearchCargo(){
    
  }

  onSearchSucursal(){
    
  }

  onCancelar(){
    this.matDialogRef.close()
  }

  onGuardar(){

  }

}
