
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';

export interface HorarioElement {
    entrada: string;
    salida: string;
    dias: string;
    turno: string;
    diasValue: string[];
}

@Component({
    selector: 'app-asignar-horario-dialog',
    templateUrl: './asignar-horario-dialog.component.html',
    styleUrls: ['./asignar-horario-dialog.component.scss']
})
export class AsignarHorarioDialogComponent implements OnInit {

    entradaControl = new FormControl();
    salidaControl = new FormControl();
    diasControl = new FormControl();
    turnoControl = new FormControl();

    diasSemana = [
        { value: 'TODOS', viewValue: 'Todos' },
        { value: 'LUN', viewValue: 'Lunes' },
        { value: 'MAR', viewValue: 'Martes' },
        { value: 'MIE', viewValue: 'Miércoles' },
        { value: 'JUE', viewValue: 'Jueves' },
        { value: 'VIE', viewValue: 'Viernes' },
        { value: 'SAB', viewValue: 'Sábado' },
        { value: 'DOM', viewValue: 'Domingo' }
    ];

    listaTurnos = [
        { code: 'TODOS', name: 'Todos' },
        { code: 'DIA', name: 'Día' },
        { code: 'NOCHE', name: 'Noche' },
        { code: 'MADRUGADA', name: 'Madrugada' }
    ];

    displayedColumns: string[] = ['entrada', 'salida', 'dias', 'turno', 'acciones'];
    dataSource = new MatTableDataSource<HorarioElement>([]);

    constructor(
        public dialogRef: MatDialogRef<AsignarHorarioDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

    ngOnInit(): void {
    }

    onAgregarHorario(): void {
    }

    onEliminarHorario(element: HorarioElement): void {
    }

    onGuardar(): void {
        this.dialogRef.close(this.dataSource.data);
    }

    onCancelar(): void {
        this.dialogRef.close();
    }
}
