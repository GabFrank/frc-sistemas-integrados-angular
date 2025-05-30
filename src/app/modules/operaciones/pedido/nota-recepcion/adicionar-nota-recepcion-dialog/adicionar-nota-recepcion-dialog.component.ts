import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialog,
} from "@angular/material/dialog";
import { MatSelect } from "@angular/material/select";
import { MatTable, MatTableDataSource } from "@angular/material/table";
import { Observable } from "rxjs";
import { updateDataSource } from "../../../../../commons/core/utils/numbersUtils";
import { CargandoDialogService } from "../../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { DialogosService } from "../../../../../shared/components/dialogos/dialogos.service";
import { Documento } from "../../../../financiero/documento/documento.model";
import { DocumentoService } from "../../../../financiero/documento/documento.service";
import { AdicionarDetalleCompraItemDialogComponent } from "../../../compra/adicionar-detalle-compra-item-dialog/adicionar-detalle-compra-item-dialog.component";
import { CompraItemEstado } from "../../../compra/compra-enums";
import { CompraItem } from "../../../compra/compra-item.model";
import { CompraService } from "../../../compra/compra.service";
import {
  AdicionarItemDialogComponent,
  AdicionarPedidoItemDialog,
} from "../../adicionar-item-dialog/adicionar-item-dialog.component";
import {
  PedidoItem,
  PedidoItemInput,
} from "../../edit-pedido/pedido-item.model";
import { Pedido } from "../../edit-pedido/pedido.model";
import { PedidoItemService } from "../../pedido-itens/pedido-item.service";
import { PedidoService } from "../../pedido.service";
import {
  AdicionarNotaRecepcionItemDialogComponent,
  SelectedItem,
} from "../adicionar-nota-recepcion-item-dialog/adicionar-nota-recepcion-item-dialog.component";
import { PedidoItemPorIdGQL } from "../graphql/pedidoItemPorId";
import { NotaRecepcion } from "../nota-recepcion.model";
import { NotaRecepcionService } from "../nota-recepcion.service";

export class AdicionarNotaRecepcionData {
  pedido: Pedido;
  notaRecepcion: NotaRecepcion;
  notaRecepcionList: NotaRecepcion[];
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { dateToString, formatearFecha, parseShortDate, validarFecha } from "../../../../../commons/core/utils/dateUtils";
import { MatButton, MatIconButton } from "@angular/material/button";
import { NotificacionSnackbarService } from "../../../../../notificacion-snackbar.service";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-adicionar-nota-recepcion-dialog",
  templateUrl: "./adicionar-nota-recepcion-dialog.component.html",
  styleUrls: ["./adicionar-nota-recepcion-dialog.component.scss"],
})
export class AdicionarNotaRecepcionDialogComponent implements OnInit {
  @ViewChild("numeroInput", { static: false })
  numeroInput: ElementRef;

  @ViewChild("timbradoInput", { static: false })
  timbradoInput: ElementRef;

  @ViewChild("tipoMatSelect", { static: false })
  tipoMatSelect: MatSelect;

  @ViewChild("fechaInput", { static: false }) fechaInput: ElementRef;

  @ViewChild("saveBtn", {static: false, read: MatIconButton}) saveBtn: MatIconButton;

  tipoBoletaList: any[] = ["LEGAL", "COMUN", "AMBAS"];

  selectedNotaRecepcion: NotaRecepcion;
  selectedPedido: Pedido;
  selectedDocumento: Documento;
  idControl = new FormControl()
  numeroControl = new FormControl(null, Validators.required);
  timbradoControl = new FormControl();
  documentoControl = new FormControl(null);
  fechaControl = new FormControl(null, Validators.required);
  tipoBoletaControl = new FormControl(null, Validators.required);
  formGroup: FormGroup;
  isEditing = false;
  sameNumeroNota = false;

  documentoList: Documento[];

  dataSource = new MatTableDataSource<PedidoItem>([]);

