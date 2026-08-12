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
  tipoControl = new FormControl(CajaVirtualTipo.CAJA_MAYOR, Validators.required);
  sucursalControl = new FormControl(null, Validators.required);
  descripcionControl = new FormControl();
  limiteGsControl = new FormControl();
  activoControl = new FormControl(true);

  isEditing = false;
  isSaving = false;

  tipoList = [
    { label: 'Caja Mayor', value: CajaVirtualTipo.CAJA_MAYOR },
    { label: 'Caja Chica', value: CajaVirtualTipo.CAJA_CHICA }
  ];

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
      tipoControl: this.tipoControl,
      sucursalControl: this.sucursalControl,
      descripcionControl: this.descripcionControl,
      limiteGsControl: this.limiteGsControl,
      activoControl: this.activoControl
    });

    if (this.data != null) {
      this.isEditing = true;
      this.nombreControl.setValue(this.data.nombre);
      this.tipoControl.setValue(this.data.tipo);
      this.sucursalControl.setValue(this.data.sucursal?.id);
      this.descripcionControl.setValue(this.data.descripcion);
      this.limiteGsControl.setValue(this.data.limiteGs);
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
    cajaVirtual.tipo = this.tipoControl.value;
    let sucursal = new Sucursal();
    sucursal.id = this.sucursalControl.value;
    cajaVirtual.sucursal = sucursal;
    cajaVirtual.descripcion = this.descripcionControl.value;
    cajaVirtual.limiteGs = this.limiteGsControl.value;
    cajaVirtual.activo = this.activoControl.value;
    cajaVirtual.usuario = this.mainService.usuarioActual;

    this.isSaving = true;
    this.cajaVirtualService.onSave(cajaVirtual)
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
          this.notificacionService.openAlgoSalioMal('Error al guardar la caja virtual');
        }
      });
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
