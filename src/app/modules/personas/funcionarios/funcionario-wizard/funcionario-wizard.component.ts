import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CurrencyMask } from '../../../../commons/core/utils/numbersUtils';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { Persona } from '../../persona/persona.model';
import { PersonaService } from '../../persona/persona.service';
import { UsuarioSearchGQL } from '../../usuarios/graphql/usuarioSearch';
import { Usuario } from '../../usuarios/usuario.model';
import { UsuarioService } from '../../usuarios/usuario.service';
import { Funcionario } from '../funcionario.model';
import { FuncionarioService } from '../funcionario.service';
import { PreRegistroFuncionario } from '../pre-registro-funcionario.model';

export interface FuncionarioWizard {
  preRegistroFuncionario: PreRegistroFuncionario;
}

@UntilDestroy()
@Component({
  selector: 'app-funcionario-wizard',
  templateUrl: './funcionario-wizard.component.html',
  styleUrls: ['./funcionario-wizard.component.scss'],

})
export class FuncionarioWizardComponent implements OnInit {

  selectedPreRegistro: PreRegistroFuncionario;
  formGroup: FormGroup;
  sucursalList: Sucursal[];
  currencyMask = new CurrencyMask();

  nombrePersona = new FormControl(null, [Validators.required])
  apodoPersona = new FormControl()
  nacimientoPersona = new FormControl()
  documentoPersona = new FormControl(null, [Validators.required])
  emailPersona = new FormControl(null, [Validators.required])
  direccionPersona = new FormControl()
  telefonoPersona = new FormControl(null, [Validators.required])
  isFuncionarioPersona = new FormControl()
  passwordUsuario = new FormControl()
  nicknameUsuario = new FormControl(null, [Validators.required])
  sucursalFuncionario = new FormControl(null, [Validators.required])
  creditoFuncionario = new FormControl(null, [Validators.required])
  fechaIngresoFuncionario = new FormControl()
  sueldoFuncionario = new FormControl(null, [Validators.required])
  activoFuncionario = new FormControl()
  fasePruebaFuncionario = new FormControl()

