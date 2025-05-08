import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "./../../../../notificacion-snackbar.service";
import { BeepService } from "./../../../../shared/beep/beep.service";
import { MatDialog } from "@angular/material/dialog";
import { Output, EventEmitter, ViewChild, ElementRef } from "@angular/core";
import { Component, Input, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { untilDestroyed, UntilDestroy } from "@ngneat/until-destroy";
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from "../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { VentaItem } from "../../../operaciones/venta/venta-item.model";
import { ProductoPorCodigoGQL } from "../../../productos/producto/graphql/productoPorCodigo";
import { Producto } from "../../../productos/producto/producto.model";
import { Observable } from "rxjs";
import { environment } from "../../../../../environments/environment";
import {
  ProductoCategoriaDialogComponent,
  ProductoCategoriaDialogData,
  ProductoCategoriaResponseData,
} from "../../comercial/venta-touch/producto-categoria-dialog/producto-categoria-dialog.component";
import { SelectProductosResponseData } from "../../comercial/venta-touch/select-productos-dialog/select-productos-dialog.component";
import { ProductoService } from "../../../productos/producto/producto.service";
import { ConfiguracionService } from "../../../../shared/services/configuracion.service";
@UntilDestroy()
@Component({
  selector: "app-buscador",
  templateUrl: "./buscador.component.html",
  styleUrls: ["./buscador.component.scss"],
})
export class BuscadorComponent implements OnInit {
  @ViewChild("buscadorInput", { static: false }) buscadorInput: ElementRef;

  @Input()
  selectedTipoPrecio;

  @Input()
  tiposPrecios;

  @Input()
  mostrarPrecios = false;

  @Input()
  focusEvent: Observable<void>;

  @Input()
  clearBuscadorEvent: Observable<void>;

  @Output()
  dialogEvent = new EventEmitter();

  @Output()
  addItemEvent = new EventEmitter();

  @Output()
  crearItemEvent = new EventEmitter();

  @Output()
  cantidadEvent = new EventEmitter();

  @Input()
  openSearchEvent: Observable<void>;

  formGroup: FormGroup;
  cantidadControl = new FormControl(null, Validators.required);
  buscadorControl = new FormControl(null);
  dialogReference;
  isAudio = false;
  filteredPrecios: string[];
  modoPrecio: string;

  constructor(
    private dialog: MatDialog,
    private productoService: ProductoService,
    private beepService: BeepService,
    private notificacionSnackbar: NotificacionSnackbarService,
    private configService: ConfiguracionService
  ) {
    this.filteredPrecios = this.configService.getConfig().precios.split(',');
    this.modoPrecio = this.configService.getConfig().modo;
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      cantidad: this.cantidadControl,
      buscador: this.buscadorControl,
    });
    this.formGroup.get("cantidad").setValue(1);

    if (this.focusEvent) {
      this.focusEvent.pipe(untilDestroyed(this)).subscribe((res) => {
        this.setFocusToInput();
      });
    }

    if (this.openSearchEvent) {
      this.openSearchEvent.pipe(untilDestroyed(this)).subscribe((res) => {
        this.onEnterPress();
      });
    }

    this.buscadorControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((res: string) => {
        if (res?.includes("*")) {
          let multiIndex = this.buscadorControl.value?.indexOf("*");
          if (multiIndex > -1) {
            this.cantidadEvent.emit(
              +this.buscadorControl.value?.slice(0, multiIndex)
            );
          }
        }
      });

    if (this.clearBuscadorEvent) {
      this.clearBuscadorEvent.pipe(untilDestroyed(this)).subscribe((res) => {
        this.buscadorControl.setValue(null);
      });
    }
  }

  buscarProductoDialog() {
    let codigo: string = this.buscadorControl.value;
    let prefix;
    if (codigo != null && codigo.length > 7) {
      prefix = codigo.substring(0, 2);
    }

    let data: PdvSearchProductoData = {
      cantidad: this.formGroup.get("cantidad").value,
      texto: this.formGroup.get("buscador").value,
      selectedTipoPrecio: this.selectedTipoPrecio,
      tiposPrecios: this.tiposPrecios,
      mostrarStock: true,
      mostrarOpciones: true,
      conservarUltimaBusqueda: true,
      servidor: false,
    };
    this.dialogReference = this.dialog.open(PdvSearchProductoDialogComponent, {
      height: "90%",
      data,
      autoFocus: false,
      restoreFocus: true,
    });
    this.formGroup.get("buscador").setValue("");
    this.formGroup.get("cantidad").setValue(1);
    this.dialogReference
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          let response: PdvSearchProductoResponseData = res;
          let item = new VentaItem();
          item.cantidad = response.cantidad;
          item.producto = response.producto;
          item.presentacion = response.presentacion;
          item.precioVenta = response.precio;
          item.precio = item.precioVenta?.precio;
          item.precioCosto = response?.producto?.costo?.ultimoPrecioCompra;
          this.addItemEvent.emit(item);
        }
        this.dialogReference = undefined;
        this.setFocusToInput();
      });
  }

  onTabPress() {
    let cantidad = this.buscadorControl.value;
    if (!isNaN(cantidad)) {
      this.cantidadControl.setValue(+cantidad);
      this.buscadorControl.setValue(null);
      this.setFocusToInput();
    }
  }

  onEnterPress() {
    let multiIndex = this.buscadorControl.value?.indexOf("*");
    if (multiIndex > -1) {
      this.cantidadControl.setValue(
        +this.buscadorControl.value?.slice(0, multiIndex)
      );
      this.buscadorControl.setValue(
        this.buscadorControl.value?.slice(multiIndex + 1)
      );
    }
    this.buscarPorCodigo(this.buscadorControl.value);
  }

  buscarPorCodigo(texto: string) {
    let producto: Producto;
    let isPesable = false;
    let peso;
    let codigo;
    let isPrefi20 = false;
    if (texto == null || texto == " " || texto == "") return null;
    // if (texto.length == 13 && texto.substring(0, 2) == '20') {
    //   isPesable = true;
    //   codigo = texto.substring(2, 7)
    //   peso = +texto.substring(7, 12) / 1000
    //   texto = codigo
    //   this.cantidadControl.setValue(peso)
    // }
    if (texto.length == 13 && texto.substring(0, 2) == "20") {
      isPrefi20 = true;
    }
    this.productoService.onGetProductoPorCodigo(texto, false)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          console.log('Encontro producto por codigo');
          producto = res;
          if (producto != null) {
            if (producto?.balanza == true && texto.length == 13) {
              peso = +texto.substring(7, 12) / 1000;
              this.cantidadControl.setValue(peso);
            }
            this.isAudio ? this.beepService.beep() : null;
            if (this.mostrarPrecios) {
              this.dialog
                .open(ProductoCategoriaDialogComponent, {
                  data: {
                    presentaciones: producto?.presentaciones,
                    producto,
                  },
                  width: "90%",
                })
                .afterClosed()
                .pipe(untilDestroyed(this))
                .subscribe((res) => {
                  let respuesta: SelectProductosResponseData =
                    new SelectProductosResponseData();
                  let productoCategoriaResponse: ProductoCategoriaResponseData =
                    res;
                  if (
                    productoCategoriaResponse?.presentacion != null &&
                    productoCategoriaResponse.precio != null
                  ) {
                    respuesta.producto = producto;
                    respuesta.data = productoCategoriaResponse;
                    this.crearItemEvent.emit({
                      presentacion: productoCategoriaResponse?.presentacion,
                      precio: productoCategoriaResponse.precio,
                      producto: producto,
                      texto: texto,
                      cantidad: productoCategoriaResponse.cantidad,
                    });
                    this.buscadorControl.setValue(null);
                    this.cantidadControl.setValue(1);
                  }
                });
            } else {
              this.crearItemEvent.emit({
                producto: producto,
                texto: texto,
                cantidad: this.cantidadControl.value,
              });
              this.buscadorControl.setValue(null);
              this.cantidadControl.setValue(1);
              return;
            }
          } else {
            console.log("no encontro el producto con codigo original");

            this.isAudio ? this.beepService.boop() : null;
            // this.cantidadControl.setValue(1);
            if (isPrefi20) {
              console.log("es prefix");

              isPesable = true;
              codigo = texto.substring(2, 7);
              peso = +texto.substring(7, 12) / 1000;
              texto = codigo;
              this.cantidadControl.setValue(peso);
              this.productoService.onGetProductoPorCodigo(texto, false)
                .pipe(untilDestroyed(this))
                .subscribe((res) => {
                  if (res != null) {
                    producto = res;
                    if (producto != null) {
                      if (producto?.balanza == true && texto.length == 13) {
                        peso = +texto.substring(7, 12) / 1000;
                        this.cantidadControl.setValue(peso);
                      }
                      this.crearItemEvent.emit({
                        producto: producto,
                        texto: texto,
                        cantidad: this.cantidadControl.value,
                      });
                      this.buscadorControl.setValue(null);
                      this.cantidadControl.setValue(1);
                      return;
                    } else {
                      this.cantidadControl.setValue(1);
                      this.buscarProductoDialog();
                      this.notificacionSnackbar.notification$.next({
                        texto: "Producto no encontrado",
                        color: NotificacionColor.warn,
                        duracion: 2,
                      });
                    }
                  }
                });
            } else {
              this.buscarProductoDialog();
            }
          }
        } else {
          console.log('No encontro producto por codigo');
          this.buscarProductoDialog();
        }
        this.setFocusToInput();
      });
  }

  setFocusToInput() {
    setTimeout(() => {
      this.buscadorInput.nativeElement.focus();
    }, 1000);
  }
}
