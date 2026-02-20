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
import { TabService } from '../../../../layouts/tab/tab.service';
import { HorarioService } from '../../../administrativo/horarios/service/horario.service';
import { HorarioInput } from '../../../administrativo/horarios/models/horario.model';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { PageInfo } from '../../../../app.component';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { AdicionarFuncionarioDialogComponent } from '../adicionar-funcionario-dialog/adicionar-funcionario-dialog.component';
import { MainService } from '../../../../main.service';
import { FuncionarioInput } from '../funcionario-input.model';

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
  horarioParaAsignar: any;
  seleccionados = new SelectionModel<Funcionario>(true, []);

  idControl = new FormControl(null, Validators.required)
  nombreControl = new FormControl(null, Validators.required)
  sucursalControl = new FormControl(null)

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
    private mainService: MainService
  ) {
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.paginator._changePageSize(this.paginator.pageSizeOptions[1])
      this.pageSize = this.paginator.pageSizeOptions[1]
      this.onFiltrar()
    }, 0);

    if (this.data?.tabData?.data?.horarioParaAsignar) {
      this.horarioParaAsignar = this.data.tabData.data.horarioParaAsignar;
    }

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

  onAddFuncionario(funcionario?: Funcionario, index?) {
    this.matDialog.open(AdicionarFuncionarioDialogComponent, {
      data: {
        funcionario
      },
      width: '70%',
      height: '70%',
      autoFocus: true,
      restoreFocus: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        if (funcionario == null) {
          this.dataSource.data = updateDataSource(this.dataSource.data, res);
        } else {
          this.dataSource.data = updateDataSource(this.dataSource.data, res, index);
        }
      }
    })
  }

  onFiltrar() {
    let sucursalIdList = [];
    this.sucursalControl.value?.forEach(s => {
      if (s != null) {
        sucursalIdList.push(s.id)
      }
    });
    this.service.onGetAllWithPage(this.pageIndex, this.pageSize, this.idControl.value, this.nombreControl.value?.toUpperCase(), sucursalIdList.length > 0 ? sucursalIdList : null).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.selectedPageInfo = res;
        this.dataSource.data = this.selectedPageInfo?.getContent;
      }
    })
  }

  onResetFiltro() {
    this.nombreControl.setValue(null)
    this.sucursalControl.setValue(null)
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
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

  onAsignarHorario(): void {
    if (this.seleccionados.selected.length > 0 && this.horarioParaAsignar) {
      let peticionesCompletadas = 0;
      let totalPeticiones = this.seleccionados.selected.length;

      this.seleccionados.selected.forEach(funcionario => {
        let horarioInput = new HorarioInput();
        horarioInput.horaEntrada = this.horarioParaAsignar.entrada;
        horarioInput.horaSalida = this.horarioParaAsignar.salida;
        horarioInput.usuarioId = funcionario.usuario?.id || this.mainService.usuarioActual?.id;
        horarioInput.dias = this.horarioParaAsignar.diasValue;
        horarioInput.turno = this.horarioParaAsignar.turnoValue;

        this.horarioService.onSaveHorario(horarioInput).pipe(untilDestroyed(this)).subscribe((res: any) => {
          let funcInput = new FuncionarioInput();
          funcInput.id = funcionario.id;
          funcInput.personaId = funcionario.persona?.id;
          funcInput.cargoId = funcionario.cargo?.id;
          funcInput.sucursalId = funcionario.sucursal?.id;
          funcInput.credito = funcionario.credito;
          funcInput.sueldo = funcionario.sueldo;
          funcInput.fasePrueba = funcionario.fasePrueba;
          funcInput.diarista = funcionario.diarista;
          funcInput.supervisadoPorId = funcionario.supervisadoPor?.id;
          funcInput.activo = funcionario.activo;
          funcInput.usuarioId = funcionario.usuario?.id;
          // set new horario
          funcInput.horarioId = res.id;

          this.service.onSaveFuncionario(funcInput, true).pipe(untilDestroyed(this)).subscribe(savedFunc => {
            funcionario.horario = savedFunc.horario;
            this.dataSource.data = [...this.dataSource.data];
            peticionesCompletadas++;
            if (peticionesCompletadas === totalPeticiones) {
              this.notificacionService.openSucess('Horarios asignados correctamente');
              this.seleccionados.clear();
            }
          });
        });
      });
    }
  }

}
