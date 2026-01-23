import { Component, Inject, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Vehiculo } from '../models/vehiculo.model';
import { VehiculoService } from '../vehiculo.service';
import { MainService } from '../../../../main.service';

@UntilDestroy()
@Component({
    selector: 'app-buscar-vehiculo-dialog',
    templateUrl: './buscar-vehiculo-dialog.component.html',
    styleUrls: ['./buscar-vehiculo-dialog.component.scss']
})
export class BuscarVehiculoDialogComponent implements OnInit {
    private vehiculoService = inject(VehiculoService);
    public mainService = inject(MainService);
    private matDialog = inject(MatDialog);

    buscarControl = new FormControl('');
    dataSource = new MatTableDataSource<Vehiculo>();
    isSearching = false;

    displayedColumns = ['id', 'marca', 'modelo', 'chapa', 'acciones'];

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<BuscarVehiculoDialogComponent>
    ) {
    }

    ngOnInit(): void {
        this.onFiltrar('');

        this.buscarControl.valueChanges.pipe(untilDestroyed(this)).subscribe(value => {
            this.onFiltrar(value || '');
        });
    }

    onFiltrar(texto: string): void {
        this.isSearching = true;
        this.vehiculoService.onFiltrar(texto, 0, 20).pipe(untilDestroyed(this)).subscribe(res => {
            this.dataSource.data = res || [];
            this.isSearching = false;
        });
    }

    onSelect(vehiculo: Vehiculo): void {
        this.dialogRef.close(vehiculo);
    }

    onCancelar(): void {
        this.dialogRef.close();
    }
}
