import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormGroup, Validators, FormControl } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { DomSanitizer } from "@angular/platform-browser";
import { NgxImageCompressService } from "ngx-image-compress";
import { Codigo } from "../../codigo/codigo.model";
import { CrearCodigosDialogComponent } from "../../codigo/crear-codigos-dialog/crear-codigos-dialog.component";
import { AddFamiliaDialogComponent } from "../../familia/add-familia-dialog/add-familia-dialog.component";
import { Familia } from "../../familia/familia.model";
import { FamiliaService } from "../../familia/familia.service";
import { PrecioPorSucursal } from "../../precio-por-sucursal/precio-por-sucursal.model";
import { AddSubfamiliaDialogComponent } from "../../sub-familia/add-subfamilia-dialog/add-subfamilia-dialog.component";
import { Subfamilia } from "../../sub-familia/sub-familia.model";
import { SubFamiliaService } from "../../sub-familia/sub-familia.service";
import { TipoPrecio } from "../../tipo-precio/tipo-precio.model";
import { Producto } from "../producto.model";
import { ProductoService } from "../producto.service";
import { TipoConservacion } from "./producto-enums";
import { ProductoInput } from "../producto-input.model";
import { CodigoService } from "../../codigo/codigo.service";
import { CodigoInput } from "../../codigo/codigo-input.model";
import { PrecioPorSucursalInput } from "../../precio-por-sucursal/precio-por-sucursal-input.model";
import { PrecioPorSucursalService } from "../../precio-por-sucursal/precio-por-sucursal.service";
import { MainService } from "../../../../main.service";
import { CurrencyMask } from "../../../../commons/core/utils/numbersUtils";
import {
  NotificacionSnackbarService,
  NotificacionColor,
} from "../../../../notificacion-snackbar.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { CortarImagenDialogComponent } from "../../../../shared/cortar-imagen-dialog/cortar-imagen-dialog.component";
import { QrCodeComponent } from "../../../../shared/qr-code/qr-code.component";
import { MatStepper } from "@angular/material/stepper";
import { MatInput } from "@angular/material/input";
import { dialog } from "electron";
import { CargandoDialogComponent } from "../../../../shared/components/cargando-dialog/cargando-dialog.component";
import { TabService } from "../../../../layouts/tab/tab.service";
import { Tab } from "../../../../layouts/tab/tab.model";
import { ListCompraComponent } from "../../../operaciones/compra/list-compra/list-compra.component";
import { Clipboard } from "@angular/cdk/clipboard";

@Component({
  selector: "app-producto",
  templateUrl: "./producto.component.html",
  styleUrls: ["./producto.component.css"],
})
export class ProductoComponent implements OnInit {
  @Input() data;

  @ViewChild("stepper", { static: false }) stepper: MatStepper;
  @ViewChild("codigoInput", { static: false }) codigoInput: ElementRef;
  @ViewChild("nombreInput", { static: false }) nombreInput: ElementRef;
  @ViewChild("valorInput", { static: false }) valorInput: ElementRef;
  @ViewChild("codigoCantidad", { static: false })
  codigoCantidadInput: ElementRef;
  @ViewChild("tipoPrecioInput", { static: false }) tipoPrecioInput: ElementRef;

  isLinear = false;
  tipoProductoControl: FormGroup;
  categoriaControl: FormGroup;
  datosGeneralesControl: FormGroup;
  imagenesControl: FormGroup;
  codigosControl: FormGroup;
  preciosControl: FormGroup;
  selectedProducto: Producto;
  // familia
  familiasList: Familia[] = [];
  subfamiliasList: Subfamilia[] = [];
  selectedFamilia: Familia = null;
  selectedSubfamilia: Subfamilia = null;
  filteredFamilias = [];

  //datos generales
  selectedTipoConservacion: TipoConservacion;
  //datos generales

  //codigo
  isEditingCodigo = false;
  codigoDataSource = new MatTableDataSource<Codigo>(null);
  codigosList: Codigo[] = [];
  selectedCodigo: Codigo;
  isPrincipal = false;
  isCaja = false;
  isCodigoEnUso = false;
  tipoPrecioList: TipoPrecio[] = [];
  filteredTipoPrecioList: TipoPrecio[] = [];
  selectedTipoPrecio: TipoPrecio;
  selectedCodigoPrecio: Codigo;
  currency = new CurrencyMask();
  isEditingPrecio = false;
  precioList: PrecioPorSucursal[];
  precioDataSource = new MatTableDataSource<PrecioPorSucursal>(null);
  codigoImagenQr = "";
  isCropping = false;
  isCodigoPrincipal = false;
  isCodigoCaja = false;
  precio1 = null;
  precio2 = null;
  precio3 = null;
  tipoConservacionList: string[] = [];

  //estados de pantalla precio
  precioFormEnable = true;
  btnAdicionarPrecio = true;
  btnCancelarPrecio = true;
  activarPrecioTable = true;
  selectedPrecio: PrecioPorSucursal = null;
  btnEditarPrecio = false;
  btnGuardarPrecio = false;
  btnNuevoPrecio = false;
  imagenPrincipal = null;

