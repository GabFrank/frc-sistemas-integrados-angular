import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { Vehiculo } from '../models/vehiculo.model';
import { TipoVehiculo } from '../models/tipo-vehiculo.model';
import { VehiculoService } from '../vehiculo.service';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { TabService, TabData } from '../../../../layouts/tab/tab.service';
import { MatDialog } from '@angular/material/dialog';
import { Tab } from '../../../../layouts/tab/tab.model';
import { VehiculoComponent } from '../vehiculo-form/vehiculo.component';
import { PreRegistroVehiculoComponent } from '../pre-registro/pre-registro-vehiculo.component';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-list-vehiculos',
    templateUrl: './list-vehiculos.component.html',
    styleUrls: ['./list-vehiculos.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger("detailExpand", [
            state("collapsed", style({ height: "0px", minHeight: "0" })),
            state("expanded", style({ height: "*" })),
            transition(
                "expanded <=> collapsed",
                animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
            ),
        ]),
    ],
})
export class ListVehiculosComponent implements OnInit {
    private vehiculoService = inject(VehiculoService);
    private tabService = inject(TabService);
    private dialog = inject(MatDialog);

    dataSource = new MatTableDataSource<Vehiculo>();
    displayedColumns = ['id', 'chapa', 'marca', 'modelo', 'tipo', 'anho', 'color', 'acciones'];

    filtroControl = new FormControl('');
    tipoControl = new FormControl(null);
    tiposVehiculo$ = new BehaviorSubject<TipoVehiculo[]>([]);

    pageIndex = 0;
    pageSize = 15;
    totalElements = 0;
    expandedVehiculo: Vehiculo;

    ngOnInit(): void {
        this.onFiltrar();
        this.cargarTipos();
    }

    cargarTipos(): void {
        this.vehiculoService.onFiltrarTipos('%').subscribe(res => {
            this.tiposVehiculo$.next(res);
        });
    }

    onFiltrar(): void {
        const texto = this.filtroControl.value || '';
        this.vehiculoService.onFiltrar(texto, this.pageIndex, this.pageSize).subscribe(res => {
            if (res) {
                this.dataSource.data = res;
                this.totalElements = res.length;
            }
        });
    }

    handlePageEvent(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.onFiltrar();
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
