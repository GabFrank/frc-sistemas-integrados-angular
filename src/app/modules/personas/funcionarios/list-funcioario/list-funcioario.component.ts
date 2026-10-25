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
import { HorarioInput } from '../../../administrativo/horarios/models/horario.model';
import { PROPAGAR_ERROR_DE_RED, TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../../generics/generic-crud.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { PageInfo } from '../../../../app.component';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { FuncionarioInput } from '../funcionario-input.model';
import { esRechazoDelServidor } from '../../../../commons/core/utils/graphqlErrorUtils';

/** Cómo terminó un usuario del lote: un rechazo no se arregla reintentando; sin respuesta, sí. */
type ResultadoLote = 'ok' | 'rechazo' | 'sinRespuesta';
const resultadoDelError = (error: any): ResultadoLote => esRechazoDelServidor(error) ? 'rechazo' : 'sinRespuesta';

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
      let usuariosRechazados = 0;
      let usuariosSinRespuesta = 0;
      const totalUsuarios = funcionariosPorUsuario.size;

      // Cada usuario termina una vez, bien o con falla: antes un error o un null colgaba el conteo y no
      // salía ningún aviso (#390).
      const finalizarUsuario = (resultado: ResultadoLote) => {
        usuariosProcesados++;
        if (resultado === 'rechazo') usuariosRechazados++;
        if (resultado === 'sinRespuesta') usuariosSinRespuesta++;
        if (usuariosProcesados !== totalUsuarios) return;
        const usuariosConFalla = usuariosRechazados + usuariosSinRespuesta;
        if (usuariosConFalla === 0) {
          this.notificacionService.openSucess('Horarios asignados correctamente');
          this.seleccionados.clear();
        } else {
          // La selección queda para reintentar.
          this.notificacionService.openWarn(
            `Se asignaron horarios a ${totalUsuarios - usuariosConFalla} de ${totalUsuarios} usuarios.` +
            (usuariosRechazados > 0 ? ` El servidor rechazó ${usuariosRechazados}.` : '') +
            (usuariosSinRespuesta > 0 ? ` No respondió para ${usuariosSinRespuesta}.` : ''),
            8
          );
        }
        this.dataSource.data = [...this.dataSource.data];
      };

      // 2. Para cada usuario único, verificar si ya tiene el horario antes de crear uno nuevo
      funcionariosPorUsuario.forEach((funcionarios, usuarioId) => {
        this.horarioService
          .onGetHorariosPorUsuario(usuarioId, true, PROPAGAR_ERROR_DE_RED, {
            timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS,
            silenciarAvisoTimeout: true,
          })
          .pipe(untilDestroyed(this))
          .subscribe({
            error: (error) => finalizarUsuario(resultadoDelError(error)),
            next: (horariosExistentes) => {
          // Un null es un error del servidor: crear un horario nuevo acá lo duplicaba en cada reintento.
          if (horariosExistentes == null) {
            // Es una lectura: un null también puede ser una respuesta vacía; reintentar no cuesta nada.
            finalizarUsuario('sinRespuesta');
            return;
          }
          // Buscar un horario idéntico en los registros del usuario
          const horarioExistente = horariosExistentes.find(h =>
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

            // El verde es el del final del lote (#501)
            this.horarioService.onSaveHorario(horarioInput, true, PROPAGAR_ERROR_DE_RED, { avisarExito: false }).pipe(untilDestroyed(this)).subscribe({
              next: (res: any) => {
                if (res?.id == null) {
                  finalizarUsuario('sinRespuesta');
                  return;
                }
                this.vincularMultiplesFuncionarios(funcionarios, res.id, finalizarUsuario);
              },
              error: (error) => finalizarUsuario(resultadoDelError(error)),
            });
          }
            },
          });
      });
    }
  }

  private vincularMultiplesFuncionarios(funcionarios: Funcionario[], horarioId: number, onComplete: (resultado: ResultadoLote) => void) {
    let completados = 0;
    let resultadoUsuario: ResultadoLote = 'ok';
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

      // Un rechazo pesa más que una falta de respuesta: reintentar no lo arregla.
      const terminar = (resultado: ResultadoLote) => {
        if (resultado === 'rechazo' || (resultado === 'sinRespuesta' && resultadoUsuario === 'ok')) resultadoUsuario = resultado;
        completados++;
        if (completados === funcionarios.length) onComplete(resultadoUsuario);
      };
      // El verde es el del final del lote (#501)
      this.service.onSaveFuncionario(funcInput, true, PROPAGAR_ERROR_DE_RED, { avisarExito: false }).pipe(untilDestroyed(this)).subscribe({
        next: (saved) => {
          if (saved == null) return terminar('sinRespuesta');
          f.horario = saved.horario;
          terminar('ok');
        },
        error: (error) => terminar(resultadoDelError(error)),
      });
    });
  }

}
