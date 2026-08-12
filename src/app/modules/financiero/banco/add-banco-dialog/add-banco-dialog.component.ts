import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Banco } from '../banco.model';
import { BancoService } from '../banco.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-add-banco-dialog',
  templateUrl: './add-banco-dialog.component.html',
  styleUrls: ['./add-banco-dialog.component.scss']
})
export class AddBancoDialogComponent implements OnInit {

  formGroup: FormGroup;
  nombreControl = new FormControl('', Validators.required);
  codigoControl = new FormControl('');

  isEditing = false;
  isSaving = false;

  constructor(
    private dialogRef: MatDialogRef<AddBancoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Banco,
    private bancoService: BancoService,
    private notificacion: NotificacionSnackbarService,
  ) { }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      nombreControl: this.nombreControl,
      codigoControl: this.codigoControl,
    });

    if (this.data != null) {
      this.isEditing = true;
      this.nombreControl.setValue(this.data.nombre);
      this.codigoControl.setValue(this.data.codigo);
    }
  }

  onSave() {
    if (this.formGroup.invalid) return;

    const banco = new Banco();
    if (this.isEditing) banco.id = this.data.id;
    banco.nombre = this.nombreControl.value?.toUpperCase();
    banco.codigo = this.codigoControl.value?.toUpperCase();

    this.isSaving = true;
    this.bancoService.onSave(banco)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          this.isSaving = false;
          if (res != null) {
            this.notificacion.openSucess('Banco guardado correctamente');
            this.dialogRef.close(res);
          }
        },
        error: () => {
          this.isSaving = false;
          this.notificacion.openAlgoSalioMal('Error al guardar el banco');
        }
      });
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
