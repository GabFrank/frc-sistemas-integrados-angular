import { ChangeDetectorRef, Component, Input, OnInit, AfterViewInit } from '@angular/core';
import { AbstractControl, FormControl, Validators } from '@angular/forms';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { HORA_VALIDA, OPCIONES_HORA, normalizarHora, posicionarListaHora } from '../../utils/selector-hora';
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

export interface HorarioElement {
    id?: number;
    entrada: string;
    salida: string;
    dias: string;
    turno: string;
    diasValue: string[];
    turnoValue: string;
    /** Cuántos funcionarios lo tienen asignado. */
    asignados: number;
}

/**
 * Todos los horarios, sin importar el funcionario: un horario se comparte entre todos los que lo
 * tienen. Se crea o edita uno y se guarda en el momento; el + lo asigna a otros funcionarios sin
 * copiarlo, y editarlo lo cambia para todos. Uno que alguien usa no se puede borrar.
 */
@UntilDestroy()
@Component({
    selector: 'app-asignar-horario-dialog',
    templateUrl: './asignar-horario-dialog.component.html',
    styleUrls: ['./asignar-horario-dialog.component.scss']
})
export class AsignarHorarioDialogComponent implements OnInit, AfterViewInit {
    @Input() data: Tab;

    entradaControl = new FormControl(null, [Validators.required, Validators.pattern(HORA_VALIDA)]);
    salidaControl = new FormControl(null, [Validators.required, Validators.pattern(HORA_VALIDA)]);

    /** Lista desplegable de horas cada 30 min (ver utils/selector-hora). */
    readonly opcionesHora = OPCIONES_HORA;
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

    displayedColumns: string[] = ['id', 'entrada', 'salida', 'dias', 'turno', 'asignados', 'acciones'];
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
        this.cargar();
        // Al volver de la lista de funcionarios (asignar a otros), refrescar cuántos lo usan.
        this.tabService.onTabReactivada(this.data).pipe(untilDestroyed(this)).subscribe(() => this.cargar());
    }

    private cargar(): void {
        this.horarioService.onGetHorariosCatalogo().pipe(untilDestroyed(this)).subscribe(res => {
            if (res) this.mostrar(res);
        });
    }

    private mostrar(horarios: Horario[]): void {
        this.dataSource.data = horarios.map(h => this.aFila(h));
        this.dataSource.paginator = this.paginator;
        this.cdr.markForCheck();
    }

    private aFila(h: Horario): HorarioElement {
        const diasOrdenados = this.diasSemana.map(d => d.value).filter(d => (h.dias || []).includes(d));
        return {
            id: h.id,
            entrada: h.horaEntrada?.substring(0, 5),
            salida: h.horaSalida?.substring(0, 5),
            dias: diasOrdenados.length ? diasOrdenados.map(d => this.diasSemana.find(ds => ds.value == d)?.viewValue).join(', ') : 'Todos',
            turno: this.listaTurnos.find(t => t.code == h.turno)?.name,
            diasValue: diasOrdenados,
            turnoValue: h.turno,
            asignados: h.cantidadAsignados ?? 0
        };
    }

    onListaHoraAbierta(lista: MatAutocomplete, control: AbstractControl): void {
        posicionarListaHora(lista, control.value);
    }

    onNormalizarHora(control: AbstractControl): void {
        const hora = normalizarHora(control.value);
        if (hora && hora !== control.value) control.setValue(hora);
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

    /**
     * Crea el horario, o guarda los cambios del que se está editando, en el momento. El central
     * rechaza uno igual a otro que ya existe: en ese caso se asigna el existente.
     */
    onGuardarHorario(): void {
        const controles = [this.entradaControl, this.salidaControl, this.diasControl, this.turnoControl];
        if (controles.some(c => c.invalid)) {
            controles.forEach(c => c.markAsTouched());
            return;
        }
        const editado = this.elementoEnEdicion;
        const input = new HorarioInput();
        input.id = editado?.id;
        input.horaEntrada = this.entradaControl.value;
        input.horaSalida = this.salidaControl.value;
        input.dias = this.diasControl.value?.length ? this.diasControl.value : ['TODOS'];
        input.turno = this.turnoControl.value;
        this.horarioService.onSaveHorario(input, true, undefined, { avisarExito: false })
            .pipe(untilDestroyed(this))
            .subscribe(res => {
                if (!res) return;
                const usan = editado?.asignados ?? 0;
                this.notificacionService.openSucess(editado
                    ? (usan > 0 ? `Horario actualizado para los ${usan} funcionario${usan === 1 ? '' : 's'} que lo usan` : 'Horario actualizado')
                    : 'Horario creado: con el + lo asignás a los funcionarios');
                this.limpiarFormulario();
                this.cargar();
            });
    }

    onEliminarHorario(element: HorarioElement): void {
        if (element.asignados > 0) {
            this.notificacionService.openWarn(`No se puede borrar: lo usa${element.asignados === 1 ? ' 1 funcionario' : 'n ' + element.asignados + ' funcionarios'}. ` +
                'Quitáselo desde la lista de funcionarios antes de borrarlo.', 8);
            return;
        }
        this.horarioService.onDeleteHorario(element.id).pipe(untilDestroyed(this)).subscribe(res => {
            if (res) {
                if (this.elementoEnEdicion?.id === element.id) this.limpiarFormulario();
                this.cargar();
            }
        });
    }

    onEditarHorario(element: HorarioElement): void {
        this.entradaControl.setValue(element.entrada);
        this.salidaControl.setValue(element.salida);
        this.diasControl.setValue(element.diasValue?.length ? element.diasValue : ['TODOS']);
        this.diasAnteriores = this.diasControl.value;
        this.turnoControl.setValue(element.turnoValue);
        this.elementoEnEdicion = element;
    }

    onAsignarAOtros(element: HorarioElement): void {
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

    onCancelar(): void {
        this.limpiarFormulario();
    }

    private limpiarFormulario(): void {
        this.elementoEnEdicion = null;
        this.entradaControl.reset();
        this.salidaControl.reset();
        this.diasControl.reset();
        this.turnoControl.reset();
        this.diasAnteriores = [];
    }
}
