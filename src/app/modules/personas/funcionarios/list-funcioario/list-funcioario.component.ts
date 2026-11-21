import { animate, state, style, transition, trigger } from '@angular/animations';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { updateDataSource } from '../../../../commons/core/utils/numbersUtils';
import { WindowInfoService } from '../../../../shared/services/window-info.service';
import { Funcionario } from '../funcionario.model';
import { FuncionarioService } from '../funcionario.service';
import { FormControl, Validators } from '@angular/forms';
import { MatSort } from '@angular/material/sort';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SelectionModel } from '@angular/cdk/collections';
import { Input } from '@angular/core';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService, TabData } from '../../../../layouts/tab/tab.service';
import { CargoService } from '../../../empresarial/cargo/cargo.service';
import { Cargo } from '../../../empresarial/cargo/cargo.model';
import { LegajoFuncionarioComponent } from '../../../rrhh/legajo/legajo-funcionario/legajo-funcionario.component';
import { HorarioService } from '../../../administrativo/horarios/service/horario.service';
import { Horario } from '../../../administrativo/horarios/models/horario.model';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NuevoHorarioDialogComponent, NuevoHorarioDialogData } from '../../../administrativo/horarios/components/nuevo-horario-dialog/nuevo-horario-dialog.component';

/** Un horario asignado, listo para la fila desplegada de la lista. */
interface HorarioAsignado {
  id: number;
  entrada: string;
  salida: string;
  dias: string;
  turno: string;
}

const NOMBRE_DIA: Record<string, string> = {
  LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles', JUEVES: 'Jueves',
  VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo',
};
const ORDEN_DIAS = Object.keys(NOMBRE_DIA);
const NOMBRE_TURNO: Record<string, string> = { DIA: 'Día', NOCHE: 'Noche', MADRUGADA: 'Madrugada' };
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { MainService } from '../../../../main.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-funcioario',
  templateUrl: './list-funcioario.component.html',
  styleUrls: ['./list-funcioario.component.css'],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      ),
    ]),
  ],
})
export class ListFuncioarioComponent implements OnInit, AfterViewInit {

  @ViewChild(MatSort) sort: MatSort;

  @Input() data: Tab;
  get horarioParaAsignar(): any {
    return this.data?.tabData?.data?.horarioParaAsignar;
  }
  seleccionados = new SelectionModel<Funcionario>(true, []);

  idControl = new FormControl(null)
  nombreControl = new FormControl(null)
  sucursalControl = new FormControl(null)
  // null = Todos; true/false = valor concreto
  estadoControl = new FormControl(null)   // activo
  cargoControl = new FormControl<Cargo>(null)     // se filtra por su id; lo elige el buscador
  ipsActivoControl = new FormControl(null)
  fasePruebaControl = new FormControl(null)
  cobraBancoControl = new FormControl(null)

  /** Funcionarios paginados en el central (#772): descarta respuestas viejas; si falla, vuelve a la página anterior. */
  pag = new PaginacionLista<Funcionario>({
    cargar: (page, size) => this.consultar(page, size),
    pageSize: 25,
    alCargar: (res) => this.dataSource.data = res.getContent ?? [],
    // Falló un filtro nuevo: las filas a la vista son de otro filtro.
    alFallar: (filtroNuevo) => { if (filtroNuevo) this.dataSource.data = []; },
  });
  orderById = null;
  orderByNombre = null;

  dataSource = new MatTableDataSource<Funcionario>([]);
  expandedFuncionario: Funcionario;
  /** Horarios asignados por id de funcionario, para la fila desplegada (#523). */
  horariosAsignados: Record<number, HorarioAsignado[]> = {};
  displayedColumns: string[] = ['id', 'nombre', 'sucursal', 'cargo', 'supervisadoPor', 'telefono', 'nickname', 'horario', 'acciones'];

  sucursalList: Sucursal[];
  sucursalIdList = [];

  constructor(
    public service: FuncionarioService,
    public windowInfoService: WindowInfoService,
    private matDialog: MatDialog,
    private sucursalService: SucursalService,
    private horarioService: HorarioService,
    private tabService: TabService,
    private notificacionService: NotificacionSnackbarService,
    private mainService: MainService,
    private cargoService: CargoService,
    private dialogosService: DialogosService
  ) {
  }

  ngOnInit(): void {
    this.pag.filtrar();



    this.sucursalService.onGetAllSucursales(true).pipe(untilDestroyed(this)).subscribe(res => {
      this.sucursalList = res.filter((s) => {
        if (s.id != 0) {
          this.sucursalIdList.push(s.id);
          return s;
        }
      });
    })
  }

  ngAfterViewInit(): void {
  }

  rowSelectedEvent(e) {
  }

  onAddFuncionario() {
    // El alta ahora vive en el legajo (tab "Información general"). Se abre un legajo
    // en modo nuevo (sin id); al guardar carga el funcionario recién creado.
    this.tabService.addTab(new Tab(
      LegajoFuncionarioComponent,
      'Nuevo funcionario',
      new TabData(null, {}),
      null
    ));
  }

  // Un filtro nuevo arranca en la página 1: la página actual puede no existir en el resultado filtrado.
  onFiltrar() {
    this.pag.filtrar();
  }

  /** Repite la página a la vista. */
  buscar() {
    this.pag.recargar();
  }

