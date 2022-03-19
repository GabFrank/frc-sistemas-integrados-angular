import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormControlName } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { Observable } from "rxjs";
import { updateDataSource } from "../../../../../commons/core/utils/numbersUtils";
import { PedidoItem } from "../../edit-pedido/pedido-item.model";
import { Pedido } from "../../edit-pedido/pedido.model";
import { PedidoService } from "../../pedido.service";
import { NotaRecepcion } from "../nota-recepcion.model";
import { NotaRecepcionService } from "../nota-recepcion.service";

class AdicionarNotaRecepcionItemData {
  notaRecepcion: NotaRecepcion;
}

export class SelectedItem {
  pedidoItem: PedidoItem;
  selected = false;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-adicionar-nota-recepcion-item-dialog",
  templateUrl: "./adicionar-nota-recepcion-item-dialog.component.html",
  styleUrls: ["./adicionar-nota-recepcion-item-dialog.component.scss"],
})
export class AdicionarNotaRecepcionItemDialogComponent implements OnInit {
  selectedNotaRecepcion: NotaRecepcion;

  displayedColumns = [
    "id",
    "producto",
    "presentacion",
    "cantidad",
    "precioUnitario",
    "descuentoUnitario",
    "valorTotal",
    "select",
  ];

  dataSource = new MatTableDataSource<SelectedItem>([]);

  selectAllControl = new FormControl(false);
  selectItemControl = new FormControl();
  selectedPedido: Pedido;
  itensSobrantes: PedidoItem[];

  selectedItems: SelectedItem[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarNotaRecepcionItemData,
    private matDialogRef: MatDialogRef<AdicionarNotaRecepcionItemDialogComponent>,
    private pedidoService: PedidoService,
    private notaRecepcionService: NotaRecepcionService
  ) {
    if (data?.notaRecepcion != null) {
      this.cargarDatos();
      this.getSobrantes();
    }
  }

  ngOnInit(): void {
    this.selectedItems = [];
  }

  cargarDatos() {
    this.selectedNotaRecepcion = this.data.notaRecepcion;
    if (this.selectedNotaRecepcion.pedidoItemList != null) {
      this.selectedNotaRecepcion.pedidoItemList.forEach((e) => {
        let item = new SelectedItem();
        item.pedidoItem = e;
        item.selected = true;
        this.dataSource.data = updateDataSource(this.dataSource.data, item);
      });
    }
  }

  //sobrantes son los itens del pedido que aun no fueron vinculados a una nota
  getSobrantes() {
    this.pedidoService
      .onGetPedidoItemSobrantes(this.selectedNotaRecepcion.pedido.id).pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          res.forEach((e) => {
            let item = new SelectedItem();
            item.pedidoItem = e;
            item.selected = false;
            this.dataSource.data = updateDataSource(this.dataSource.data, item);
          });
        }
      });
  }

  setAll(checked) {
    let arr = this.dataSource.data;
    arr.forEach((e) => {
      e.selected = !checked;
      this.onRowClick(e);
    });
  }

  onRowClick(item: SelectedItem) {
    let arr = this.dataSource.data;
    let index = arr.findIndex((e) => e.pedidoItem.id == item.pedidoItem.id);
    item.selected = !item.selected;
    arr[index] = item;
    this.dataSource.data = arr;
  }

  onCancelar() {
    this.matDialogRef.close();
  }

  onAceptar() {
    let addItems: PedidoItem[] = [];
    let removeItems: PedidoItem[] = [];
    this.dataSource.data.forEach((e) => {
      let pedidoItem = new PedidoItem();
      Object.assign(pedidoItem, e.pedidoItem);
      if (e.selected == true) {
        addItems.push(pedidoItem);
      } else {
        removeItems.push(pedidoItem);
      }
    });

    this.onAddItens(addItems).pipe(untilDestroyed(this)).subscribe(res => {
      console.log('adding items')
      if(res){
        this.onRemoveItens(removeItems).pipe(untilDestroyed(this)).subscribe(res => {
          console.log('remov items')
          this.matDialogRef.close(addItems)
        })
      }
    })
  }

  onAddItens(addItems): Observable<boolean> {
    let length = addItems.length;
    let count = 0;
    return new Observable((obs) => {
      if (length > 0) {
        addItems.forEach((i) => {
          if (i?.notaRecepcion == null) {
            this.pedidoService
              .onUpdateNotaRecepcionId(i.id, this.selectedNotaRecepcion.id).pipe(untilDestroyed(this))
              .subscribe((res) => {
                console.log(res)
                count++;
                if (length == count) {
                  obs.next(true);
                }
              });
          } else {
            count++;
            if (length == count) {
              obs.next(true);
            }
          }
        });
      } else {
        obs.next(true);
      }
    });
  }

  onRemoveItens(removeItems): Observable<boolean> {
    let length = removeItems.length;
    let count = 0;
    return new Observable((obs) => {
      if (length > 0) {
        removeItems.forEach((i) => {
          if (i?.notaRecepcion != null) {
            this.pedidoService
              .onUpdateNotaRecepcionId(i.id, null).pipe(untilDestroyed(this))
              .subscribe((res) => {
                console.log(res)
                count++;
                if (length == count) {
                  obs.next(true);
                }
              });
          } else {
            count++;
            if (length == count) {
              obs.next(true);
            }
          }
        });
      } else {
        obs.next(true);
      }
    });
  }
}