  constructor(
    public mainService: MainService,
    private notifiActionBar: NotificacionSnackbarService,
    private dialogo: DialogosService,
    private matDialog: MatDialog,
    private sanitizer: DomSanitizer,
    private imageCompress: NgxImageCompressService,
    private familiaService: FamiliaService,
    private subfamiliaService: SubFamiliaService,
    private productoService: ProductoService,
    private codigoService: CodigoService,
    private precioPorSucursalService: PrecioPorSucursalService,
    private tabService: TabService,
    private copyToClipService: Clipboard
  ) {
    //inicializar las subscripciones
    

    // this.codigoService.dataOBs.subscribe((res) => {
    //   this.codigosList = res;
    //   this.codigoDataSource.data = this.codigosList;
    // });

    // precioPorSucursalService.datosObs.subscribe((res) => {
    //   this.precioList = res;
    //   this.refreshPrecioTable();
    // });
  }

  ngOnInit() {
    let ref = this.matDialog.open(CargandoDialogComponent);

    this.familiaService.familiaBS.subscribe((res) => {
      this.familiasList = res;
      if (this.selectedFamilia != null) {
        this.selectedFamilia = this.familiasList.find(
          (f) => f.id == this.selectedFamilia.id
        );
        this.subfamiliasList = this.selectedFamilia.subfamilias;
      }
    });

    // inicializar arrays
    this.codigosList = [];
    this.precioList = [];

    this.createForm();
    this.cargarTipoPrecios();
    this.refreshCodigoTable();
    this.cargarTipoConservacion();

    setTimeout(() => {
      if (this.data?.tabData?.data.id != null) {
        this.cargarProducto(this.data.tabData.data.id, ref);
      }
    }, 100);
  }

  cargarProducto(id, ref) {
    this.productoService.getProducto(id).subscribe((res) => {
      console.log(res)
      this.selectedProducto = res;
      this.selectedSubfamilia = this.selectedProducto?.subfamilia;
      this.selectedFamilia = this.selectedSubfamilia?.familia;
      setTimeout(() => {
        this.seleccionarFamilia(this.selectedFamilia);
        setTimeout(() => {
          this.seleccionarSubfamilia(this.selectedSubfamilia);
        }, 500);
      }, 500);
      this.datosGeneralesControl.controls.descripcion.setValue(
        this.selectedProducto.descripcion
      );
      this.datosGeneralesControl.controls.descripcionFactura.setValue(
        this.selectedProducto.descripcionFactura
      );
      this.datosGeneralesControl.controls.iva.setValue(
        `${this.selectedProducto.iva}`
      );
      this.datosGeneralesControl.controls.unidadPorCaja.setValue(
        this.selectedProducto.unidadPorCaja
      );
      this.datosGeneralesControl.controls.poseeEmbalajePrincipal.setValue(
        this.selectedProducto.unidadPorCaja > 0
      );
      this.datosGeneralesControl.controls.unidadPorCajaSecundaria.setValue(
        this.selectedProducto.unidadPorCajaSecundaria
      );
      this.datosGeneralesControl.controls.poseeEmbalajeSecundaria.setValue(
        this.selectedProducto.unidadPorCajaSecundaria > 0
      );
      this.datosGeneralesControl.controls.balanza.setValue(
        this.selectedProducto.balanza
      );
      this.datosGeneralesControl.controls.garantia.setValue(
        this.selectedProducto.garantia
      );
      this.datosGeneralesControl.controls.tiempoGarantia.setValue(
        this.selectedProducto.tiempoGarantia
      );
      this.datosGeneralesControl.controls.vencimiento.setValue(
        this.selectedProducto.vencimiento
      );
      this.datosGeneralesControl.controls.ingrediente.setValue(
        this.selectedProducto.ingrediente
      );
      this.datosGeneralesControl.controls.stock.setValue(
        this.selectedProducto.stock
      );
      this.datosGeneralesControl.controls.cambiable.setValue(
        this.selectedProducto.cambiable
      );
      this.datosGeneralesControl.controls.tipoConservacion.setValue(
        this.selectedProducto.tipoConservacion
      );
      this.datosGeneralesControl.controls.diasVencimiento.setValue(
        this.selectedProducto.diasVencimiento
      );
      this.codigoService.onGetCodigosPorProductoId(res.id).subscribe((res) => {
        this.codigosList = res.data.data;
        this.codigoDataSource.data = this.codigosList;
      });
      this.precioPorSucursalService
        .onGetPorProductoId(res.id)
        .subscribe((res) => {
          this.precioList = res.data.data;
          this.precioDataSource.data = this.precioList;
        });
      this.loadImagenPrincipal(res?.imagenPrincipal);
      ref.close();
    });
  }

