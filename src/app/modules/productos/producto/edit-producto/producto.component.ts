import {
  animate,
  state,
  style,
  transition,
  trigger
} from "@angular/animations";
import { Clipboard } from "@angular/cdk/clipboard";
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewChildren
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from "@angular/material/dialog";
import { MatStepper } from "@angular/material/stepper";
import { MatTable, MatTableDataSource } from "@angular/material/table";
import { DomSanitizer } from "@angular/platform-browser";
import { NgxImageCompressService } from "ngx-image-compress";
import { Subscription } from "rxjs";
import { CurrencyMask, updateDataSource } from "../../../../commons/core/utils/numbersUtils";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabService } from "../../../../layouts/tab/tab.service";
import { MainService } from "../../../../main.service";
import {
  NotificacionColor, NotificacionSnackbarService
} from "../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { CortarImagenDialogComponent } from "../../../../shared/cortar-imagen-dialog/cortar-imagen-dialog.component";
import {
  VizualizarImagenData,
  VizualizarImagenDialogComponent
} from "../../../../shared/images/vizualizar-imagen-dialog/vizualizar-imagen-dialog.component";
import { QrCodeComponent } from "../../../../shared/qr-code/qr-code.component";
import { ListCompraComponent } from "../../../operaciones/compra/list-compra/list-compra.component";
import {
  AdicionarCodigoData,
  AdicionarCodigoDialogComponent
} from "../../codigo/adicionar-codigo-dialog/adicionar-codigo-dialog.component";
import { Codigo } from "../../codigo/codigo.model";
import { CodigoService } from "../../codigo/codigo.service";
import { SearchEnvaseDialogComponent } from "../../envase/search-envase-dialog/search-envase-dialog.component";
import { AddFamiliaDialogComponent } from "../../familia/add-familia-dialog/add-familia-dialog.component";
import { Familia } from "../../familia/familia.model";
import { FamiliaService } from "../../familia/familia.service";
import {
  AdicionarPrecioDialogComponent,
  AdicionarPrecioPorSucursalData
} from "../../precio-por-sucursal/adicionar-precio-dialog/adicionar-precio-dialog.component";
import { PrecioPorSucursal } from "../../precio-por-sucursal/precio-por-sucursal.model";
import { PrecioPorSucursalService } from "../../precio-por-sucursal/precio-por-sucursal.service";
import {
  AdicionarPresentacionComponent,
  AdicionarPresentacionData
} from "../../presentacion/adicionar-presentacion/adicionar-presentacion.component";
import { Presentacion } from "../../presentacion/presentacion.model";
import { PresentacionService } from "../../presentacion/presentacion.service";
import { AddSubfamiliaDialogComponent } from "../../sub-familia/add-subfamilia-dialog/add-subfamilia-dialog.component";
import { Subfamilia } from "../../sub-familia/sub-familia.model";
import { SubFamiliaService } from "../../sub-familia/sub-familia.service";
import { TipoPrecio } from "../../tipo-precio/tipo-precio.model";
import { ProductoInput } from "../producto-input.model";
import { Producto } from "../producto.model";
import { ProductoService } from "../producto.service";
import { TipoConservacion } from "./producto-enums";

export class ProductoDialogData {
  producto: Producto;
  isDialog = true;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-producto",
  templateUrl: "./producto.component.html",
  styleUrls: ["./producto.component.css"],
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
export class ProductoComponent implements OnInit, OnDestroy {
  @Input() data;
  
  @ViewChildren("fileInput") fileInputList: any;
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
  presentacionControl: FormGroup;
  selectedProducto: Producto;
  // familia
  familiasList: Familia[] = [];
  subfamiliasList: Subfamilia[] = [];
  selectedFamilia: Familia = null;
  selectedSubfamilia: Subfamilia = null;
  filteredFamilias = [];

