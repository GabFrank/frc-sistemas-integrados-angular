import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import {
  updateDataSource,
  updateDataSourceInsertFirst,
  updateDataSourceWithId,
} from "../../../../commons/core/utils/numbersUtils";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabService } from "../../../../layouts/tab/tab.service";
import { MainService } from "../../../../main.service";
import {
  NotificacionSnackbarService,
} from "../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { Proveedor } from "../../../personas/proveedor/proveedor.model";
import { ProveedorService } from "../../../personas/proveedor/proveedor.service";
import {
  PdvSearchProductoDialogComponent,
  PdvSearchProductoData,
  PdvSearchProductoResponseData,
} from "../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { CreateItemDialogComponent } from "../create-item-dialog/create-item-dialog.component";
import {
  Devolucion,
  DevolucionEstado,
  DevolucionItem,
  MotivoAveria,
  TipoDevolucion,
} from "../devolucion.model";
import { DevolucionService } from "../devolucion.service";
import { ListDevolucionComponent } from "../list-devolucion/list-devolucion.component";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-edit-devolucion",
  templateUrl: "./edit-devolucion.component.html",
  styleUrls: ["./edit-devolucion.component.scss"],
})
export class EditDevolucionComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  @Input() data: Tab;

  readonly TipoDevolucion = TipoDevolucion;
  readonly DevolucionEstado = DevolucionEstado;

  selectedDevolucion = new Devolucion();
  dataSource = new MatTableDataSource<DevolucionItem>([]);
  isDialogOpen = false;

  tipoControl = new FormControl(TipoDevolucion.SIN_PROVEEDOR, Validators.required);
  sucursalControl = new FormControl(null, Validators.required);
  observacionControl = new FormControl(null);
  motivoControl = new FormControl(null);

  nroNotaCreditoControl = new FormControl(null);
  montoAcreditadoControl = new FormControl(null);

  selectedProveedor: Proveedor;
  proveedorTexto = "";

  sucursalList: Sucursal[] = [];
  motivosAveria: MotivoAveria[] = [];
  tipoList = Object.values(TipoDevolucion);

  // flags precalculados (no llamar funciones desde el HTML)
  esNuevo = true;
  esPendiente = true;
  esConProveedor = false;
  puedeEditarCabecera = true;
  canAvanzarSeparado = false;
  canAvanzarRetirado = false;
  canAvanzarDescartado = false;
  canCanjear = false;
  canAcreditar = false;
  canCancelar = false;
  canjeMode = false;
  acreditarMode = false;

  columnsToDisplay = [
    "producto",
    "presentacion",
    "cantidad",
    "motivoAveria",
    "costo",
    "lote",
    "vencimiento",
    "menu",
  ];

  columnsCanje = [
    "producto",
    "presentacion",
    "cantidad",
    "cantidadReingresada",
    "vencimientoReingreso",
  ];

  constructor(
    private matDialog: MatDialog,
    public mainService: MainService,
    private devolucionService: DevolucionService,
    private cargandoService: CargandoDialogService,
    private dialogosService: DialogosService,
    private notificacionService: NotificacionSnackbarService,
    private sucursalService: SucursalService,
    private proveedorService: ProveedorService,
    private tabService: TabService
  ) {}

  ngOnInit(): void {
    this.selectedDevolucion = new Devolucion();
    this.selectedDevolucion.tipo = TipoDevolucion.SIN_PROVEEDOR;
    this.selectedDevolucion.estado = DevolucionEstado.PENDIENTE;

    this.sucursalService.onGetAllSucursales(true).subscribe((res) => {
      this.sucursalList = res.filter((s) => s.id != 0);
      if (this.selectedDevolucion?.id == null) {
        let actual = this.sucursalList.find(
          (s) => s.id == this.mainService.sucursalActual?.id
        );
        if (actual != null) {
          this.sucursalControl.setValue(actual);
        }
      }
    });

    this.devolucionService
      .onGetMotivosAveriaActivos()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.motivosAveria = res ?? [];
      });

    this.tipoControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((tipo: TipoDevolucion) => {
        this.esConProveedor = tipo == TipoDevolucion.CON_PROVEEDOR;
      });

    if (this.data?.tabData != null && this.data?.tabData["id"] != null) {
      this.cargarDatos(this.data.tabData["id"]);
    } else {
      this.esNuevo = true;
      this.esConProveedor =
        this.tipoControl.value == TipoDevolucion.CON_PROVEEDOR;
      this.computeEstadoFlags();
    }
  }

  cargarDatos(id: number) {
    this.devolucionService
      .onGetDevolucion(id)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.selectedDevolucion = new Devolucion();
          Object.assign(this.selectedDevolucion, res);
          this.esNuevo = false;
          this.tipoControl.setValue(this.selectedDevolucion.tipo);
          this.esConProveedor =
            this.selectedDevolucion.tipo == TipoDevolucion.CON_PROVEEDOR;
          this.selectedProveedor = this.selectedDevolucion.proveedor;
          this.proveedorTexto =
            this.selectedDevolucion.proveedor?.persona?.nombre ?? "";
          this.sucursalControl.setValue(this.selectedDevolucion.sucursalOrigen);
          this.observacionControl.setValue(this.selectedDevolucion.observacion);
          this.motivoControl.setValue(this.selectedDevolucion.motivo);
          this.nroNotaCreditoControl.setValue(
            this.selectedDevolucion.nroNotaCredito
          );
          this.montoAcreditadoControl.setValue(
            this.selectedDevolucion.montoAcreditado
          );
          this.dataSource.data = this.selectedDevolucion.items ?? [];
          this.getItems();
          this.computeEstadoFlags();
        }
      });
  }

  getItems() {
    if (this.selectedDevolucion?.id == null) return;
    this.devolucionService
      .onGetDevolucionItemsPorDevolucion(this.selectedDevolucion.id)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.dataSource.data = res ?? [];
      });
  }

  computeEstadoFlags() {
    const estado = this.selectedDevolucion?.estado;
    const conProveedor =
      this.selectedDevolucion?.tipo == TipoDevolucion.CON_PROVEEDOR ||
      this.tipoControl.value == TipoDevolucion.CON_PROVEEDOR;

    this.esPendiente = estado == null || estado == DevolucionEstado.PENDIENTE;
    this.puedeEditarCabecera = this.esNuevo || this.esPendiente;

    this.canAvanzarSeparado = false;
    this.canAvanzarRetirado = false;
    this.canAvanzarDescartado = false;
    this.canCanjear = false;
    this.canAcreditar = false;
    this.canCancelar = false;

    if (this.selectedDevolucion?.id == null) {
      return;
    }

    switch (estado) {
      case DevolucionEstado.PENDIENTE:
        this.canAvanzarSeparado = true;
        this.canCancelar = true;
        break;
      case DevolucionEstado.SEPARADO:
        if (conProveedor) {
          this.canAvanzarRetirado = true;
        } else {
          this.canAvanzarDescartado = true;
        }
        this.canCancelar = true;
        break;
      case DevolucionEstado.RETIRADO:
        this.canCanjear = true;
        this.canAcreditar = true;
        break;
      default:
        break;
    }
  }

  onBuscarProveedor() {
    this.proveedorService
      .onSearchProveedorPorTexto(this.proveedorTexto)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.selectedProveedor = res;
          this.proveedorTexto = res.persona?.nombre;
        }
      });
  }

  onRemoverProveedor() {
    this.selectedProveedor = null;
    this.proveedorTexto = "";
  }

  onGuardarCabecera(): Promise<Devolucion> {
    return new Promise((resolve, reject) => {
      if (this.sucursalControl.invalid || this.tipoControl.invalid) {
        this.notificacionService.openWarn(
          "Complete tipo y sucursal antes de guardar"
        );
        reject();
        return;
      }
      if (
        this.tipoControl.value == TipoDevolucion.CON_PROVEEDOR &&
        this.selectedProveedor == null
      ) {
        this.notificacionService.openWarn(
          "Debe seleccionar un proveedor para una devolución con proveedor"
        );
        reject();
        return;
      }

      let aux = new Devolucion();
      Object.assign(aux, this.selectedDevolucion);
      aux.tipo = this.tipoControl.value;
      aux.proveedor =
        this.tipoControl.value == TipoDevolucion.CON_PROVEEDOR
          ? this.selectedProveedor
          : null;
      aux.sucursalOrigen = this.sucursalControl.value;
      aux.observacion =
        this.observacionControl.value != null
          ? ("" + this.observacionControl.value).toUpperCase()
          : null;
      aux.motivo =
        this.motivoControl.value != null
          ? ("" + this.motivoControl.value).toUpperCase()
          : null;
      aux.usuario = this.mainService.usuarioActual;
      if (aux.fecha == null) aux.fecha = new Date();
      if (aux.estado == null) aux.estado = DevolucionEstado.PENDIENTE;

      this.devolucionService
        .onSaveDevolucion(aux.toInput())
        .pipe(untilDestroyed(this))
        .subscribe(
          (res) => {
            if (res != null) {
              Object.assign(this.selectedDevolucion, res);
              this.esNuevo = false;
              this.tabService.changeCurrentTabName(
                "Devol. " + this.selectedDevolucion.id
              );
              this.computeEstadoFlags();
              resolve(this.selectedDevolucion);
            } else {
              reject();
            }
          },
          () => reject()
        );
    });
  }

  onAddItem() {
    if (this.selectedDevolucion?.id == null) {
      this.onGuardarCabecera().then(() => this.abrirBusquedaProducto());
    } else {
      this.abrirBusquedaProducto();
    }
  }

  abrirBusquedaProducto() {
    this.isDialogOpen = true;
    let data: PdvSearchProductoData = {
      cantidad: 1,
      mostrarOpciones: false,
      mostrarStock: true,
      conservarUltimaBusqueda: true,
    };
    this.matDialog
      .open(PdvSearchProductoDialogComponent, {
        data: data,
        height: "80%",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: PdvSearchProductoResponseData) => {
        this.isDialogOpen = false;
        if (res?.presentacion != null) {
          this.abrirCreateItem(res, null);
        }
      });
  }

  abrirCreateItem(res: PdvSearchProductoResponseData, item: DevolucionItem) {
    this.isDialogOpen = true;
    this.matDialog
      .open(CreateItemDialogComponent, {
        data: {
          item,
          producto: res?.producto,
          presentacion: res?.presentacion,
          tipo: this.selectedDevolucion.tipo,
          motivosAveria: this.motivosAveria,
        },
        width: "40%",
        disableClose: true,
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((dialogRes) => {
        this.isDialogOpen = false;
        if (dialogRes?.item != null) {
          this.onSaveItem(dialogRes.item);
        }
      });
  }

  onSaveItem(item: DevolucionItem) {
    let isNew = item?.id == null;
    let aux = new DevolucionItem();
    Object.assign(aux, item);
    aux.devolucion = this.selectedDevolucion;
    this.devolucionService
      .onSaveDevolucionItem(aux.toInput())
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          if (isNew) {
            this.dataSource.data = updateDataSourceInsertFirst(
              this.dataSource.data,
              res
            );
          } else {
            this.dataSource.data = updateDataSourceWithId(
              this.dataSource.data,
              res,
              res.id
            );
          }
        }
      });
  }

  onEditItem(item: DevolucionItem) {
    let res: PdvSearchProductoResponseData = {
      producto: item.producto,
      presentacion: item.presentacion,
    };
    this.abrirCreateItem(res, item);
  }

  onDeleteItem(item: DevolucionItem, index: number) {
    this.devolucionService
      .onDeleteDevolucionItem(item.id)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.dataSource.data = updateDataSource(
            this.dataSource.data,
            null,
            index
          );
        }
      });
  }

  onAvanzar(estado: DevolucionEstado) {
    this.dialogosService
      .confirm(
        "Atención!!",
        "¿Confirma avanzar la devolución al estado " + estado + "?"
      )
      .pipe(untilDestroyed(this))
      .subscribe((confirmado) => {
        if (confirmado) {
          this.ejecutarAvanzar(estado);
        }
      });
  }

  ejecutarAvanzar(estado: DevolucionEstado) {
    this.devolucionService
      .onAvanzarEstado(this.selectedDevolucion.id, estado)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          Object.assign(this.selectedDevolucion, res);
          this.canjeMode = false;
          this.acreditarMode = false;
          this.computeEstadoFlags();
        }
      });
  }

  onIniciarCanje() {
    this.canjeMode = true;
    this.acreditarMode = false;
  }

  onConfirmarCanje() {
    const items = this.dataSource.data ?? [];
    if (items.length == 0) {
      this.notificacionService.openWarn("No hay items para canjear");
      return;
    }
    this.cargandoService.openDialog(false, "Guardando canje...");
    let pendientes = items.length;
    let huboError = false;
    items.forEach((item) => {
      let aux = new DevolucionItem();
      Object.assign(aux, item);
      aux.devolucion = this.selectedDevolucion;
      this.devolucionService
        .onSaveDevolucionItem(aux.toInput())
        .pipe(untilDestroyed(this))
        .subscribe(
          () => {
            pendientes--;
            if (pendientes == 0 && !huboError) {
              this.cargandoService.closeDialog();
              this.ejecutarAvanzar(DevolucionEstado.CANJEADO);
            }
          },
          () => {
            huboError = true;
            this.cargandoService.closeDialog();
            this.notificacionService.openAlgoSalioMal(
              "Error al guardar el reingreso de un item"
            );
          }
        );
    });
  }

  onIniciarAcreditar() {
    this.acreditarMode = true;
    this.canjeMode = false;
  }

  onConfirmarAcreditar() {
    this.devolucionService
      .onAcreditar(
        this.selectedDevolucion.id,
        this.nroNotaCreditoControl.value != null
          ? ("" + this.nroNotaCreditoControl.value).toUpperCase()
          : null,
        this.montoAcreditadoControl.value
      )
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          Object.assign(this.selectedDevolucion, res);
          this.acreditarMode = false;
          this.computeEstadoFlags();
        }
      });
  }

  onCancelar() {
    this.dialogosService
      .confirm("Atención!!", "¿Confirma cancelar esta devolución?")
      .pipe(untilDestroyed(this))
      .subscribe((confirmado) => {
        if (confirmado) {
          this.devolucionService
            .onCancelar(
              this.selectedDevolucion.id,
              this.motivoControl.value != null
                ? ("" + this.motivoControl.value).toUpperCase()
                : null
            )
            .pipe(untilDestroyed(this))
            .subscribe((res) => {
              if (res != null) {
                Object.assign(this.selectedDevolucion, res);
                this.computeEstadoFlags();
              }
            });
        }
      });
  }

  onVolver() {
    this.tabService.addTab(
      new Tab(
        ListDevolucionComponent,
        "Lista de devoluciones",
        null,
        EditDevolucionComponent
      )
    );
  }
}
