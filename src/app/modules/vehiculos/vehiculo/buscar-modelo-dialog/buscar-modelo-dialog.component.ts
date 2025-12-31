import { Component, Inject, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Modelo } from '../models/modelo.model';
import { Marca } from '../models/marca.model';
import { VehiculoService } from '../vehiculo.service';
import { MainService } from '../../../../main.service';

@UntilDestroy()
@Component({
    selector: 'app-buscar-modelo-dialog',
    templateUrl: './buscar-modelo-dialog.component.html',
    styleUrls: ['./buscar-modelo-dialog.component.scss']
})
export class BuscarModeloDialogComponent implements OnInit {
    private fb = inject(FormBuilder);
    private vehiculoService = inject(VehiculoService);
    public mainService = inject(MainService);

    buscarControl = new FormControl('');
    dataSource = new MatTableDataSource<Modelo>();
    isSearching = false;
    showAddForm = false;

    marcaForm: FormGroup;
    modeloForm: FormGroup;
    marcas$ = new BehaviorSubject<Marca[]>([]);
    currentMarca: Marca | null = null;

    displayedColumns = ['id', 'marca', 'modelo', 'acciones'];

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<BuscarModeloDialogComponent>
    ) {
        this.marcaForm = this.fb.group({
            descripcion: ['', [Validators.required]]
        });

        this.modeloForm = this.fb.group({
            marcaId: [null, [Validators.required]],
            descripcion: ['', [Validators.required]]
        });
    }

    ngOnInit(): void {
        this.onFiltrarModelos('');
        this.cargarMarcas();

        this.buscarControl.valueChanges.pipe(untilDestroyed(this)).subscribe(value => {
            this.onFiltrarModelos(value || '');
        });
    }

    onFiltrarModelos(texto: string): void {
        this.isSearching = true;
        this.vehiculoService.onFiltrarModelos(texto).pipe(untilDestroyed(this)).subscribe(res => {
            this.dataSource.data = res || [];
            this.isSearching = false;
        });
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

    onSelectModelo(modelo: Modelo): void {
        this.dialogRef.close(modelo);
    }

    toggleAddForm(): void {
        this.showAddForm = !this.showAddForm;
    }

    onGuardarMarca(): void {
        if (this.marcaForm.valid) {
            this.vehiculoService.onGuardarMarca({
                descripcion: this.marcaForm.value.descripcion.toUpperCase(),
                usuarioId: this.mainService.usuarioActual?.id
            }).pipe(untilDestroyed(this)).subscribe(res => {
                if (res) {
                    this.marcaForm.reset();
                    this.cargarMarcas();
                    this.currentMarca = res;
                    this.modeloForm.get('marcaId')?.setValue(Number(res.id));
                }
            });
        }
    }

    onGuardarModelo(): void {
        if (this.modeloForm.valid) {
            this.vehiculoService.onGuardarModelo({
                marcaId: Number(this.modeloForm.value.marcaId),
                descripcion: this.modeloForm.value.descripcion.toUpperCase(),
                usuarioId: this.mainService.usuarioActual?.id
            }).pipe(untilDestroyed(this)).subscribe(res => {
                if (res) {
                    this.onSelectModelo(res);
                }
            });
        }
    }

    onSelectMarca(marca: Marca): void {
        this.currentMarca = marca;
        this.modeloForm.get('marcaId')?.setValue(marca?.id ? Number(marca.id) : null);
    }

    onCancelar(): void {
        this.dialogRef.close();
    }
}
