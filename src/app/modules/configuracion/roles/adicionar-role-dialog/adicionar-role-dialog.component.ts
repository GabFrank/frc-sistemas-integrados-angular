import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { Role } from '../role.model';
import { RoleService } from '../role.service';

export interface AdicionarRoleData {
  role: Role;
}

@UntilDestroy()
@Component({
  selector: 'app-adicionar-role-dialog',
  templateUrl: './adicionar-role-dialog.component.html',
  styleUrls: ['./adicionar-role-dialog.component.scss']
})
export class AdicionarRoleDialogComponent implements OnInit {

  selectedRole = new Role;
  selectedSucursal: Sucursal;
  nombreControl = new FormControl(null, Validators.required)
  formGroup: FormGroup;
  isEditting = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: AdicionarRoleData,
    private dialogRef: MatDialogRef<AdicionarRoleDialogComponent>,
    private roleService: RoleService
  ) { }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      nombre: this.nombreControl,
    })

    if (this.data.role != null) {
      Object.assign(this.selectedRole, this.data.role)
      this.cargarDatos()
    } else {
      this.isEditting = true
    }
  }

  cargarDatos() {
    this.nombreControl.setValue(this.selectedRole.nombre)
    this.formGroup.disable()
  }

  onCancel() {
    this.dialogRef.close(null)
  }

  onSave() {
    this.selectedRole.nombre = this.nombreControl.value
    this.roleService.onSaveRole(this.selectedRole.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.dialogRef.close(res)
        }
      })
  }

}
