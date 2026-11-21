import { PROPAGAR_ERROR_DE_RED } from "../../../../generics/generic-crud.service";
import { TIMEOUT_POR_DEFECTO_MS } from "../../../../shared/services/timeout-link";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { Component, Input, OnInit } from "@angular/core";
import { Observable, of } from "rxjs";
import { catchError } from "rxjs/operators";
import { FormControl, FormGroup } from "@angular/forms";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { PaginaCentral, PaginacionLista } from "../../../../shared/components/paginacion/paginacion-lista";
import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabData, TabService } from "../../../../layouts/tab/tab.service";
import { MainService } from "../../../../main.service";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { Proveedor } from "../../../personas/proveedor/proveedor.model";
import { ProveedorService } from "../../../personas/proveedor/proveedor.service";
import { Devolucion, DevolucionEstado } from "../devolucion.model";
import { DevolucionService } from "../devolucion.service";
import { EditDevolucionComponent } from "../edit-devolucion/edit-devolucion.component";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-list-devolucion",
  templateUrl: "./list-devolucion.component.html",
  styleUrls: ["./list-devolucion.component.scss"],
})
export class ListDevolucionComponent implements OnInit {
  @Input() data: Tab;

  sucursalControl = new FormControl();
  estadoControl = new FormControl();
  fechaInicioControl = new FormControl();
  fechaFinControl = new FormControl();
  fechaFormGroup: FormGroup;

  selectedProveedor: Proveedor;
  proveedorTexto = "";

  sucursalList: Sucursal[] = [];
  estadoList = Object.values(DevolucionEstado);
  today = new Date();

  displayedColumns = [
    "id",
    "tipo",
    "proveedor",
    "sucursal",
    "estado",
    "resolucion",
    "fecha",
    "acciones",
  ];

  /** Paginadas en el central (#772): gana la última página pedida; si falla una página vuelve a la anterior. */
  pag: PaginacionLista<Devolucion> = new PaginacionLista<Devolucion>({
    cargar: (page, size) => this.consultar(page, size),
    pageSize: 25,
  });
  /** La próxima carga es la recarga al volver a la pestaña: sin avisos. */
  private recargaSilenciosa = false;

  constructor(
    private devolucionService: DevolucionService,
    private tabService: TabService,
    public mainService: MainService,
    private sucursalService: SucursalService,
    private proveedorService: ProveedorService,
    private notificacionService: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinControl,
    });

    let unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(this.today.getDate() - 7);
    this.fechaInicioControl.setValue(unaSemanaAtras);
    this.fechaFinControl.setValue(this.today);

    // Abierta desde el aviso de compras: las devoluciones en espera de ese proveedor,
    // sin rango de fechas (una pendiente puede tener más de una semana).
    const proveedorInicial: Proveedor = this.data?.tabData?.data?.proveedor;
    if (proveedorInicial != null) {
      this.selectedProveedor = proveedorInicial;
      this.proveedorTexto = proveedorInicial.persona?.nombre ?? "";
      this.fechaInicioControl.setValue(null);
      this.fechaFinControl.setValue(null);
    }

    this.sucursalService.onGetAllSucursales(true, PROPAGAR_ERROR_DE_RED, { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true }).subscribe({
      // Con null (error del servidor) res.filter lanzaba TypeError (#390).
      next: (res) => { this.sucursalList = (res ?? []).filter((s) => s.id != 0); },
      error: () => this.notificacionService.openWarn("No se pudieron cargar las sucursales para el filtro.", 5),
    });

    this.pag.filtrar();

    // La pestaña queda viva en segundo plano: al volver, releer con los mismos
    // filtros y página lo que se operó desde otras pestañas.
    this.tabService
      .onTabReactivada(this.data)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.recargaSilenciosa = true;
        this.pag.recargar();
      });
  }

  onBuscarProveedor() {
    this.proveedorService
      .onSearchProveedorPorTexto(this.proveedorTexto)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.selectedProveedor = res;
          this.proveedorTexto = res.persona?.nombre;
          this.onFilter();
        }
      });
  }

  onRemoverProveedor() {
    this.selectedProveedor = null;
    this.proveedorTexto = "";
    this.onFilter();
  }

  // Un filtro nuevo arranca en la página 1: la página actual puede no existir en el resultado filtrado.
  onFilter() {
    this.pag.filtrar();
  }

  private consultar(page: number, size: number): Observable<PaginaCentral<Devolucion> | null> {
    const silencioso = this.recargaSilenciosa;
    this.recargaSilenciosa = false;
    let fechaInicio: Date = this.fechaInicioControl.value;
    let fechaFin: Date = this.fechaFinControl.value;
    let inicioStr: string = null;
    let finStr: string = null;
    if (fechaInicio != null) {
      let aux = new Date(fechaInicio);
      aux.setHours(0, 0, 0);
      inicioStr = dateToString(aux);
    }
    if (fechaFin != null) {
      let aux = new Date(fechaFin);
      aux.setHours(23, 59, 59);
      finStr = dateToString(aux);
    }
    return this.devolucionService
      .onGetDevolucionesConFiltros(
        this.selectedProveedor?.id,
        this.sucursalControl.value?.id,
        this.estadoControl.value,
        inicioStr,
        finStr,
        page,
        size,
        true,
        silencioso,
        PROPAGAR_ERROR_DE_RED,
        { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true }
      )
      .pipe(
        // null: el servicio ya avisó el error. En la recarga silenciosa (al volver a la pestaña) no se avisa.
        catchError(() => {
          if (!silencioso) {
            this.notificacionService.openWarn("No se pudieron cargar las devoluciones: el servidor no responde.", 5);
          }
          return of(null);
        })
      );
  }

  onResetFiltro() {
    this.sucursalControl.setValue(null);
    this.estadoControl.setValue(null);
    this.selectedProveedor = null;
    this.proveedorTexto = "";
    let unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(this.today.getDate() - 7);
    this.fechaInicioControl.setValue(unaSemanaAtras);
    this.fechaFinControl.setValue(this.today);
    this.onFilter();
  }

  onAdd() {
    this.tabService.addTab(
      new Tab(
        EditDevolucionComponent,
        "Nueva Devolución",
        null,
        ListDevolucionComponent
      )
    );
  }

  onEdit(devolucion: Devolucion) {
    this.tabService.addTab(
      new Tab(
        EditDevolucionComponent,
        "Devol. " + devolucion.id,
        new TabData(devolucion.id),
        ListDevolucionComponent
      )
    );
  }

}