  cargarDatosPrueba() {
    this.datosGeneralesControl.controls.descripcion.setValue(
      "JABON LIQUIDO CONFORT 500 ML"
    );
    this.datosGeneralesControl.controls.balanza.setValue(false);
    this.datosGeneralesControl.controls.poseeEmbalajePrincipal.setValue(true);
    this.datosGeneralesControl.controls.poseeEmbalajeSecundaria.setValue(false);
    this.datosGeneralesControl.controls.unidadPorCaja.setValue(10);
    this.datosGeneralesControl.controls.stock.setValue(true);
    this.datosGeneralesControl.controls.garantia.setValue(false);
    this.datosGeneralesControl.controls.vencimiento.setValue(false);
    this.datosGeneralesControl.controls.iva.setValue("10");
    setTimeout(() => {
      this.seleccionarFamilia(this.familiasList[0]);
      setTimeout(() => {
        this.seleccionarSubfamilia(this.familiasList[0]);
        setTimeout(() => {
          this.stepper.next();
          setTimeout(() => {
            this.codigosControl.controls.codigo.setValue("555666777");
            this.crearCodigosAlternativos();
            this.stepper.next();
            setTimeout(() => {
              this.selectedTipoPrecio = this.tipoPrecioList[0];
              this.preciosControl.controls.tipoPrecio.setValue(
                this.selectedTipoPrecio
              );
              this.displayTipoPrecio(this.selectedTipoPrecio);
              this.preciosControl.controls.precio.setValue(4000);
              this.selectedCodigoPrecio = this.codigosList[0];
              this.onAddPrecio("add");
              this.selectedTipoPrecio = this.tipoPrecioList[1];
              this.preciosControl.controls.tipoPrecio.setValue(
                this.selectedTipoPrecio
              );
              this.displayTipoPrecio(this.selectedTipoPrecio);
              this.preciosControl.controls.precio.setValue(40000);
              this.selectedCodigoPrecio = this.codigosList.find(
                (c) => c.caja == true
              );
              this.onAddPrecio("add");
              setTimeout(() => {
                this.generarPrecios();
                this.stepper.next();
              }, 500);
            }, 500);
          }, 500);
        }, 500);
      }, 500);
    }, 300);
  }

  createForm() {
    this.tipoProductoControl = new FormGroup({});
    this.categoriaControl = new FormGroup({});
    this.datosGeneralesControl = new FormGroup({
      descripcion: new FormControl(null, Validators.required),
      descripcionFactura: new FormControl(null),
      iva: new FormControl(null),
      poseeEmbalajePrincipal: new FormControl(null),
      poseeEmbalajeSecundaria: new FormControl(null),
      unidadPorCaja: new FormControl(null, [
        Validators.min(1),
        Validators.max(100),
      ]),
      unidadPorCajaSecundaria: new FormControl(null, [
        Validators.min(2),
        Validators.max(1000),
      ]),
      balanza: new FormControl(null),
      garantia: new FormControl(null),
      tiempoGarantia: new FormControl(null, [
        Validators.min(1),
        Validators.max(60),
      ]), //en dias
      ingrediente: new FormControl(null),
      combo: new FormControl(null),
      stock: new FormControl(null),
      cambiable: new FormControl(null),
      esAlcoholico: new FormControl(null),
      promocion: new FormControl(null),
      vencimiento: new FormControl(null),
      diasVencimiento: new FormControl(null),
      subfamilia: new FormControl(null),
      tipoConservacion: new FormControl(null),
      ingredientesList: new FormControl(null),
      existenciaTotal: new FormControl(null),
      observacion: new FormControl(null),
      sucursales: new FormControl(null),
      productoUltimasCompras: new FormControl(null),
      precio1: new FormControl(null),
      precio2: new FormControl(null),
      precio3: new FormControl(null),
    });
    this.imagenesControl = new FormGroup({
      imagenPrincipal: new FormControl(null),
    });
    this.codigosControl = new FormGroup({
      codigo: new FormControl(null),
      codigoDescripcion: new FormControl(null),
      tipoCodigo: new FormControl(null),
      codigoCantidad: new FormControl(null),
      codigoActivo: new FormControl(null),
      tipoPrecio: new FormControl(null),
      codigoPrecio: new FormControl(null, Validators.required),
    });
    this.preciosControl = new FormGroup({
      codigoPrecio: new FormControl(null),
      precio: new FormControl(null, [Validators.min(1)]),
      sucursalPrecio: new FormControl(null),
    });

    this.preciosControl.controls.codigoPrecio.disable();

    //inicializacion
    this.datosGeneralesControl.controls.iva.setValue("10");
    this.codigosControl.controls.tipoCodigo.setValue("principal");
    this.codigosControl.controls.codigoCantidad.setValue("1");
    this.codigosControl.controls.codigoActivo.setValue(true);

    //listeners para los forms
    this.codigosControl.controls.tipoCodigo.valueChanges.subscribe((res) => {
      if (res == "caja") {
        this.codigosControl.controls.codigoCantidad.setValue(
          this.datosGeneralesControl.controls.unidadPorCaja.value
        );
      }
    });

    this.datosGeneralesControl.controls.poseeEmbalajeSecundaria.valueChanges.subscribe(
      (res) => {
        if (!res) {
          this.datosGeneralesControl.controls.unidadPorCajaSecundaria.setValue(
            null
          );
        }
      }
    );

    this.datosGeneralesControl.controls.poseeEmbalajePrincipal.valueChanges.subscribe(
      (res) => {
        if (!res) {
          this.datosGeneralesControl.controls.unidadPorCaja.setValue(null);
          this.datosGeneralesControl.controls.poseeEmbalajeSecundaria.setValue(
            false
          );
        }
      }
    );
  }

  // funciones datos generales
  onDescripcionFacturaOut() {
    if (
      this.datosGeneralesControl.controls.descripcionFactura.value == null ||
      this.datosGeneralesControl.controls.descripcionFactura.value == ""
    ) {
      this.datosGeneralesControl.controls.descripcionFactura.setValue(
        this.datosGeneralesControl.controls.descripcion.value
      );
    }
  }

