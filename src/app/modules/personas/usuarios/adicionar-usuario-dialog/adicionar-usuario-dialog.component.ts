import { Component, Inject, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { UsuarioInput } from '../usuario-input.model';
import { Usuario } from '../usuario.model';
import { UsuarioService } from '../usuario.service';

export class AdicionarUsuarioDialogData {
  persona: Persona;
  usuario: Usuario;
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
  formGroup: FormGroup;
  isEditting = false;
  usuarioRoleList = new MatTableDataSource<UsuarioRole>([])
  usuarioRoleColumnsToDisplay = ['id', 'nombre', 'eliminar']
  roleList: Role[];
  selectedUsuarioRole;
  
  constructor(
    @Inject(MAT_DIALOG_DATA) private data: AdicionarUsuarioDialogData,
    private dialogRef: MatDialogRef<AdicionarUsuarioDialogComponent>,
    private usuarioService: UsuarioService,
    private matDialog: MatDialog,
    private roleService: RoleService,
    public mainService: MainService
  ) {
  }

  ngOnInit(): void {
    console.log(this.data);

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
    this.roleService.onGetUsuarioRolePorUsuario(this.selectedUsuario?.id).pipe(untilDestroyed(this))
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

  onDeleteUsuarioRole(usuarioRole, usuarioRoleIndex) {
    this.roleService.onDeleteUsuarioRole(usuarioRole?.id).pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.usuarioRoleList.data = updateDataSource(this.usuarioRoleList.data, null, usuarioRoleIndex)
      }
    })
  }

  onAddUsuarioRole() {
    this.onSearchRole().pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
        let selectedRole: Role = res;
        let input = new UsuarioRoleInput;
        input.roleId = selectedRole.id;
        input.userId = this.selectedUsuario.id;
        this.roleService.onSaveUsuarioRole(input).pipe(untilDestroyed(this)).subscribe(saveRes => {
          this.usuarioRoleList.data = updateDataSource(this.usuarioRoleList.data, saveRes)
        })
      }
    })
  }

  onSearchRole(): Observable<Role> {
    let data: SearchListtDialogData = {
      titulo: "Seleccionar sucursal",
      query: null,
      tableData: [
        { id: "id", nombre: "Id", width: "20%" },
        { id: "nombre", nombre: "Nombre", width: "60%" }
      ],
      inicialData: this.roleList?.filter(r => {
        return this.usuarioRoleList.data.find(ur => ur.role.id == r.id) == null;
      }),
    };
    // data.
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
          if (res != null) {
            return obs.next(res);
          } else {
            return obs.next(null);
          }
        });
    })
  }


}
