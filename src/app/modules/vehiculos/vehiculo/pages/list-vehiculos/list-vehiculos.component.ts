import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Vehiculo } from '../../models/vehiculo.model';
import { VehiculoService } from '../../service/vehiculo.service';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
@UntilDestroy()
@Component({
    selector: 'app-list-vehiculos',
    templateUrl: './list-vehiculos.component.html',
    styleUrls: ['./list-vehiculos.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListVehiculosComponent implements OnInit {
    public vehiculoService = inject(VehiculoService);
    private cdr = inject(ChangeDetectorRef);

    dataSource = new MatTableDataSource<Vehiculo>();
    displayedColumns = ['id', 'chapa', 'marca', 'modelo', 'tipo', 'anho', 'color', 'acciones'];

    filtroControl = new FormControl('');
    tipoControl = new FormControl(null);

    ngOnInit(): void {
        this.vehiculoService.cargarTiposCache();
        this.vehiculoService.refrescar();
        this.initFiltros();
        this.initDataStream();
    }

    private initFiltros(): void {
        this.filtroControl.valueChanges.pipe(
            untilDestroyed(this),
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(texto => {
            this.vehiculoService.setSearchText(texto || '');
        });

        this.tipoControl.valueChanges.pipe(
            untilDestroyed(this)
        ).subscribe(tipoId => {
            this.vehiculoService.updateTipoFilter(tipoId);
        });
    }

    private initDataStream(): void {
        this.vehiculoService.filteredVehiculos$.pipe(
            untilDestroyed(this)
        ).subscribe(res => {
            this.dataSource.data = res;
            this.cdr.markForCheck();
        });
    }

    onFiltrar(): void {
        this.vehiculoService.refrescar();
    }

    handlePageEvent(event: PageEvent): void {
        this.vehiculoService.updatePagination(event.pageIndex, event.pageSize);
    }

    onAdicionar(): void {
        this.vehiculoService.abrirFormulario().subscribe();
    }

    onEditar(vehiculo: Vehiculo): void {
        this.vehiculoService.abrirFormulario(vehiculo).subscribe();
    }

    onEliminar(vehiculo: Vehiculo): void {
        if (vehiculo.id) {
            this.vehiculoService.onEliminar(vehiculo.id).subscribe();
        }
    }

    resetFiltro(): void {
        this.filtroControl.setValue('');
        this.tipoControl.setValue(null);
        this.vehiculoService.updateTipoFilter(null);
        this.vehiculoService.refrescar();
    }
}

