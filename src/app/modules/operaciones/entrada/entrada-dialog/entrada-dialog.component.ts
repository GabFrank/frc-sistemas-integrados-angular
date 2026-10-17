import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import {
  FormControl,
  FormControlName,
  FormGroup,
  Validators,
} from "@angular/forms";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { MatSelect } from "@angular/material/select";
import { MatTableDataSource } from "@angular/material/table";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../../notificacion-snackbar.service";
import { avisoTrasMutacion, erroresDeRechazo } from "../../../../commons/core/utils/graphqlErrorUtils";
import { CargandoDialogComponent } from "../../../../shared/components/cargando-dialog/cargando-dialog.component";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { Presentacion } from "../../../productos/presentacion/presentacion.model";
import {
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from "../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { Producto } from "../../../productos/producto/producto.model";
import { EntradaItem } from "../entrada-item/entrada-item.model";
import { EntradaItemService } from "../entrada-item/entrada-item.service";
import { Entrada, EntradaInput, TipoEntrada } from "../entrada.model";
import { EntradaService } from "../entrada.service";

import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas';

export interface EntradaDialogData {
  id?: number;
  entrada?: Entrada;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-entrada-dialog",
  templateUrl: "./entrada-dialog.component.html",
  styleUrls: ["./entrada-dialog.component.scss"],
})
export class EntradaDialogComponent implements OnInit {
  @ViewChild("productoInput", { static: false }) productoInput: ElementRef;
  @ViewChild("cantidadInput", { static: false }) cantidadInput: ElementRef;
  @ViewChild("tipoEntradaSelect", { static: true })
  tipoEntradaSelect: MatSelect;

  @ViewChild('pdfTable')
  pdfTable!: ElementRef;

  selectedEntrada: Entrada;
  responsableCargaControl = new FormControl();
  tipoEntradaControl = new FormControl();
  sucursalControl = new FormControl();
  idControl = new FormControl();
  creadoEnControl = new FormControl();
  observacionControl = new FormControl();
  formGroup: FormGroup;
  usuarioInputControl = new FormControl<Usuario>(null);
  selectedResponsable: Usuario;
  tipoEntradasList: any[];
  selectedTipoEntrada: TipoEntrada;
  sucursalList: Sucursal[];
  filteredSucursalList: Sucursal[];
  selectedSucursal: Sucursal;
  itemDataSource = new MatTableDataSource<EntradaItem>(null);
  displayedColumns = [
    "id",
    "producto",
    "codigo",
    "presentacion",
    "cantidad"];

  isEditar = true;
  isItemEditar = true;
  /** Su finalización quedó sin respuesta en esta sesión: no se toca hasta releerla finalizada (#527). */
  bloqueada = false;
  finalizando = false;
  cargandoDialogRef: MatDialogRef<CargandoDialogComponent>;