  onProductoSave() {
    if (this.selectedProducto != null && !this.datosGeneralesControl.dirty) {
      //nada
    } else {
      const {
        descripcion,
        descripcionFactura,
        iva,
        unidadPorCaja,
        unidadPorCajaSecundaria,
        balanza,
        stock,
        garantia,
        tiempoGarantia,
        cambiable,
        ingredientes,
        combo,
        promocion,
        vencimiento,
        diasVencimiento,
        tipoConservacion,
        subfamiliaId,
      } = this.datosGeneralesControl.value;
      let productoInput = new ProductoInput();
      productoInput = {
        descripcion,
        descripcionFactura,
        iva,
        unidadPorCaja,
        unidadPorCajaSecundaria,
        balanza,
        stock,
        garantia,
        tiempoGarantia,
        cambiable,
        ingredientes,
        combo,
        promocion,
        vencimiento,
        diasVencimiento,
        tipoConservacion,
        subfamiliaId,
      };
      if (this.selectedProducto != null) {
        productoInput.id = this.selectedProducto.id;
        this.codigoService.onGetCodigosPorProductoId(productoInput.id);
      }
      productoInput.descripcion = productoInput.descripcion.toUpperCase();
      productoInput.descripcionFactura =
        productoInput.descripcionFactura.toUpperCase();
      productoInput.subfamiliaId = this.selectedSubfamilia.id;
      this.productoService.onSaveProducto(productoInput).subscribe((res) => {
        if (res != null) {
          this.selectedProducto = res;
          setTimeout(() => {
            this.codigoInput.nativeElement.focus();
          }, 100);
        } else {
          this.stepper.previous();
          setTimeout(() => {
            this.nombreInput.nativeElement.focus();
          }, 100);
        }
      });
    }
  }
  // funciones datos generales

  //funciones de codigos
  onCodigoCantidadOut() {
    if (+this.codigosControl.controls.codigoCantidad.value > 100) {
      this.dialogo
        .confirm("Atencion!!", "Estás seguro que la cantidad es mayor a 100?")
        .subscribe((res) => {
          if (!res) {
            this.codigoCantidadInput.nativeElement.select();
          }
        });
    }
    if (
      this.datosGeneralesControl.controls.unidadPorCaja.value == null ||
      this.datosGeneralesControl.controls.unidadPorCaja.value == ""
    ) {
      this.datosGeneralesControl.controls.unidadPorCaja.setValue(
        this.codigosControl.controls.codigoCantidad.value
      );
    }
  }

  onCodigoSave() {}

  //funciones de codigos

  seleccionarFamilia(tipo) {
    this.selectedFamilia = this.familiasList?.find((f) => f.id == tipo.id);
    this.subfamiliasList = this.selectedFamilia?.subfamilias;
    setTimeout(() => {
      // this.filtrarFamilias();
      this.stepper.next();
    }, 500);
  }

  seleccionarSubfamilia(tipo) {
    this.selectedSubfamilia = tipo;
    if (this.selectedFamilia?.nombre == "BEBIDAS") {
      this.datosGeneralesControl.controls.esAlcoholico.setValue(true);
      this.datosGeneralesControl.controls.poseeEmbalajePrincipal.setValue(true);
      this.datosGeneralesControl.controls.stock.setValue(true);
      this.datosGeneralesControl.controls.vencimiento.setValue(true);
      this.datosGeneralesControl.controls.tipoConservacion.setValue(
        TipoConservacion.ENFRIABLE
      );
    }

    setTimeout(() => {
      this.nombreInput.nativeElement.focus();
    }, 100);

    setTimeout(() => {
      this.stepper.next();
    }, 500);

  }

  filtrarFamilias() {
    this.filteredFamilias = this.familiasList?.filter(
      (c) => c.id == this.selectedFamilia?.id
    );
  }

  cargarTipoConservacion() {
    for (let key in TipoConservacion) {
      let tipo: string = TipoConservacion[key];
      this.tipoConservacionList.push(tipo);
    }
  }

  buscarCodigo() {
    this.matDialog
      .open(CrearCodigosDialogComponent, {
        data: {
          codigos: this.codigosList.filter((c) => {
            let flag = true;
            this.precioList?.forEach((p) => {
              if (p.codigo.id == c.id) {
                flag = false;
              }
            });
            return flag;
          }),
        },
        width: "800px",
        height: "500px",
      })
      .afterClosed()
      .subscribe((res) => {
        if (res != null) {
          this.selectedCodigoPrecio = res;
          this.preciosControl?.controls?.codigoPrecio.setValue(
            `${res.codigo} - ${res.principal ? "Principal" : res.caja}`
          );
        }
      });
  }

