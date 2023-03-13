import { FlatTreeControl } from "@angular/cdk/tree";
import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from "@angular/material/tree";
import { updateDataSource } from "../../../../commons/core/utils/numbersUtils";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { WindowInfoService } from "../../../../shared/services/window-info.service";
import { AdicionarTipoGastoDialogComponent } from "../adicionar-tipo-gasto-dialog/adicionar-tipo-gasto-dialog.component";
import { TipoGastoService } from "../tipo-gasto.service";
import { TipoGasto } from "./tipo-gasto.model";

interface ExampleFlatNode {
  expandable: boolean;
  name: string;
  level: number;
  id?: number;
  parent?: TipoGasto;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-list-tipo-gastos",
  templateUrl: "./list-tipo-gastos.component.html",
  styleUrls: ["./list-tipo-gastos.component.scss"],
})
export class ListTipoGastosComponent implements OnInit {
  selectedTipoGasto: TipoGasto;
  selectedNode: ExampleFlatNode;
  treeHeight;
  containerHeight;

  displayedClasificacionGastoColumns = [
    "id",
    "descripcion",
    "autorizacion",
    "cargo",
    "activo",
    "acciones",
  ];
  displayedGastoColumns = [
    "id",
    "descripcion",
    "clasificacion",
    "autorizacion",
    "cargo",
    "activo",
    "acciones",
  ];

  constructor(
    private tipoGastoService: TipoGastoService,
    private windowInfoService: WindowInfoService,
    private matDialog: MatDialog,
    private cargandoService: CargandoDialogService
  ) {
    this.treeHeight = windowInfoService.innerTabHeight * 0.8;
    this.containerHeight = windowInfoService.innerTabHeight;
  }

  ngOnInit(): void {
    this.cargarTipoGastos(false);
  }

  cargarTipoGastos(update?: boolean, tipoGasto?: TipoGasto) {
    this.cargandoService.openDialog();
    this.tipoGastoService.onGetRoot().pipe(untilDestroyed(this)).subscribe((res) => {
      this.cargandoService.closeDialog();
      if (res != null) {
        this.dataSource.data = res;
        this.treeControl.collapseAll();
        if (update) {
          let nodes = this.treeControl.dataNodes;
          nodes.find((e) => {
            if (
              e?.parent != null &&
              e.parent.id === tipoGasto?.clasificacionGasto?.id
            ) {
              this.expandAnsestrales(e, nodes);
            }
          });
        }
      }
    });
  }

  //funcionnes del tree
  private _transformer = (node: TipoGasto, level: number) => {
    return {
      expandable: !!node.subtipoList && node.subtipoList.length > 0,
      name: node.descripcion,
      level: level,
      id: node.id,
      parent: node?.clasificacionGasto,
    };
  };

  treeControl = new FlatTreeControl<ExampleFlatNode>(
    (node) => node.level,
    (node) => node.expandable
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    (node) => node.level,
    (node) => node.expandable,
    (node) => node.subtipoList
  );

  onSelectNode(node) {
    this.selectedNode = node;
    this.getTipoGastoDetail(node);
  }

  getTipoGastoDetail(node: ExampleFlatNode) {
    this.tipoGastoService.onGetById(node.id).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
        this.selectedTipoGasto = res;
      }
    });
  }

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;

  addNewItem() {
    let node = this.selectedNode;
    this.matDialog
      .open(AdicionarTipoGastoDialogComponent, {
        data: {
          parent: node,
        },
        width: "50%",
        disableClose: true,
        restoreFocus: true,
        autoFocus: true,
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          if (node == undefined) {
            this.dataSource.data = updateDataSource(this.dataSource.data, res);
          } else {
            this.cargarTipoGastos(true, res);
          }
        }
      });
  }

  editItem() {
    let node = this.selectedNode;
    this.cargandoService.openDialog();
    this.tipoGastoService.onGetById(node.id).pipe(untilDestroyed(this)).subscribe((res) => {
      this.cargandoService.closeDialog();
      if (res != null) {
        this.matDialog
          .open(AdicionarTipoGastoDialogComponent, {
            data: {
              tipoGasto: res,
              parent: node,
            },
            width: "50%",
            disableClose: true,
            restoreFocus: true,
            autoFocus: true,
          })
          .afterClosed().pipe(untilDestroyed(this))
          .subscribe((res) => {
            if (res != null) {
              if(res == 'delete'){
                this.deleteFromDataSource(node);
              } else if (node == undefined) {
                this.dataSource.data = updateDataSource(
                  this.dataSource.data,
                  res
                );
              } else {
                this.cargarTipoGastos(true, res);
              }
            }
          });
      }
    });
  }

  deleteFromDataSource(node: ExampleFlatNode){
    let index = this.treeControl.dataNodes.findIndex(e => e.id == node.id)
    console.log('eliminando ', node)
    this.treeControl.dataNodes[index] = null; 
  }

  expandAnsestrales(node: ExampleFlatNode, nodes: ExampleFlatNode[]) {
    if (node.parent != null) {
      this.expandAnsestrales(
        nodes.find((e) => e.id == node.parent.id),
        nodes
      );
    }
    this.treeControl.expand(node);
  }

  //

}
