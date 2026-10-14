import { Component, Inject, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Usuario } from '../usuario.model';
import { UsuarioService } from '../usuario.service';

export class AdicionarUsuarioDialogData {
  /** Persona del usuario nuevo (Personas → «Crear usuario»). Sin ella se elige en el diálogo. */
  persona?: Persona;
  usuario?: Usuario;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Persona } from '../../persona/persona.model';
import { Role, UsuarioRole, UsuarioRoleInput } from '../../../configuracion/roles/role.model';
import { RoleService } from '../../../configuracion/roles/role.service';
import { MatTableDataSource } from '@angular/material/table';
import { updateDataSource } from '../../../../commons/core/utils/numbersUtils';
import { SearchListDialogComponent, SearchListtDialogData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { Observable, of } from 'rxjs';
import { catchError, defaultIfEmpty, timeout } from 'rxjs/operators';
import { ROLES } from '../../roles/roles.enum';
import { MainService } from '../../../../main.service';
import { terminarSiFalla } from '../../../../commons/core/utils/rxjsUtils';
import { PersonaSearchGQL } from '../../persona/graphql/personaSearch';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-adicionar-usuario-dialog',
  templateUrl: './adicionar-usuario-dialog.component.html',
  styleUrls: ['./adicionar-usuario-dialog.component.scss']
})
export class AdicionarUsuarioDialogComponent implements OnInit {

  readonly ROLES = ROLES

