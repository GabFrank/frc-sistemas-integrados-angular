
import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { HorarioService } from '../../service/horario.service';

export interface HorarioElement {
    id?: number;
    entrada: string;
    salida: string;
    dias: string;
    turno: string;
    diasValue: string[];
    turnoValue: string;
}

@Component({
    selector: 'app-asignar-horario-dialog',
    templateUrl: './asignar-horario-dialog.component.html',
    styleUrls: ['./asignar-horario-dialog.component.scss']
})
export class AsignarHorarioDialogComponent implements OnInit {

    entradaControl = new FormControl(null, [Validators.required]);
    salidaControl = new FormControl(null, [Validators.required]);
    diasControl = new FormControl(null, [Validators.required]);
    turnoControl = new FormControl(null, [Validators.required]);

    diasSemana = [
        { value: 'TODOS', viewValue: 'Todos' },
        { value: 'LUNES', viewValue: 'Lunes' },
        { value: 'MARTES', viewValue: 'Martes' },
        { value: 'MIERCOLES', viewValue: 'Miércoles' },
        { value: 'JUEVES', viewValue: 'Jueves' },
        { value: 'VIERNES', viewValue: 'Viernes' },
        { value: 'SABADO', viewValue: 'Sábado' },
        { value: 'DOMINGO', viewValue: 'Domingo' }
    ];

    listaTurnos = [
        { code: 'DIA', name: 'Día' },
        { code: 'NOCHE', name: 'Noche' },
        { code: 'MADRUGADA', name: 'Madrugada' }
    ];

    displayedColumns: string[] = ['entrada', 'salida', 'dias', 'turno', 'acciones'];
    dataSource = new MatTableDataSource<HorarioElement>([]);

    constructor(
        public dialogRef: MatDialogRef<AsignarHorarioDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private horarioService: HorarioService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        if (this.data?.usuarioId) {
            this.horarioService.onGetHorariosPorUsuario(this.data.usuarioId).subscribe(res => {
                if (res) {
                    this.dataSource.data = res.map(h => {
                        return {
                            id: h.id,
                            entrada: h.horaEntrada,
                            salida: h.horaSalida,
                            dias: h.dias?.map(d => this.diasSemana.find(ds => ds.value == d)?.viewValue).join(', '),
                            turno: this.listaTurnos.find(t => t.code == h.turno)?.name,
                            diasValue: h.dias,
                            turnoValue: h.turno
                        }
                    });
                    this.cdr.markForCheck();
                }
            })
        }
    }

    onAgregarHorario(): void {
        if (this.entradaControl.valid && this.salidaControl.valid && this.diasControl.valid && this.turnoControl.valid) {
            const diasValue = this.diasControl.value ? [...this.diasControl.value].sort() : [];
            const turnoValue = this.turnoControl.value;
            const entrada = this.entradaControl.value;
            const salida = this.salidaControl.value;
            const existe = this.dataSource.data.some(h =>
                h.entrada === entrada &&
                h.salida === salida &&
                h.turnoValue === turnoValue &&
                JSON.stringify(h.diasValue ? [...h.diasValue].sort() : []) === JSON.stringify(diasValue)
            );

            if (!existe) {
                let item: HorarioElement = {
                    entrada: entrada,
                    salida: salida,
                    dias: this.diasControl.value?.map(d => this.diasSemana.find(ds => ds.value == d)?.viewValue).join(', '),
                    turno: this.listaTurnos.find(t => t.code == turnoValue)?.name,
                    diasValue: this.diasControl.value,
                    turnoValue: turnoValue
                }
                this.dataSource.data = [...this.dataSource.data, item];
                this.diasControl.reset();
            }
        }
    }

    onEliminarHorario(element: HorarioElement): void {
        if (element.id) {
            this.horarioService.onDeleteHorario(element.id).subscribe(res => {
                if (res) {
                    this.dataSource.data = this.dataSource.data.filter(i => i !== element);
                }
            })
        } else {
            this.dataSource.data = this.dataSource.data.filter(i => i !== element);
        }
    }

    onGuardar(): void {
        this.dialogRef.close(this.dataSource.data);
    }

    onCancelar(): void {
        this.dialogRef.close();
    }
}


