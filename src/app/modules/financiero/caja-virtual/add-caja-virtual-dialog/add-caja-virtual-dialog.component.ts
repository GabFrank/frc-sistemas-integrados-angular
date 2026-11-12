import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CajaVirtual, CajaVirtualTipo } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { MainService } from '../../../../main.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-add-caja-virtual-dialog',
  templateUrl: './add-caja-virtual-dialog.component.html',
  styleUrls: ['./add-caja-virtual-dialog.component.scss']
})
export class AddCajaVirtualDialogComponent implements OnInit {
  sucursalIdList: number[];
  sucursalList: Sucursal[]= [];

  formGroup: FormGroup;
  nombreControl = new FormControl('', Validators.required);
  sucursalControl = new FormControl(null);
  descripcionControl = new FormControl();
  activoControl = new FormControl(true);

  isEditing = false;
  isSaving = false;

  constructor(
    private dialogRef: MatDialogRef<AddCajaVirtualDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CajaVirtual,
    private cajaVirtualService: CajaVirtualService,
    private notificacionService: NotificacionSnackbarService,
    private sucursalService: SucursalService,
    public mainService: MainService
  ) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      nombreControl: this.nombreControl,
      sucursalControl: this.sucursalControl,
      descripcionControl: this.descripcionControl,
      activoControl: this.activoControl
    });

    if (this.data != null) {
      this.isEditing = true;
      this.nombreControl.setValue(this.data.nombre);
      this.sucursalControl.setValue(this.data.sucursal?.id);
      this.descripcionControl.setValue(this.data.descripcion);
      this.activoControl.setValue(this.data.activo);
    }

      this.sucursalIdList = [];
      this.sucursalList = [];

      this.sucursalService.onGetAllSucursalesByActive(true, true)
        .subscribe((res) => {
          this.sucursalList = res.filter((s) => {
            if (s.id != 0 && s.id != 999) {
              this.sucursalIdList.push(s.id);
              return s;
            }
          });
        })
  }

  onSave() {
    if (this.formGroup.invalid) return;

    const cajaVirtual = new CajaVirtual();
    if (this.isEditing) cajaVirtual.id = this.data.id;
    cajaVirtual.nombre = this.nombreControl.value?.toUpperCase();
    // CAJA_CHICA se retiró (central #220): toda caja es CAJA_MAYOR. El límite tampoco se envía:
    // el central no lo pisa si no llega.
    cajaVirtual.tipo = CajaVirtualTipo.CAJA_MAYOR;
    // Sucursal es opcional: una caja puede estar en una oficina administrativa
    // que no es una sucursal. Solo se envia si el usuario eligio una.
    if (this.sucursalControl.value != null) {
      let sucursal = new Sucursal();
      sucursal.id = this.sucursalControl.value;
      cajaVirtual.sucursal = sucursal;
    }
    cajaVirtual.descripcion = this.descripcionControl.value;
    cajaVirtual.activo = this.activoControl.value;
    cajaVirtual.usuario = this.mainService.usuarioActual;

    this.isSaving = true;
    // El aviso de éxito es propio (más específico); el de error lo da onSaveCustom.
    this.cajaVirtualService.onSave(cajaVirtual, { avisarExito: false })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          this.isSaving = false;
          if (res != null) {
            this.notificacionService.openSucess('Caja virtual guardada correctamente');
            this.dialogRef.close(res);
          }
        },
        error: () => {
          this.isSaving = false;
        }
      });
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