  onAddCodigo(accion) {
    let codigo: Codigo = new Codigo();
    let index = -1;
    let isTipoPrecioInUse = false;
    codigo.id = this.selectedCodigo?.id;
    codigo.codigo = this.codigosControl.controls.codigo.value;
    codigo.principal =
      this.codigosControl.controls.tipoCodigo.value == "principal";
    codigo.caja = this.codigosControl.controls.tipoCodigo.value == "caja";
    codigo.variacion =
      this.codigosControl.controls.tipoCodigo.value == "alternativo";
    codigo.cantidad = +this.codigosControl.controls.codigoCantidad.value;
    codigo.activo = this.codigosControl.controls.codigoActivo.value;
    codigo.tipoPrecio =
      this.tipoPrecioList[this.codigosControl.controls.tipoPrecio.value];
    codigo.precio = this.codigosControl.controls.codigoPrecio.value;
    if (this.codigosList?.length > 0) {
      this.isPrincipal =
        this.codigosList.find(
          (c) => c?.principal == true && c?.id != codigo?.id
        ) != null;
      this.isCaja =
        this.codigosList.find((c) => c?.caja == true && c?.id != codigo?.id) !=
        null;
      this.isCodigoEnUso =
        this.codigosList.find((c) => {
          if (
            c?.codigo == codigo.codigo &&
            c?.tipoPrecio?.id == codigo?.tipoPrecio?.id &&
            codigo?.id == null
          ) {
            return c;
          } else {
            return null;
          }
        }) != null;
      isTipoPrecioInUse =
        this.codigosList.find((c) => {
          if (
            c?.tipoPrecio?.id == codigo.tipoPrecio?.id &&
            c?.id != codigo?.id
          ) {
            return c;
          }
        }) != null;
    }
    if (codigo.precio == null) {
      this.notifiActionBar.notification$.next({
        color: NotificacionColor.warn,
        texto: "El precio es un campo obligatorio!!",
        duracion: 2,
      });
    } else if (
      codigo.principal &&
      (codigo.codigo == null || codigo.codigo == "")
    ) {
      this.notifiActionBar.notification$.next({
        color: NotificacionColor.warn,
        texto: "El código principal no puede estar vacío!!",
        duracion: 2,
      });
    } else if (this.isPrincipal && codigo.principal) {
      this.notifiActionBar.notification$.next({
        color: NotificacionColor.warn,
        texto: "Ya existe un código principal",
        duracion: 2,
      });
    } else if (this.isCaja && codigo.caja) {
      this.notifiActionBar.notification$.next({
        color: NotificacionColor.warn,
        texto: "Ya existe un código de caja",
        duracion: 2,
      });
    } else if (this.isCodigoEnUso) {
      this.notifiActionBar.notification$.next({
        color: NotificacionColor.warn,
        texto: "Este código ya esta en uso",
        duracion: 2,
      });
    } else if (isTipoPrecioInUse && codigo.tipoPrecio != null) {
      this.notifiActionBar.notification$.next({
        color: NotificacionColor.warn,
        texto: "Tipo precio ya está en uso",
        duracion: 2,
      });
    } else if (isTipoPrecioInUse && codigo.tipoPrecio != null) {
      this.notifiActionBar.notification$.next({
        color: NotificacionColor.warn,
        texto: "Tipo precio ya está en uso",
        duracion: 2,
      });
    } else {
      let ref = this.matDialog.open(CargandoDialogComponent);
      let codigoInput = new CodigoInput();
      codigoInput.id = this.selectedCodigo?.id;
      codigoInput.principal = codigo.principal;
      codigoInput.activo = codigo.activo;
      codigoInput.caja = codigo.caja;
      codigoInput.cantidad = codigo.cantidad;
      codigoInput.codigo = codigo.codigo;
      codigoInput.descripcion = codigo?.descripcion?.toUpperCase();
      console.log(
        "agregando producto id al codigo: ",
        this.selectedProducto?.id
      );
      codigoInput.productoId = this.selectedProducto?.id;
      codigoInput.tipoPrecioId = codigo?.tipoPrecio?.id;
      codigoInput.variacion = codigo.variacion;
      switch (accion) {
        case "add":
          this.codigoService.onSaveCodigo(codigoInput).subscribe((res) => {
            this.codigosList.push(res);
            this.codigoDataSource.data = this.codigosList;
            this.selectedCodigo = res;
            ref.close();
          });
          break;
        case "save":
          this.codigoService.onSaveCodigo(codigoInput).subscribe((res) => {
            this.codigosList[
              this.codigosList.findIndex((f) => f?.id == res?.id)
            ] = res;
            this.codigoDataSource.data = this.codigosList;
            this.isEditingCodigo = false;
            ref.close();
          });

          break;

        default:
          break;
      }
      this.resetCodigoControl();
      this.refreshCodigoTable();
      this.codigosControl.disable();
    }
  }

  crearCodigosAlternativos() {
    let cantPorCaja = this.datosGeneralesControl.controls.unidadPorCaja.value;
    let principal = this.codigosList.find((c) => c?.principal === true)?.codigo;
    let caja = this.codigosList.find((c) => c?.caja === true)?.codigo;
    if (this.codigosControl.controls.codigo.value != null) {
      principal = this.codigosControl.controls.codigo.value;
      this.codigosControl.controls.codigo.setValue(principal);
      this.codigosControl.controls.tipoCodigo.setValue("principal");
      this.codigosControl.controls.codigoActivo.setValue(true);
      this.onAddCodigo("add");
      if (caja == null && cantPorCaja > 1) {
        this.codigosControl.controls.codigo.setValue(`CAJA${principal}`);
        this.codigosControl.controls.tipoCodigo.setValue("caja");
        this.codigosControl.controls.codigoActivo.setValue(true);
        this.codigosControl.controls.codigoCantidad.setValue(`${cantPorCaja}`);
        this.onAddCodigo("add");
      } else {
        this.notifiActionBar.notification$.next({
          texto: "Se necesita código de caja y la cantidad por caja.",
          duracion: 4,
          color: NotificacionColor.warn,
        });
      }
    }

    if (cantPorCaja != null && cantPorCaja > 1 && principal != null) {
      let sufix = principal;
      for (let index = 1; index < cantPorCaja; index++) {
        this.codigosControl.controls.codigo.setValue(`${index}${sufix}`);
        this.codigosControl.controls.tipoCodigo.setValue("alternativo");
        this.codigosControl.controls.codigoActivo.setValue(true);
        this.codigosControl.controls.codigoCantidad.setValue(`${index}`);
        this.onAddCodigo("add");
        this.resetCodigoControl();
      }
      this.refreshCodigoTable();
    } else {
      this.notifiActionBar.notification$.next({
        texto: "Se necesita código de caja y la cantidad por caja.",
        duracion: 4,
        color: NotificacionColor.warn,
      });
    }
  }