  selectedUsuario = new Usuario;
  selectedPersona: Persona;
  nicknameControl = new FormControl(null, Validators.required)
  activoControl = new FormControl(true)
  // Precargada para que el encargado no tenga que tipearla; se manda solo en el alta.
  passwordControl = new FormControl('123', Validators.required)
  // Visible: la de por defecto (123) no es secreta y así se ve qué se va a guardar.
  verPassword = true;
  /** Sin id todavía: se pide la clave y no se muestran los roles (necesitan el id). */
  esAlta = true;
  /** La persona vino del llamador (Personas): no se puede cambiar. */
  personaFija = false;
  buscandoPersona = false;
  guardando = false;
  puedeGuardar = false;
  /** Sin EDITAR_USUARIOS (o ADMIN) el diálogo es solo de consulta: se llega por «Ir a usuario». */
  puedeEditarUsuarios = false;
  /** Asignar o quitar roles sigue siendo solo de ADMIN. */
  puedeAsignarRoles = false;
  /** Lo que se devuelve al cerrar, aunque se cancele después del alta, para que la lista se refresque. */
  usuarioCreado: Usuario;
  formGroup: FormGroup;
  isEditting = false;
  usuarioRoleList = new MatTableDataSource<UsuarioRole>([])
  /** Los roles del usuario no se pudieron leer: no se muestran como «sin roles» ni se dejan tocar. */
  rolesNoDisponibles = false;
  roleList: Role[];
  selectedUsuarioRole;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: AdicionarUsuarioDialogData,
    private dialogRef: MatDialogRef<AdicionarUsuarioDialogComponent>,
    private usuarioService: UsuarioService,
    private matDialog: MatDialog,
    private roleService: RoleService,
    public mainService: MainService,
    private notificacionService: NotificacionSnackbarService,
    private personaSearch: PersonaSearchGQL
  ) {
  }

  ngOnInit(): void {
    this.puedeEditarUsuarios = this.mainService.tieneAlgunRol([ROLES.EDITAR_USUARIOS]);
    this.puedeAsignarRoles = this.mainService.tieneAlgunRol([ROLES.ADMIN]);
    this.formGroup = new FormGroup({
      nickname: this.nicknameControl,
      activo: this.activoControl,
      password: this.passwordControl
    })

    if (this.data?.usuario != null) {
      this.esAlta = false;
      Object.assign(this.selectedUsuario, this.data.usuario)
      this.selectedPersona = this.selectedUsuario.persona;
      setTimeout(() => {
        this.cargarDatos()
      }, 500);
    } else {
      this.isEditting = true
      if (this.data?.persona != null) {
        this.personaFija = true;
        this.elegirPersona(this.data.persona);
      }
    }
    this.actualizarPuedeGuardar();

    setTimeout(() => {
      this.roleService.onGetRoles().pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) {
          this.roleList = res;
        }
      })
    }, 1000);
  }

  cargarDatos() {
    this.nicknameControl.setValue(this.selectedUsuario.nickname)
    this.activoControl.setValue(this.selectedUsuario.activo)
    this.formGroup.disable()
    // Con la lista vacía por un error parecería un usuario sin roles, y se podría agregar uno repetido (#390).
    this.roleService.onGetUsuarioRolePorUsuario(this.selectedUsuario?.id).pipe(terminarSiFalla(() => this.rolesNoDisponibles = true), untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.usuarioRoleList.data = res;
        }
      })
  }

  onCancel() {
    this.dialogRef.close(this.usuarioCreado ?? null)
  }

  onBuscarPersona() {
    const data: SearchListtDialogData = {
      titulo: 'Buscar persona',
      query: this.personaSearch,
      tableData: [
        { id: 'id', nombre: 'Id', width: '10%' },
        { id: 'nombre', nombre: 'Nombre', width: '60%' },
        { id: 'documento', nombre: 'Documento', width: '30%' },
      ],
      search: true,
      // Sin texto traería todas las personas (miles): se busca al escribir.
      inicialSearch: false,
    };
    this.matDialog.open(SearchListDialogComponent, {
      data,
      width: '40%',
      height: '80%'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe((persona: Persona) => {
      if (persona != null) this.elegirPersona(persona);
    })
  }

  /** Una persona tiene un solo usuario (usuario_un_persona): si ya lo tiene, se abre ese. */
  elegirPersona(persona: Persona) {
    this.buscandoPersona = true;
    this.actualizarPuedeGuardar();
    this.usuarioService.onGetUsuarioPorPersonaId(persona.id)
      .pipe(terminarSiFalla(() => {
        this.buscandoPersona = false;
        this.actualizarPuedeGuardar();
        this.notificacionService.openWarn('No se pudo verificar si la persona ya tiene usuario. Intentá de nuevo.', 4);
      }), untilDestroyed(this))
      .subscribe((usuario: Usuario) => {
        this.buscandoPersona = false;
        if (usuario?.id != null) {
          this.notificacionService.openWarn(`${persona.nombre} ya tiene el usuario ${usuario.nickname}: se abre para editarlo.`, 4);
          this.abrirUsuarioExistente(usuario);
        } else {
          this.selectedPersona = persona;
          // El nombre de usuario arranca con el de la persona; se puede cambiar.
          this.nicknameControl.setValue(persona.nombre?.toUpperCase() ?? null);
        }
        this.actualizarPuedeGuardar();
      })
  }

  private abrirUsuarioExistente(usuario: Usuario) {
    this.esAlta = false;
    this.isEditting = false;
    this.selectedUsuario = new Usuario;
    Object.assign(this.selectedUsuario, usuario);
    this.selectedPersona = this.selectedUsuario.persona;
    this.cargarDatos();
  }

  actualizarPuedeGuardar() {
    this.puedeGuardar = !this.guardando && !this.buscandoPersona
      && (!this.esAlta || this.selectedPersona != null);
  }

  onSave() {
    if (this.guardando) return;
    const eraAlta = this.esAlta;
    this.guardando = true;
    this.actualizarPuedeGuardar();
    const nickname: string = this.nicknameControl.value?.trim() ?? '';
    const nicknameAnterior: string = eraAlta ? '' : (this.selectedUsuario.nickname ?? '');
    if (nickname.toUpperCase() == nicknameAnterior.toUpperCase()) {
      this.guardar(eraAlta);
      return;
    }
    // Repetido, el central responde con un error de constraint que no se entiende.
    // Si no se puede verificar, se guarda igual: la base sigue rechazando el duplicado.
    this.usuarioService.onVerificarUsuario(nickname)
      .pipe(timeout(15000), catchError(() => of(false)), defaultIfEmpty(false), untilDestroyed(this))
      .subscribe(existe => {
        if (existe) {
          this.notificacionService.openWarn(`Ya existe un usuario ${nickname.toUpperCase()}. Elegí otro nombre.`, 4);
          this.guardando = false;
          this.actualizarPuedeGuardar();
        } else {
          this.guardar(eraAlta);
        }
      })
  }

  private guardar(eraAlta: boolean) {
    this.selectedUsuario.nickname = this.nicknameControl.value?.trim()
    this.selectedUsuario.activo = this.activoControl.value
    this.selectedUsuario.persona = this.selectedPersona;
    // Al editar no se manda: el central conserva la guardada.
    this.selectedUsuario.password = eraAlta ? this.passwordControl.value : null;
    const input = this.selectedUsuario.toInput();
    // Un central sin este campo rechaza el guardado en vez de guardar mal la clave.
    input.respetarClave = true;
    this.usuarioService.onSaveUsuario(input)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          this.guardando = false;
          this.selectedUsuario.password = null;
          if (res == null) {
            this.actualizarPuedeGuardar();
            return;
          }
          if (eraAlta) {
            // Queda abierto y en edición para cargar los roles, que necesitan el id.
            this.usuarioCreado = res;
            Object.assign(this.selectedUsuario, res);
            this.esAlta = false;
            this.actualizarPuedeGuardar();
          } else {
            this.dialogRef.close(res)
          }
        },
        error: () => {
          // El error ya lo avisó el genérico.
          this.guardando = false;
          this.selectedUsuario.password = null;
          this.actualizarPuedeGuardar();
        }
      })
  }

  onDeleteUsuarioRole(usuarioRole, usuarioRoleIndex) {
    this.roleService.onDeleteUsuarioRole(usuarioRole?.id).pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.usuarioRoleList.data = updateDataSource(this.usuarioRoleList.data, null, usuarioRoleIndex)
      }
    })
  }

  onAddUsuarioRole() {
    const openSearch = () => {
      this.onSearchRole().pipe(untilDestroyed(this)).subscribe((res) => {
        if (res != null && res.length > 0) {
          const inputList = res.map(role => {
            const input = new UsuarioRoleInput;
            input.roleId = role.id;
            input.userId = this.selectedUsuario.id;
            return input;
          });
          this.roleService.onSaveUsuarioRoleList(inputList).pipe(untilDestroyed(this)).subscribe(saveRes => {
            if (saveRes != null) {
              this.usuarioRoleList.data = [...saveRes, ...this.usuarioRoleList.data]
            }
          })
        }
      })
    };

    if (this.roleList != null) {
      openSearch();
    } else {
      this.roleService.onGetRoles().pipe(untilDestroyed(this)).subscribe(res => {
        this.roleList = res ?? [];
        openSearch();
      });
    }
  }

  onSearchRole(): Observable<Role[]> {
    const data: SearchListtDialogData = {
      titulo: "Seleccionar roles",
      multiple: true,
      labelAceptar: "Agregar",
      query: null,
      tableData: [
        { id: "id", nombre: "Id", width: "20%" },
        { id: "nombre", nombre: "Nombre", width: "60%" }
      ],
      inicialData: this.roleList?.filter(r => {
        return this.usuarioRoleList.data.find(ur => ur.role.id == r.id) == null;
      }) ?? [],
    };
    return new Observable(obs => {
      this.matDialog
        .open(SearchListDialogComponent, {
          data,
          height: "80%",
          width: "80%",
        })
        .afterClosed()
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          obs.next(res ?? null);
          obs.complete();
        });
    })
  }


}
