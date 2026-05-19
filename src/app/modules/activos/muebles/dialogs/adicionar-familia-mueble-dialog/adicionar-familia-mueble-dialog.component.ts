import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MuebleService } from '../../service/mueble.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FamiliaMueble } from '../../models/familia-mueble.model';
import { MainService } from '../../../../../main.service';

@UntilDestroy()
@Component({
  selector: 'app-adicionar-familia-mueble-dialog',
  templateUrl: './adicionar-familia-mueble-dialog.component.html',
  styleUrls: ['./adicionar-familia-mueble-dialog.component.scss']
})
export class AdicionarFamiliaMuebleDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private muebleService = inject(MuebleService);
  private mainService = inject(MainService);

  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<AdicionarFamiliaMuebleDialogComponent>
  ) {
    this.form = this.fb.group({
      descripcion: ['', [Validators.required]]
    });
  }

  ngOnInit(): void { }

  onGuardar(): void {
    if (this.form.valid) {
      this.muebleService.onGuardarFamilia({
        descripcion: this.form.value.descripcion.toUpperCase(),
        usuarioId: this.mainService.usuarioActual?.id
      }).pipe(untilDestroyed(this)).subscribe((res: FamiliaMueble) => {
        if (res) {
          this.dialogRef.close(res);
        }
      });
    }
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
