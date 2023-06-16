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
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

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

  selectedNotaRecepcion: NotaRecepcion;
  selectedPedido: Pedido;
  selectedDocumento: Documento;
  numeroControl = new FormControl(null, Validators.required);
  timbradoControl = new FormControl();
  documentoControl = new FormControl(null, Validators.required);
  formGroup: FormGroup;
  isEditar = false;

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
    private cargandoDialogo: CargandoDialogService
  ) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      numero: this.numeroControl,
      timbrado: this.timbradoControl,
      documento: this.documentoControl,
    });

    this.documentoList = [];
    this.documentoService.onGetDocumentos().pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
        this.documentoList = res;
        this.onSelectDocumento(this.documentoList[0]);
      }
    });

    setTimeout(() => {
      this.tipoMatSelect._elementRef.nativeElement.focus();
    }, 200);

    if (this.data.pedido != null) {
      this.selectedPedido = this.data.pedido;
    }

    if (this.data.notaRecepcion != null) {
      this.cargarDatos();
    }
  }

  cargarDatos() {
    this.isEditar = true;
    if (this.data.notaRecepcion != null) {
      this.selectedNotaRecepcion = this.data.notaRecepcion;
      this.onSelectDocumento(this.selectedNotaRecepcion.documento);
      this.numeroControl.setValue(this.selectedNotaRecepcion.numero);
      this.timbradoControl.setValue(this.selectedNotaRecepcion.timbrado);
      this.formGroup.disable();
      this.dataSource.data = this.selectedNotaRecepcion.pedidoItemList;
    }
  }

  onSelectDocumento(documento: Documento) {
    if (documento != null) {
      this.selectedDocumento = documento;
      this.documentoControl.setValue(this.selectedDocumento.id);
    }
  }

  onSelectItens() {
    if (this.selectedNotaRecepcion == null) {
      this.onGuardarNota().pipe(untilDestroyed(this)).subscribe((res) => {
        if (res) {
          this.openAddNotaItemDialog();
        } else {
        }
      });
    } else {
      this.openAddNotaItemDialog();
    }
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
      this.timbradoInput.nativeElement.focus();
    } else if (this.selectedDocumento.descripcion == "COMUN") {
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

  onGuardarNota(): Observable<boolean> {
    return new Observable((obs) => {
      let nota = new NotaRecepcion();
      if (this.selectedNotaRecepcion != null) {
        nota.id = this.selectedNotaRecepcion.id;
        nota.creadoEn = this.selectedNotaRecepcion.creadoEn;
        nota.usuario = this.selectedNotaRecepcion.usuario;
      }
      nota.pedido = this.selectedPedido;
      nota.numero = this.numeroControl.value;
      nota.documento = this.selectedDocumento;
      nota.timbrado = this.timbradoControl.value;
      this.notaRecepcionService
        .onSaveNotaRecepcion(nota.toInput()).pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res != null) {
            nota.id = res.id;
            this.selectedNotaRecepcion = nota;
            this.isEditar = false;
            obs.next(true);
          } else {
            obs.next(true);
            this.isEditar = true;
          }
        });
    });
  }

  onGuardarItem(nuevaLista: SelectedItem[]) {}

  onModificar(item: PedidoItem, i) {
    if (item.compraItem == null) {
      let compraItem = new CompraItem();
      compraItem.compra = this.selectedPedido.compra;
      compraItem.pedidoItem = item;
      compraItem.cantidad = item.cantidad;
      compraItem.precioUnitario = item.precioUnitario;
      compraItem.producto = item.producto;
      compraItem.presentacion = item.presentacion;
      compraItem.descuentoUnitario = item.descuentoUnitario;
      compraItem.bonificacion =
        item.precioUnitario == 0 ||
        item.precioUnitario.toFixed(0) == item.descuentoUnitario.toFixed(0);
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

  onVolver() {
    this.matDialogRef.close(this.dataSource.data);
  }

  onEditar() {}


}
