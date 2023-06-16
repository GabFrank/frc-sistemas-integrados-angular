import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { Cargo } from '../../../empresarial/cargo/cargo.model';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { AdicionarPersonaDialogComponent } from '../../persona/adicionar-persona-dialog/adicionar-persona-dialog.component';
import { BuscarPersonaData, BuscarPersonaDialogComponent } from '../../persona/buscar-persona-dialog/buscar-persona-dialog.component';
import { Persona } from '../../persona/persona.model';
import { PersonaService } from '../../persona/persona.service';
import { PersonaComponent } from '../../persona/persona/persona.component';
import { AdicionarUsuarioDialogComponent } from '../../usuarios/adicionar-usuario-dialog/adicionar-usuario-dialog.component';
import { Usuario } from '../../usuarios/usuario.model';
import { UsuarioService } from '../../usuarios/usuario.service';
import { FuncionarioInput } from '../funcionario-input.model';
import { Funcionario } from '../funcionario.model';
import { FuncionarioService } from '../funcionario.service';

export class AdicionarFuncionarioDialogData {
  funcionario: Funcionario;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-adicionar-funcionario-dialog',
  templateUrl: './adicionar-funcionario-dialog.component.html',
  styleUrls: ['./adicionar-funcionario-dialog.component.scss']
})
export class AdicionarFuncionarioDialogComponent implements OnInit {

  formGroup: FormGroup;

  idControl = new FormControl()
  creditoControl = new FormControl()
  fechaIngresoControl = new FormControl()
  sueldoControl = new FormControl()
  fasePruebaControl = new FormControl()
  diaristaControl = new FormControl()
  creadoEnControl = new FormControl()
  usuarioControl = new FormControl()
  cargoControl = new FormControl()
  sucursalControl = new FormControl()
  supervisadoPorControl = new FormControl()
  activoControl = new FormControl()

  selectedFuncionario: Funcionario;
  selectedPersona: Persona;
  selectedSucursal: Sucursal;
  selectedCargo: Cargo;
  selectedResponsable: Funcionario;
  selectedUsuario: Usuario;

  cargoList: Cargo[];
  sucursalList: Sucursal[];
  funcionarioList: Funcionario[];

  today = new Date()

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarFuncionarioDialogData,
    private matDialogRef: MatDialogRef<AdicionarFuncionarioDialogComponent>,
    private matDialog: MatDialog,
    private notificacionBar: NotificacionSnackbarService,
    private usuarioService: UsuarioService,
    private funcionarioService: FuncionarioService,
    private personaService: PersonaService
  ) {
    if(data?.funcionario != null){
      this.selectedFuncionario = data.funcionario;
      personaService.onGetPersona(this.selectedFuncionario.persona.id).pipe(untilDestroyed(this)).subscribe(res => {
        if(res!=null){
          this.selectedPersona = res;
        }
      })
      usuarioService.onGetUsuarioPorPersonaId(this.selectedFuncionario.persona.id).pipe(untilDestroyed(this)).subscribe(res => {
        if(res!=null){
          this.selectedUsuario = res;
        }
      })
      this.cargarDatos()
    }
  }

  ngOnInit(): void {

    //ini arrays
    this.cargoList = []
    this.sucursalList = []
    this.funcionarioList = []

    this.createForm()
  }

  cargarDatos(){
    this.idControl.setValue(this.selectedFuncionario.id)
    this.activoControl.setValue(this.selectedFuncionario.activo)
    this.diaristaControl.setValue(this.selectedFuncionario.diarista)
    this.fasePruebaControl.setValue(this.selectedFuncionario.fasePrueba)
    this.sucursalControl.setValue(this.selectedFuncionario.sueldo)
    this.creditoControl.setValue(this.selectedFuncionario.credito)
    this.activoControl.setValue(this.selectedFuncionario.activo)
    this.cargoControl.setValue(this.selectedFuncionario?.cargo?.id)
    this.sucursalControl.setValue(this.selectedFuncionario?.sucursal?.id)
    this.fechaIngresoControl.setValue(this.selectedFuncionario?.fechaIngreso)
    this.supervisadoPorControl.setValue(this.selectedFuncionario?.supervisadoPor?.id)
  }

  onSearchPersona(){
    this.matDialog.open(BuscarPersonaDialogComponent, {
      autoFocus: true,
      restoreFocus: true,
      height: '90%',
      width: '100%'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if(res!=null){
        if(res.isFuncionario){
          this.notificacionBar.notification$.next( {
            texto: 'Esta persona ya está registrada como funcionario',
            color: NotificacionColor.warn,
            duracion: 3
          })
        } else {
          this.selectedPersona = res;
          this.usuarioService.onGetUsuarioPorPersonaId(this.selectedPersona.id).pipe(untilDestroyed(this)).subscribe(res => {
            if(res!=null){
              this.selectedUsuario = res;
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
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if(res!=null){
        this.selectedPersona = res;
        this.usuarioService.onGetUsuarioPorPersonaId(this.selectedPersona.id).pipe(untilDestroyed(this)).subscribe(res => {
          if(res!=null){
            this.selectedUsuario = res;
          }
        })
      } else {
        this.selectedPersona = null;
        this.selectedUsuario = null;
      }
    })
  }

  onAddUsuario(){
    this.matDialog.open(AdicionarUsuarioDialogComponent, {
      data: {
        personaId: this.selectedPersona.id,
        usuario: this.selectedUsuario
      },
      autoFocus: true,
      restoreFocus: true,
      width: '30%'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if(res!=null){
        this.selectedUsuario = res;
      }
    })
  }

  createForm(){
    this.diaristaControl.setValue(false)
    this.activoControl.setValue(true)
    this.fasePruebaControl.setValue(true)
  }

  onSearchCargo(){

  }

  onSearchSucursal(){

  }

  onCancelar(){
    this.matDialogRef.close()
  }

  onGuardar(){
    let input = new FuncionarioInput;
    if(this.selectedFuncionario!=null){
      input.id = this.selectedFuncionario.id;
      input.personaId = this.selectedFuncionario.persona.id;
      input.creadoEn = this.selectedFuncionario.creadoEn;
      input.usuarioId = this.selectedFuncionario?.usuario?.id;
    } else {
      input.personaId = this.selectedPersona.id;
    }
    input.cargoId = this.selectedCargo?.id;
    input.credito = this.creditoControl.value;
    input.sucursalId = this.selectedSucursal?.id;
    input.sueldo = this.sueldoControl.value;
    input.fechaIngreso = this.fechaIngresoControl.value;
    input.diarista = this.diaristaControl.value;
    input.fasePrueba = this.fasePruebaControl.value;
    input.activo = this.activoControl.value;
    input.supervisadoPorId = this.selectedResponsable?.id;
    input.personaId != null ? this.funcionarioService.onSaveFuncionario(input).pipe(untilDestroyed(this)).subscribe(res => {
      if(res!=null){
        this.selectedFuncionario = res;
        this.matDialogRef.close(this.selectedFuncionario)
      }
    }) : null;
  }

}
