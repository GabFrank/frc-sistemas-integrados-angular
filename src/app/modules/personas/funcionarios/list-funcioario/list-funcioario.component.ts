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
import { dateToString } from '../../../../commons/core/utils/dateUtils';
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
  get horarioParaAsignar(): any {
    return this.data?.tabData?.data?.horarioParaAsignar;
  }
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
      // 1. Agrupar funcionarios por ID de usuario para evitar procesar al mismo usuario varias veces
      const funcionariosPorUsuario = new Map<number, Funcionario[]>();
      this.seleccionados.selected.forEach(f => {
        const uId = f.usuario?.id;
        if (uId) {
          if (!funcionariosPorUsuario.has(uId)) funcionariosPorUsuario.set(uId, []);
          funcionariosPorUsuario.get(uId).push(f);
        }
      });

      let usuariosProcesados = 0;
      const totalUsuarios = funcionariosPorUsuario.size;

      const finalizarUsuario = () => {
        usuariosProcesados++;
        if (usuariosProcesados === totalUsuarios) {
          this.notificacionService.openSucess('Horarios asignados correctamente');
          this.seleccionados.clear();
          this.dataSource.data = [...this.dataSource.data];
        }
      };

      // 2. Para cada usuario único, verificar si ya tiene el horario antes de crear uno nuevo
      funcionariosPorUsuario.forEach((funcionarios, usuarioId) => {
        this.horarioService.onGetHorariosPorUsuario(usuarioId).pipe(untilDestroyed(this)).subscribe(horariosExistentes => {
          // Buscar un horario idéntico en los registros del usuario
          const horarioExistente = (horariosExistentes || []).find(h =>
            h.horaEntrada === this.horarioParaAsignar.entrada &&
            h.horaSalida === this.horarioParaAsignar.salida &&
            h.turno === this.horarioParaAsignar.turnoValue &&
            JSON.stringify((h.dias || []).sort()) === JSON.stringify((this.horarioParaAsignar.diasValue || []).sort())
          );

          if (horarioExistente) {
            // Si ya existe para este usuario, lo REUTILIZAMOS para todos sus funcionarios
            this.vincularMultiplesFuncionarios(funcionarios, horarioExistente.id, finalizarUsuario);
          } else {
            // Si no existe, creamos UNO SOLO para este usuario
            let horarioInput = new HorarioInput();
            horarioInput.horaEntrada = this.horarioParaAsignar.entrada;
            horarioInput.horaSalida = this.horarioParaAsignar.salida;
            horarioInput.usuarioId = usuarioId;
            horarioInput.dias = this.horarioParaAsignar.diasValue;
            horarioInput.turno = this.horarioParaAsignar.turnoValue;

            this.horarioService.onSaveHorario(horarioInput).pipe(untilDestroyed(this)).subscribe((res: any) => {
              this.vincularMultiplesFuncionarios(funcionarios, res.id, finalizarUsuario);
            });
          }
        });
      });
    }
  }

  private vincularMultiplesFuncionarios(funcionarios: Funcionario[], horarioId: number, onComplete: () => void) {
    let completados = 0;
    funcionarios.forEach(f => {
      let funcInput = new FuncionarioInput();
      funcInput.id = f.id;
      funcInput.personaId = f.persona?.id;
      funcInput.cargoId = f.cargo?.id;
      funcInput.sucursalId = f.sucursal?.id;
      funcInput.credito = f.credito;
      funcInput.sueldo = f.sueldo;
      funcInput.fasePrueba = f.fasePrueba;
      funcInput.diarista = f.diarista;
      funcInput.supervisadoPorId = f.supervisadoPor?.id;
      funcInput.activo = f.activo;
      funcInput.usuarioId = f.usuario?.id;
      funcInput.horarioId = horarioId;
      if (f.fechaIngreso) {
        funcInput.fechaIngreso = dateToString(new Date(f.fechaIngreso));
      }

      this.service.onSaveFuncionario(funcInput, true).pipe(untilDestroyed(this)).subscribe(saved => {
        f.horario = saved.horario;
        completados++;
        if (completados === funcionarios.length) onComplete();
      });
    });
  }

}