  //presentaciones
  presentacionesList: Presentacion[];
  presentacionesDataSource = new MatTableDataSource<Presentacion>(null);
  presentacionColumnsToDisplay = [
    "id",
    "descripcion",
    "cantidad",
    "codigoPrincipal",
    "precioPrincipal",
    "tipoPresentacion",
    "principal",
    "activo",
    "accion",
  ];
  codigoColumnsToDisplay = ["id", "codigo", "principal", "activo", "eliminar"];
  precioColumnsToDisplay = [
    "id",
    "tipoPrecio",
    "precio",
    "principal",
    "eliminar",
  ];

  precioCostoColumnsToDisplay = [
    "id",
    "costoMedio",
    "ultimoCostoCompra",
    "eliminar",
  ];
  selectedPresentacionCodigoDataSource = new MatTableDataSource(null);
  selectedPresentacionPrecioDataSource = new MatTableDataSource(null);
  //datos generales
  selectedTipoConservacion: TipoConservacion;
  //datos generales

  //codigo
  isEditingCodigo = false;
  codigoDataSource = new MatTableDataSource<Codigo>([]);
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
  precioDataSource = new MatTableDataSource<PrecioPorSucursal>([]);
  codigoImagenQr = "";
  isCropping = false;
  isCodigoPrincipal = false;
  isCodigoCaja = false;
  precio1 = null;
  precio2 = null;
  precio3 = null;
  tipoConservacionList: string[] = [];
  isDialog = false;

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
  selectedEnvase : Producto;
  isEnvaseSub: Subscription;

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: ProductoDialogData,
    private matDialogRef: MatDialogRef<ProductoComponent>,
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
    private copyToClipService: Clipboard,
    private presentacionService: PresentacionService,
    private changeDetectorRefs: ChangeDetectorRef,
    private cargandoDialog: CargandoDialogService
  ) {
    if (dialogData != null) {
      this.isDialog = dialogData.isDialog;
    }
  }

  ngOnInit() {
    this.familiaService.familiaBS.pipe(untilDestroyed(this)).subscribe((res) => {
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
    this.presentacionesList = [];

    this.createForm();
    this.cargarTipoConservacion();

    setTimeout(() => {
      if (this.data?.tabData?.data.id != null) {
        this.cargarProducto(this.data.tabData.data.id);
      } else if (this.dialogData?.producto != null) {
        this.cargarProducto(this.dialogData.producto.id);
      } else {
        this.cargandoDialog.closeDialog();
      }
    }, 200);

    this.isEnvaseSub = this.datosGeneralesControl.controls.isEnvase.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      if(res==true){
        this.datosGeneralesControl.controls.balanza.setValue(false)
        this.datosGeneralesControl.controls.garantia.setValue(false)
        this.datosGeneralesControl.controls.ingrediente.setValue(false)
        this.datosGeneralesControl.controls.esAlcoholico.setValue(false)
        this.datosGeneralesControl.controls.promocion.setValue(false)
        this.datosGeneralesControl.controls.vencimiento.setValue(false)                                 
      }
    })

  }

  cargarProducto(id) {
    this.productoService.getProducto(id).pipe(untilDestroyed(this)).subscribe((res) => {
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
        this.selectedProducto?.descripcion
      );
      this.datosGeneralesControl.controls.descripcionFactura.setValue(
        this.selectedProducto?.descripcionFactura
      );
      this.datosGeneralesControl.controls.iva.setValue(
        `${this.selectedProducto.iva}`
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
      if(this.selectedProducto?.envase!=null){
        this.onSelectEnvase(this.selectedProducto.envase)
      }
      
      // this.codigoService.onGettipoPresentacionsPorProductoId(res.id).subscribe((res) => {
      //   this.codigosList = res.data.data;
      //   this.codigoDataSource.data = this.codigosList;
      // });
      // this.precioPorSucursalService
      //   .onGetPorProductoId(res.id)
      //   .subscribe((res) => {
      //     this.precioList = res.data.data;
      //     this.precioDataSource.data = this.precioList;
      //   });


      this.getPresentacionPorProductoId(res.id);

      this.loadImagenPrincipal();
      this.cargandoDialog.closeDialog();
      setTimeout(() => {
        this.stepper.next();
      }, 1000);
    });
  }

