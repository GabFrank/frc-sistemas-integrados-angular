import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehiculoService } from '../vehiculo.service';
import { TabService, TabData } from '../../../../layouts/tab/tab.service';
import { VehiculoInput } from '../models/vehiculo-input.model';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Vehiculo } from '../models/vehiculo.model';
import { Modelo } from '../models/modelo.model';
import { TipoVehiculo } from '../models/tipo-vehiculo.model';
import { BehaviorSubject } from 'rxjs';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

@UntilDestroy()
@Component({
    selector: 'app-vehiculo',
    templateUrl: './vehiculo.component.html',
    styleUrls: ['./vehiculo.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VehiculoComponent implements OnInit {
    private fb = inject(FormBuilder);
    private vehiculoService = inject(VehiculoService);
    private tabService = inject(TabService);

    form: FormGroup;
    vehiculo: Vehiculo;

    modelos$ = new BehaviorSubject<Modelo[]>([]);
    tiposVehiculo$ = new BehaviorSubject<TipoVehiculo[]>([]);

    ngOnInit(): void {
        const tabData = this.tabService.currentTab()?.tabData?.data;
        this.vehiculo = tabData;

        this.form = this.fb.group({
            id: [this.vehiculo?.id],
            chapa: [this.vehiculo?.chapa, [Validators.required]],
            color: [this.vehiculo?.color, [Validators.required]],
            anho: [this.vehiculo?.anho || new Date().getFullYear(), [Validators.required, Validators.min(1900)]],
            nuevo: [this.vehiculo?.nuevo || false],
            documentacion: [this.vehiculo?.documentacion || false],
            refrigerado: [this.vehiculo?.refrigerado || false],
            capacidadKg: [this.vehiculo?.capacidadKg],
            capacidadPasajeros: [this.vehiculo?.capacidadPasajeros],
            primerKilometraje: [this.vehiculo?.primerKilometraje],
            fechaAdquisicion: [this.vehiculo?.fechaAdquisicion],
            modeloId: [this.vehiculo?.modelo?.id, [Validators.required]],
            tipoVehiculoId: [this.vehiculo?.tipoVehiculo?.id, [Validators.required]]
        });

        if (this.vehiculo?.modelo) {
            this.modelos$.next([this.vehiculo.modelo]);
        }
        if (this.vehiculo?.tipoVehiculo) {
            this.tiposVehiculo$.next([this.vehiculo.tipoVehiculo]);
        }
    }

    onGuardar(): void {
        if (this.form.valid) {
            const values = this.form.value;
            const input: VehiculoInput = {
                ...values,
                chapa: values.chapa?.toUpperCase(),
                color: values.color?.toUpperCase(),
                fechaAdquisicion: values.fechaAdquisicion ? dateToString(new Date(values.fechaAdquisicion)) : null
            };
            this.vehiculoService.onGuardar(input).pipe(untilDestroyed(this)).subscribe(res => {
                if (res) {
                    this.tabService.removeTab(this.tabService.currentIndex);
                }
            });
        }
    }

    onFiltrarModelos(texto: string): void {
        this.vehiculoService.onFiltrarModelos(texto).pipe(untilDestroyed(this)).subscribe(res => {
            this.modelos$.next(res);
        });
    }

    onFiltrarTipos(texto: string): void {
        this.vehiculoService.onFiltrarTipos(texto).pipe(untilDestroyed(this)).subscribe(res => {
            this.tiposVehiculo$.next(res);
        });
    }

    onSelectModelo(modelo: Modelo): void {
        this.form.get('modeloId')?.setValue(modelo?.id);
    }

    onSelectTipo(tipo: TipoVehiculo): void {
        this.form.get('tipoVehiculoId')?.setValue(tipo?.id);
    }

    onCancelar(): void {
        this.tabService.removeTab(this.tabService.currentIndex);
    }
}