  //entradaitem
  productoIdControl = new FormControl();
  productoControl = new FormControl(null, Validators.required);
  presentacionControl = new FormControl(null, Validators.required);
  cantidadControl = new FormControl(null, Validators.required);
  itemObservacionControl = new FormControl();
  itemFormGroup: FormGroup;
  selectedProducto: Producto;
  selectedPresentacion: Presentacion;
  selectedEntradaItem: EntradaItem;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EntradaDialogData,
    private matDialogRef: MatDialogRef<EntradaDialogComponent>,
    private sucursalService: SucursalService,
    private entradaService: EntradaService,
    private notificicacionBar: NotificacionSnackbarService,
    private matDialog: MatDialog,
    private entradaItemService: EntradaItemService,
    private dialogoService: DialogosService,
    private cargandoService: CargandoDialogService
  ) {
    if (data.entrada != null) this.selectedEntrada = data.entrada;
  }

  ngOnInit(): void {
    //inicializar arrays
    const { requestId } = this.cargandoService.openDialog()
    this.tipoEntradasList = [];
    this.sucursalList = [];
    this.itemDataSource.data = []

    this.createForm();
    this.buscarSucursales();

    //listeners de los controls

    if (this.data?.entrada != null) this.cargarDatos();
    // La fila de la lista puede ser de antes de un corte: se relee (#527)
    if (this.data?.entrada?.id != null) this.buscarEntrada(this.data.entrada.id)
    if (this.data?.id != null) this.buscarEntrada(this.data.id)

    this.cargandoService.closeDialog(requestId)

  }

  createForm() {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl("responsableCarga", this.responsableCargaControl);
    this.formGroup.addControl("tipoEntrada", this.tipoEntradaControl);
    this.formGroup.addControl("sucursal", this.sucursalControl);
    this.formGroup.addControl("observacion", this.observacionControl);
    this.formGroup.addControl("observacion", this.observacionControl);
    this.formGroup.addControl("usuarioInput", this.usuarioInputControl);
    this.formGroup.addControl("id", this.idControl);
    this.formGroup.addControl("creadoEn", this.creadoEnControl);
    this.formGroup.controls.id.disable();
    this.formGroup.controls.creadoEn.disable();

    this.itemFormGroup = new FormGroup({});
    this.itemFormGroup.addControl("producto", this.productoControl);
    this.itemFormGroup.addControl("presentacion", this.presentacionControl);
    this.itemFormGroup.addControl("cantidad", this.cantidadControl);
    this.itemFormGroup.addControl("observacion", this.itemObservacionControl);
    this.itemFormGroup.addControl("productoId", this.productoIdControl);
    this.presentacionControl.disable();
    this.productoIdControl.disable();
    this.tipoEntradasList = Object.values(TipoEntrada);
    this.onSelectTipoEntrada(TipoEntrada.COMPRA);
  }

  buscarSucursales() {
    this.sucursalService.onGetAllSucursales(true).pipe(untilDestroyed(this)).subscribe((res) => {
      this.sucursalList = res.sort((a, b) => {
        if (a.nombre < b.nombre) {
          return -1;
        } else {
          return 1;
        }
      });
    });
  }

  buscarEntrada(id) {
    this.entradaService.onGetEntrada(id).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.selectedEntrada = res;
        this.cargarDatos()
      }
    })
  }

  cargarDatos() {
    this.actualizarBloqueo();
    this.isEditar = false;
    this.idControl.setValue(this.selectedEntrada.id);
    this.creadoEnControl.setValue(this.selectedEntrada.creadoEn);
    this.usuarioInputControl.setValue(this.selectedEntrada?.responsableCarga ?? null);
    this.onResponsableSelect(this.selectedEntrada?.responsableCarga);
    this.onSelectTipoEntrada(this.selectedEntrada?.tipoEntrada);
    this.onSelectSucursal(this.selectedEntrada?.sucursal);
    this.formGroup.disable();
    if (this.selectedEntrada.entradaItemList != null) {
      this.itemDataSource.data = this.selectedEntrada.entradaItemList;
    }
    setTimeout(() => {
      this.setFocusToProductoInput();
    }, 100);
  }

  onSelectSucursal(e) {
    this.selectedSucursal = this.sucursalList.find((s) => s.id == e);
    if (this.selectedSucursal != null) {
      this.sucursalControl.setValue(this.selectedSucursal.id);
    }
  }

  onResponsableSelect(e: Usuario) {
    this.selectedResponsable = e?.id != null ? e : null;
  }

  onSelectTipoEntrada(e) {
    this.selectedTipoEntrada = e as TipoEntrada;
    this.tipoEntradaControl.setValue(this.selectedTipoEntrada);
    if (this.selectedTipoEntrada != TipoEntrada.SUCURSAL) {
      this.onSelectSucursal(null);
    }
  }

  setFocusToTipoEntrada() {
    setTimeout(() => {
      this.tipoEntradaSelect._elementRef.nativeElement.focus();
    }, 0);
  }

  onEdit(e: EntradaItem) { }

  onDelete() {
    if (this.bloqueada) return;
    this.dialogoService.confirm('Atención!!', 'Realmente desea eliminar este item?', null, [`Producto: ${this.selectedEntradaItem.producto?.descripcion.toUpperCase()}`, `Presentación: ${this.selectedEntradaItem.presentacion?.descripcion.toUpperCase()}`, `Cantidad: ${this.selectedEntradaItem.cantidad}`]).subscribe(res => {
      if (res) {
        this.entradaItemService.onDeleteEntradaItem(this.selectedEntradaItem.id).pipe(untilDestroyed(this))
          .subscribe(res2 => {
            if (res2) {
              let auxArray = this.itemDataSource.data;
              let index = auxArray.findIndex(i => i.id == this.selectedEntradaItem.id)
              if (index > -1) {
                auxArray.splice(index, 1);
                this.itemDataSource.data = auxArray;
              }
              this.onEditItem()
              this.itemFormGroup.reset()
            }
          })
      }
    })
  }

  onSaveEntrada() {
    let entrada = new EntradaInput();
    entrada.id = this.selectedEntrada?.id;
    entrada.responsableCargaId = this.selectedResponsable?.id;
    entrada.tipoEntrada = this.selectedTipoEntrada;
    entrada.sucursalId = this.selectedSucursal?.id;
    entrada.creadoEn = this.selectedEntrada?.creadoEn;
    entrada.activo = (this.selectedEntrada?.activo == true)
    const esAlta = entrada.id == null;
    this.entradaService.onSaveEntrada(entrada).pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        this.selectedEntrada = res;
        this.isEditar = false;
        this.cargarDatos();
        this.usuarioInputControl.disable();
        this.tipoEntradaControl.disable();
        this.sucursalControl.disable();
      },
      // Un rechazo ya lo avisó el genérico: se sigue editando. Un alta sin respuesta pudo haberse creado:
      // repetirla crearía otra
      error: (err) => {
        if (esAlta && erroresDeRechazo(err) == null) this.cerrarTrasCorte(err, "se guardó la entrada");
      },
    });
  }

  addProducto() { }

  onEditar() {
    this.isEditar = true;
    this.usuarioInputControl.enable();
    this.tipoEntradaControl.enable();
    this.sucursalControl.enable();
  }

  onCancelar() {
    if (this.selectedEntrada != null) this.selectedEntrada.entradaItemList = this.itemDataSource.data;
    this.matDialogRef.close(this.selectedEntrada);
  }

  searchProducto() {
    let texto: string = this.productoControl.value;
    this.matDialog
      .open(PdvSearchProductoDialogComponent, {
        data: {
          texto: texto != null ? texto.toUpperCase() : "",
          mostrarStock: true
        },
        width: "100%",
        height: "100%",
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        let respuesta: PdvSearchProductoResponseData;
        if (res != null) {
          respuesta = res;
          this.onSelectProducto(respuesta.producto);
          this.onSelectPresentacion(respuesta.presentacion);
          this.onFocusToCantidad()
        }
      });
  }

  onSelectProducto(producto) {
    this.selectedProducto = producto;
    this.productoControl.setValue(this.selectedProducto.descripcion);
    this.productoIdControl.setValue(this.selectedProducto.id);
  }

  onProductoFocus() {
    this.productoControl.value != null ? this.productoInput.nativeElement.select() : null;
  }

  onSelectPresentacion(presentacion) {
    this.selectedPresentacion = presentacion;
    this.presentacionControl.setValue(this.selectedPresentacion.descripcion);
  }

  setFocusToProductoInput() {
    setTimeout(() => {
      this.productoInput.nativeElement.focus();
    }, 200);
  }

  onFocusToCantidad() {
    setTimeout(() => {
      this.cantidadInput.nativeElement.focus();
    }, 100);
  }

  onItemSave() {
    if (this.bloqueada || !this.itemFormGroup.valid) return;
    let auxArray: EntradaItem[] = []
    let isNew = this.selectedEntradaItem?.id == null;
    let item = new EntradaItem();
    item.id = this.selectedEntradaItem?.id;
    item.entrada = this.selectedEntrada;
    item.producto = this.selectedProducto;
    item.presentacion = this.selectedPresentacion;
    item.cantidad = this.cantidadControl.value;
    item.usuario = this.selectedEntradaItem?.usuario;
    item.creadoEn = this.selectedEntradaItem?.creadoEn;
    this.entradaItemService.onSaveEntradaItem(item.toInput()).pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          if (res != null) {
            this.selectedEntradaItem = res;
            if (!isNew) {
              let index = this.itemDataSource.data.findIndex(s => s.id == this.selectedEntradaItem.id)
              auxArray = this.itemDataSource.data;
              auxArray[index] = this.selectedEntradaItem;
              this.itemDataSource.data = auxArray;
            } else {
              auxArray = this.itemDataSource.data;
              auxArray.push(this.selectedEntradaItem);
              this.itemDataSource.data = auxArray;
            }
            this.onItemCancelar()
          }
        },
        // Un ítem nuevo sin respuesta pudo haberse guardado: repetirlo lo duplica, y al finalizar duplica el stock
        error: err => {
          if (isNew && erroresDeRechazo(err) == null) this.cerrarTrasCorte(err, "se guardó el ítem");
        },
      })
  }

  onSelectEntradaItem(item: EntradaItem) {
    this.selectedEntradaItem = item;
    this.onSelectProducto(item.producto);
    this.onSelectPresentacion(item.presentacion);
    this.cantidadControl.setValue(item.cantidad)
    this.itemFormGroup.disable()
    this.isItemEditar = false;
  }

  onEditItem() {
    this.isItemEditar = true;
    this.productoControl.enable()
    this.cantidadControl.enable()
    this.setFocusToProductoInput()
  }

  onFinalizarEntrada() {
    const id = this.selectedEntrada?.id;
    if (id == null || this.finalizando || this.bloqueada) return;
    this.finalizando = true;
    this.entradaService.onFinalizarEntrega(id).pipe(untilDestroyed(this)).subscribe({
      next: (ok) => {
        this.finalizando = false;
        this.selectedEntrada.activo = ok == true;
        if (ok) {
          this.notificicacionBar.notification$.next({
            texto: "Entrada finalizada",
            color: NotificacionColor.success,
            duracion: 2,
          });
        }
      },
      error: (err) => {
        this.finalizando = false;
        // Un rechazo ya lo avisó el genérico y no se aplicó nada
        if (erroresDeRechazo(err) != null) return;
        // Sin respuesta pudo haberse aplicado, y repetirla duplica el stock: queda bloqueada en esta sesión
        this.entradaService.finalizacionSinConfirmar.add(id);
        this.cerrarTrasCorte(err, "se finalizó la entrada");
      },
    });
  }

  /** Bloquea la entrada si su finalización quedó sin respuesta; la libera recién al leerla finalizada. */
  private actualizarBloqueo() {
    const sinConfirmar = this.entradaService.finalizacionSinConfirmar;
    if (this.selectedEntrada?.activo == true) sinConfirmar.delete(this.selectedEntrada.id);
    const antes = this.bloqueada;
    this.bloqueada = sinConfirmar.has(this.selectedEntrada?.id);
    if (this.bloqueada && !antes) {
      this.notificicacionBar.notification$.next({
        texto: "No se pudo confirmar si se finalizó esta entrada: revisá el stock antes de repetir. Para habilitarla, reiniciá el sistema.",
        color: NotificacionColor.warn,
        duracion: 8,
      });
    }
  }

  /**
   * Tras una escritura sin respuesta que no se puede repetir (alta, finalizar): avisa, cierra y la lista recarga.
   * El corte por tiempo ya lo avisó el link.
   */
  private cerrarTrasCorte(err: any, queSeHizo: string) {
    const aviso = avisoTrasMutacion(err, queSeHizo);
    if (aviso != null) {
      this.notificicacionBar.notification$.next({ texto: aviso, color: NotificacionColor.warn, duracion: 8 });
    }
    this.matDialogRef.close({ recargar: true });
  }

  onItemCancelar() {
    this.selectedEntradaItem = null;
    this.itemFormGroup.reset();
    this.onEditItem()
  }


  public downloadAsPDF() {
    let data = this.pdfTable.nativeElement;
    html2canvas(data as any).then(canvas => {
      var imgWidth = 210;
      var pageHeight = 295;
      var imgHeight = canvas.height * imgWidth / canvas.width;
      var heightLeft = imgHeight;
      const contentDataURL = canvas.toDataURL('image/png');
      let pdfData = new jsPDF('p', 'mm', 'a4');
      var position = 0;
      pdfData.setPage(1)
      pdfData.addImage(contentDataURL, 'PNG', 0, 0, 200, 290)
      pdfData.save(`MyPdf.pdf`);
    });
  }
}
