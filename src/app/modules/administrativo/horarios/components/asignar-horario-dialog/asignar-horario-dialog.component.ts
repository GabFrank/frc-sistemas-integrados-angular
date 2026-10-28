
import { ChangeDetectorRef, Component, Input, OnInit, AfterViewInit } from '@angular/core';
import { AbstractControl, FormControl, Validators } from '@angular/forms';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ViewChild } from '@angular/core';
import { HorarioService } from '../../service/horario.service';
import { TabService, TabData } from '../../../../../layouts/tab/tab.service';
import { Tab } from '../../../../../layouts/tab/tab.model';
import { Horario, HorarioInput } from '../../models/horario.model';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ListFuncioarioComponent } from '../../../../personas/funcionarios/list-funcioario/list-funcioario.component';

const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/;
/** Alto de una opción de la lista (mat-option de Material 15). */
const ALTO_OPCION_PX = 48;

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

    entradaControl = new FormControl(null, [Validators.required, Validators.pattern(HORA_VALIDA)]);
    salidaControl = new FormControl(null, [Validators.required, Validators.pattern(HORA_VALIDA)]);

    /**
     * Opciones de la lista desplegable de hora, cada 30 min, como el MatTimepicker de Material
     * 19 (este proyecto está en Material 15, que no lo trae). Se puede escribir cualquier otra.
     */
    readonly opcionesHora: string[] = Array.from({ length: 48 }, (_, i) =>
        `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);
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
    private diasAnteriores: string[] = [];

    constructor(
        private horarioService: HorarioService,
        private cdr: ChangeDetectorRef,
        private tabService: TabService,
        private notificacionService: NotificacionSnackbarService
    ) { }

    ngOnInit(): void {
        this.usuarioId = this.data?.tabData?.id;
        if (this.usuarioId) {
            this.horarioService.onGetHorariosPorUsuario(this.usuarioId).pipe(untilDestroyed(this)).subscribe(res => {
                if (res) this.mostrar(res);
            });
        }
    }

    /** Muestra todos los horarios del usuario tal cual están guardados (antes se escondían los repetidos). */
    private mostrar(horarios: Horario[]): void {
        this.dataSource.data = horarios.map(h => this.aFila(h.id, h.horaEntrada, h.horaSalida, h.dias, h.turno));
        this.dataSource.paginator = this.paginator;
        this.cdr.markForCheck();
    }

    private aFila(id: number, entrada: string, salida: string, dias: string[], turno: string): HorarioElement {
        const diasOrdenados = this.diasSemana.map(d => d.value).filter(d => (dias || []).includes(d));
        return {
            id,
            entrada: entrada?.substring(0, 5),
            salida: salida?.substring(0, 5),
            dias: diasOrdenados.length ? diasOrdenados.map(d => this.diasSemana.find(ds => ds.value == d)?.viewValue).join(', ') : 'Todos',
            turno: this.listaTurnos.find(t => t.code == turno)?.name,
            diasValue: diasOrdenados,
            turnoValue: turno
        };
    }

    /** Al abrir la lista, la deja en la hora del campo (o en las 08:00 si está vacío). */
    onListaHoraAbierta(lista: MatAutocomplete, control: AbstractControl): void {
        const valor: string = HORA_VALIDA.test(control.value || '') ? control.value : '08:00';
        const [h, m] = valor.split(':').map(Number);
        const indice = Math.min(h * 2 + (m >= 30 ? 1 : 0), this.opcionesHora.length - 1);
        setTimeout(() => {
            const panel = lista.panel?.nativeElement as HTMLElement;
            if (panel) panel.scrollTop = Math.max(0, (indice - 2) * ALTO_OPCION_PX);
        });
    }

    /** Acepta lo que se escribe rápido: "8" → 08:00, "830" o "8.30" → 08:30, "17:5" → 17:05. */
    onNormalizarHora(control: AbstractControl): void {
        const texto: string = (control.value || '').toString().trim();
        if (!texto || HORA_VALIDA.test(texto)) return;
        let h: number, m: number;
        const partes = texto.split(/[:.,\s]/).filter(p => p !== '');
        if (partes.length >= 2) {
            h = Number(partes[0]);
            m = Number(partes[1]);
        } else if (/^\d{1,2}$/.test(texto)) {
            h = Number(texto);
            m = 0;
        } else if (/^\d{3,4}$/.test(texto)) {
            h = Number(texto.slice(0, -2));
            m = Number(texto.slice(-2));
        }
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
            control.setValue(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        }
    }

    /** "Todos" no se combina con días sueltos: elegir uno quita al otro. */
    onCambioDias(): void {
        const dias: string[] = this.diasControl.value || [];
        const anteriores: string[] = this.diasAnteriores;
        const eligioTodos = dias.includes('TODOS') && !anteriores.includes('TODOS');
        let nuevos = dias;
        if (eligioTodos) nuevos = ['TODOS'];
        else if (dias.includes('TODOS') && dias.length > 1) nuevos = dias.filter(d => d !== 'TODOS');
        if (nuevos !== dias) this.diasControl.setValue(nuevos);
        this.diasAnteriores = nuevos;
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
                const item = this.aFila(this.elementoEnEdicion?.id, entrada, salida, diasValue, turnoValue);
                this.dataSource.data = [...this.dataSource.data, item];
                this.dataSource.paginator = this.paginator;
                this.elementoEnEdicion = null;
                this.entradaControl.reset();
                this.salidaControl.reset();
                this.diasControl.reset();
                this.turnoControl.reset();
                this.diasAnteriores = [];
            } else {
                this.notificacionService.openWarn('Ese horario ya está en la tabla');
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
        this.diasControl.setValue(element.diasValue?.length ? element.diasValue : ['TODOS']);
        this.diasAnteriores = this.diasControl.value;
        this.turnoControl.setValue(element.turnoValue);
        this.elementoEnEdicion = element;
        this.dataSource.data = this.dataSource.data.filter(i => i !== element);
        this.dataSource.paginator = this.paginator;
    }

    onAsignarAOtros(element: HorarioElement): void {
        if (!element.id) {
            this.notificacionService.openWarn('Guardá el horario antes de asignarlo a otros funcionarios');
            return;
        }
        const data = new TabData(null, { horarioParaAsignar: { horarioId: element.id } });
        this.tabService.addTab(
            new Tab(
                ListFuncioarioComponent,
                'Lista de funcionarios',
                data,
                AsignarHorarioDialogComponent
            )
        );
    }

    /**
     * Guarda la tabla entera de una vez (#523). Se aceptan varios horarios el mismo día, aunque
     * se pisen o repitan uno de "Todos": al marcar, el central usa el de entrada más cercana.
     */
    onGuardar(): void {
        const horarios = this.dataSource.data.map(h => {
            const input = new HorarioInput();
            input.id = h.id;
            input.horaEntrada = h.entrada;
            input.horaSalida = h.salida;
            input.dias = h.diasValue?.length ? h.diasValue : ['TODOS'];
            input.turno = h.turnoValue;
            return input;
        });
        this.horarioService.onSaveHorariosUsuario(this.usuarioId, horarios).pipe(untilDestroyed(this)).subscribe({
            next: res => {
                if (res) this.mostrar(res);
                this.notificacionService.openSucess('Horarios guardados');
            },
            // Nada se guarda: la tabla queda como está para corregir y volver a guardar.
            error: (error) => {
                const motivo = Array.isArray(error) ? error[0]?.message : null;
                this.notificacionService.openWarn(motivo
                    ? `No se guardaron los horarios. ${motivo}`
                    : 'No se guardaron los horarios: no hubo respuesta del servidor. Probá de nuevo.', motivo ? 15 : 6);
            },
        });
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
        this.diasAnteriores = [];
    }
}