  //roles control
  cajeroControl = new FormControl()
  admControl = new FormControl()

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: FuncionarioWizard,
    private sucursalService: SucursalService,
    private matDialogRef: MatDialogRef<FuncionarioWizardComponent>,
    private personaService: PersonaService,
    private usuarioService: UsuarioService,
    private funcionarioService: FuncionarioService,
    private cargandoService: CargandoDialogService,
    private dialogoService: DialogosService,
    private notificacionService: NotificacionSnackbarService
  ) {

  }

  ngOnInit(): void {
    this.cargandoService.openDialog()
    this.formGroup = new FormGroup({})
    this.formGroup.addControl('nombrePersona', this.nombrePersona)
    this.formGroup.addControl('apodoPersona', this.apodoPersona)
    this.formGroup.addControl('nacimientoPersona', this.nacimientoPersona)
    this.formGroup.addControl('documentoPersona', this.documentoPersona)
    this.formGroup.addControl('emailPersona', this.emailPersona)
    this.formGroup.addControl('direccionPersona', this.direccionPersona)
    this.formGroup.addControl('telefonoPersona', this.telefonoPersona)
    this.formGroup.addControl('isFuncionarioPersona', this.isFuncionarioPersona)
    this.formGroup.addControl('passwordUsuario', this.passwordUsuario)
    this.formGroup.addControl('nicknameUsuario', this.nicknameUsuario)
    this.formGroup.addControl('sucursalFuncionario', this.sucursalFuncionario)
    this.formGroup.addControl('creditoFuncionario', this.creditoFuncionario)
    this.formGroup.addControl('fechaIngresoFuncionario', this.fechaIngresoFuncionario)
    this.formGroup.addControl('sueldoFuncionario', this.sueldoFuncionario)
    this.formGroup.addControl('activoFuncionario', this.activoFuncionario)
    this.formGroup.addControl('fasePruebaFuncionario', this.fasePruebaFuncionario)

    this.selectedPreRegistro = new PreRegistroFuncionario;
    Object.assign(this.selectedPreRegistro, this.data.preRegistroFuncionario as PreRegistroFuncionario)
    this.sucursalService.onGetAllSucursales()
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.cargandoService.closeDialog()
        this.sucursalList = res.filter(s => s.id != 0);
        this.cargarDatos()
      })
  }

  cargarDatos() {
    this.nombrePersona.setValue(this.selectedPreRegistro?.nombreCompleto)
    this.apodoPersona.setValue(this.selectedPreRegistro?.apodo)
    this.nacimientoPersona.setValue(new Date(this.selectedPreRegistro?.fechaNacimiento))
    console.log(this.selectedPreRegistro.fechaNacimiento)
    console.log(this.nacimientoPersona.value)
    this.documentoPersona.setValue(this.selectedPreRegistro?.documento)
    this.emailPersona.setValue(this.selectedPreRegistro?.email)
    this.direccionPersona.setValue(this.selectedPreRegistro?.direccion)
    this.telefonoPersona.setValue(this.selectedPreRegistro?.telefonoPersonal)
    this.isFuncionarioPersona.setValue(true)
    this.passwordUsuario.setValue('123')
    this.fechaIngresoFuncionario.setValue(new Date(this.selectedPreRegistro?.fechaIngreso))
    this.activoFuncionario.setValue(true)
    this.sucursalFuncionario.setValue(this.sucursalList.find(s => s.nombre.toUpperCase() == this.selectedPreRegistro.sucursal.toUpperCase()).id)
  }

  onCancelar() {
    this.matDialogRef.close()
  }

  onGuardar() {
    this.dialogoService.confirm('Atención!', 'Realmente desea guardar este registro?')
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.usuarioService.onVerificarUsuario(this.nicknameUsuario.value)
            .pipe(untilDestroyed(this))
            .subscribe(usuarioExiste => {
              if (usuarioExiste) {
                this.notificacionService.notification$.next({
                  texto: 'Ya existe un usuario con ese nickname',
                  color: NotificacionColor.warn,
                  duracion: 2
                })
              } else {
                let persona = new Persona;
                persona.nombre = this.nombrePersona.value;
                persona.apodo = this.apodoPersona.value;
                persona.direccion = this.direccionPersona.value;
                persona.documento = this.documentoPersona.value;
                persona.email = this.emailPersona.value;
                persona.isFuncionario = true;
                persona.nacimiento = this.nacimientoPersona.value;
                persona.telefono = this.telefonoPersona.value;
                this.personaService.onSavePersona(persona.toInput())
                  .pipe(untilDestroyed(this))
                  .subscribe(newPersona => {
                    if (newPersona != null) {
                      let usuario = new Usuario
                      usuario.nickname = this.nicknameUsuario.value;
                      usuario.password = '123';
                      usuario.persona = newPersona;
                      this.usuarioService.onSaveUsuario(usuario.toInput())
                        .pipe(untilDestroyed(this))
                        .subscribe(newUsuario => {
                          if (newUsuario != null) {
                            let funcionario = new Funcionario;
                            funcionario.activo = true;
                            funcionario.credito = this.creditoFuncionario.value;
                            funcionario.fasePrueba = this.fasePruebaFuncionario.value;
                            funcionario.fechaIngreso = this.fechaIngresoFuncionario.value;
                            funcionario.persona = newPersona;
                            funcionario.sucursal = this.sucursalFuncionario.value;
                            funcionario.sueldo = this.sucursalFuncionario.value;
                            this.funcionarioService.onSaveFuncionario(funcionario.toInput())
                              .pipe(untilDestroyed(this))
                              .subscribe(newFuncionario => {
                                if (newFuncionario != null) {
                                  this.selectedPreRegistro.funcionario = newFuncionario;
                                  this.selectedPreRegistro.verificado = true;
                                  this.funcionarioService.onSavePreRegistroFuncionarioGraphql(this.selectedPreRegistro.toInput())
                                    .pipe(untilDestroyed(this))
                                    .subscribe(res => {
                                      if (res != null) {
                                        this.matDialogRef.close(res)
                                      }
                                    })
                                } else {
                                  this.usuarioService.onDeleteUsuarioSinDialogo(newUsuario.id)
                                    .pipe(untilDestroyed(this))
                                    .subscribe(deletedUsuario => {
                                      if (deletedUsuario) {
                                        this.personaService.onDeletePersonaSinDialogo(newPersona?.id)
                                          .pipe(untilDestroyed(this))
                                          .subscribe(deletedPersona => {
                                            this.notificacionService.openAlgoSalioMal()
                                          })
                                      }
                                    })
                                }
                              })
                          } else {
                            this.personaService.onDeletePersonaSinDialogo(newPersona?.id)
                              .pipe(untilDestroyed(this))
                              .subscribe(personaDeleteResponse => {
                                this.notificacionService.openAlgoSalioMal()
                              })
                          }
                        })
                    }
                  })
              }
            })

        }
      })

  }

}
