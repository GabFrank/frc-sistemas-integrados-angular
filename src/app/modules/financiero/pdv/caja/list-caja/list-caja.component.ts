import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { updateDataSource } from "../../../../../commons/core/utils/numbersUtils";
import { Tab } from "../../../../../layouts/tab/tab.model";
import { TabData, TabService } from "../../../../../layouts/tab/tab.service";
import { CargandoDialogService } from "../../../../../shared/components/cargando-dialog/cargando-dialog.service";
import {
  SearchListDialogComponent,
  SearchListtDialogData,
} from "../../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { ListVentaComponent } from "../../../../operaciones/venta/list-venta/list-venta.component";
import { VentaService } from "../../../../operaciones/venta/venta.service";
import { Funcionario } from "../../../../personas/funcionarios/funcionario.model";
import { PdvSearchProductoDialogComponent } from "../../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { Producto } from "../../../../productos/producto/producto.model";
import { SearchMaletinGQL } from "../../../maletin/graphql/searchMaletin";
import { Maletin } from "../../../maletin/maletin.model";
import { AdicionarCajaDialogComponent } from "../adicionar-caja-dialog/adicionar-caja-dialog.component";
import { PdvCaja } from "../caja.model";
import { CajaService } from "../caja.service";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MainService } from "../../../../../main.service";
import { SucursalesSearchGQL } from "../../../../empresarial/sucursal/graphql/sucursalesSearch";
import { Sucursal } from "../../../../empresarial/sucursal/sucursal.model";
import { MostrarBalanceDialogComponent } from "../mostrar-balance-dialog/mostrar-balance-dialog.component";
import { PageInfo } from "../../../../../app.component";
import { UsuarioSearchGQL } from "../../../../personas/usuarios/graphql/usuarioSearch";
import { Usuario } from "../../../../personas/usuarios/usuario.model";
import { CajaObservacionDashboardComponent } from "../../caja-observacion/caja-observacion-dashboard/caja-observacion-dashboard.component";
import { CajaObservacionService } from "../../caja-observacion/caja-observacion.service";
import { MainCajaObservacionComponent } from "../../caja-observacion/main-caja-observacion/main-caja-observacion.component";
import { CajaObservacion } from "../../caja-observacion/caja-observacion.model";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../../../notificacion-snackbar.service";
import { GenericCrudService } from "../../../../../generics/generic-crud.service";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-list-caja",
  templateUrl: "./list-caja.component.html",
  styleUrls: ["./list-caja.component.scss"],
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
export class ListCajaComponent implements OnInit {
  dataSource = new MatTableDataSource<PdvCaja>([]);
  cajaObservacionList: CajaObservacion[];
  selectedPdvCaja: PdvCaja;
  expandedCaja: PdvCaja;
  selectedProducto: Producto;
  selectedMaletin: Maletin;
  selectedCajero: Usuario;
  selectedSucursal: Sucursal;
  lastValue = null;
  estadoList = [
    "En proceso",
    "Concluido",
    "Necesita verificacion",
    "En verificacion",
    "Verificado y concluido sin problema",
    "Verificado y concluido con problema",
  ];

  displayedColumns = [
    "id",
    "sucursal",
    "verificado",
    "maletin",
    "activo",
    "fechaApertura",
    "fechaCierre",
    // 'observacion',
    "usuario",
    "acciones",
  ];

  fechaFormGroup: FormGroup;
  codigoControl = new FormControl(null, [Validators.required]);
  fechaInicioControl = new FormControl();
  fechaFinalControl = new FormControl();
  estadoControl = new FormControl();
  maletinControl = new FormControl();
  responsableControl = new FormControl();
  codigoProductoControl = new FormControl();
  productoControl = new FormControl();
  activoControl = new FormControl();
  verificadoControl = new FormControl();
  codigoMaletinControl = new FormControl();
  sucursalControl = new FormControl();
  sucursalCodigoControl = new FormControl();
  conObsControl = new FormControl(false);

