import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SucursalService } from '../../../../../empresarial/sucursal/sucursal.service';
import { Sucursal } from '../../../../../empresarial/sucursal/sucursal.model';
import { Funcionario } from '../../../../../personas/funcionarios/funcionario.model';
import { VehiculoService } from '../../service/vehiculo.service';
import { EnteService } from '../../../../ente/service/ente.service';
import { EnteSucursal } from '../../../../ente/models/ente-sucursal.model';

@UntilDestroy()
@Component({
    selector: 'app-list-vehiculo-sucursal',
    templateUrl: './list-vehiculo-sucursal.component.html',
    styleUrls: ['./list-vehiculo-sucursal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListVehiculoSucursalComponent implements OnInit {
    public vehiculoService = inject(VehiculoService);
    private enteService = inject(EnteService);
    private cdr = inject(ChangeDetectorRef);
    private sucursalService = inject(SucursalService);

    dataSource = new MatTableDataSource<EnteSucursal>();
    displayedColumns = ['id', 'vehiculo', 'sucursal', 'responsable', 'usuario', 'creadoEn', 'acciones'];
    isLoading = false;

    sucursalControl = new FormControl(null);
    responsableControl = new FormControl('');
    sucursales: Sucursal[] = [];

    ngOnInit(): void {
        this.cargarSucursales();
        this.vehiculoService.refrescarSucursal();
        this.initFiltros();
        this.initDataStream();
    }

    private initFiltros(): void {
        this.sucursalControl.valueChanges.pipe(
            untilDestroyed(this)
        ).subscribe(id => {
            this.vehiculoService.setSucursalFilter(id);
        });
    }

    private initDataStream(): void {
        this.vehiculoService.vehiculosSucursal$.pipe(
            untilDestroyed(this)
        ).subscribe(res => {
            this.dataSource.data = res;
            this.cdr.markForCheck();
        });
    }

    cargarSucursales(): void {
        this.sucursalService.onGetAllSucursales().subscribe(res => {
            this.sucursales = res || [];
            this.cdr.markForCheck();
        });
    }

    onFiltrar(): void {
        this.vehiculoService.refrescarSucursal();
    }


    handlePageEvent(event: PageEvent): void {
        this.vehiculoService.updatePaginationSucursal(event.pageIndex, event.pageSize);
    }

    onBuscarResponsable(): void {
        this.enteService.abrirBuscadorResponsable().pipe(untilDestroyed(this)).subscribe((res: Funcionario | undefined) => {
            if (res) {
                this.responsableControl.setValue(res.persona?.nombre || '');
                this.vehiculoService.setResponsableFilter(res.id);
                this.cdr.markForCheck();
            }
        });
    }

    resetFiltro(): void {
        this.sucursalControl.setValue(null);
        this.responsableControl.setValue('');
        this.vehiculoService.setSucursalFilter(null);
        this.vehiculoService.setResponsableFilter(null);
    }

    onAdicionar(): void {
        this.vehiculoService.abrirFormularioSucursal().subscribe();
    }

    onEditar(enteSucursal: EnteSucursal): void {
        this.vehiculoService.abrirFormularioSucursal(enteSucursal).subscribe();
    }

    onEliminar(enteSucursal: EnteSucursal): void {
        if (enteSucursal?.id) {
            this.vehiculoService.onEliminarVehiculoSucursal(enteSucursal).subscribe();
        }
    }
}

