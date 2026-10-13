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
import { Observable } from 'rxjs';
import { ROLES } from '../../roles/roles.enum';
import { MainService } from '../../../../main.service';
import { terminarSiFalla } from '../../../../commons/core/utils/rxjsUtils';
import { BuscarPersonaDialogComponent } from '../../persona/buscar-persona-dialog/buscar-persona-dialog.component';
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
  /** Solo al crear: al editar la clave no se toca (se resetea desde la lista de usuarios). */
  passwordControl = new FormControl(null, Validators.required)
  formGroup: FormGroup;
  isEditting = false;
  usuarioRoleList = new MatTableDataSource<UsuarioRole>([])
  /** Los roles del usuario no se pudieron leer: no se muestran como «sin roles» ni se dejan tocar. */
  rolesNoDisponibles = false;
  usuarioRoleColumnsToDisplay = ['id', 'nombre', 'eliminar']
  roleList: Role[];
  selectedUsuarioRole;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarUsuarioDialogData,
    private dialogRef: MatDialogRef<AdicionarUsuarioDialogComponent>,
    private usuarioService: UsuarioService,
    private matDialog: MatDialog,
    private roleService: RoleService,
    public mainService: MainService,
    private notificacionService: NotificacionSnackbarService
  ) {
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      nickname: this.nicknameControl,
      activo: this.activoControl
    })

    if (this.data.usuario != null) {
      Object.assign(this.selectedUsuario, this.data.usuario)
      this.selectedPersona = this.selectedUsuario.persona;
      setTimeout(() => {
        this.cargarDatos()
      }, 500);
    } else {
      this.selectedPersona = this.data?.persona;
      this.isEditting = true
    }

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
    this.dialogRef.close(null)
  }

  onSave() {
    this.selectedUsuario.nickname = this.nicknameControl.value?.trim()
    this.selectedUsuario.activo = this.activoControl.value
    this.selectedUsuario.persona = this.selectedPersona;
    const esNuevo = this.selectedUsuario.id == null;
    // Sin clave en el input el central conserva la que tiene.
    this.selectedUsuario.password = esNuevo ? this.passwordControl.value?.trim() : null;
    this.usuarioService.onSaveUsuario(this.selectedUsuario.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res == null) return;
        if (!esNuevo) {
          this.dialogRef.close(res)
          return;
        }
        // Recién creado: el diálogo queda abierto para asignarle los roles.
        this.selectedUsuario.id = res.id;
        this.selectedUsuario.password = null;
        this.passwordControl.reset();
        this.isEditting = false;
        this.formGroup.disable();
        this.notificacionService.openSucess('Usuario creado. Ahora podés asignarle los roles.', 4);
      })
  }

  onSeleccionarPersona() {
    this.matDialog.open(BuscarPersonaDialogComponent, {
      data: {},
      width: '60%',
      height: '70%'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe((persona: Persona) => {
      if (persona == null) return;
      if (persona.isUsuario) {
        this.notificacionService.openWarn('Esa persona ya tiene usuario.');
        return;
      }
      this.selectedPersona = persona;
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
