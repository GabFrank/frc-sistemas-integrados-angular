
import { ChangeDetectorRef, Component, Input, OnInit, AfterViewInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ViewChild } from '@angular/core';
import { HorarioService } from '../../service/horario.service';
import { TabService, TabData } from '../../../../../layouts/tab/tab.service';
import { Tab } from '../../../../../layouts/tab/tab.model';
import { HorarioInput } from '../../models/horario.model';
import { MainService } from '../../../../../main.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ListFuncioarioComponent } from '../../../../personas/funcionarios/list-funcioario/list-funcioario.component';

export interface HorarioElement {
    id?: number;
    entrada: string;
    salida: string;
    dias: string;
    turno: string;
    diasValue: string[];
    turnoValue: string;
}

@UntilDestroy()
@Component({
    selector: 'app-asignar-horario-dialog',
    templateUrl: './asignar-horario-dialog.component.html',
    styleUrls: ['./asignar-horario-dialog.component.scss']
})
export class AsignarHorarioDialogComponent implements OnInit, AfterViewInit {
    @Input() data: Tab;
    usuarioId: number;

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

    displayedColumns: string[] = ['id', 'entrada', 'salida', 'dias', 'turno', 'acciones'];
    dataSource = new MatTableDataSource<HorarioElement>([]);

    @ViewChild(MatPaginator) paginator: MatPaginator;

    elementoEnEdicion: HorarioElement | null = null;

    constructor(
        private horarioService: HorarioService,
        private cdr: ChangeDetectorRef,
        private tabService: TabService,
        private mainService: MainService,
        private notificacionService: NotificacionSnackbarService
    ) { }

    ngOnInit(): void {
        this.usuarioId = this.data?.tabData?.id;
        if (this.usuarioId) {
            this.horarioService.onGetHorariosPorUsuario(this.usuarioId).subscribe(res => {
                if (res) {
                    const uniqueSchedules = [];
                    res.forEach(h => {
                        const daysKey = JSON.stringify((h.dias || []).sort());
                        const isDuplicate = uniqueSchedules.some(us => 
                            us.entrada === h.horaEntrada &&
                            us.salida === h.horaSalida &&
                            us.turnoValue === h.turno &&
                            JSON.stringify((us.diasValue || []).sort()) === daysKey
                        );
                        if (!isDuplicate) {
                            uniqueSchedules.push({
                                id: h.id,
                                entrada: h.horaEntrada,
                                salida: h.horaSalida,
                                dias: h.dias?.map(d => this.diasSemana.find(ds => ds.value == d)?.viewValue).join(', '),
                                turno: this.listaTurnos.find(t => t.code == h.turno)?.name,
                                diasValue: h.dias,
                                turnoValue: h.turno
                            });
                        }
                    });
                    this.dataSource.data = uniqueSchedules;
                    this.dataSource.paginator = this.paginator;
                    this.cdr.markForCheck();
                }
            })
        }
    }

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
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
                    id: this.elementoEnEdicion?.id,
                    entrada: entrada,
                    salida: salida,
                    dias: this.diasControl.value?.map(d => this.diasSemana.find(ds => ds.value == d)?.viewValue).join(', '),
                    turno: this.listaTurnos.find(t => t.code == turnoValue)?.name,
                    diasValue: this.diasControl.value,
                    turnoValue: turnoValue
                }
                this.dataSource.data = [...this.dataSource.data, item];
                this.dataSource.paginator = this.paginator;
                this.elementoEnEdicion = null;
                this.entradaControl.reset();
                this.salidaControl.reset();
                this.diasControl.reset();
                this.turnoControl.reset();
            } else {
                this.notificacionService.openWarn('El horario ya existe');
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

    onEditarHorario(element: HorarioElement): void {
        this.entradaControl.setValue(element.entrada);
        this.salidaControl.setValue(element.salida);
        this.diasControl.setValue(element.diasValue);
        this.turnoControl.setValue(element.turnoValue);
        this.elementoEnEdicion = element;
        this.dataSource.data = this.dataSource.data.filter(i => i !== element);
        this.dataSource.paginator = this.paginator;
    }

    onAsignarAOtros(element: HorarioElement): void {
        const data = new TabData(null, { horarioParaAsignar: element });
        this.tabService.addTab(
            new Tab(
                ListFuncioarioComponent,
                'Lista de funcionarios',
                data,
                AsignarHorarioDialogComponent
            )
        );
    }

    onGuardar(): void {
        if (this.dataSource.data && this.dataSource.data.length > 0) {
            this.dataSource.data.forEach(h => {
                let horarioInput = new HorarioInput();
                horarioInput.id = h.id;
                horarioInput.horaEntrada = h.entrada;
                horarioInput.horaSalida = h.salida;
                horarioInput.usuarioId = this.usuarioId;
                horarioInput.dias = h.diasValue;
                horarioInput.turno = h.turnoValue;

                this.horarioService.onSaveHorario(horarioInput).pipe(untilDestroyed(this)).subscribe(res => {
                });
            });
            this.notificacionService.openSucess('Horarios asignados correctamente');
        }
    }

    onCancelar(): void {
        if (this.elementoEnEdicion) {
            this.dataSource.data = [...this.dataSource.data, this.elementoEnEdicion];
            this.elementoEnEdicion = null;
        }
        this.entradaControl.reset();
        this.salidaControl.reset();
        this.diasControl.reset();
        this.turnoControl.reset();
    }
}