  private consultar(page: number, size: number) {
    const sucursalIdList = (this.sucursalControl.value || []).filter(s => s != null).map(s => s.id);
    return this.service.onGetAllWithPage(
      page, size,
      this.idControl.value,
      this.nombreControl.value?.toUpperCase(),
      sucursalIdList.length > 0 ? sucursalIdList : null,
      this.estadoControl.value,
      this.cargoControl.value?.id,
      this.fasePruebaControl.value,
      this.cobraBancoControl.value,
      this.ipsActivoControl.value
    );
  }

  onBuscarCargo() {
    this.cargoService.onBuscarCargo()
      .pipe(untilDestroyed(this))
      .subscribe(cargo => this.onSelectCargo(cargo));
  }

  onSelectCargo(cargo: Cargo) {
    this.cargoControl.setValue(cargo);
    this.onFiltrar();
  }

  onResetFiltro() {
    this.idControl.setValue(null)
    this.nombreControl.setValue(null)
    this.sucursalControl.setValue(null)
    this.estadoControl.setValue(null)
    this.cargoControl.setValue(null)
    this.ipsActivoControl.setValue(null)
    this.fasePruebaControl.setValue(null)
    this.cobraBancoControl.setValue(null)
    this.onFiltrar();
  }

  onVerLegajo(funcionario: Funcionario) {
    const nombre = funcionario?.persona?.nombre || funcionario?.nickname || ('#' + funcionario?.id);
    // Título único por funcionario para evitar el dedupe por título del TabService
    // (así cada legajo abre su propio tab y corre ngOnInit con su id).
    this.tabService.addTab(new Tab(
      LegajoFuncionarioComponent,
      'Legajo — ' + nombre,
      new TabData(funcionario.id, { id: funcionario.id }),
      null
    ));
  }

  isAllSelected() {
    const numSelected = this.seleccionados.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.seleccionados.clear() :
      this.dataSource.data.forEach(row => this.seleccionados.select(row));
  }

  /**
   * "Asignar a otros" desde Asignar horario: les asigna a los seleccionados el mismo horario, sin
   * copiarlo (editarlo después lo cambia para todos). Sin usuario para marcar, se avisa.
   */
  onAsignarHorario(): void {
    const horarioId = this.horarioParaAsignar?.horarioId;
    if (this.seleccionados.selected.length === 0 || !horarioId) return;
    const funcionarioIds = this.seleccionados.selected.map(f => f.id);
    this.horarioService.onAsignarHorario(horarioId, funcionarioIds).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        if (!res) return;
        if (res.errores?.length) {
          this.notificacionService.openWarn(
            `Horario asignado a ${res.copiados}. No se pudo a ${res.errores.length}: ${res.errores.join(' | ')}`, 12);
        } else {
          this.notificacionService.openSucess(`Horario asignado a ${res.copiados} funcionario${res.copiados === 1 ? '' : 's'}`);
        }
        this.seleccionados.clear();
        this.buscar();
      },
      error: () => { },
    });
  }


  /** Despliega la fila con los horarios asignados al funcionario (#523). */
  onVerHorarios(funcionario: Funcionario, event: Event): void {
    event.stopPropagation();
    if (this.expandedFuncionario === funcionario) {
      this.expandedFuncionario = null;
      return;
    }
    this.expandedFuncionario = funcionario;
    this.cargarHorarios(funcionario);
  }

  private cargarHorarios(funcionario: Funcionario): void {
    this.horarioService.onGetHorariosPorFuncionario(funcionario.id).pipe(untilDestroyed(this)).subscribe({
      next: (horarios: Horario[]) => {
        this.horariosAsignados = {
          ...this.horariosAsignados,
          [funcionario.id]: (horarios || [])
            .map(h => this.aHorarioAsignado(h))
            .sort((a, b) => (a.entrada || '').localeCompare(b.entrada || '')),
        };
      },
      error: () => { },
    });
  }

  private aHorarioAsignado(h: Horario): HorarioAsignado {
    const dias = (h.dias || []).filter(d => d !== 'TODOS');
    const todos = !h.dias?.length || h.dias.includes('TODOS');
    return {
      id: h.id,
      entrada: h.horaEntrada?.substring(0, 5),
      salida: h.horaSalida?.substring(0, 5),
      dias: todos ? 'Todos' : ORDEN_DIAS.filter(d => dias.includes(d)).map(d => NOMBRE_DIA[d]).join(', '),
      turno: NOMBRE_TURNO[h.turno] || h.turno,
    };
  }

  onQuitarHorario(funcionario: Funcionario, horario: HorarioAsignado): void {
    this.dialogosService
      .confirm('Quitar horario', `¿Quitarle a ${funcionario.persona?.nombre || 'este funcionario'} el horario ` +
        `${horario.turno} ${horario.entrada}-${horario.salida} (${horario.dias})?`)
      .pipe(untilDestroyed(this))
      .subscribe(ok => {
        if (!ok) return;
        this.horarioService.onQuitarHorarioFuncionario(funcionario.id, horario.id).pipe(untilDestroyed(this)).subscribe({
          next: res => {
            if (res) funcionario.horarioResumen = res.horarioResumen;
            this.notificacionService.openSucess('Horario quitado');
            this.cargarHorarios(funcionario);
          },
          error: () => { },
        });
      });
  }


  /** Crea un horario y se lo deja asignado al funcionario; al volver refresca la tabla. */
  onNuevoHorario(funcionario: Funcionario): void {
    const data: NuevoHorarioDialogData = { funcionarioId: funcionario.id, nombre: funcionario.persona?.nombre };
    this.matDialog.open(NuevoHorarioDialogComponent, { data, autoFocus: false })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: Funcionario) => {
        if (!res) return;
        funcionario.horarioResumen = res.horarioResumen;
        this.cargarHorarios(funcionario);
      });
  }

}
