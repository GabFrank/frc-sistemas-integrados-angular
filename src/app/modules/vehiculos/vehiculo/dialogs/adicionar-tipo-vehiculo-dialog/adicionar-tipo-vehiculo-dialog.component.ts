import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { VehiculoService } from '../../service/vehiculo.service';
import { MainService } from '../../../../../main.service';
import { TipoVehiculo } from '../../models/tipo-vehiculo.model';

@UntilDestroy()
@Component({
    selector: 'app-adicionar-tipo-vehiculo-dialog',
    templateUrl: './adicionar-tipo-vehiculo-dialog.component.html',
    styleUrls: ['./adicionar-tipo-vehiculo-dialog.component.scss']
})
export class AdicionarTipoVehiculoDialogComponent implements OnInit {

    private fb = inject(FormBuilder);
    private vehiculoService = inject(VehiculoService);
    public mainService = inject(MainService);

    tipoForm: FormGroup;

    constructor(
        public dialogRef: MatDialogRef<AdicionarTipoVehiculoDialogComponent>
    ) {
        this.tipoForm = this.fb.group({
            descripcion: ['', [Validators.required]]
        });
    }

    ngOnInit(): void {
    }

    onGuardarTipo(): void {
        if (this.tipoForm.valid) {
            this.vehiculoService.onGuardarTipo({
                descripcion: this.tipoForm.value.descripcion.toUpperCase(),
                usuarioId: this.mainService.usuarioActual?.id
            }).pipe(untilDestroyed(this)).subscribe((res: TipoVehiculo) => {
                if (res) {
                    this.dialogRef.close(res);
                }
            });
        }
    }

    onCancelar(): void {
        this.dialogRef.close();
    }
}
