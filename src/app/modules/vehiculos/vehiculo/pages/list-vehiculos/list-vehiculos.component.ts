import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { Vehiculo } from '../../models/vehiculo.model';
import { TipoVehiculo } from '../../models/tipo-vehiculo.model';
import { VehiculoService } from '../../service/vehiculo.service';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { TabService } from '../../../../../layouts/tab/tab.service';
import { MatDialog } from '@angular/material/dialog';
import { VehiculoComponent } from '../../dialogs/vehiculo-form/vehiculo.component';
@Component({
    selector: 'app-list-vehiculos',
    templateUrl: './list-vehiculos.component.html',
    styleUrls: ['./list-vehiculos.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListVehiculosComponent implements OnInit {
    private vehiculoService = inject(VehiculoService);
    private tabService = inject(TabService);
    private dialog = inject(MatDialog);
    private cdr = inject(ChangeDetectorRef);

    dataSource = new MatTableDataSource<Vehiculo>();
    displayedColumns = ['id', 'chapa', 'marca', 'modelo', 'tipo', 'anho', 'color', 'acciones'];

    filtroControl = new FormControl('');
    tipoControl = new FormControl(null);
    tiposVehiculo$ = new BehaviorSubject<TipoVehiculo[]>([]);

    pageIndex = 0;
    pageSize = 15;
    totalElements = 0;
    allData: Vehiculo[] = [];

    ngOnInit(): void {
        this.onFiltrar();
        this.cargarTipos();
        this.tipoControl.valueChanges.subscribe(() => {
            this.pageIndex = 0;
            this.aplicarFiltros();
        });
    }

    cargarTipos(): void {
        this.vehiculoService.onFiltrarTipos('%').subscribe(res => {
            this.tiposVehiculo$.next(res);
        });
    }

    onFiltrar(): void {
        const texto = this.filtroControl.value || '';
        this.pageIndex = 0;

        this.vehiculoService.onFiltrar(texto, 0, 1000).subscribe(res => {
            if (res) {
                this.allData = res;
                this.aplicarFiltros();
            }
        });
    }

    handlePageEvent(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.aplicarFiltros();
    }

    aplicarFiltros(): void {
        const tipoId = this.tipoControl.value;

        let filteredData = this.allData;
        if (tipoId) {
            filteredData = this.allData.filter(v => v.tipoVehiculo?.id === tipoId);
        }

        const startIndex = this.pageIndex * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        this.dataSource.data = paginatedData;
        this.totalElements = filteredData.length;
        this.cdr.markForCheck();
    }

    onAdicionar(): void {
        const dialogRef = this.dialog.open(VehiculoComponent, {
            width: '800px',
            disableClose: true,
            autoFocus: false
        });

        dialogRef.afterClosed().subscribe(res => {
            if (res) {
                this.onFiltrar();
            }
        });
    }

    onEditar(vehiculo: Vehiculo): void {
        const dialogRef = this.dialog.open(VehiculoComponent, {
            width: '800px',
            data: vehiculo,
            disableClose: true,
            autoFocus: false
        });

        dialogRef.afterClosed().subscribe(res => {
            if (res) {
                this.onFiltrar();
            }
        });
    }

    onEliminar(vehiculo: Vehiculo): void {
        if (vehiculo.id) {
            this.vehiculoService.onEliminar(vehiculo.id).subscribe(res => {
                if (res) {
                    this.onFiltrar();
                }
            });
        }
    }

    resetFiltro(): void {
        this.filtroControl.setValue('');
        this.tipoControl.setValue(null);
        this.pageIndex = 0;
        this.onFiltrar();
    }
}

