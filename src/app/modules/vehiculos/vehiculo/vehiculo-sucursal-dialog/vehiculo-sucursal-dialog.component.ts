import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { VehiculoSucursal } from '../models/vehiculo-sucursal.model';
import { VehiculoSucursalInput } from '../models/vehiculo-sucursal-input.model';
import { VehiculoService } from '../vehiculo.service';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { MainService } from '../../../../main.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';
import { Vehiculo } from '../models/vehiculo.model';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { FuncionarioSearchGQL } from '../../../personas/funcionarios/graphql/funcionarioSearch';

export interface VehiculoSucursalDialogData {
    vehiculoSucursal?: VehiculoSucursal;
    vehiculo?: Vehiculo;
}

@Component({
    selector: 'app-vehiculo-sucursal-dialog',
    templateUrl: './vehiculo-sucursal-dialog.component.html',
    styleUrls: ['./vehiculo-sucursal-dialog.component.scss']
})
export class VehiculoSucursalDialogComponent implements OnInit {
    private vehiculoService = inject(VehiculoService);
    private sucursalService = inject(SucursalService);
    private mainService = inject(MainService);
    private dialog = inject(MatDialog);
    private funcionarioSearchGQL = inject(FuncionarioSearchGQL);

    form: FormGroup;
    sucursales: Sucursal[] = [];
    vehiculos: Vehiculo[] = [];
    isLoading = false;
    mostrarVehiculo = false;
    selectedResponsable: Funcionario | null = null;
    responsableControlDisplay = new FormControl('');

    constructor(
        public dialogRef: MatDialogRef<VehiculoSucursalDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: VehiculoSucursalDialogData
    ) {
        this.mostrarVehiculo = !this.data?.vehiculo;
        this.form = new FormGroup({
            vehiculoControl: new FormControl(null, this.mostrarVehiculo ? Validators.required : null),
            sucursalControl: new FormControl(null, Validators.required),
            responsableControl: new FormControl(null)
        });
    }

    ngOnInit(): void {
        this.cargarSucursales();
        
        if (this.mostrarVehiculo) {
            this.cargarVehiculos();
        }
        
        if (this.data?.vehiculo) {
            this.form.patchValue({
                vehiculoControl: this.data.vehiculo.id
            });
        }
        
        if (this.data?.vehiculoSucursal) {
            this.selectedResponsable = this.data.vehiculoSucursal.responsable || null;
            this.responsableControlDisplay.setValue(this.selectedResponsable?.persona?.nombre || '');
            
            this.form.patchValue({
                vehiculoControl: this.data.vehiculoSucursal.vehiculo?.id || this.data.vehiculo?.id,
                sucursalControl: this.data.vehiculoSucursal.sucursal?.id || null,
                responsableControl: this.data.vehiculoSucursal.responsable?.id || null
            });
        }
    }

    cargarSucursales(): void {
        this.sucursalService.onGetAllSucursales().subscribe(res => {
            this.sucursales = res || [];
        });
    }

    cargarVehiculos(): void {
        this.vehiculoService.onFiltrar('', 0, 1000).subscribe(res => {
            this.vehiculos = res || [];
        });
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
                this.responsableControlDisplay.setValue(res.persona?.nombre || '');
                this.form.patchValue({
                    responsableControl: res.id
                });
            }
        });
    }

    onGuardar(): void {
        if (this.form.invalid) {
            return;
        }

        const vehiculoId = this.mostrarVehiculo 
            ? this.form.get('vehiculoControl')?.value 
            : this.data?.vehiculo?.id;

        if (!vehiculoId) {
            return;
        }

        this.isLoading = true;
        const input: VehiculoSucursalInput = {
            id: this.data?.vehiculoSucursal?.id,
            vehiculoId: vehiculoId,
            sucursalId: this.form.get('sucursalControl')?.value,
            responsableId: this.form.get('responsableControl')?.value || null,
            usuarioId: this.mainService.usuarioActual?.id
        };

        this.vehiculoService.onGuardarVehiculoSucursal(input).subscribe({
            next: (res) => {
                this.isLoading = false;
                this.dialogRef.close(res);
            },
            error: () => {
                this.isLoading = false;
            }
        });
    }

    onCancelar(): void {
        this.dialogRef.close();
    }
}

