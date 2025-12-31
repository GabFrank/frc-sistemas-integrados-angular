import { Component, Inject, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TipoVehiculo } from '../models/tipo-vehiculo.model';
import { VehiculoService } from '../vehiculo.service';
import { MainService } from '../../../../main.service';

@UntilDestroy()
@Component({
    selector: 'app-buscar-tipo-vehiculo-dialog',
    templateUrl: './buscar-tipo-vehiculo-dialog.component.html',
    styleUrls: ['./buscar-tipo-vehiculo-dialog.component.scss']
})
export class BuscarTipoVehiculoDialogComponent implements OnInit {
    private fb = inject(FormBuilder);
    private vehiculoService = inject(VehiculoService);
    public mainService = inject(MainService);

    buscarControl = new FormControl('');
    dataSource = new MatTableDataSource<TipoVehiculo>();
    isSearching = false;
    showAddForm = false;

    tipoForm: FormGroup;

    displayedColumns = ['id', 'tipo', 'acciones'];

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<BuscarTipoVehiculoDialogComponent>
    ) {
        this.tipoForm = this.fb.group({
            descripcion: ['', [Validators.required]]
        });
    }

    ngOnInit(): void {
        this.onFiltrarTipos('');

        this.buscarControl.valueChanges.pipe(untilDestroyed(this)).subscribe(value => {
            this.onFiltrarTipos(value || '');
        });
    }

    onFiltrarTipos(texto: string): void {
        this.isSearching = true;
        this.vehiculoService.onFiltrarTipos(texto).pipe(untilDestroyed(this)).subscribe(res => {
            this.dataSource.data = res || [];
            this.isSearching = false;
        });
    }

    onSelectTipo(tipo: TipoVehiculo): void {
        this.dialogRef.close(tipo);
    }

    toggleAddForm(): void {
        this.showAddForm = !this.showAddForm;
    }

    onGuardarTipo(): void {
        if (this.tipoForm.valid) {
            this.vehiculoService.onGuardarTipo({
                descripcion: this.tipoForm.value.descripcion.toUpperCase(),
                usuarioId: this.mainService.usuarioActual?.id
            }).pipe(untilDestroyed(this)).subscribe(res => {
                if (res) {
                    this.onSelectTipo(res);
                }
            });
        }
    }

    onCancelar(): void {
        this.dialogRef.close();
    }
}
