import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { VehiculoSucursal } from '../../models/vehiculo-sucursal.model';
import { VehiculoSucursalInput } from '../../models/vehiculo-sucursal-input.model';
import { VehiculoService } from '../../service/vehiculo.service';
import { Vehiculo } from '../../models/vehiculo.model';
import { SucursalService } from '../../../../../empresarial/sucursal/sucursal.service';
import { Sucursal } from '../../../../../empresarial/sucursal/sucursal.model';
import { Funcionario } from '../../../../../personas/funcionarios/funcionario.model';
import { MainService } from '../../../../../../main.service';
import { EnteService } from '../../../../ente/service/ente.service';
import { TipoEnte } from '../../../../ente/enums/tipo-ente.enum';

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
    private enteService = inject(EnteService);

    form: FormGroup;
    sucursales: Sucursal[] = [];
    isLoading = false;
    mostrarVehiculo = false;
    selectedResponsable: Funcionario | null = null;
    responsableControlDisplay = new FormControl('');
    selectedVehiculo: Vehiculo | null = null;
    vehiculoControlDisplay = new FormControl('');

    // Controles
    vehiculoControl = new FormControl<number | null>(null);
    sucursalControl = new FormControl<number | null>(null, [Validators.required]);
    responsableControl = new FormControl<number | null>(null);

    constructor(
        public dialogRef: MatDialogRef<VehiculoSucursalDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: VehiculoSucursalDialogData
    ) {
        this.mostrarVehiculo = !this.data?.vehiculo;
        if (this.mostrarVehiculo) {
            this.vehiculoControl.setValidators([Validators.required]);
        }

        this.form = new FormGroup({
            vehiculoControl: this.vehiculoControl,
            sucursalControl: this.sucursalControl,
            responsableControl: this.responsableControl
        });
    }

    ngOnInit(): void {
        this.cargarSucursales();

        if (this.data?.vehiculo) {
            this.selectedVehiculo = this.data.vehiculo;
            this.vehiculoControlDisplay.setValue(this.getVehiculoDisplay(this.data.vehiculo));
            this.vehiculoControl.setValue(this.data.vehiculo.id);
        }

        if (this.data?.vehiculoSucursal) {
            const vehiculo = this.data.vehiculoSucursal.vehiculo || this.data.vehiculo || null;
            this.selectedVehiculo = vehiculo;
            this.vehiculoControlDisplay.setValue(vehiculo ? this.getVehiculoDisplay(vehiculo) : '');
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

    onBuscarVehiculo(): void {
        this.enteService.abrirBuscadorEnte(TipoEnte.VEHICULO).subscribe((ente: any) => {
            if (ente) {
                // Aquí necesitamos el objeto vehículo real o al menos sus datos de visualización.
                // El buscador de ente devuelve un Ente, que tiene referenciaId.
                // En este caso, el Ente para un Vehículo tiene el mismo ID que el Vehículo.
                this.vehiculoService.onBuscarPorId(ente.referenciaId).subscribe(v => {
                    if (v) {
                        this.selectedVehiculo = v;
                        this.vehiculoControlDisplay.setValue(this.getVehiculoDisplay(v));
                        this.vehiculoControl.setValue(v.id);
                    }
                });
            }
        });
    }

    onBuscarResponsable(): void {
        this.enteService.abrirBuscadorResponsable().subscribe(res => {
            if (res) {
                this.selectedResponsable = res;
                this.responsableControlDisplay.setValue(res.persona?.nombre || '');
                this.responsableControl.setValue(res.id);
            }
        });
    }

    private getVehiculoDisplay(v: Vehiculo | null | undefined): string {
        if (!v) return '';
        const marca = v.modelo?.marca?.descripcion ? ` ${v.modelo.marca.descripcion}` : '';
        const modelo = v.modelo?.descripcion ? ` ${v.modelo.descripcion}` : '';
        const detalle = `${marca}${modelo}`.trim();
        return detalle ? `${v.chapa} - ${detalle}` : (v.chapa || '');
    }

    onGuardar(): void {
        if (this.form.invalid) {
            return;
        }

        const vehiculoId = this.mostrarVehiculo
            ? this.vehiculoControl.value
            : this.data?.vehiculo?.id;

        if (!vehiculoId) {
            return;
        }

        this.isLoading = true;
        const input: VehiculoSucursalInput = {
            id: this.data?.vehiculoSucursal?.id,
            vehiculoId: vehiculoId,
            sucursalId: this.sucursalControl.value,
            responsableId: this.responsableControl.value || null,
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