  crearCodigos() {}

  onSelectCodigoRow(row) {
    if (!this.isEditingCodigo) {
      this.codigosControl.disable();
      this.selectedCodigo = row;
      this.selectedTipoPrecio = this.selectedCodigo?.tipoPrecio;
      console.log(this.selectedTipoPrecio);
      this.codigosControl.controls.tipoPrecio.setValue(
        this.tipoPrecioList.findIndex(
          (tp) => tp?.id == this.selectedTipoPrecio?.id
        )
      );
      console.log(this.codigosControl.controls.tipoPrecio.value);
      this.codigosControl.controls.codigo.setValue(row.codigo);
      this.codigosControl.controls.codigoActivo.setValue(row.activo);
      this.codigosControl.controls.tipoCodigo.setValue(
        row?.principal == true
          ? "principal"
          : row?.caja == true
          ? "caja"
          : "alternativo"
      );
      this.codigosControl.controls.codigoCantidad.setValue(`${row.cantidad}`);
    }
  }

  editCodigoRow() {
    this.isEditingCodigo = true;
    this.codigosControl.enable();
  }

  resetCodigoControl() {
    this.codigosControl.controls.codigo.setValue("");
    this.codigosControl.controls.tipoCodigo.setValue("principal");
    this.codigosControl.controls.codigoCantidad.setValue("1");
    this.codigosControl.controls.codigoActivo.setValue(true);
    this.codigosControl.controls.tipoPrecio.setValue(null);
    this.refreshCodigoTable();
  }

  onCancelarCodigo() {
    this.isEditingCodigo = false;
    this.selectedCodigo = null;
    this.resetCodigoControl();
    this.codigosControl.enable();
    this.selectedTipoPrecio = null;
  }

  refreshCodigoTable() {
    this.codigoDataSource.data = this.codigosList;
    this.isCodigoPrincipal =
      this.codigosList?.find((c) => c.principal == true) != null;
    this.isCodigoCaja = this.codigosList?.find((c) => c.caja == true) != null;
  }

  onDeleteCodigo(item: Codigo) {
    let ref = this.matDialog.open(CargandoDialogComponent);
    let index = this.codigosList.findIndex((c) => c?.id == item.id);
    if (index != -1) {
      this.dialogo
        .confirm(
          "Desea eliminar este código?",
          `${item.codigo.toUpperCase()}`,
          null,
          null
        )
        .subscribe((res) => {
          if (res) {
            this.codigoService.onDeleteCodigo(item.id).subscribe((res) => {
              if (res) {
                this.codigosList.splice(index, 1);
                this.onCancelarCodigo();
                this.refreshCodigoTable();
                ref.close();
              }
            });
          }
        });
    } else {
      ref.close();
    }
  }

  onAddPrecio(accion) {
    let ref = this.matDialog.open(CargandoDialogComponent);
    let precio = new PrecioPorSucursal();
    let precioInput = new PrecioPorSucursalInput();
    precioInput.id = this.selectedPrecio?.id;
    precioInput.codigoId = this.selectedCodigoPrecio.id;
    if (this.selectedCodigoPrecio != null) {
      precioInput.precio =
        this.preciosControl.controls.precio.value /
        this.selectedCodigoPrecio.cantidad;
    }
    precioInput.sucursalId = this.mainService.sucursalActual.id;
    this.selectedPrecio = precio;
    let isPrecioUsed =
      this.precioList?.find((p) => {
        if (p.codigo.tipoPrecio == undefined) return false;
        return p.codigo.tipoPrecio.id === this.selectedTipoPrecio?.id;
      }) != null;
    let isCodigoUsed =
      this.precioList?.find((p) => p.codigo?.id == this.selectedCodigo?.id) !=
      null;
    if (isPrecioUsed) {
      this.notifiActionBar.notification$.next({
        texto: "Tipo de precio ya esta en uso",
        color: NotificacionColor.warn,
        duracion: 1,
      });
    }
    if (isCodigoUsed) {
      this.notifiActionBar.notification$.next({
        texto: "Código ya esta en uso",
        color: NotificacionColor.warn,
        duracion: 1,
      });
    }
    if (!isPrecioUsed && !isCodigoUsed) {
      switch (accion) {
        case "add": //adicionar
          this.precioPorSucursalService.onSave(precioInput).subscribe((res) => {
            // let codigoInput = new CodigoInput();
            // codigoInput.id = res.codigo.id;
            // codigoInput.tipoPrecioId = this.selectedTipoPrecio?.id;
            // this.codigoService.onSaveCodigo(codigoInput).subscribe((res2) => {
            //   res.codigo = res2;
            this.precioList.push(res);
            this.setPrecioEstado("save", res);
            this.refreshPrecioTable();
            ref.close();
            // });
          });
          break;
        case "save": //guardar/editar
          this.precioPorSucursalService;
          this.precioPorSucursalService.onSave(precioInput).subscribe((res) => {
            this.precioList[this.precioList.findIndex((f) => f.id == res.id)] =
              res;
            this.setPrecioEstado("editar", res);
            this.refreshPrecioTable();
            ref.close();
          });
          break;

        default:
          break;
      }
      this.refreshPrecioTable();
    }
  }

