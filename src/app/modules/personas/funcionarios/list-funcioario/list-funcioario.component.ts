import { animate, state, style, transition, trigger } from '@angular/animations';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { updateDataSource } from '../../../../commons/core/utils/numbersUtils';
import { WindowInfoService } from '../../../../shared/services/window-info.service';
import { Funcionario } from '../funcionario.model';
import { FuncionarioService } from '../funcionario.service';
import { FormControl, Validators } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
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
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { PageInfo } from '../../../../app.component';
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

  @ViewChild(MatPaginator) paginator: MatPaginator;
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

  length = 25;
  pageSize = 25;
  pageIndex = 0;
  pageEvent: PageEvent;
  orderById = null;
  orderByNombre = null;
  selectedPageInfo: PageInfo<Funcionario>;

  dataSource = new MatTableDataSource<Funcionario>([]);
  expandedFuncionario: Funcionario;
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
    private cargoService: CargoService
  ) {
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.paginator._changePageSize(this.paginator.pageSizeOptions[1])
      this.pageSize = this.paginator.pageSizeOptions[1]
      this.buscar()
    }, 0);



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
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.buscar();
  }

  buscar() {
    let sucursalIdList = [];
    this.sucursalControl.value?.forEach(s => {
      if (s != null) {
        sucursalIdList.push(s.id)
      }
    });
    this.service.onGetAllWithPage(
      this.pageIndex, this.pageSize,
      this.idControl.value,
      this.nombreControl.value?.toUpperCase(),
      sucursalIdList.length > 0 ? sucursalIdList : null,
      this.estadoControl.value,
      this.cargoControl.value?.id,
      this.fasePruebaControl.value,
      this.cobraBancoControl.value,
      this.ipsActivoControl.value
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.selectedPageInfo = res;
        this.dataSource.data = this.selectedPageInfo?.getContent;
      }
    })
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

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.buscar();
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
   * "Asignar a otros" desde Asignar horario: copia el horario a los seleccionados como horario
   * propio de cada uno (#523). Si ya tiene uno igual no se duplica; sin usuario para marcar, se avisa.
   */
  onAsignarHorario(): void {
    const horarioId = this.horarioParaAsignar?.horarioId;
    if (this.seleccionados.selected.length === 0 || !horarioId) return;
    const funcionarioIds = this.seleccionados.selected.map(f => f.id);
    this.horarioService.onCopiarHorario(horarioId, funcionarioIds).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        if (!res) return;
        if (res.errores?.length) {
          this.notificacionService.openWarn(
            `Horario asignado a ${res.copiados}. No se pudo a ${res.errores.length}: ${res.errores.join(' | ')}`, 12);
        } else {
          this.notificacionService.openSucess(`Horario asignado a ${res.copiados} funcionarios`);
        }
        this.seleccionados.clear();
        this.buscar();
      },
      error: () => { },
    });
  }

}
