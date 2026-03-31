import { Component, Inject, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { EnteSucursal } from '../../models/ente-sucursal.model';
import { EnteSucursalInput } from '../../models/ente-sucursal-input.model';
import { EnteService } from '../../service/ente.service';
import { EnteInput } from '../../models/ente-input.model';
import { Ente } from '../../models/ente.model';
import { TipoEnte } from '../../enums/tipo-ente.enum';
import { VehiculoSearchPageGQL } from '../../../vehiculos/vehiculo/graphql/vehiculoSearchPage';
import { MuebleSearchPageGQL } from '../../../muebles/graphql/muebleSearchPage';
import { InmuebleSearchPageGQL } from '../../../inmueble/graphql/inmuebleSearchPage';
import { SucursalService } from '../../../../empresarial/sucursal/sucursal.service';
import { MainService } from '../../../../../main.service';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { FuncionarioSearchGQL } from '../../../../personas/funcionarios/graphql/funcionarioSearch';
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

    // GQLs for specialized searches
    private vehiculoSearchGQL = inject(VehiculoSearchPageGQL);
    private muebleSearchGQL = inject(MuebleSearchPageGQL);
    private inmuebleSearchGQL = inject(InmuebleSearchPageGQL);
    private funcionarioSearchGQL = inject(FuncionarioSearchGQL);

    form: FormGroup;
    sucursales: Sucursal[] = [];
    tiposEnte = Object.values(TipoEnte).filter(v => v !== TipoEnte.INSTITUCION); // Filter out unused if any

    isLoading = false;
    mostrarEnte = true;

    selectedEnte: Ente | null = null;
    enteControlDisplay = new FormControl('');

    selectedResponsable: Funcionario | null = null;
    responsableControlDisplay = new FormControl('');

    constructor(
        public dialogRef: MatDialogRef<EnteSucursalDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: EnteSucursalDialogData
    ) {
        this.form = new FormGroup({
            tipoEnteControl: new FormControl(null, Validators.required),
            enteIdControl: new FormControl(null, Validators.required),
            sucursalControl: new FormControl(this.data?.sucursalId || null, Validators.required),
            responsableIdControl: new FormControl(null)
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

            this.form.patchValue({
                tipoEnteControl: this.data.enteSucursal.ente?.tipoEnte,
                enteIdControl: this.data.enteSucursal.ente?.id,
                sucursalControl: this.data.enteSucursal.sucursal?.id,
                responsableIdControl: this.data.enteSucursal.responsable?.id
            });
        }
    }

    private setEnte(ente: Ente): void {
        this.selectedEnte = ente;
        this.form.get('tipoEnteControl')?.setValue(ente.tipoEnte);
        this.form.get('enteIdControl')?.setValue(ente.id);
        this.enteControlDisplay.setValue(`[${ente.tipoEnte}] ID: ${ente.id} - Ref: ${ente.referenciaId}`);
    }

    cargarSucursales(): void {
        this.sucursalService.onGetAllSucursales().subscribe(res => {
            this.sucursales = res || [];
            this.cdr.markForCheck();
        });
    }

    onBuscarEnte(): void {
        const tipo = this.form.get('tipoEnteControl')?.value;
        if (!tipo) return;

        let query: any;
        let tableData: TableData[] = [];
        let titulo = '';

        switch (tipo) {
            case TipoEnte.VEHICULO:
                query = this.vehiculoSearchGQL;
                titulo = 'Buscar Vehículo';
                tableData = [
                    { id: 'id', nombre: 'Id', width: '10%' },
                    { id: 'chapa', nombre: 'Chapa', width: '30%' },
                    { id: 'modelo.marca.descripcion', nombre: 'Marca', width: '30%' },
                    { id: 'modelo.descripcion', nombre: 'Modelo', width: '30%' }
                ];
                break;
            case TipoEnte.MUEBLE:
                query = this.muebleSearchGQL;
                titulo = 'Buscar Mueble';
                tableData = [
                    { id: 'id', nombre: 'Id', width: '10%' },
                    { id: 'descripcion', nombre: 'Descripción', width: '90%' }
                ];
                break;
            case TipoEnte.INMUEBLE:
                query = this.inmuebleSearchGQL;
                titulo = 'Buscar Inmueble';
                tableData = [
                    { id: 'id', nombre: 'Id', width: '10%' },
                    { id: 'nombreAsignado', nombre: 'Descripción', width: '90%' }
                ];
                break;
        }

        if (query) {
            const data: SearchListtDialogData = {
                query,
                tableData,
                titulo,
                search: true,
                inicialSearch: true,
                paginator: true,
                isServidor: true
            };

            this.dialog.open(SearchListDialogComponent, {
                data,
                width: '70vw',
                height: '80vh'
            }).afterClosed().subscribe((res: any) => {
                if (res) {
                    this.enteService.onGetByReferenciaId(tipo, res.id).subscribe(ente => {
                        if (ente) {
                            this.setEnte(ente);
                            this.updateEnteDisplayValue(tipo, res);
                        } else {
                            // If Ente doesn't exist, create it on the fly
                            const input: EnteInput = {
                                tipoEnte: tipo,
                                referenciaId: res.id,
                                activo: true,
                                usuarioId: this.mainService.usuarioActual?.id
                            };
                            this.enteService.onGuardar(input).subscribe(newEnte => {
                                if (newEnte) {
                                    this.setEnte(newEnte);
                                    this.updateEnteDisplayValue(tipo, res);
                                }
                            });
                        }
                    });
                }
            });
        }
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
        const tableData: TableData[] = [
            { id: 'id', nombre: 'Id' },
            { id: 'persona.nombre', nombre: 'Nombre' }
        ];

        const data: SearchListtDialogData = {
            query: this.funcionarioSearchGQL,
            tableData,
            titulo: 'Buscar Responsable',
            search: true,
            inicialSearch: true,
            isServidor: true
        };

        this.dialog.open(SearchListDialogComponent, {
            data,
            width: '60vw',
            height: '80vh'
        }).afterClosed().subscribe((res: Funcionario) => {
            if (res) {
                this.selectedResponsable = res;
                this.responsableControlDisplay.setValue(res.persona?.nombre || '');
                this.form.patchValue({
                    responsableIdControl: res.id
                });
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
