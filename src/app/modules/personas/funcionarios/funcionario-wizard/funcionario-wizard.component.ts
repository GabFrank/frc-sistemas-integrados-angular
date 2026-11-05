import { LECTURA_ESTRICTA } from '../../../../generics/generic-crud.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CurrencyMask } from '../../../../commons/core/utils/numbersUtils';
import { terminarSiFalla } from '../../../../commons/core/utils/rxjsUtils';
import { erroresDeRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';
import { MainService } from '../../../../main.service';
import { ROLES } from '../../roles/roles.enum';
import { Observable, of, Subscription } from 'rxjs';
import { catchError, defaultIfEmpty, map, switchMap, timeout } from 'rxjs/operators';
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
  /** Nicknames libres armados con el nombre, cuando el escrito ya existe. */
  sugerencias: string[] = [];
  private sugerenciasSub: Subscription;
  sucursalFuncionario = new FormControl(null, [Validators.required])
  creditoFuncionario = new FormControl(null, [Validators.required])
  fechaIngresoFuncionario = new FormControl()
  // La máscara de guaraníes deja 0 al borrar el monto, y required lo acepta
  sueldoFuncionario = new FormControl(null, [Validators.required, Validators.min(1)])
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
    private notificacionService: NotificacionSnackbarService,
    private mainService: MainService
  ) {

  }

  ngOnInit(): void {
    const { requestId } = this.cargandoService.openDialog()
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
    this.sucursalService.onGetAllSucursales(true).pipe(
      terminarSiFalla(() => this.cargandoService.closeDialog(requestId))
    ).subscribe((res) => {
      this.cargandoService.closeDialog(requestId)
      this.sucursalList = res.filter(s => s.id != 0);
      this.cargarDatos()
    })
  }

  cargarDatos() {
    this.nombrePersona.setValue(this.selectedPreRegistro?.nombreCompleto)
    this.apodoPersona.setValue(this.selectedPreRegistro?.apodo)
    this.nacimientoPersona.setValue(new Date(this.selectedPreRegistro?.fechaNacimiento))
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
    // Lo que pide el central para el alta: crear el usuario (EDITAR USUARIOS o VER FUNCIONARIOS) y el funcionario
    // (CREAR / VER FUNCIONARIOS o RRHH GESTIONAR). Sin eso, cortar acá en vez de dejar la persona creada.
    const puedeCrearUsuario = this.mainService.tieneAlgunRol([ROLES.EDITAR_USUARIOS, ROLES.VER_FUNCIONARIOS]);
    const puedeCrearFuncionario = this.mainService.tieneAlgunRol([ROLES.CREAR_FUNCIONARIOS, ROLES.VER_FUNCIONARIOS, ROLES.RRHH_GESTIONAR]);
    if (!puedeCrearUsuario || !puedeCrearFuncionario) {
      this.notificacionService.openWarn('No tenés permiso para dar de alta funcionarios: no se guardó nada.', 6);
      return;
    }
    this.dialogoService.confirm('Atención!', 'Realmente desea guardar este registro?')
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.cancelarSugerencias();
          // Si no se puede verificar, se sigue: la base rechaza el duplicado y deshacerAlta limpia lo creado.
          this.usuarioService.onVerificarUsuario(this.nicknameUsuario.value)
            .pipe(timeout(15000), catchError(() => of(false)), defaultIfEmpty(false), untilDestroyed(this))
            .subscribe(usuarioExiste => {
              if (usuarioExiste) {
                this.notificacionService.notification$.next({
                  texto: 'Ya existe un usuario con ese nickname',
                  color: NotificacionColor.warn,
                  duracion: 2
                })
                this.pedirSugerencias(this.nicknameUsuario.value);
              } else {
                const documento = this.documentoPersona.value?.toString().trim();
                this.personaService.onGetPorDocumento(documento, true, LECTURA_ESTRICTA)
                  .pipe(
                    // Sin saber si la persona ya existe no se guarda: crearía un duplicado (#390).
                    terminarSiFalla(() => this.notificacionService.openWarn(
                      'No se pudo verificar si la persona ya existe: no se guardó. Volvé a intentar.', 5)),
                    untilDestroyed(this)
                  )
                  .subscribe(personaExistente => {
                    if (personaExistente?.id != null) {
                      if (personaExistente.isFuncionario && personaExistente.isCliente) {
                        this.notificacionService.openWarn('La persona ya existe y ha sido registrada como cliente y funcionario');
                      } else if (personaExistente.isFuncionario) {
                        this.notificacionService.openWarn('La persona ya existe y ha sido registrada como funcionario');
                      } else if (personaExistente.isCliente) {
                        this.notificacionService.openWarn('La persona ya existe y ha sido registrada como cliente');
                      } else {
                        this.notificacionService.openWarn('La persona ya existe en el sistema');
                      }
                      return;
                    }
                    this.guardarFuncionario();
                  });
              }
            })

        }
      })

  }

  private pedirSugerencias(tomado: string) {
    this.sugerenciasSub = this.usuarioService.onSugerirNicknames(this.nombrePersona.value, [tomado ?? ''])
      .pipe(untilDestroyed(this))
      .subscribe(sugerencias => this.sugerencias = sugerencias);
  }

  private cancelarSugerencias() {
    this.sugerenciasSub?.unsubscribe();
    this.sugerencias = [];
  }

  onElegirSugerencia(nickname: string) {
    this.cancelarSugerencias();
    this.nicknameUsuario.setValue(nickname);
  }

  private guardarFuncionario(): void {
    let persona = new Persona;
    persona.nombre = this.nombrePersona.value;
    persona.apodo = this.apodoPersona.value;
    persona.direccion = this.direccionPersona.value;
    persona.documento = this.documentoPersona.value;
    persona.email = this.emailPersona.value;
    persona.isFuncionario = true;
    persona.nacimiento = this.nacimientoPersona.value;
    persona.telefono = this.telefonoPersona.value;
    // Pasos intermedios sin verde: lo da el último, el del pre-registro (#501). El aviso de cada falla ya lo da el servicio.
    this.personaService.onSavePersona(persona.toInput(), true, { avisarExito: false })
      .pipe(terminarSiFalla(), untilDestroyed(this))
      .subscribe(newPersona => {
        if (newPersona == null) return;
        let usuario = new Usuario
        usuario.nickname = this.nicknameUsuario.value;
        usuario.password = '123';
        usuario.persona = newPersona;
        this.usuarioService.onSaveUsuario(usuario.toInput(), true, { avisarExito: false })
          .pipe(terminarSiFalla(error => this.deshacerAlta(error, newPersona, null, 'el usuario')), untilDestroyed(this))
          .subscribe(newUsuario => {
            if (newUsuario == null) return;
            let funcionario = new Funcionario;
            funcionario.activo = true;
            funcionario.credito = this.creditoFuncionario.value;
            funcionario.fasePrueba = this.fasePruebaFuncionario.value;
            funcionario.fechaIngreso = this.fechaIngresoFuncionario.value;
            funcionario.persona = newPersona;
            // El select guarda el id; toInput() lee sucursal?.id y necesita el objeto
            funcionario.sucursal = this.sucursalList.find(s => s.id == this.sucursalFuncionario.value);
            funcionario.sueldo = this.sueldoFuncionario.value;
            this.funcionarioService.onSaveFuncionario(funcionario.toInput(), true, undefined, { avisarExito: false })
              .pipe(terminarSiFalla(error => this.deshacerAlta(error, newPersona, newUsuario, 'el funcionario')), untilDestroyed(this))
              .subscribe(newFuncionario => {
                if (newFuncionario == null) return;
                this.selectedPreRegistro.funcionario = newFuncionario;
                this.selectedPreRegistro.verificado = true;
                this.funcionarioService.onSavePreRegistroFuncionarioGraphql(this.selectedPreRegistro.toInput())
                  .pipe(
                    // El funcionario ya existe: reintentar choca con «la persona ya existe».
                    terminarSiFalla(() => this.notificacionService.openWarn(
                      'El funcionario quedó creado, pero la solicitud no se marcó como verificada: cerrá y revisala en la lista.', 10)),
                    untilDestroyed(this))
                  .subscribe(res => {
                    if (res != null) this.matDialogRef.close(res)
                  })
              })
          })
      })
  }

  /**
   * El servidor rechazó un paso del alta: se borra lo creado antes (usuario y después persona, por la FK) para que
   * el reintento no choque con «la persona ya existe». Sin respuesta no se borra nada: el paso pudo haberse guardado.
   */
  private deshacerAlta(error: any, persona: Persona, usuario: Usuario | null, queFallo: string): void {
    if (erroresDeRechazo(error) == null) {
      this.notificacionService.openWarn(
        `No se pudo confirmar si se guardó ${queFallo}: revisá usuarios y funcionarios antes de volver a intentar.`, 10);
      return;
    }
    // onDelete avisa su propia falla y emite null; nunca termina en error, pero por las dudas cuenta como falla.
    const borrar = (baja: Observable<any>) => baja.pipe(catchError(() => of(null)));
    const bajaUsuario = usuario?.id != null ? borrar(this.usuarioService.onDeleteUsuarioSinDialogo(usuario.id)) : of(true);
    // Lo que quedó sin borrar, o null si se deshizo todo.
    bajaUsuario.pipe(
      switchMap(ok => ok
        ? borrar(this.personaService.onDeletePersonaSinDialogo(persona.id)).pipe(map(okPersona => okPersona ? null : 'la persona'))
        : of('la persona y el usuario')),
      untilDestroyed(this)
    ).subscribe(quedo => this.notificacionService.openWarn(quedo == null
      ? `El servidor rechazó ${queFallo}: se deshizo el alta y no quedó nada guardado.`
      : `El servidor rechazó ${queFallo} y no se pudo deshacer el alta (falta borrar ${quedo}): revisalo antes de volver a intentar.`, 10));
  }

}
