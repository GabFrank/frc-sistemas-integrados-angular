import { Component, Inject, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TipoVehiculo } from '../../models/tipo-vehiculo.model';
import { VehiculoService } from '../../service/vehiculo.service';
import { MainService } from '../../../../../main.service';
import { AdicionarTipoVehiculoDialogComponent } from '../adicionar-tipo-vehiculo-dialog/adicionar-tipo-vehiculo-dialog.component';

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
    private matDialog = inject(MatDialog);

    buscarControl = new FormControl('');
    dataSource = new MatTableDataSource<TipoVehiculo>();
    isSearching = false;


    displayedColumns = ['id', 'tipo', 'acciones'];

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<BuscarTipoVehiculoDialogComponent>
    ) {
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

    onAdicionar(): void {
        this.matDialog.open(AdicionarTipoVehiculoDialogComponent, {
            width: '100%',
            maxWidth: '500px',
            disableClose: true,
            autoFocus: true
        }).afterClosed().pipe(untilDestroyed(this)).subscribe((res: TipoVehiculo) => {
            if (res) {
                this.onSelectTipo(res);
            } else {
                this.onFiltrarTipos(this.buscarControl.value || '');
            }
        });
    }

    onCancelar(): void {
        this.dialogRef.close();
    }
}
