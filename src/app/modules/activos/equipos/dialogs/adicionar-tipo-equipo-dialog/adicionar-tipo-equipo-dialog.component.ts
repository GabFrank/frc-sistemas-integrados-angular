import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../../main.service';
import { TipoEquipo } from '../../models/tipo-equipo.model';
import { EquiposService } from '../../services/equipos.service';

@UntilDestroy()
@Component({
  selector: 'app-adicionar-tipo-equipo-dialog',
  templateUrl: './adicionar-tipo-equipo-dialog.component.html',
  styleUrls: ['./adicionar-tipo-equipo-dialog.component.scss']
})
export class AdicionarTipoEquipoDialogComponent {
  private fb = inject(FormBuilder);
  private equiposService = inject(EquiposService);
  private mainService = inject(MainService);

  descripcionControl = new FormControl('', [Validators.required]);
  tipoForm: FormGroup = this.fb.group({
    descripcion: this.descripcionControl
  });

  constructor(
    public dialogRef: MatDialogRef<AdicionarTipoEquipoDialogComponent>
  ) { }

  onGuardarTipo(): void {
    if (!this.tipoForm.valid) {
      return;
    }

    this.equiposService.onGuardarTipoEquipo({
      descripcion: this.descripcionControl.value?.toUpperCase() || '',
      usuarioId: this.mainService.usuarioActual?.id
    }).pipe(untilDestroyed(this)).subscribe((res: TipoEquipo) => {
      if (res) {
        this.dialogRef.close(res);
      }
    });
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