  codigoCajeroControl = new FormControl();
  cajeroControl = new FormControl();
  today = new Date();

  //pagtination
  selectedPageInfo: PageInfo<PdvCaja>;
  pageSize = 15;
  pageIndex = 0;

  constructor(
    private cajaService: CajaService,
    private matDialog: MatDialog,
    private cargandoDialog: CargandoDialogService,
    private tabService: TabService,
    private ventaService: VentaService,
    private searchMaletin: SearchMaletinGQL,
    private mainService: MainService,
    private searchSucursal: SucursalesSearchGQL,
    private searchUsuario: UsuarioSearchGQL, 
    private cajaObservacionService: CajaObservacionService,
    private notificacionService: NotificacionSnackbarService,
    private genericCrudService: GenericCrudService
  ) {}

  ngOnInit(): void {
    let hoy = new Date();
    let aux = new Date();
    aux.setDate(hoy.getDate() - 5);

    this.fechaInicioControl.setValue(aux);
    this.fechaFinalControl.setValue(hoy);

    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinalControl,
    });

    if (this.mainService.isServidor) {
      setTimeout(() => {
        this.onSucursalSearch();
      }, 500);
    } else {
      this.onSelectSucursal(this.mainService.sucursalActual);
    }
    
    this.cajaObservacionService.cajaObservacionBS
      .pipe(untilDestroyed(this))
      .subscribe((observaciones: CajaObservacion[]) => {
        this.cajaObservacionList = observaciones;
        this.dataSource.data = this.onObservado(this.dataSource.data);
      })
  }

  onAdd(caja?: PdvCaja, index?) {
    this.matDialog.open(AdicionarCajaDialogComponent, {
      data: {
        caja,
      },
      width: "90%",
      height: "80%",
      disableClose: true,
      autoFocus: true,
      restoreFocus: true,
    });
  }

  onFilter() {
    console.log('Debug - onFilter llamado');
    console.log('Debug - selectedSucursal:', this.selectedSucursal);
    console.log('Debug - selectedSucursal.id:', this.selectedSucursal?.id);
    console.log('Debug - selectedCajero:', this.selectedCajero);
    console.log('Debug - selectedMaletin:', this.selectedMaletin);
    console.log('Debug - Parámetros enviados:', {
      codigo: this.codigoControl.value,
      estado: this.estadoControl.value,
      maletinId: this.selectedMaletin?.id,
      cajeroId: this.selectedCajero?.id,
      fechaInicio: this.fechaInicioControl.value,
      fechaFinal: this.fechaFinalControl.value,
      sucursalId: this.selectedSucursal?.id,
      verificado: this.verificadoControl.value,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize
    });

    this.cajaService
      .onGetCajasWithFilters(
        this.codigoControl.value,
        this.estadoControl.value,
        this.selectedMaletin?.id,
        this.selectedCajero?.id,
        this.fechaInicioControl.value,
        this.fechaFinalControl.value,
        this.selectedSucursal?.id,
        this.verificadoControl.value,
        this.pageIndex,
        this.pageSize
      )
      .pipe(untilDestroyed(this))
      .subscribe((res: PageInfo<PdvCaja>) => {
        console.log('Debug - Respuesta del servicio:', res);
        if (res != null) {
          this.dataSource.data = [];
          this.dataSource.data = res.getContent;
          this.selectedPageInfo = res;
          let cajas: PdvCaja[] = res.getContent;
          cajas = this.onObservado(cajas);  // Marca las cajas que tienen observación
          this.dataSource.data = cajas; 
          console.log('Debug - Cajas mostradas:', cajas.length);
        }
      });
  }

  onResetFilter() {
    this.codigoControl.setValue(null);
    this.estadoControl.setValue(null);
    this.onSelectCajero(null);
    this.onSelectMaletin(null);
    let hoy = new Date();
    let aux = new Date();
    aux.setDate(hoy.getDate() - 5);
    this.fechaInicioControl.setValue(aux);
    this.fechaFinalControl.setValue(hoy);
    this.conObsControl.setValue(false);
  }

  irVentas(caja: PdvCaja) {
    let data = new TabData();
    data.data = caja;
    this.tabService.addTab(
      new Tab(
        ListVentaComponent,
        "Ventas de la caja " + caja.id,
        data,
        ListCajaComponent
      )
    );
  }

  onObservado(cajas: PdvCaja[]): PdvCaja[] {
    cajas.forEach((caja) => {
      caja['hasObservation'] = this.cajaObservacionList
        ? this.cajaObservacionList.some((obs) => 
            obs.pdvCaja && obs.pdvCaja.id === caja.id && obs.sucursal.id === caja.sucursalId
          )
        : false;
    });
  
    if (this.conObsControl.value) {
      cajas = cajas.filter((box) => box['hasObservation']);
    }
    return cajas;
  }
  

  irObservacion(caja: PdvCaja) {
    const dialogRef = this.matDialog
      .open(CajaObservacionDashboardComponent, {
        width: "1950px",
        height: "550px",
        data: { caja: caja }
      })
      dialogRef.afterClosed()
        .subscribe(() => {
          this.cajaObservacionService.onGetCajasObservaciones().subscribe();
        })
  }

  onCondigoEnter() {}

  onCajeroSearch() {
    let data: SearchListtDialogData = {
      titulo: "Buscar cajero",
      tableData: [
        { id: "id", nombre: "Id", width: "5%" },
        {
          id: "nombre",
          nombre: "Nombre",
          nested: true,
          nestedId: "persona",
          width: "50%",
        },
        {
          id: "documento",
          nombre: "Documento",
          nested: true,
          nestedId: "persona",
          width: "40%",
        },
      ],
      query: this.searchUsuario,
    };
    this.matDialog
      .open(SearchListDialogComponent, {
        data: data,
        height: "80vh",
        width: "70vw",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.onSelectCajero(res);
        }
      });
  }

  onSelectProducto(producto: Producto) {
    this.selectedProducto = producto;
    this.productoControl.setValue(producto.descripcion);
    this.codigoProductoControl.setValue(producto.id);
  }

  onChange() {
    if (this.activoControl.value == true && this.lastValue == false) {
      this.activoControl.setValue(null);
    }
    this.lastValue = this.activoControl.value;
  }

  onProductoEnter() {}

  onCajeroEnter() {
    this.onCajeroSearch();
  }

  onBuscar() {
    this.ventaService
      .onGetVentasPorPeriodo(
        "2022-03-01T00:00:00",
        "2022-03-03T00:00:00",
        this.selectedSucursal.id
      )
      .pipe(untilDestroyed(this))
      .subscribe((res) => {});
  }

  onMaletinSearch() {
    // Verificar que hay una sucursal seleccionada
    if (!this.selectedSucursal || !this.selectedSucursal.id) {
      this.notificacionService.notification$.next({
        texto: 'Debe seleccionar una sucursal antes de buscar maletines.',
        color: NotificacionColor.warn,
        duracion: 4
      });
      return;
    }

    // Convertir ID a número si es string
    let sucursalId: number;
    if (typeof this.selectedSucursal.id === 'string') {
      sucursalId = parseInt(this.selectedSucursal.id, 10);
    } else {
      sucursalId = this.selectedSucursal.id;
    }

    // Validar que el ID convertido sea válido
    if (isNaN(sucursalId) || sucursalId <= 0) {
      this.notificacionService.notification$.next({
        texto: 'Error: ID de sucursal inválido. Por favor, seleccione nuevamente la sucursal.',
        color: NotificacionColor.danger,
        duracion: 4
      });
      return;
    }

    let data: SearchListtDialogData = {
      titulo: "Buscar maletin",
      tableData: [
        { id: "id", nombre: "Id", width: "5%" },
        { id: "descripcion", nombre: "Descripción", width: "50%" },
        { id: "abierto", nombre: "Abierto", width: "22%" },
      ],
      query: this.searchMaletin,
      queryData: {
        sucId: sucursalId,
        texto: null
      },
      inicialSearch: true,
    };

    this.matDialog
      .open(SearchListDialogComponent, {
        data: data,
        height: "80vh",
        width: "70vw",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.onSelectMaletin(res);
        }
      });
  }

  onClearCajero() {
    this.codigoCajeroControl.setValue(null);
    this.cajeroControl.setValue(null);
    this.selectedCajero = null;
    this.onFilter();
  }

  onSelectMaletin(maletin: Maletin) {
    if (maletin == null) {
      this.codigoMaletinControl.setValue(null);
      this.maletinControl.setValue(null);
      this.selectedMaletin = null;
    } else {
      this.codigoMaletinControl.setValue(maletin.id);
      this.maletinControl.setValue(maletin.descripcion);
      this.selectedMaletin = maletin;
    }
    
    // Llamar automáticamente el filtro cuando se selecciona maletin
    console.log('Debug - Maletin seleccionado, llamando onFilter()');
    this.onFilter();
  }

  onSelectCajero(cajero: Usuario) {
    if (cajero == null) {
      this.codigoCajeroControl.setValue(null);
      this.cajeroControl.setValue(null);
      this.selectedCajero = null;
    } else {
      this.codigoCajeroControl.setValue(cajero.id);
      this.cajeroControl.setValue(cajero.persona.nombre);
      this.selectedCajero = cajero;
    }
    
    // Llamar automáticamente el filtro cuando se selecciona cajero
    console.log('Debug - Cajero seleccionado, llamando onFilter()');
    this.onFilter();
  }

  onSucursalSearchById(id) {
    // this.mainService.sucursalService.onGetSucursal(id).subscribe(res => {
    //   if (res != null) {
    //     this.onSelectSucursal(res);
    //   }
    // })
  }

  onSucursalSearch(texto?) {
    let data: SearchListtDialogData = {
      titulo: "Seleccionar sucursal",
      tableData: [
        { id: "id", nombre: "Id", width: "5%" },
        { id: "nombre", nombre: "Nombre", width: "50%" },
        {
          id: "descripcion",
          nombre: "Ciudad",
          width: "22%",
          nested: true,
          nestedId: "ciudad",
        },
      ],
      query: this.searchSucursal,
      inicialSearch: true,
      texto: texto,
      isAdicionar: false,
    };
    this.matDialog
      .open(SearchListDialogComponent, {
        data: data,
        height: "80vh",
        width: "70vw",
        restoreFocus: true,
        panelClass: 'search-dialog-dark'
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.onSelectSucursal(res);
          // No llamar onFilter() aquí porque ya se llama en onSelectSucursal()
        }
      });
  }

  onSelectSucursal(sucursal: Sucursal) {
    this.sucursalCodigoControl.setValue(sucursal.id);
    this.sucursalControl.setValue(sucursal.nombre);
    this.selectedSucursal = sucursal;
    
    // Llamar automáticamente el filtro cuando se selecciona sucursal
    console.log('Debug - Sucursal seleccionada, llamando onFilter()');
    this.onFilter();
  }

  cargarMasDatos() {}

  getBalance() {
    this.cajaService
      .onGetBalanceByDate(
        this.fechaInicioControl.value,
        this.fechaFinalControl.value,
        this.selectedSucursal?.id
      )
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.matDialog.open(MostrarBalanceDialogComponent, {
            data: {
              balance: res,
            },
            width: "50%",
          });
        }
      });
  }

  handlePageEvent(e) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFilter();
  }
}

// true => false => null
// null => true => false
