import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MuebleService } from '../../service/mueble.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TipoMueble } from '../../models/tipo-mueble.model';
import { FamiliaMueble } from '../../models/familia-mueble.model';
import { MainService } from '../../../../../main.service';

@UntilDestroy()
@Component({
  selector: 'app-adicionar-tipo-mueble-dialog',
  templateUrl: './adicionar-tipo-mueble-dialog.component.html',
  styleUrls: ['./adicionar-tipo-mueble-dialog.component.scss']
})
export class AdicionarTipoMuebleDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private muebleService = inject(MuebleService);
  private mainService = inject(MainService);

  tipoForm: FormGroup;
  currentFamilia: FamiliaMueble | null = null;

  familiaMuebleIdControl = new FormControl<number | null>(null, [Validators.required]);
  descripcionControl = new FormControl('', [Validators.required]);

  constructor(
    public dialogRef: MatDialogRef<AdicionarTipoMuebleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { familiaId?: number }
  ) {
    this.familiaMuebleIdControl.setValue(data?.familiaId || null);
    this.tipoForm = this.fb.group({
      familiaMuebleId: this.familiaMuebleIdControl,
      descripcion: this.descripcionControl
    });
  }

  ngOnInit(): void {
    if (this.data?.familiaId) {
      this.muebleService.findByIdFamilia(Number(this.data.familiaId)).pipe(untilDestroyed(this)).subscribe(res => {
        if (res) this.onSelectFamilia(res);
      });
    }
  }

  onBuscarFamilia(): void {
    this.muebleService.abrirBuscadorFamilia().subscribe((res: any) => {
      if (res) {
        if (res.adicionar) {
          this.onAdicionarFamilia();
        } else {
          this.onSelectFamilia(res);
        }
      }
    });
  }

  onAdicionarFamilia(): void {
    this.muebleService.abrirAdicionarFamilia().subscribe(res => {
      if (res) {
        this.onSelectFamilia(res);
      }
    });
  }

  onSelectFamilia(familia: FamiliaMueble): void {
    this.currentFamilia = familia;
    this.familiaMuebleIdControl.setValue(familia?.id ? Number(familia.id) : null);
  }

  onGuardarTipo(): void {
    if (this.tipoForm.valid) {
      this.muebleService.onGuardarTipo({
        familiaMuebleId: Number(this.familiaMuebleIdControl.value),
        descripcion: this.descripcionControl.value?.toUpperCase() || '',
        usuarioId: this.mainService.usuarioActual?.id
      }).pipe(untilDestroyed(this)).subscribe((res: TipoMueble) => {
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
