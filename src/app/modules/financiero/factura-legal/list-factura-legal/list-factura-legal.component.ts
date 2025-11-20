import { Component, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import {
  FacturaLegal,
  FacturaLegalItem,
  ResumenFacturasDto,
} from "../factura-legal.model";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { updateDataSource } from "../../../../commons/core/utils/numbersUtils";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { ConfirmDialogComponent } from "../../../../shared/components/confirm-dialog/confirm-dialog.component";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { FacturaLegalService } from "../factura-legal.service";
import { AddFacturaLegalDialogComponent } from "../add-factura-legal-dialog/add-factura-legal-dialog.component";
import { EditFacturaLegalDialogComponent } from "../edit-factura-legal-dialog/edit-factura-legal-dialog.component";
import { EstadoDE } from "../../documento-electronico/documento-electronico.model";
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { BdcWalkService, TaskList } from "bdc-walkthrough";
import { removeSecondDigito } from "../../../../commons/core/utils/rucUtils";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { PageInfo } from "../../../../app.component";
import { ReporteService } from "../../../reportes/reporte.service";
import { TabService } from "../../../../layouts/tab/tab.service";
import { Tab } from "../../../../layouts/tab/tab.model";
import { ReportesComponent } from "../../../reportes/reportes/reportes.component";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-list-factura-legal",
  templateUrl: "./list-factura-legal.component.html",
  styleUrls: ["./list-factura-legal.component.scss"],
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
export class ListFacturaLegalComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  selectedSucursal: Sucursal;
  sucursalList: Sucursal[];
  sucursalIdList: number[];
  sucursalControl = new FormControl([], Validators.required);
  nombreControl = new FormControl(null);
  rucControl = new FormControl(null);
  cdcControl = new FormControl(null);
  tipoControl = new FormControl('TODOS');
  estadoControl = new FormControl('TODOS');
  fechaInicioControl = new FormControl(null, Validators.required);
  fechaFinControl = new FormControl(null, Validators.required);
  iva5Control = new FormControl(true);
  iva10Control = new FormControl(true);
  fechaFormGroup: FormGroup;

  length = 25;
  pageSize = 25;
  pageIndex = 0;
  pageEvent: PageEvent;
  orderById = null;
  orderByNombre = null;
  selectedPageInfo: PageInfo<FacturaLegal>;

  today = new Date();
  cantidadFacturas = 0;
  numeroInicioFactura;
  numeroFinFactura;
  totalEnGs = 0;
  total0 = 0;
  total5 = 0;
  total10 = 0;
  expandedElement;

  allSucursales = false;

  selectedFacturaItem: FacturaLegalItem;
  facturaList: FacturaLegal[];
  page = 0;
  size = 30;
  isLast = true;
  dataSource = new MatTableDataSource<FacturaLegal>([]);
  facturaItemDataSource = new MatTableDataSource<FacturaLegalItem>([]);

  displayedColumns = [
    "id",
    "sucursal",
    "numero",
    "cliente",
    "ruc",
    "electronico",
    "estado",
    "totalFinal",
    "creadoEn",
    "acciones",
  ];

  facturaItemColumnsToDisplay = [
    "id",
    "descripcion",
    "cantidad",
    "precioUnitario",
    "total",
  ];

  selectedResumenFacturas: ResumenFacturasDto;

  constructor(
    private sucursalService: SucursalService,
    private facturaService: FacturaLegalService,
    private cargandoService: CargandoDialogService,
    private notificacionService: NotificacionSnackbarService,
    private matDialog: MatDialog,
    public bdcWalkService: BdcWalkService,
    private reporteService: ReporteService,
    private tabService: TabService
  ) {}

  iniciarTutorial() {
    this.bdcWalkService.disableAll(false);
    this.bdcWalkService.reset("factura");
    this.bdcWalkService.setTaskCompleted("inicio", 1);
  }

  onFinalizar() {
    this.bdcWalkService.reset("factura");
    this.bdcWalkService.disableAll(true);
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.paginator._changePageSize(this.paginator.pageSizeOptions[1]);
      this.pageSize = this.paginator.pageSizeOptions[1];
      this.onFilter();
    }, 0);

    this.cdcControl.valueChanges.subscribe(res => {
      if (res) {
        this.sucursalControl.disable();
        this.nombreControl.disable();
        this.rucControl.disable();
        this.fechaInicioControl.disable();
        this.fechaFinControl.disable();
        this.iva5Control.disable();
        this.iva10Control.disable();
        this.tipoControl.disable();
        this.estadoControl.disable();
      } else {
        this.sucursalControl.enable();
        this.nombreControl.enable();
        this.rucControl.enable();
        this.fechaInicioControl.enable();
        this.fechaFinControl.enable();
        this.iva5Control.enable();
        this.iva10Control.enable();
        this.tipoControl.enable();
        this.estadoControl.enable();
      }
    });

    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinControl,
    });

    let date = new Date();
    let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    this.fechaInicioControl.setValue(firstDay);
    this.fechaFinControl.setValue(this.today);
    this.sucursalList = [];
    this.sucursalIdList = [];
    this.sucursalService.onGetAllSucursales(true).subscribe((res) => {
      this.sucursalList = res.filter((s) => {
        if (s.id != 0) {
          this.sucursalIdList.push(s.id);
          return s;
        }
      });
    });
  }

  onFilter() {
    this.onGetFacturas();
    this.onGetResumen();
  }

  onGetResumen() {
    if (this.fechaFormGroup.valid && this.sucursalControl.valid) {
      let fechaInicio = dateToString(this.fechaInicioControl.value);
      let fechaFin = dateToString(this.fechaFinControl.value);
      this.facturaService
        .onGetResumenFacturas(
          fechaInicio,
          fechaFin,
          this.toSucursalesId(this.sucursalControl.value),
          this.rucControl.value != null
            ? `%${this.rucControl.value?.toUpperCase()}%`
            : null,
          this.nombreControl.value != null
            ? `%${this.nombreControl.value?.toUpperCase()}%`
            : null,
          this.iva5Control.value,
          this.iva10Control.value
        )
        .subscribe((res) => {
          if (res != null) {
            this.selectedResumenFacturas = res;
          }
        });
      
    }
  }

  onGetFacturas() {
    if (this.cdcControl.value) {
      this.facturaService.onGetFacturaLegalByCdc(this.cdcControl.value).subscribe(res => {
        if (res) {
          // Calcular propiedad puedeCancelar para la factura
          (res as any).puedeCancelar = this.calcularPuedeCancelarFactura(res);
          this.dataSource.data = [res];
        } else {
          this.dataSource.data = [];
        }
      })
    } else if (this.fechaFormGroup.valid && this.sucursalControl.valid) {
      let fechaInicio = dateToString(this.fechaInicioControl.value);
      let fechaFin = dateToString(this.fechaFinControl.value);
      let isElectronico = this.tipoControl.value === 'ELECTRONICO' ? true : this.tipoControl.value === 'AUTOIMPRESO' ? false : null;
      let activo = this.estadoControl.value === 'ACTIVOS' ? true : this.estadoControl.value === 'INACTIVOS' ? false : null;
      this.facturaService
        .onGetAllFacturasLegales(
          this.pageIndex,
          this.pageSize,
          fechaInicio,
          fechaFin,
          this.toSucursalesId(this.sucursalControl.value),
          this.rucControl.value != null
            ? `%${this.rucControl.value?.toUpperCase()}%`
            : null,
          this.nombreControl.value != null
            ? `%${this.nombreControl.value?.toUpperCase()}%`
            : null,
          this.iva5Control.value,
          this.iva10Control.value,
          false,
          isElectronico,
          activo
        )
        .subscribe((res) => {
          this.selectedPageInfo = res;
          // Calcular propiedad puedeCancelar para cada factura
          this.selectedPageInfo?.getContent?.forEach(factura => {
            (factura as any).puedeCancelar = this.calcularPuedeCancelarFactura(factura);
          });
          this.dataSource.data = this.selectedPageInfo?.getContent;
        });
    }
  }

  calcularResumen() {
    this.total0 = 0;
    this.total5 = 0;
    this.total10 = 0;
    this.cantidadFacturas = this.dataSource.data?.length;
    this.numeroInicioFactura = this.dataSource.data[0]?.numeroFactura;
    this.numeroFinFactura =
      this.dataSource.data[this.dataSource.data?.length - 1]?.numeroFactura;
    this.totalEnGs = 0;
    this.dataSource.data?.forEach((f) => {
      this.totalEnGs += f?.totalFinal;
      this.total0 += f.ivaParcial0;
      this.total5 += f.ivaParcial5;
      this.total10 += f.ivaParcial10;
      let ruc = removeSecondDigito(f.ruc);
      f.ruc = ruc;
    });
  }

  toSucursalesId(sucursales: Sucursal[]) {
    let idList = [];
    sucursales.forEach((s) => idList.push(s.id));
    return idList;
  }

  onAdd() {
    this.matDialog
      .open(AddFacturaLegalDialogComponent, {
        data: {
          ventaItemList: [],
          descuento: 0,
          isServidor: true,
        },
        width: "100%",
        height: "80vh",
      })
      .afterClosed()
      .subscribe((res) => {
        if (res != null) {
          this.dataSource.data = updateDataSource(this.dataSource.data, res);
        }
      });
  }

  onEdit(factura: FacturaLegal, i: number) {
    this.matDialog.open(EditFacturaLegalDialogComponent, {
      data: { factura },
      width: '850px',
      maxWidth: '95vw',
      disableClose: false
    }).afterClosed().subscribe(res => {
      if (res) {
        // Reload the list to get updated data
        this.onGetFacturas();
      }
    });
  }

  // Removed onDeleteFactura - facturas can no longer be deleted from this menu

  onDeleteFacturaItem(facturaItem, i) {
    // this.facturaItemService.onDeleteFacturaItem(facturaItem.id)
    //   .pipe(untilDestroyed(this))
    //   .subscribe(res => {
    //     if (res) {
    //       this.facturaItemDataSource.data = updateDataSource(this.facturaItemDataSource.data, null, i)
    //     }
    //   })
  }

  onEditFacturaItem(facturaItem, i) {
    // console.log(i);
    // this.matDialog.open(AdicionarFacturaItemDialogComponent, {
    //   data: {
    //     factura: this.expandedElement,
    //     facturaItem
    //   }
    //   ,
    //   width: '50%'
    // }).afterClosed().subscribe(res => {
    //   if (res != null) {
    //     this.facturaItemDataSource.data = updateDataSource(this.facturaItemDataSource.data, res, i)
    //     // this.dataSource.data = updateDataSource(this.dataSource.data, this.facturaItemDataSource.data, i)
    //   }
    // })
  }

  onAddFacturaItem(factura: FacturaLegalItem, i) {
    // this.matDialog.open(AdicionarFacturaItemDialogComponent, {
    //   data: {
    //     factura
    //   }
    //   ,
    //   width: '50%'
    // }).afterClosed().subscribe(res => {
    //   if (res != null) {
    //     this.facturaItemDataSource.data = updateDataSource(this.facturaItemDataSource.data, res)
    //     // this.dataSource.data = updateDataSource(this.dataSource.data, this.facturaItemDataSource.data, i)
    //   }
    // })
  }

  resetFiltro() {
    let date = new Date();
    let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    this.fechaInicioControl.setValue(firstDay);
    this.fechaFinControl.setValue(this.today);
    this.sucursalControl.setValue(null);
    this.nombreControl.setValue(null);
    this.rucControl.setValue(null);
    this.selectedResumenFacturas = null;
    this.dataSource.data = [];
  }

  exportarExcel(todos?: Boolean) {
    let filename = "frc_";
    let sucursalesNames: Sucursal[] = this.sucursalControl.value;

    if (sucursalesNames.length != 1 && todos == false) {
      return null;
    }
    let fechaFinDate: Date = this.fechaFinControl.value;
    fechaFinDate.setHours(23, 59, 59, 59);
    let fechaInicio = dateToString(this.fechaInicioControl.value);
    let fechaFin = dateToString(fechaFinDate);

    !todos
      ? this.facturaService
          .onGenerarExcelFacturas(fechaInicio, fechaFin, sucursalesNames[0].id)
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            if (res != null && res == "") return null;
            const byteCharacters = atob(res);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);

            // Create a Blob from the byte array
            const blob = new Blob([byteArray], {
              type: "application/vnd.ms-excel",
            });

            let url = window.URL.createObjectURL(blob);
            let a = document.createElement("a");
            document.body.appendChild(a);
            a.setAttribute("style", "display: none");
            a.href = url;
            a.download = `${sucursalesNames[0]?.nombre
              .replace(" ", "_")
              .toLowerCase()}_${fechaInicio.substring(0, 10)}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
          })
      : this.facturaService
          .onGenerarExcelFacturasZip(
            fechaInicio,
            fechaFin,
            this.toSucursalesId(this.sucursalControl.value)
          )
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            if (res != null && res == "") return null;
            const byteCharacters = atob(res);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);

            // Create a Blob from the byte array
            const blob = new Blob([byteArray], {
              type: "application/zip",
            });

            let url = window.URL.createObjectURL(blob);
            let a = document.createElement("a");
            document.body.appendChild(a);
            a.setAttribute("style", "display: none");
            a.href = url;
            a.download = `facturas-bodega-franco-${fechaInicio.substring(
              0,
              10
            )}.zip`;
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
          });
  }

  onImprimir(factura: FacturaLegal, i) {
    this.facturaService.onReimprimirFactura(factura.id, factura.sucursalId);
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onGetFacturas();
  }

  // Computed property helpers
  esElectronica(factura: FacturaLegal): boolean {
    return !!(factura.cdc && factura.cdc.trim().length > 0);
  }

  getEstadoDisplay(factura: FacturaLegal): string {
    if (this.esElectronica(factura)) {
      // Factura electrónica - mostrar estado del DE
      return factura.documentoElectronico?.estado || 'N/A';
    } else {
      // Factura papel - mostrar activo/inactivo
      return factura.activo ? 'ACTIVA' : 'INACTIVA';
    }
  }

  getEstadoClass(factura: FacturaLegal): string {
    if (this.esElectronica(factura)) {
      const estado = factura.documentoElectronico?.estado;
      switch (estado) {
        case EstadoDE.APROBADO:
          return 'estado-aprobado';
        case EstadoDE.PENDIENTE:
        case EstadoDE.EN_LOTE:
          return 'estado-pendiente';
        case EstadoDE.RECHAZADO:
          return 'estado-rechazado';
        case EstadoDE.CANCELADO:
          return 'estado-cancelado';
        default:
          return 'estado-default';
      }
    } else {
      return factura.activo ? 'estado-activo' : 'estado-inactivo';
    }
  }

  puedeEditarFactura(factura: FacturaLegal): boolean {
    return true;
  }

  calcularPuedeCancelarFactura(factura: FacturaLegal): boolean {
    // Solo se puede cancelar si:
    // - Tiene activo = true, O
    // - Si es electrónica, el estado del documento electrónico es APROBADO
    if (factura.activo === true) {
      return true;
    }

    if (this.esElectronica(factura) && factura.documentoElectronico?.estado === EstadoDE.APROBADO) {
      return true;
    }

    return false;
  }

  onCancelarFactura(factura: FacturaLegal) {
    const esElectronica = this.esElectronica(factura);
    const titulo = esElectronica ? 'Cancelar Factura Electrónica' : 'Cancelar Factura';
    const mensaje = esElectronica
      ? '¿Desea cancelar esta factura electrónica? Esto enviará un evento de cancelación a SIFEN.'
      : '¿Desea cancelar esta factura? Esta acción no se puede deshacer.';

    const dialogRef = this.matDialog.open(ConfirmDialogComponent, {
      data: {
        titulo,
        mensaje,
        opciones: [
          { texto: 'Solo Factura', valor: false },
          { texto: 'Factura + Venta', valor: true }
        ],
        cancelar: true
      },
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.ejecutarCancelacion(factura, result);
      }
    });
  }

  private ejecutarCancelacion(factura: FacturaLegal, cancelarVenta: boolean) {
    this.cargandoService.openDialog();

    this.facturaService.onCancelarFacturaLegal(factura.id, factura.sucursalId, cancelarVenta)
      .subscribe({
        next: (resultado: string) => {
          this.cargandoService.closeDialog();

          if (resultado.startsWith('EXITO')) {
            this.notificacionService.openGuardadoConExito();
            this.onGetFacturas(); // Recargar la lista
          } else if (resultado.startsWith('ERROR_SIFEN')) {
            this.notificacionService.openAlgoSalioMal('Error en SIFEN: ' + resultado.substring(11));
          } else if (resultado.startsWith('ERROR')) {
            this.notificacionService.openAlgoSalioMal('Error: ' + resultado.substring(6));
          } else {
            this.notificacionService.openAlgoSalioMal('Error desconocido: ' + resultado);
          }
        },
        error: (error) => {
          this.cargandoService.closeDialog();
          console.error('Error al cancelar factura:', error);
          this.notificacionService.openAlgoSalioMal('Error al cancelar la factura');
        }
      });
  }

  onDescargarXml(factura: FacturaLegal) {
    if (!this.esElectronica(factura)) {
      this.notificacionService.openAlgoSalioMal('Esta factura no es electrónica');
      return;
    }

    this.cargandoService.openDialog();
    this.facturaService.onDescargarXmlFacturaElectronica(factura.id, factura.sucursalId, true)
      .subscribe({
        next: (base64String: string) => {
          this.cargandoService.closeDialog();
          if (!base64String) {
            this.notificacionService.openAlgoSalioMal('No se pudo descargar el XML');
            return;
          }

          // Convertir Base64 a Blob
          const byteCharacters = atob(base64String);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/xml' });

          // Crear descarga
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          document.body.appendChild(a);
          a.setAttribute('style', 'display: none');
          a.href = url;
          a.download = `factura-${factura.numeroFactura}-${factura.cdc}.xml`;
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        },
        error: (error) => {
          this.cargandoService.closeDialog();
          console.error('Error al descargar XML:', error);
          this.notificacionService.openAlgoSalioMal('Error al descargar el XML');
        }
      });
  }

  onDescargarPdf(factura: FacturaLegal) {
    if (!this.esElectronica(factura)) {
      this.notificacionService.openAlgoSalioMal('Esta factura no es electrónica');
      return;
    }

    this.cargandoService.openDialog();
    this.facturaService.onDescargarPdfFacturaElectronica(factura.id, factura.sucursalId, true)
      .subscribe({
        next: (base64String: string) => {
          this.cargandoService.closeDialog();
          if (!base64String) {
            this.notificacionService.openAlgoSalioMal('No se pudo descargar el PDF');
            return;
          }

          // Convertir Base64 a Blob
          const byteCharacters = atob(base64String);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });

          // Crear descarga
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          document.body.appendChild(a);
          a.setAttribute('style', 'display: none');
          a.href = url;
          a.download = `factura-${factura.numeroFactura}-${factura.cdc}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        },
        error: (error) => {
          this.cargandoService.closeDialog();
          console.error('Error al descargar PDF:', error);
          this.notificacionService.openAlgoSalioMal('Error al descargar el PDF');
        }
      });
  }

  onAbrirPdf(factura: FacturaLegal) {
    if (!this.esElectronica(factura)) {
      this.notificacionService.openAlgoSalioMal('Esta factura no es electrónica');
      return;
    }

    this.cargandoService.openDialog();
    this.facturaService.onDescargarPdfFacturaElectronica(factura.id, factura.sucursalId, true)
      .subscribe({
        next: (base64String: string) => {
          this.cargandoService.closeDialog();
          if (!base64String) {
            this.notificacionService.openAlgoSalioMal('No se pudo cargar el PDF');
            return;
          }

          // Agregar el PDF al servicio de reportes
          const nombreReporte = `Factura Electrónica ${factura.numeroFactura} - ${factura.cdc}`;
          this.reporteService.onAdd(nombreReporte, base64String);

          // Abrir el componente de reportes en un nuevo tab
          this.tabService.addTab(new Tab(ReportesComponent, 'Reportes', null, ListFacturaLegalComponent));
        },
        error: (error) => {
          this.cargandoService.closeDialog();
          console.error('Error al abrir PDF:', error);
          this.notificacionService.openAlgoSalioMal('Error al cargar el PDF');
        }
      });
  }
}
