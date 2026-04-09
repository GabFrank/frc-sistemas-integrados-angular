import { Component, Inject, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { startWith } from 'rxjs/operators';
import { EnteSucursal } from '../../models/ente-sucursal.model';
import { EnteSucursalInput } from '../../models/ente-sucursal-input.model';
import { EnteService } from '../../service/ente.service';
import { Ente } from '../../models/ente.model';
import { TipoEnte } from '../../enums/tipo-ente.enum';
import { SucursalService } from '../../../../empresarial/sucursal/sucursal.service';
import { MainService } from '../../../../../main.service';
import { Funcionario } from '../../../../personas/funcionarios/funcionario.model';
import { Sucursal } from '../../../../empresarial/sucursal/sucursal.model';

export interface EnteSucursalDialogData {
    enteSucursal?: EnteSucursal;
    ente?: Ente;
    sucursalId?: number;
}

@Component({
    selector: 'app-ente-sucursal-dialog',
    templateUrl: './ente-sucursal-dialog.component.html',
    styleUrls: ['./ente-sucursal-dialog.component.scss']
})
export class EnteSucursalDialogComponent implements OnInit {
    private enteService = inject(EnteService);
    private sucursalService = inject(SucursalService);
    private mainService = inject(MainService);
    private dialog = inject(MatDialog);
    private cdr = inject(ChangeDetectorRef);

    form: FormGroup;
    sucursales: Sucursal[] = [];
    tiposEnte = Object.values(TipoEnte).filter(v => v !== TipoEnte.INSTITUCION); // Filter out unused if any

    isLoading = false;
    mostrarEnte = true;

    selectedEnte: Ente | null = null;
    enteControlDisplay = new FormControl('');

    selectedResponsable: Funcionario | null = null;
    responsableControlDisplay = new FormControl('');

    // Form Controls
    tipoEnteControl = new FormControl<TipoEnte | null>(null, Validators.required);
    enteIdControl = new FormControl<number | null>(null, Validators.required);
    sucursalControl = new FormControl<number | null>(null, Validators.required);
    responsableIdControl = new FormControl<number | null>(null);

    tipoEnte$ = this.tipoEnteControl.valueChanges.pipe(
        startWith(this.tipoEnteControl.value)
    );

    constructor(
        public dialogRef: MatDialogRef<EnteSucursalDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: EnteSucursalDialogData
    ) {
        this.sucursalControl.setValue(this.data?.sucursalId || null);
        this.form = new FormGroup({
            tipoEnteControl: this.tipoEnteControl,
            enteIdControl: this.enteIdControl,
            sucursalControl: this.sucursalControl,
            responsableIdControl: this.responsableIdControl
        });
    }

    ngOnInit(): void {
        this.cargarSucursales();

        if (this.data?.ente) {
            this.setEnte(this.data.ente);
            this.mostrarEnte = false;
        }

        if (this.data?.enteSucursal) {
            this.setEnte(this.data.enteSucursal.ente!);
            this.mostrarEnte = false;
            this.selectedResponsable = this.data.enteSucursal.responsable || null;
            this.responsableControlDisplay.setValue(this.selectedResponsable?.persona?.nombre || '');

            this.tipoEnteControl.setValue(this.data.enteSucursal.ente?.tipoEnte || null);
            this.enteIdControl.setValue(this.data.enteSucursal.ente?.id || null);
            this.sucursalControl.setValue(this.data.enteSucursal.sucursal?.id || null);
            this.responsableIdControl.setValue(this.data.enteSucursal.responsable?.id || null);
        }
    }

    private setEnte(ente: Ente): void {
        this.selectedEnte = ente;
        this.tipoEnteControl.setValue(ente.tipoEnte);
        this.enteIdControl.setValue(ente.id || null);
        this.enteControlDisplay.setValue(`[${ente.tipoEnte}] ID: ${ente.id} - Ref: ${ente.referenciaId}`);
    }

    cargarSucursales(): void {
        this.sucursalService.onGetAllSucursales().subscribe(res => {
            this.sucursales = res || [];
            this.cdr.markForCheck();
        });
    }

    onBuscarEnte(): void {
        const tipo = this.tipoEnteControl.value;
        if (!tipo) return;

        this.enteService.abrirBuscadorEnte(tipo).subscribe(ente => {
            if (ente) {
                this.setEnte(ente);
                this.cdr.markForCheck();
            }
        });
    }

    private updateEnteDisplayValue(tipo: TipoEnte, res: any): void {
        if (tipo === TipoEnte.VEHICULO) {
            this.enteControlDisplay.setValue(`${res.chapa || ''} - ${res.modelo?.marca?.descripcion || ''} ${res.modelo?.descripcion || ''}`);
        } else if (tipo === TipoEnte.INMUEBLE) {
            this.enteControlDisplay.setValue(`${res.nombreAsignado || res.nombre_asignado || 'Sin nombre'}`);
        } else {
            this.enteControlDisplay.setValue(`${res.descripcion || 'Sin descripción'}`);
        }
    }

    onBuscarResponsable(): void {
        this.enteService.abrirBuscadorResponsable().subscribe(res => {
            if (res) {
                this.selectedResponsable = res;
                this.responsableControlDisplay.setValue(res.persona?.nombre || '');
                this.responsableIdControl.setValue(res.id);
                this.cdr.markForCheck();
            }
        });
    }

    onGuardar(): void {
        if (this.form.invalid) return;

        this.isLoading = true;
        const input: EnteSucursalInput = {
            id: this.data?.enteSucursal?.id,
            enteId: this.form.get('enteIdControl')?.value,
            sucursalId: this.form.get('sucursalControl')?.value,
            responsableId: this.form.get('responsableIdControl')?.value,
            usuarioId: this.mainService.usuarioActual?.id
        };

        this.enteService.onGuardarEnteSucursal(input).subscribe({
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