  createForm() {
    this.tipoProductoControl = new FormGroup({});
    this.categoriaControl = new FormGroup({});
    this.datosGeneralesControl = new FormGroup({
      descripcion: new FormControl(null, Validators.required),
      descripcionFactura: new FormControl(null),
      iva: new FormControl("10"),
      balanza: new FormControl(null),
      garantia: new FormControl(null),
      tiempoGarantia: new FormControl(null, [
        Validators.min(1),
        Validators.max(60),
      ]), //en dias
      ingrediente: new FormControl(null),
      combo: new FormControl(null),
      stock: new FormControl(true),
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
      isEnvase: new FormControl(null),
      poseeEnvase: new FormControl(null),
      envase: new FormControl(null)
    });
    this.datosGeneralesControl.controls.envase.disable()

    this.imagenesControl = new FormGroup({
      imagenPrincipal: new FormControl(null),
    });
    this.codigosControl = new FormGroup({
      codigo: new FormControl(null, Validators.required),
      tipoCodigo: new FormControl(null),
      codigoActivo: new FormControl(null),
    });
    this.presentacionControl = new FormGroup({
      descripcion: new FormControl(null),
      buscarPresentacion: new FormControl(null),
      activo: new FormControl(null),
      principal: new FormControl(null),
      codigoPrecio: new FormControl(null),
      tipoPresentacion: new FormControl(null),
      cantidad: new FormControl(null),
    });
    this.preciosControl = new FormGroup({
      codigoPrecio: new FormControl(null),
      precio: new FormControl(null, [Validators.min(1)]),
      sucursalPrecio: new FormControl(null),
    });

    //inicializacion

    //listeners para los forms
  }
  // funciones datos generales
  onDescripcionFacturaOut() {
    if (
      this.datosGeneralesControl.controls.descripcionFactura.value == null ||
      this.datosGeneralesControl.controls.descripcionFactura.value == ""
    ) {
      this.datosGeneralesControl.controls.descripcionFactura.setValue(
        this.datosGeneralesControl.controls?.descripcion.value
      );
    }
  }

  onSelectEnvase(envase: Producto){
    this.datosGeneralesControl.controls.envase.setValue(
      envase.descripcion
    );
    this.selectedEnvase = envase
    this.datosGeneralesControl.controls.poseeEnvase.setValue(true);
  }

