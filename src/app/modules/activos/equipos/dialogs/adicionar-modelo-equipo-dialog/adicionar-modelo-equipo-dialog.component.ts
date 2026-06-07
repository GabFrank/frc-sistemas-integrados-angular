import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../../main.service';
import { MarcaEquipo } from '../../models/marca-equipo.model';
import { ModeloEquipo } from '../../models/modelo-equipo.model';
import { EquiposService } from '../../services/equipos.service';

@UntilDestroy()
@Component({
  selector: 'app-adicionar-modelo-equipo-dialog',
  templateUrl: './adicionar-modelo-equipo-dialog.component.html',
  styleUrls: ['./adicionar-modelo-equipo-dialog.component.scss']
})
export class AdicionarModeloEquipoDialogComponent {
  private fb = inject(FormBuilder);
  private equiposService = inject(EquiposService);
  public mainService = inject(MainService);

  marcaForm: FormGroup;
  modeloForm: FormGroup;
  marcas$ = new BehaviorSubject<MarcaEquipo[]>([]);
  currentMarca: MarcaEquipo | null = null;

  descripcionMarcaControl = new FormControl('', [Validators.required]);
  marcaIdControl = new FormControl<number | null>(null, [Validators.required]);
  descripcionModeloControl = new FormControl('', [Validators.required]);

  constructor(
    public dialogRef: MatDialogRef<AdicionarModeloEquipoDialogComponent>
  ) {
    this.marcaForm = this.fb.group({
      descripcion: this.descripcionMarcaControl
    });

    this.modeloForm = this.fb.group({
      marcaId: this.marcaIdControl,
      descripcion: this.descripcionModeloControl
    });
  }

  ngOnInit(): void {
    this.cargarMarcas();
  }

  cargarMarcas(): void {
    this.equiposService.onFiltrarMarcas('%').pipe(untilDestroyed(this)).subscribe((res) => {
      this.marcas$.next(res || []);
    });
  }

  onFiltrarMarcas(texto: string): void {
    this.equiposService.onFiltrarMarcas(texto).pipe(untilDestroyed(this)).subscribe((res) => {
      this.marcas$.next(res || []);
    });
  }

  onSelectMarca(marca: MarcaEquipo): void {
    this.currentMarca = marca;
    this.marcaIdControl.setValue(marca?.id ? Number(marca.id) : null);
  }

  onGuardarMarca(): void {
    if (!this.marcaForm.valid) {
      return;
    }

    this.equiposService.onGuardarMarca({
      descripcion: this.descripcionMarcaControl.value?.toUpperCase() || '',
      usuarioId: this.mainService.usuarioActual?.id
    }).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res) {
        this.marcaForm.reset();
        this.cargarMarcas();
        this.currentMarca = res;
        this.marcaIdControl.setValue(Number(res.id));
      }
    });
  }

  onGuardarModelo(): void {
    if (!this.modeloForm.valid) {
      return;
    }

    this.equiposService.onGuardarModelo({
      marcaId: Number(this.marcaIdControl.value),
      descripcion: this.descripcionModeloControl.value?.toUpperCase() || '',
      usuarioId: this.mainService.usuarioActual?.id
    }).pipe(untilDestroyed(this)).subscribe((res: ModeloEquipo) => {
      if (res) {
        this.dialogRef.close(res);
      }
    });
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
