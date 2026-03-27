import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MuebleService } from '../../service/mueble.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TipoMueble } from '../../models/tipo-mueble.model';
import { FamiliaMueble } from '../../models/familia-mueble.model';
import { BehaviorSubject } from 'rxjs';
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

  familiaForm: FormGroup;
  tipoForm: FormGroup;
  familias$ = new BehaviorSubject<FamiliaMueble[]>([]);
  currentFamilia: FamiliaMueble | null = null;

  constructor(
    public dialogRef: MatDialogRef<AdicionarTipoMuebleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { familiaId?: number }
  ) {
    this.familiaForm = this.fb.group({
      descripcion: ['', [Validators.required]]
    });

    this.tipoForm = this.fb.group({
      familiaMuebleId: [data?.familiaId || null, [Validators.required]],
      descripcion: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.cargarFamilias();
  }

  cargarFamilias(): void {
    // We can assume search for '%' returns everything or filter by text
    this.muebleService.onFiltrarFamilias('%').pipe(untilDestroyed(this)).subscribe(res => {
      this.familias$.next(res || []);
      if (this.data?.familiaId) {
        this.currentFamilia = res?.find(f => f.id == this.data.familiaId) || null;
      }
    });
  }

  onFiltrarFamilias(texto: string): void {
    this.muebleService.onFiltrarFamilias(texto).pipe(untilDestroyed(this)).subscribe(res => {
      this.familias$.next(res || []);
    });
  }

  onSelectFamilia(familia: FamiliaMueble): void {
    this.currentFamilia = familia;
    this.tipoForm.get('familiaMuebleId')?.setValue(familia?.id ? Number(familia.id) : null);
  }

  onGuardarFamilia(): void {
    if (this.familiaForm.valid) {
      this.muebleService.onGuardarFamilia({
        descripcion: this.familiaForm.value.descripcion.toUpperCase(),
        usuarioId: this.mainService.usuarioActual?.id
      }).pipe(untilDestroyed(this)).subscribe(res => {
        if (res) {
          this.familiaForm.reset();
          this.cargarFamilias();
          this.currentFamilia = res;
          this.tipoForm.get('familiaMuebleId')?.setValue(Number(res.id));
        }
      });
    }
  }

  onGuardarTipo(): void {
    if (this.tipoForm.valid) {
      this.muebleService.onGuardarTipo({
        familiaMuebleId: Number(this.tipoForm.value.familiaMuebleId),
        descripcion: this.tipoForm.value.descripcion.toUpperCase(),
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