  displayedColumns = [
    "producto",
    "presentacion",
    "cantidad",
    "cantidadPorUnidad",
    "precioUnitario",
    "descuentoUnitario",
    "valorTotal",
    "estado",
    "acciones",
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarNotaRecepcionData,
    private matDialogRef: MatDialogRef<AdicionarNotaRecepcionDialogComponent>,
    private documentoService: DocumentoService,
    private matDialog: MatDialog,
    private dialogoService: DialogosService,
    private notaRecepcionService: NotaRecepcionService,
    private pedidoService: PedidoService,
    private compraService: CompraService,
    private cargandoDialogo: CargandoDialogService,
    private notificacionService: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      numero: this.numeroControl,
      fecha: this.fechaControl,
      tipoBoleta: this.tipoBoletaControl,
    });

    if(this.data?.pedido != null){
      this.selectedPedido = this.data.pedido;
    }

    if (this.data?.notaRecepcion != null) {
      this.cargarDatos();
    } else {
      this.isEditing = true;
    }

    this.numeroControl.valueChanges.subscribe((value: number) => {
      this.data.notaRecepcionList?.forEach( n => {
        if(n.numero == value){
          this.sameNumeroNota = true;
        } else {
          this.sameNumeroNota = false;
        }
      })
    })

    this.fechaControl.setValue(dateToString(new Date(), "dd/MM/yy"), {emitEvent: false})
  }

  cargarDatos() {
    console.log("Cargando datos")
    if (this.data.notaRecepcion != null) {
      this.selectedNotaRecepcion = new NotaRecepcion();
      Object.assign(this.selectedNotaRecepcion,  this.data.notaRecepcion);
      this.idControl.setValue(this.selectedNotaRecepcion.id)
      this.onSelectDocumento(this.selectedNotaRecepcion.documento);
      this.numeroControl.setValue(this.selectedNotaRecepcion.numero);
      this.timbradoControl.setValue(this.selectedNotaRecepcion.timbrado);
      this.formGroup.disable();
      this.dataSource.data = this.selectedNotaRecepcion.pedidoItemList;
      this.tipoBoletaControl.setValue(this.selectedNotaRecepcion.tipoBoleta)
      this.fechaControl.setValue(dateToString(this.selectedNotaRecepcion?.fecha))
      this.fechaControl.markAsTouched();
    }
  }

  onSelectDocumento(documento: Documento) {
    if (documento != null) {
      this.selectedDocumento = documento;
      this.documentoControl.setValue(this.selectedDocumento.id);
    }
  }

  onSelectItens() {
    // if (this.selectedNotaRecepcion == null) {
    //   this.onGuardarNota().pipe(untilDestroyed(this)).subscribe((res) => {
    //     if (res) {
    //       this.openAddNotaItemDialog();
    //     } else {
    //     }
    //   });
    // } else {
    //   this.openAddNotaItemDialog();
    // }
  }

  openAddNotaItemDialog() {
    this.matDialog
      .open(AdicionarNotaRecepcionItemDialogComponent, {
        data: {
          notaRecepcion: this.selectedNotaRecepcion,
        },
        width: "90%",
        height: "70%",
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.selectedNotaRecepcion.pedidoItemList = res;
          this.dataSource.data = res;
        }
      });
  }

  onTipoEnter() {
    this.numeroInput.nativeElement.focus();
  }

  onNumeroEnter() {
    if (this.numeroControl.value != null) {
      this.fechaInput.nativeElement.select();
    } else if (this.tipoBoletaControl.value == "COMUN") {
      this.dialogoService
        .confirm("Desea crear un número fictício?", null, null).pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res) {
            this.numeroControl.setValue(
              (Math.random() * 1000001 + 10000).toFixed(0)
            );
          }
        });
    }
  }

  onTimpradoEnter() {
    this.onSelectItens();
  }

  tipoMatSelectChange(e) {
    if (e.value != null) {
      let id = e.value;
      let documento = this.documentoList.find((d) => d.id == id);
      this.onSelectDocumento(documento);
    }
  }

  onTipoMatSelectOpened(opened: boolean) {
    if (this.selectedDocumento != null) {
      this.tipoMatSelect.close();
    }
  }

  onGuardarNota() {

  }

  onGuardarItem(nuevaLista: SelectedItem[]) {}

  onModificar(item: PedidoItem, i) {
    if (item.compraItem == null) {
      let compraItem = new CompraItem();
      compraItem.compra = this.selectedPedido.compra;
      compraItem.pedidoItem = item;
      compraItem.cantidad = item.cantidadCreacion;
      compraItem.precioUnitario = item.precioUnitarioCreacion;
      compraItem.producto = item.producto;
      compraItem.presentacion = item.presentacionCreacion;
      compraItem.descuentoUnitario = item.descuentoUnitarioCreacion;
      compraItem.bonificacion =
        item.precioUnitarioCreacion == 0 ||
        item.precioUnitarioCreacion.toFixed(0) == item.descuentoUnitarioCreacion.toFixed(0);
      this.compraService
        .onSaveCompraItem(compraItem.toInput()).pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoDialogo.closeDialog();
          if (res != null) {
            compraItem.id = res.id;
            item.compraItem = compraItem;
            this.openCompraItemDialog(item.compraItem, item).pipe(untilDestroyed(this)).subscribe((res2) => {
              if (res2 != null) {
                item.compraItem = res2;
                this.dataSource.data = updateDataSource(
                  this.dataSource.data,
                  item,
                  i
                );
              }
            });
          }
        });
    } else {
      this.openCompraItemDialog(item.compraItem, item).pipe(untilDestroyed(this)).subscribe((res2) => {
        if (res2 != null) {
          item.compraItem = res2;
          this.dataSource.data = updateDataSource(
            this.dataSource.data,
            item,
            i
          );
        }
      });
    }
  }

  openCompraItemDialog(compraItem: CompraItem, pedidoItem: PedidoItem): Observable<any> {
    return this.matDialog
      .open(AdicionarDetalleCompraItemDialogComponent, {
        data: {
          compraItem,
          pedidoItem,
          mostrarPrecio: true
        },
        width: "100%",
        disableClose: false,
      })
      .afterClosed();
  }

  onVolver(nuevo?: boolean) {
    if(nuevo) this.matDialogRef.close({nuevo: true});
    this.matDialogRef.close(this.selectedNotaRecepcion);
  }

  onEdit() {
    this.isEditing = true;
    this.formGroup.enable();
    setTimeout(() => {
      this.numeroInput.nativeElement.select();
    }, 100);
  }

  onSave(){
    if(this.selectedNotaRecepcion == null){
      this.selectedNotaRecepcion = new NotaRecepcion();
      this.selectedNotaRecepcion.pedido = this.selectedPedido;
    }
    this.selectedNotaRecepcion.numero = this.numeroControl.value;
    this.selectedNotaRecepcion.fecha = parseShortDate(this.fechaControl.value);
    this.selectedNotaRecepcion.tipoBoleta = this.tipoBoletaControl.value?.toString();
    this.notaRecepcionService.onSaveNotaRecepcion(this.selectedNotaRecepcion.toInput()).pipe(untilDestroyed(this)).subscribe(res => {
      if(res != null){
        this.selectedNotaRecepcion.id = res.id;
        this.matDialogRef.close(this.selectedNotaRecepcion);
      }
    })
  }

  onDateInput(event: any): void {
    this.fechaControl.setValue(formatearFecha(event), {emitEvent: false})
  }

  onFechaEnter(){
    if(this.fechaControl.value != null && validarFecha(this.fechaControl.value)){
      console.log(this.saveBtn);
      this.saveBtn._elementRef.nativeElement.focus();
    } else {
      this.notificacionService.openWarn("Fecha inválida")
      this.fechaInput.nativeElement.select()
    }
  }

  onDelete(){

  }


}
