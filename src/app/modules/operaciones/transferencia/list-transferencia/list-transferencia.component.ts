import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { Component, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { PageInfo } from "../../../../app.component";
import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { updateDataSource } from "../../../../commons/core/utils/numbersUtils";
import { Tab } from "../../../../layouts/tab/tab.model";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { EditTransferenciaComponent } from "../edit-transferencia/edit-transferencia.component";
import {
  EtapaTransferencia,
  Transferencia,
  TransferenciaEstado,
} from "../transferencia.model";
import { TabData, TabService } from "./../../../../layouts/tab/tab.service";
import { MainService } from "./../../../../main.service";
import { CargandoDialogService } from "./../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { TransferenciaService } from "./../transferencia.service";
import { MatDialog } from "@angular/material/dialog";
import { DialogoNuevasFuncionesComponent } from "../../../../shared/components/dialogo-nuevas-funciones/dialogo-nuevas-funciones.component";
import { interval } from "rxjs";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "./../../../../notificacion-snackbar.service";

@UntilDestroy()
@Component({
  selector: "app-list-transferencia",
  templateUrl: "./list-transferencia.component.html",
  styleUrls: ["./list-transferencia.component.scss"],
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
export class ListTransferenciaComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  titulo = "Lista de Transferencias";

  dataSource = new MatTableDataSource<Transferencia>([]);

  selectedTransferencia: Transferencia;
  expandedTransferencia: Transferencia;

  idControl = new FormControl();
  sucOrigenControl = new FormControl();
  sucDestinoControl = new FormControl();
  estadoControl = new FormControl();
  etapaControl = new FormControl();
  fechaInicioControl = new FormControl();
  fechaFinControl = new FormControl();
  fechaFormGroup: FormGroup;
  sucursalList: Sucursal[];
  sucursalIdlist: Number[];
  estadoList = Object.values(TransferenciaEstado);
  etapaList = Object.values(EtapaTransferencia);
  today = new Date();

  displayedColumns = [
    "id",
    "origen",
    "destino",
    "estado",
    "etapa",
    "fecha",
    "tipo",
    "acciones",
  ];

  length = 25;
  pageSize = 25;
  pageIndex = 0;
  pageEvent: PageEvent;
  selectedPageInfo: PageInfo<Transferencia>;

  constructor(
    private transferenciaService: TransferenciaService,
    private cargandoService: CargandoDialogService,
    private tabService: TabService,
    public mainService: MainService,
    private sucursalService: SucursalService,
    private matDialog: MatDialog,
    private notificacionService: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {

    // this.dialogoService.

    setTimeout(() => {
      this.paginator._changePageSize(this.paginator.pageSizeOptions[1]);
      this.pageSize = this.paginator.pageSizeOptions[1];
      this.onFilter();
    }, 0);

    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinControl,
    });

    this.sucursalList = [];
    this.sucursalIdlist = [];

    this.onGetTransferencias();
    this.sucursalService.onGetAllSucursales(true).subscribe((res) => {
      this.sucursalList = res.filter((s) => {
        if (s.id != 0) {
          this.sucursalIdlist.push(s.id);
          return s;
        }
      })
    });

    interval(300000).pipe(untilDestroyed(this)).subscribe(()=> {
      this.onFilter();      
    });
  }

  onGetTransferencias() {
    let unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(this.today.getDate() - 7);
    this.fechaInicioControl.setValue(unaSemanaAtras);
    this.fechaFinControl.setValue(this.today);
    this.onFilter();
  }

  onFilter() {
    if (this.fechaFinControl.value == null)
      this.fechaFinControl.setValue(this.today);
    let unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(this.fechaFinControl.value.getDate() - 7);
    if (this.fechaInicioControl.value == null)
      this.fechaInicioControl.setValue(unaSemanaAtras);
    if (this.idControl.value == null) {
      let fechaInicio: Date = this.fechaInicioControl.value;
      let fechaFin: Date = this.fechaFinControl.value;
      fechaInicio.setHours(0, 0, 0);
      fechaFin.setHours(23, 59, 59);
      this.transferenciaService
        .onGetTransferenciasWithFilters(
          this.sucOrigenControl.value?.id,
          this.sucDestinoControl.value?.id,
          this.estadoControl.value,
          null,
          this.etapaControl.value,
          null,
          null,
          dateToString(fechaInicio),
          dateToString(fechaFin),
          this.pageIndex,
          this.pageSize
        )
        .pipe(untilDestroyed(this))
        .subscribe((res: PageInfo<Transferencia>) => {
          if (res != null) {
            this.selectedPageInfo = res;
            this.dataSource.data = res.getContent;
          }
        });
    } else {
      this.transferenciaService
        .onGetTransferencia(this.idControl.value)
        .subscribe((res) => {
          if (res != null) {
            this.dataSource.data = [res];
          }
        });
    }
  }

  onResetFiltro() {
    this.idControl.setValue(null);
    this.sucOrigenControl.setValue(null);
    this.sucDestinoControl.setValue(null);
    this.estadoControl.setValue(null);
    this.etapaControl.setValue(null);
    let unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(this.today.getDate() - 7);
    this.fechaInicioControl.setValue(unaSemanaAtras);
    this.fechaFinControl.setValue(this.today);
  }

  onRowClick(transferencia: Transferencia, index) {
    // this.expandedTransferencia = transferencia;
    // this.cargandoService.openDialog();
    // if (transferencia?.transferenciaItemList == null) {
    //   this.transferenciaService
    //     .onGetTransferencia(transferencia.id)
    //     .pipe(untilDestroyed(this))
    //     .subscribe((res) => {
    //       this.cargandoService.closeDialog();
    //       if (res != null) {
    //         this.selectedTransferencia = res;
    //         this.dataSource.data = updateDataSource(
    //           this.dataSource.data,
    //           res,
    //           index
    //         );
    //       }
    //     });
    // } else {
    //   this.cargandoService.closeDialog();
    // }
  }

  onEdit(transferencia: Transferencia, index) {
    this.tabService.addTab(
      new Tab(
        EditTransferenciaComponent,
        "Transf. " + transferencia.id,
        new TabData(transferencia.id),
        ListTransferenciaComponent
      )
    );
  }

  onDelete(transferencia: Transferencia, index) {
    // Primero cargar los detalles completos de la transferencia para verificar si tiene productos
    this.cargandoService.openDialog();
    
    this.transferenciaService
      .onGetTransferencia(transferencia.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (transferenciaCompleta) => {
          this.cargandoService.closeDialog();
          
          // Verificar si la transferencia tiene productos
          if (transferenciaCompleta?.transferenciaItemList && transferenciaCompleta.transferenciaItemList.length > 0) {
            this.notificacionService.notification$.next({
              texto: `No se puede eliminar la transferencia. Contiene ${transferenciaCompleta.transferenciaItemList.length} producto(s).`,
              color: NotificacionColor.warn,
              duracion: 4
            });
            return;
          }

          // Si no tiene productos, proceder con la eliminación
          this.transferenciaService
            .onDeleteTransferencia(transferencia.id)
            .pipe(untilDestroyed(this))
            .subscribe((res) => {
              if (res) {
                this.dataSource.data = updateDataSource(
                  this.dataSource.data,
                  null,
                  index
                );
                this.notificacionService.notification$.next({
                  texto: 'Transferencia eliminada correctamente',
                  color: NotificacionColor.success,
                  duracion: 3
                });
              }
            });
        },
        error: (error) => {
          this.cargandoService.closeDialog();
          this.notificacionService.notification$.next({
            texto: 'Error al verificar los detalles de la transferencia',
            color: NotificacionColor.danger,
            duracion: 4
          });
        }
      });
  }

  onAdd() {
    this.tabService.addTab(
      new Tab(
        EditTransferenciaComponent,
        "Nueva Transferencia",
        null,
        ListTransferenciaComponent
      )
    );
  }

  onImprimir(id) {
    this.transferenciaService.onImprimirTransferencia(id);
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFilter();
  }
}
