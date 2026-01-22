import { Component, Inject, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Modelo } from '../models/modelo.model';
import { Marca } from '../models/marca.model';
import { VehiculoService } from '../vehiculo.service';
import { MainService } from '../../../../main.service';
import { AdicionarModeloDialogComponent } from '../adicionar-modelo-dialog/adicionar-modelo-dialog.component';

@UntilDestroy()
@Component({
    selector: 'app-buscar-modelo-dialog',
    templateUrl: './buscar-modelo-dialog.component.html',
    styleUrls: ['./buscar-modelo-dialog.component.scss']
})
export class BuscarModeloDialogComponent implements OnInit {
    private fb = inject(FormBuilder);
    private vehiculoService = inject(VehiculoService);
    public mainService = inject(MainService);
    private matDialog = inject(MatDialog);

    buscarControl = new FormControl('');
    dataSource = new MatTableDataSource<Modelo>();
    isSearching = false;

    displayedColumns = ['id', 'marca', 'modelo', 'acciones', 'editarEliminar'];

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<BuscarModeloDialogComponent>
    ) {
    }

    ngOnInit(): void {
        this.onFiltrarModelos('');
        this.onFiltrarModelos('');

        this.buscarControl.valueChanges.pipe(untilDestroyed(this)).subscribe(value => {
            this.onFiltrarModelos(value || '');
        });
    }

    onFiltrarModelos(texto: string): void {
        this.isSearching = true;
        this.vehiculoService.onFiltrarModelos(texto).pipe(untilDestroyed(this)).subscribe(res => {
            this.dataSource.data = res || [];
            this.isSearching = false;
        });
    }

    onSelectModelo(modelo: Modelo): void {
        this.dialogRef.close(modelo);
    }

    onAdicionar(): void {
        this.matDialog.open(AdicionarModeloDialogComponent, {
            width: '100%',
            maxWidth: '600px',
            disableClose: true,
            autoFocus: true
        }).afterClosed().pipe(untilDestroyed(this)).subscribe((res: Modelo) => {
            if (res) {
                this.onSelectModelo(res);
            } else {
                this.onFiltrarModelos(this.buscarControl.value || '');
            }
        });
    }

    onCancelar(): void {
        this.dialogRef.close();
    }



    onEliminarModelo(modelo: Modelo): void {
        if (modelo.id) {
            this.vehiculoService.onEliminarModelo(Number(modelo.id)).pipe(untilDestroyed(this)).subscribe(res => {
                if (res) {
                    this.onFiltrarModelos(this.buscarControl.value || '');
                }
            });
        }
    }
}
