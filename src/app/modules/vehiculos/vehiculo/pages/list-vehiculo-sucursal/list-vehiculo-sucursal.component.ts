import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { VehiculoSucursal } from '../../models/vehiculo-sucursal.model';
import { VehiculoService } from '../../service/vehiculo.service';
import { MatDialog } from '@angular/material/dialog';
import { VehiculoSucursalDialogComponent } from '../../dialogs/vehiculo-sucursal-dialog/vehiculo-sucursal-dialog.component';
import { SucursalService } from '../../../../empresarial/sucursal/sucursal.service';
import { Sucursal } from '../../../../empresarial/sucursal/sucursal.model';
import { Funcionario } from '../../../../personas/funcionarios/funcionario.model';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { FuncionarioSearchGQL } from '../../../../personas/funcionarios/graphql/funcionarioSearch';

@Component({
    selector: 'app-list-vehiculo-sucursal',
    templateUrl: './list-vehiculo-sucursal.component.html',
    styleUrls: ['./list-vehiculo-sucursal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListVehiculoSucursalComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatTable) table: MatTable<any>;

    private vehiculoService = inject(VehiculoService);
    private dialog = inject(MatDialog);
    private cdr = inject(ChangeDetectorRef);
    private sucursalService = inject(SucursalService);
    private funcionarioSearchGQL = inject(FuncionarioSearchGQL);

    dataSource = new MatTableDataSource<VehiculoSucursal>();
    displayedColumns = ['id', 'vehiculo', 'sucursal', 'responsable', 'usuario', 'creadoEn', 'acciones'];
    isLoading = false;

    sucursalControl = new FormControl(null);
    responsableControl = new FormControl('');
    selectedResponsable: Funcionario | null = null;
    sucursales: Sucursal[] = [];

    pageIndex = 0;
    pageSize = 15;
    totalElements = 0;

    ngOnInit(): void {
        this.cargarSucursales();
        setTimeout(() => {
            if (this.paginator) {
                this.paginator._changePageSize(this.paginator.pageSizeOptions[0]);
                this.pageSize = this.paginator.pageSizeOptions[0];
            }
            this.onFiltrar();
        }, 0);
    }

    cargarSucursales(): void {
        this.sucursalService.onGetAllSucursales().subscribe(res => {
            this.sucursales = res || [];
            this.cdr.markForCheck();
        });
    }

    onFiltrar(): void {
        this.pageIndex = 0;
        if (this.paginator) {
            this.paginator.pageIndex = 0;
        }
        this.cargarDatos();
    }

    cargarDatos(): void {
        this.isLoading = true;
        const sucursalId = this.sucursalControl.value;
        const responsableId = this.selectedResponsable?.id;

        this.vehiculoService.onBuscarVehiculosSucursalSearchPage(sucursalId, responsableId, this.pageIndex, this.pageSize).subscribe({
            next: (res) => {
                const pageResult = res || { getContent: [], getTotalElements: 0 };
                this.dataSource.data = pageResult.getContent || [];
                this.totalElements = pageResult.getTotalElements || 0;
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.isLoading = false;
                this.cdr.markForCheck();
            }
        });
    }

    handlePageEvent(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.cargarDatos();
    }

    onBuscarResponsable(): void {
        const tableData: TableData[] = [
            {
                id: 'id',
                nombre: 'Id'
            },
            {
                id: 'nombre',
                nombre: 'Nombre',
                nested: true,
                nestedId: 'persona',
                nestedColumnId: 'nombre'
            }
        ];

        const data: SearchListtDialogData = {
            query: this.funcionarioSearchGQL,
            tableData: tableData,
            titulo: 'Buscar Responsable',
            search: true,
            inicialSearch: true
        };

        this.dialog.open(SearchListDialogComponent, {
            data: data,
            width: '60%',
            height: '80%'
        }).afterClosed().subscribe((res: Funcionario) => {
            if (res) {
                this.selectedResponsable = res;
                this.responsableControl.setValue(res.persona?.nombre || '');
                this.onFiltrar();
            }
        });
    }

    resetFiltro(): void {
        this.sucursalControl.setValue(null);
        this.responsableControl.setValue('');
        this.selectedResponsable = null;
        this.pageIndex = 0;
        if (this.paginator) {
            this.paginator.pageIndex = 0;
        }
        this.cargarDatos();
    }

    onAdicionar(): void {
        // Necesitamos un diálogo que permita seleccionar el vehículo primero
        // Por ahora, usar el diálogo sin vehículo y que permita seleccionarlo
        const dialogRef = this.dialog.open(VehiculoSucursalDialogComponent, {
            width: '500px',
            disableClose: true,
            autoFocus: false,
            data: {}
        });

        dialogRef.afterClosed().subscribe(res => {
            if (res) {
                this.cargarDatos();
            }
        });
    }

    onEditar(vehiculoSucursal: VehiculoSucursal): void {
        if (!vehiculoSucursal.vehiculo?.id) return;

        const dialogRef = this.dialog.open(VehiculoSucursalDialogComponent, {
            width: '500px',
            disableClose: true,
            autoFocus: false,
            data: { vehiculoSucursal, vehiculo: vehiculoSucursal.vehiculo }
        });

        dialogRef.afterClosed().subscribe(res => {
            if (res) {
                this.cargarDatos();
            }
        });
    }

    onEliminar(vehiculoSucursal: VehiculoSucursal): void {
        if (!vehiculoSucursal.id) return;

        this.vehiculoService.onEliminarVehiculoSucursal(vehiculoSucursal.id).subscribe({
            next: () => {
                this.cargarDatos();
            }
        });
    }
}

