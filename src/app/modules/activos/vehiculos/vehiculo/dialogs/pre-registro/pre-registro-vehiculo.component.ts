import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehiculoService } from '../../service/vehiculo.service';
import { BehaviorSubject } from 'rxjs';
import { Marca } from '../../models/marca.model';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { VehiculoComponent } from '../vehiculo-form/vehiculo.component';
import { MainService } from '../../../../../../main.service';
import { TabData, TabService } from '../../../../../../layouts/tab/tab.service';
import { Tab } from '../../../../../../layouts/tab/tab.model';

@UntilDestroy()
@Component({
    selector: 'app-pre-registro-vehiculo',
    templateUrl: './pre-registro-vehiculo.component.html',
    styleUrls: ['./pre-registro-vehiculo.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreRegistroVehiculoComponent implements OnInit {
    private fb = inject(FormBuilder);
    private vehiculoService = inject(VehiculoService);
    private tabService = inject(TabService);
    public mainService = inject(MainService);

    tipoForm: FormGroup;
    marcaForm: FormGroup;
    modeloForm: FormGroup;

    marcas$ = new BehaviorSubject<Marca[]>([]);

    // UI states
    tipoSaved = false;
    marcaSaved = false;
    modeloSaved = false;

    ngOnInit(): void {
        this.tipoForm = this.fb.group({
            descripcion: ['', [Validators.required]]
        });

        this.marcaForm = this.fb.group({
            descripcion: ['', [Validators.required]]
        });

        this.modeloForm = this.fb.group({
            marcaId: [null, [Validators.required]],
            descripcion: ['', [Validators.required]]
        });

        this.cargarMarcas();
    }

    cargarMarcas(): void {
        this.vehiculoService.onFiltrarMarcas('%').pipe(untilDestroyed(this)).subscribe(res => {
            this.marcas$.next(res);
        });
    }

    onFiltrarMarcas(texto: string): void {
        this.vehiculoService.onFiltrarMarcas(texto).pipe(untilDestroyed(this)).subscribe(res => {
            this.marcas$.next(res);
        });
    }

    onGuardarTipo(): void {
        if (this.tipoForm.valid) {
            this.vehiculoService.onGuardarTipo({
                descripcion: this.tipoForm.value.descripcion.toUpperCase(),
                usuarioId: this.mainService.usuarioActual?.id
            }).pipe(untilDestroyed(this)).subscribe(res => {
                if (res) {
                    this.tipoSaved = true;
                    this.tipoForm.disable();
                }
            });
        }
    }

    onGuardarMarca(): void {
        if (this.marcaForm.valid) {
            this.vehiculoService.onGuardarMarca({
                descripcion: this.marcaForm.value.descripcion.toUpperCase(),
                usuarioId: this.mainService.usuarioActual?.id
            }).pipe(untilDestroyed(this)).subscribe(res => {
                if (res) {
                    this.marcaSaved = true;
                    this.marcaForm.disable();
                    this.cargarMarcas(); // Refresh list for model selection
                }
            });
        }
    }

    onGuardarModelo(): void {
        if (this.modeloForm.valid) {
            this.vehiculoService.onGuardarModelo({
                marcaId: this.modeloForm.value.marcaId,
                descripcion: this.modeloForm.value.descripcion.toUpperCase(),
                usuarioId: this.mainService.usuarioActual?.id
            }).pipe(untilDestroyed(this)).subscribe(res => {
                if (res) {
                    this.modeloSaved = true;
                    this.modeloForm.disable();
                }
            });
        }
    }

    onSelectMarca(marca: Marca): void {
        this.modeloForm.get('marcaId')?.setValue(marca?.id ? Number(marca.id) : null);
    }

    onContinuar(): void {
        // Redirigir al formulario de vehículo
        this.tabService.addTab(new Tab(VehiculoComponent, 'Agregar Vehículo', new TabData(), PreRegistroVehiculoComponent));
        // Opcionalmente cerrar esta pestaña
        this.tabService.removeTab(this.tabService.currentIndex - 1);
    }

    onCancelar(): void {
        this.tabService.removeTab(this.tabService.currentIndex);
    }
}