  onProductoSave() {
    if (this.selectedProducto != null && !this.datosGeneralesControl.dirty) {
      //nada
    } else {
      const {
        id,
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
        isEnvase,
        envaseId
      } = this.datosGeneralesControl.value;
      let productoInput = new ProductoInput();
      productoInput = {
        id,
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
        isEnvase,
        envaseId
      };
      if (this.selectedProducto != null) {
        productoInput.id = this.selectedProducto.id;
      }
      productoInput.descripcion = productoInput?.descripcion.toUpperCase();
      if (productoInput?.descripcionFactura == null)
        productoInput.descripcionFactura = productoInput.descripcion;
      productoInput.descripcionFactura =
        productoInput?.descripcionFactura.toUpperCase();
      productoInput.subfamiliaId = this.selectedSubfamilia.id;
      productoInput.envaseId = this.selectedEnvase?.id
      this.productoService.onSaveProducto(productoInput).pipe(untilDestroyed(this)).subscribe((res) => {
        if (res != null) {
          this.selectedProducto = res;
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

  seleccionarFamilia(tipo) {
    this.cargandoDialog.openDialog();
    this.selectedFamilia = this.familiasList?.find((f) => f.id == tipo.id);
    this.subfamiliasList = this.selectedFamilia?.subfamilias;
    setTimeout(() => {
      // this.filtrarFamilias();
      this.stepper.next();
      this.cargandoDialog.closeDialog();
    }, 500);
  }

  seleccionarSubfamilia(tipo) {
    this.cargandoDialog.openDialog();
    this.selectedSubfamilia = tipo;
    if (this.selectedFamilia?.nombre == "BEBIDAS") {
      this.datosGeneralesControl.controls.esAlcoholico.setValue(true);
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
      this.cargandoDialog.closeDialog();
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
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        let objectUrl = URL.createObjectURL(res);
        this.imagenPrincipal = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        var reader = new FileReader();
        reader.readAsDataURL(res);
        reader.onloadend = () => {
          let base64data = reader.result;
          this.presentacionService.onImageSave(
            base64data.toString(),`${this.selectedProducto.id}.jpg`
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
      .afterClosed().pipe(untilDestroyed(this))
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
      .afterClosed().pipe(untilDestroyed(this))
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
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
        }
      });
  }

  //familia

  onFinalizar() {
    if (this.isDialog) {
      this.matDialogRef.close(this.selectedProducto);
    } else {
      this.tabService.removeTab(this.data.id - 1);
      this.tabService.addTab(
        new Tab(ProductoComponent, "Nuevo Producto", null, ListCompraComponent)
      );
    }
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
        .afterClosed().pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res != null) {
            this.presentacionService
              .onImageSave(
                res,
                `${this.selectedPresentacion.id}.jpg`
              ).pipe(untilDestroyed(this))
              .subscribe((res2) => {
                if (res2 != null) {
                  let presentacionIndex =
                    this.presentacionesDataSource.data.findIndex(
                      (p) => p.id == this.selectedPresentacion.id
                    );
                  this.presentacionesDataSource.data[
                    presentacionIndex
                  ].imagenPrincipal = res2;
                }
              });
          }
        });
    };
    reader.readAsDataURL(file);
  }

  loadImagenPrincipal() {
    this.selectedProducto?.presentaciones?.forEach((p) => {
      if (p.principal == true) {
        this.imagenPrincipal = p?.imagenPrincipal;
      }
    });
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
            // if (this.selectedFamilia != null) {
            //   this.stepper.next();
            // }
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
            // if (this.selectedSubfamilia != null) {
            //   this.stepper.next();
            // }
          }
        }
        break;
      case 2:
        if (key == "Enter") {
          // if (this.datosGeneralesControl.valid) {
          //   this.onProductoSave();
          //   this.stepper.next();
          // }
        }
        break;
      case 3:
        if (key == "Enter") {
        }
        break;
      case 3:
        if (key == "Enter") {
        }
        break;
      case 4:
        if (key == "Enter") {
        }
        break;
      case 5:
        // if (key == "Enter") {
        //   this.onFinalizar();
        // }
        break;

      default:
        break;
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

  // funciones de presentacion

  selectedPresentacion: Presentacion | null;
  isPresentacionLoading = false;
  codigoPrincipal: Codigo;
  expandedPresentacion: any;
  @ViewChild("presentacionTable") presentacionTable: MatTable<Presentacion>;
  @ViewChild("codigoTable") codigoTable: MatTable<Codigo>;
  @ViewChild("precioTable") precioTable: MatTable<PrecioPorSucursalService>;

  getPresentacionPorProductoId(id) {
    this.cargandoDialog.openDialog()
    this.isPresentacionLoading = true;
    this.presentacionService
      .onGetPresentacionesPorProductoId(id).pipe(untilDestroyed(this))
      .subscribe((data) => {
        this.presentacionesList = data;
        this.presentacionesDataSource.data = [...this.presentacionesList];
        this.isPresentacionLoading = false;
        this.cargandoDialog.closeDialog()
      });
  }