  editPrecioRow() {
    this.setPrecioEstado("editar");
  }

  resetPrecioControl() {
    this.preciosControl.reset();
  }

  onCancelarPrecio() {
    this.setPrecioEstado("cancelar");
  }

  refreshPrecioTable() {
    this.precioDataSource.data = this.precioList;
    this.precio1 = this.precioList?.find(
      (p) => p?.codigo?.tipoPrecio?.descripcion === "PRECIO 1"
    );
    this.precio2 = this.precioList?.find(
      (p) => p?.codigo?.tipoPrecio?.descripcion === "PRECIO 2"
    );
    this.precio3 = this.precioList?.find(
      (p) => p?.codigo?.tipoPrecio?.descripcion === "PRECIO 3"
    );
  }

  onDeletePrecio(item: PrecioPorSucursal) {
    let ref = this.matDialog.open(CargandoDialogComponent);
    let index = this.precioList.findIndex((c) => c?.id == item.id);
    if (index != -1) {
      this.dialogo
        .confirm("Desea eliminar este precio?", null, null, [
          `Precio: ${item.precio}`,
          `Tipo: ${
            item.codigo?.tipoPrecio
              ? item.codigo?.tipoPrecio?.descripcion
              : "No asignado"
          }`,
          `Código; ${item.codigo.codigo.toUpperCase()}`,
        ])
        .subscribe((res) => {
          if (res) {
            this.precioPorSucursalService.onDelete(item.id).subscribe((res) => {
              if (res) {
                this.precioList.splice(index, 1);
                this.onCancelarPrecio();
                this.refreshPrecioTable();
                ref.close();
              }
            });
          }
        });
    } else {
      ref.close();
    }
  }

  generarPrecios() {
    this.onCancelarPrecio();
    let isPrincipal = this.precioList.find((e) => e.codigo.principal === true);
    let isCaja = this.precioList.find((e) => e.codigo.caja === true);
    if (isPrincipal != null && isCaja != null && isCaja.codigo.cantidad > 1) {
      let precio = isPrincipal.precio;
      for (let index = 1; index < isCaja.codigo.cantidad; index++) {
        this.preciosControl.controls.precio.setValue(index * precio);
        this.selectedCodigoPrecio = this.codigosList.find(
          (c) => c.codigo == `${index}${isPrincipal.codigo.codigo}`
        );
        if (this.selectedCodigoPrecio != null) {
          this.selectedTipoPrecio = null;
          this.onAddPrecio("add");
        }
      }
    } else {
      this.notifiActionBar.notification$.next({
        texto:
          "Para generar precios primero necesita cargar el precio princial y el precio de caja",
        color: NotificacionColor.warn,
        duracion: 3,
      });
    }
  }

  setPrecioEstado(estado, precio?: PrecioPorSucursal) {
    switch (estado) {
      case "nuevo":
        this.preciosControl.enable();
        this.btnAdicionarPrecio = true;
        this.btnCancelarPrecio = true;
        this.activarPrecioTable = true;
        this.selectedPrecio = null;
        this.btnEditarPrecio = false;
        this.btnGuardarPrecio = false;
        this.btnNuevoPrecio = false;
        this.selectedCodigoPrecio = null;
        break;
      case "save":
        this.preciosControl.disable();
        this.btnAdicionarPrecio = false;
        this.btnCancelarPrecio = false;
        this.activarPrecioTable = true;
        this.selectedPrecio = precio;
        this.selectedCodigoPrecio = precio.codigo;
        this.btnEditarPrecio = true;
        this.btnGuardarPrecio = false;
        this.btnNuevoPrecio = true;
        break;
      case "editar":
        this.preciosControl.enable();
        this.btnAdicionarPrecio = false;
        this.btnCancelarPrecio = true;
        this.activarPrecioTable = false;
        this.selectedPrecio = precio;
        this.btnEditarPrecio = false;
        this.btnGuardarPrecio = true;
        this.btnNuevoPrecio = false;
        this.selectedCodigo = precio?.codigo;
        break;
      case "cancelar":
        this.preciosControl.reset();
        this.preciosControl.enable();
        this.btnAdicionarPrecio = true;
        this.btnCancelarPrecio = true;
        this.activarPrecioTable = true;
        this.selectedPrecio = null;
        this.btnEditarPrecio = false;
        this.btnGuardarPrecio = false;
        this.btnNuevoPrecio = false;
        this.selectedCodigoPrecio = null;

        break;
      case "seleccionado":
        this.selectedPrecio = precio;
        this.selectedCodigoPrecio = precio.codigo;
        this.preciosControl.controls.precio.setValue(precio?.precio);
        this.preciosControl.disable();
        this.btnAdicionarPrecio = false;
        this.btnCancelarPrecio = false;
        this.activarPrecioTable = true;
        this.btnEditarPrecio = true;
        this.btnGuardarPrecio = false;
        this.btnNuevoPrecio = true;
        break;
      default:
        break;
    }
  }

  cargarTipoPrecios() {
    for (let index = 1; index < 4; index++) {
      let tipoPrecio = new TipoPrecio();
      tipoPrecio.id = index;
      tipoPrecio.activo = true;
      tipoPrecio.autorizacion = false;
      tipoPrecio.descripcion = `PRECIO ${index}`;
      this.tipoPrecioList.push(tipoPrecio);
    }
    this.filteredTipoPrecioList = this.tipoPrecioList;
  }

