import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { VehiculoService } from '../../service/vehiculo.service';
import { Modelo } from '../../models/modelo.model';
import { Marca } from '../../models/marca.model';
import { MainService } from '../../../../../../main.service';

@UntilDestroy()
@Component({
    selector: 'app-adicionar-modelo-dialog',
    templateUrl: './adicionar-modelo-dialog.component.html',
    styleUrls: ['./adicionar-modelo-dialog.component.scss']
})
export class AdicionarModeloDialogComponent implements OnInit {

    private fb = inject(FormBuilder);
    private vehiculoService = inject(VehiculoService);
    public mainService = inject(MainService);

    marcaForm: FormGroup;
    modeloForm: FormGroup;
    marcas$ = new BehaviorSubject<Marca[]>([]);
    currentMarca: Marca | null = null;

    // Controles
    descripcionMarcaControl = new FormControl('', [Validators.required]);
    marcaIdControl = new FormControl<number | null>(null, [Validators.required]);
    descripcionModeloControl = new FormControl('', [Validators.required]);

    constructor(
        public dialogRef: MatDialogRef<AdicionarModeloDialogComponent>
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
        this.vehiculoService.onFiltrarMarcas('%').pipe(untilDestroyed(this)).subscribe(res => {
            this.marcas$.next(res || []);
        });
    }

    onFiltrarMarcas(texto: string): void {
        this.vehiculoService.onFiltrarMarcas(texto).pipe(untilDestroyed(this)).subscribe(res => {
            this.marcas$.next(res || []);
        });
    }

    onSelectMarca(marca: Marca): void {
        this.currentMarca = marca;
        this.marcaIdControl.setValue(marca?.id ? Number(marca.id) : null);
    }

    onGuardarMarca(): void {
        if (this.marcaForm.valid) {
            this.vehiculoService.onGuardarMarca({
                descripcion: this.descripcionMarcaControl.value?.toUpperCase() || '',
                usuarioId: this.mainService.usuarioActual?.id
            }).pipe(untilDestroyed(this)).subscribe(res => {
                if (res) {
                    this.marcaForm.reset();
                    this.cargarMarcas();
                    this.currentMarca = res;
                    this.marcaIdControl.setValue(Number(res.id));
                }
            });
        }
    }

    onGuardarModelo(): void {
        if (this.modeloForm.valid) {
            this.vehiculoService.onGuardarModelo({
                marcaId: Number(this.marcaIdControl.value),
                descripcion: this.descripcionModeloControl.value?.toUpperCase() || '',
                usuarioId: this.mainService.usuarioActual?.id
            }).pipe(untilDestroyed(this)).subscribe((res: Modelo) => {
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