  onAdicionarPresentacion() {
    let data = new AdicionarPresentacionData();
    data.producto = this.selectedProducto;
    this.matDialog
      .open(AdicionarPresentacionComponent, {
        data,
        width: "50%",
        disableClose: true,
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        let presentacion = new Presentacion();
        presentacion = res as Presentacion;
        if (presentacion?.id != null) {
          this.presentacionesList.push(presentacion);
          this.presentacionesDataSource.data = this.presentacionesList;
        }
      });
  }

  onPresentacionRowClick(row: Presentacion) {
    this.selectedPresentacion = row;    
    let data = new AdicionarPresentacionData();
    data.producto = this.selectedProducto;
    data.presentacion = row;
    this.matDialog
      .open(AdicionarPresentacionComponent, {
        data,
        width: "50%",
        disableClose: true,
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res?.id != null) {
          this.presentacionesList[
            this.presentacionesList.findIndex((p) => p.id == res.id)
          ] = res;
        }
        this.presentacionesDataSource.data = this.presentacionesList;
      });
  }

  onPresentacionSelect(row: Presentacion) {
    this.selectedPresentacion = row;
    console.log(row);
    if (row != null) {
      this.codigoService
        .onGetCodigosPorPresentacionId(this.selectedPresentacion.id).pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.selectedPresentacionCodigoDataSource.data = res.data.data;
          this.precioPorSucursalService
            .onGetPrecioPorSurursalPorPresentacionId(
              this.selectedPresentacion.id
            ).pipe(untilDestroyed(this))
            .subscribe((res2) => {
              this.selectedPresentacionPrecioDataSource.data = res2.data.data;
            });
        });
    }
  }

  onImageClick(row: Presentacion) {
    let data = new VizualizarImagenData();
    data.entity = row;
    data.service = this.presentacionService;
    data.url = "productos/presentaciones";
    this.matDialog
      .open(VizualizarImagenDialogComponent, {
        data,
        disableClose: true,
        height: "80%",
        width: "80%",
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          let presentacionIndex = this.presentacionesDataSource.data.findIndex(
            (p) => p.id == row.id
          );
          this.presentacionesDataSource.data[presentacionIndex] = res;
        }
      });
  }

  onDeletePresentacion(presentacion: Presentacion) {
    this.presentacionService
      .onDeletePresentacion(presentacion).pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.getPresentacionPorProductoId(this.selectedProducto.id);
        }
      });
  }

  //fin funciones de presentacion

  //adicionar codigo y precio
  onAddCodigo(index?, presentacionIndex?) {    
    this.selectedPresentacion.producto = this.selectedProducto;
    let data = new AdicionarCodigoData();
    data.codigo = this.selectedCodigo;
    data.presentacion = this.selectedPresentacion;
    this.matDialog
      .open(AdicionarCodigoDialogComponent, {
        data,
        width: "50%",
        disableClose: true,
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.codigoDataSource.data = updateDataSource(this.codigoDataSource.data, res, index)
          let presentacion = this.presentacionesDataSource.data[presentacionIndex];
          if(res.principal){
            presentacion.codigoPrincipal = res;
            this.presentacionesDataSource.data = updateDataSource(this.presentacionesDataSource.data, presentacion, presentacionIndex)
          } else if(presentacion?.codigoPrincipal!=null && presentacion?.codigoPrincipal?.id == res.id) {
            presentacion.codigoPrincipal = null;
            this.presentacionesDataSource.data = updateDataSource(this.presentacionesDataSource.data, presentacion, presentacionIndex)
          }
          // let presentacionId = res.presentacion.id;
          // if (presentacionId != null) {
          //   let presentacionIndex =
          //     this.presentacionesDataSource.data.findIndex(
          //       (p) => p.id == presentacionId
          //     );
          //   let codigoIndex = this.presentacionesDataSource.data[
          //     presentacionIndex
          //   ].codigos.findIndex((c) => c.id == res.id);
          //   let list = [...this.presentacionesDataSource.data];
          //   if (codigoIndex != -1) {
          //     console.log('actualizando codigo')
          //     console.log(res)
          //     list[presentacionIndex].codigos[codigoIndex] = res;
          //   } else {
          //     console.log('agregando nuevo codigo', presentacionIndex, res)
          //     list[presentacionIndex].codigos.push(res)
          //   }
          //   this.presentacionesDataSource.data = [...list];
          //   this.codigoTable.renderRows()
          // }
        }
      });
  }

  onEditCodigo(codigo: Codigo, i, presentacionIndex) {
    this.selectedCodigo = codigo;
    this.onAddCodigo(i, presentacionIndex);
  }

  onDeleteCodigo(codigo: Codigo, codigoIndex) {
    // this.cargandoDialog.openDialog()
    // this.codigoService.onDeleteCodigo(codigo).pipe(untilDestroyed(this)).subscribe((res) => {
    //   this.cargandoDialog.closeDialog()
    //   if (res) {
    //     this.getPresentacionPorProductoId(this.selectedProducto.id);
    //   }
    // });
  }

  onAddPrecio(index?, presentacionIndex?) {
    let data = new AdicionarPrecioPorSucursalData();
    data.precio = this.selectedPrecio;
    data.presentacion = this.selectedPresentacion;
    this.matDialog
      .open(AdicionarPrecioDialogComponent, {
        data,
        width: "50%",
        disableClose: true,
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.precioDataSource.data = updateDataSource(this.precioDataSource.data, res, index)
          let presentacion = this.presentacionesDataSource.data[presentacionIndex];
          if(res.principal){
            presentacion.precioPrincipal = res;
            this.presentacionesDataSource.data = updateDataSource(this.presentacionesDataSource.data, presentacion, presentacionIndex)
          } else if(presentacion?.precioPrincipal!=null && presentacion?.precioPrincipal?.id == res.id) {
            presentacion.precioPrincipal = null;
            this.presentacionesDataSource.data = updateDataSource(this.presentacionesDataSource.data, presentacion, presentacionIndex)
          }
          // let presentacionId = res.presentacion.id;
          // if (presentacionId != null) {
          //   let presentacionIndex =
          //     this.presentacionesDataSource.data.findIndex(
          //       (p) => p.id == presentacionId
          //     );
          //   let precioIndex = this.presentacionesDataSource.data[
          //     presentacionIndex
          //   ].precios.findIndex((c) => c.id == res.id);
          //   let list = [...this.presentacionesDataSource.data];
          //   if (precioIndex != -1) {
          //     list[presentacionIndex].precios[precioIndex] = res;
          //   } else {
          //     list[presentacionIndex].precios.push(res)
          //   }
          //   this.presentacionesDataSource.data = [...list];
          //   this.precioTable.renderRows()
          // }
        }
      });
  }

  onEditPrecio(precio: PrecioPorSucursal, i, presentacionIndex) {
    this.selectedPrecio = precio;
    this.onAddPrecio(i, presentacionIndex);
  }

  onDeletePrecio(precio: PrecioPorSucursal, precioIndex) {
    // this.cargandoDialog.openDialog()
    // this.precioPorSucursalService.onDelete(precio).pipe(untilDestroyed(this)).subscribe((res) => {
    //   this.cargandoDialog.closeDialog()
    //   if (res) {
    //     this.getPresentacionPorProductoId(this.selectedProducto.id);
    //   }
    // });
  }

  //"could not execute statement; SQL [n/a]; constraint [presentacion_producto_fk]; nested exception is org.hibernate.exception.ConstraintViolationException: could not execute statement"

  //change detector refresh
  refresh() {
    this.changeDetectorRefs.detectChanges();
  }

  onSearchEnvase(){ 
    this.matDialog.open(SearchEnvaseDialogComponent, {
      data: {
        producto: this.selectedProducto
      },
      width: '70%',
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if(res!=null){
        this.onSelectEnvase(res);
      }
    })
  }

  ngOnDestroy(): void {
      this.isEnvaseSub.unsubscribe()
  }
}