  displayTipoPrecio(tipo?: TipoPrecio) {
    this.selectedTipoPrecio = tipo;
    return tipo != null ? `${tipo.id} - ${tipo.descripcion}` : "";
  }

  onSelectPrecioRow(row: PrecioPorSucursal) {
    this.setPrecioEstado("seleccionado", row);
  }

  onPrecioFocusIn() {
    setTimeout(() => {
      this.valorInput.nativeElement.focus();
    }, 500);
  }

  onCargarImagen() {}

  onQrCode() {
    let nombre = this.datosGeneralesControl.controls.descripcion.value;
    this.codigoImagenQr = Date.now().toString();
    this.matDialog
      .open(QrCodeComponent, {
        data: {
          nombre,
          codigo: this.codigoImagenQr,
        },
      })
      .afterClosed()
      .subscribe((res) => {
        let objectUrl = URL.createObjectURL(res);
        this.imagenPrincipal = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        var reader = new FileReader();
        reader.readAsDataURL(res);
        reader.onloadend = () => {
          let base64data = reader.result;
          this.productoService.onImageSave(
            base64data.toString(),
            `/productos/${this.selectedProducto.id}.jpg`
          );
        };
      });
  }

  // familia

  addFamilia() {
    this.matDialog
      .open(AddFamiliaDialogComponent, {
        width: "500px",
      })
      .afterClosed()
      .subscribe((res) => {
        if (res != null) {
          setTimeout(() => {
            this.selectedFamilia = res;
            // this.seleccionarFamilia(res)
          }, 500);
        }
      });
  }

  addSubfamilia() {
    this.matDialog
      .open(AddSubfamiliaDialogComponent, {
        width: "500px",
        data: {
          familiaId: this.selectedFamilia.id,
        },
      })
      .afterClosed()
      .subscribe((res) => {
        if (res != null) {
          setTimeout(() => {
            this.selectedSubfamilia = res;
            // this.seleccionarSubfamilia(res)
          }, 500);
        }
      });
  }

  onFamiliaRightClick(item, event) {
    event.preventDefault();
    this.matDialog
      .open(AddFamiliaDialogComponent, {
        data: {
          familia: item,
        },
        width: "500px",
      })
      .afterClosed()
      .subscribe((res) => {
        if (res != null) {
        }
      });
  }

  //familia

  onFinalizar() {
    console.log(this.data);
    this.tabService.removeTab(this.data.id - 1);
    this.tabService.addTab(
      new Tab(ProductoComponent, "Nuevo Producto", null, ListCompraComponent)
    );
  }

  //carga de imagen
  img: any;

  onFileInput(e: any) {
    let file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.img = reader.result as string;
      this.matDialog
        .open(CortarImagenDialogComponent, {
          data: {
            imagen: e,
          },
          width: "50%",
          height: "50%",
          disableClose: false,
        })
        .afterClosed()
        .subscribe((res) => {
          if (res != null) this.imagenPrincipal = res;
          this.productoService.onImageSave(
            this.imagenPrincipal,
            `/productos/${this.selectedProducto.id}.jpg`
          );
        });
    };
    reader.readAsDataURL(file);
  }

  loadImagenPrincipal(imagen: string) {
    this.imagenPrincipal = imagen;
  }

  @HostListener("window:keyup", ["$event"])
  keyEvent(event: KeyboardEvent) {
    let key = event.key;
    let isNumber = (+key).toString() === key;

    switch (this.stepper.selectedIndex) {
      case 0:
        if (isNumber) {
          if (this.familiasList.length >= +key) {
            this.seleccionarFamilia(this.familiasList[+key - 1]);
          }
        } else {
          if (key == "Enter") {
            if (this.selectedFamilia != null) {
              this.stepper.next();
            }
          }
        }
        break;
      case 1:
        if (isNumber) {
          if (this.subfamiliasList.length >= +key) {
            this.seleccionarSubfamilia(this.subfamiliasList[+key - 1]);
          }
        } else {
          if (key == "Enter") {
            if (this.selectedSubfamilia != null) {
              this.stepper.next();
            }
          }
        }
        break;
      case 2:
        if (key == "Enter") {
          if (this.datosGeneralesControl.valid) {
            this.onProductoSave();
            this.stepper.next();
          }
        }
        break;
      case 3:
        if (key == "Enter") {
          if (this.codigosList?.length > 0) {
            this.stepper.next();
          }
        }
        break;
      case 3:
        if (key == "Enter") {
          if (this.codigosList?.length > 0) {
            this.stepper.next();
          }
        }
        break;
      case 4:
        if (key == "Enter") {
          if (this.precioList?.length > 0) {
            this.stepper.next();
          }
        }
        break;
      case 5:
        if (key == "Enter") {
          this.onFinalizar();
        }
        break;

      default:
        break;
    }
  }

  onValorInputEnterPress() {
    if (this.selectedCodigoPrecio != null) {
      this.onAddPrecio("add");
    } else {
      this.buscarCodigo();
    }
  }

  copyToClip(text) {
    this.copyToClipService.copy(text);
    this.notifiActionBar.notification$.next({
      texto: "Copiado",
      color: NotificacionColor.success,
      duracion: 1,
    });
  }
}
