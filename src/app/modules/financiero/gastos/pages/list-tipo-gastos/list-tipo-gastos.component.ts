import { FlatTreeControl } from "@angular/cdk/tree";
import { ChangeDetectionStrategy, Component, OnInit, inject } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from "@angular/material/tree";
import { updateDataSource } from "../../../../../commons/core/utils/numbersUtils";
import { WindowInfoService } from "../../../../../shared/services/window-info.service";
import { AdicionarTipoGastoDialogComponent } from "../../dialogs/adicionar-tipo-gasto-dialog/adicionar-tipo-gasto-dialog.component";
import { GastoService } from "../../service/gasto.service";
import { TipoGasto } from "../../models/tipo-gasto.model";

export interface NodoTipoGasto {
  expandible: boolean;
  nombre: string;
  nivel: number;
  id?: number;
  padre?: TipoGasto;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: "app-list-tipo-gastos",
  templateUrl: "./list-tipo-gastos.component.html",
  styleUrls: ["./list-tipo-gastos.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListTipoGastosComponent implements OnInit {
  private gastoService = inject(GastoService);
  private windowInfoService = inject(WindowInfoService);
  private matDialog = inject(MatDialog);

  public tipoGastoSeleccionado$ = new BehaviorSubject<TipoGasto | null>(null);
  public nodoSeleccionado$ = new BehaviorSubject<NodoTipoGasto | null>(null);
  public cargando$ = new BehaviorSubject<boolean>(false);

  alturaArbol = this.windowInfoService.innerTabHeight * 0.85;
  alturaContenedor = this.windowInfoService.innerTabHeight;

  private transformador = (nodo: TipoGasto, nivel: number): NodoTipoGasto => {
    return {
      expandible: !!nodo.subtipoList && nodo.subtipoList.length > 0,
      nombre: nodo.descripcion,
      nivel: nivel,
      id: nodo.id,
      padre: nodo?.clasificacionGasto,
    };
  };

  controlArbol = new FlatTreeControl<NodoTipoGasto>(
    (nodo) => nodo.nivel,
    (nodo) => nodo.expandible
  );

  aplanadorArbol = new MatTreeFlattener(
    this.transformador,
    (nodo) => nodo.nivel,
    (nodo) => nodo.expandible,
    (nodo) => nodo.subtipoList
  );

  fuenteDatos = new MatTreeFlatDataSource(this.controlArbol, this.aplanadorArbol);

  tieneHijos = (_: number, nodo: NodoTipoGasto) => nodo.expandible;

  ngOnInit(): void {
    this.cargarTipoGastos(false);
  }

  cargarTipoGastos(actualizar?: boolean, tipoGasto?: TipoGasto): void {
    this.cargando$.next(true);
    this.gastoService.tipoGastoOnGetRoot()
      .pipe(
        untilDestroyed(this),
        finalize(() => this.cargando$.next(false))
      )
      .subscribe((res) => {
        if (res != null) {
          this.fuenteDatos.data = res;
          this.controlArbol.collapseAll();
          if (actualizar) {
            const nodos = this.controlArbol.dataNodes;
            nodos.find((e) => {
              if (e?.padre != null && e.padre.id === tipoGasto?.clasificacionGasto?.id) {
                this.expandirAncestros(e, nodos);
              }
            });
          }
        }
      });
  }

  seleccionarNodo(nodo: NodoTipoGasto): void {
    this.nodoSeleccionado$.next(nodo);
    this.obtenerDetalleTipoGasto(nodo);
  }

  obtenerDetalleTipoGasto(nodo: NodoTipoGasto): void {
    this.gastoService.tipoGastoOnGetById(nodo.id!)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.tipoGastoSeleccionado$.next(res);
        }
      });
  }

  agregarNuevo(): void {
    const nodo = this.nodoSeleccionado$.value;
    this.matDialog
      .open(AdicionarTipoGastoDialogComponent, {
        data: { parent: nodo },
        width: "50%",
        disableClose: true,
        restoreFocus: true,
        autoFocus: true,
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          if (nodo == null) {
            this.fuenteDatos.data = updateDataSource(this.fuenteDatos.data, res);
          } else {
            this.cargarTipoGastos(true, res);
          }
        }
      });
  }

  editarItem(): void {
    const nodo = this.nodoSeleccionado$.value;
    if (!nodo || !nodo.id) return;

    this.gastoService.tipoGastoOnGetById(nodo.id)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.matDialog
            .open(AdicionarTipoGastoDialogComponent, {
              data: {
                tipoGasto: res,
                parent: nodo,
              },
              width: "50%",
              disableClose: true,
              restoreFocus: true,
              autoFocus: true,
            })
            .afterClosed()
            .pipe(untilDestroyed(this))
            .subscribe((dialogRes) => {
              if (dialogRes != null) {
                if (dialogRes === 'delete') {
                  this.eliminarDeFuenteDatos(nodo);
                  this.tipoGastoSeleccionado$.next(null);
                  this.nodoSeleccionado$.next(null);
                } else if (nodo == null) {
                  this.fuenteDatos.data = updateDataSource(this.fuenteDatos.data, dialogRes);
                } else {
                  this.cargarTipoGastos(true, dialogRes);
                }
              }
            });
        }
      });
  }

  eliminarDeFuenteDatos(nodo: NodoTipoGasto): void {
    const indice = this.controlArbol.dataNodes.findIndex(e => e.id === nodo.id);
    if (indice > -1) {
      this.controlArbol.dataNodes[indice] = null;
      // Trigger update
      this.fuenteDatos.data = [...this.fuenteDatos.data];
    }
  }

  expandirAncestros(nodo: NodoTipoGasto, nodos: NodoTipoGasto[]): void {
    if (nodo.padre != null) {
      const padre = nodos.find((e) => e.id === nodo.padre!.id);
      if (padre) {
        this.expandirAncestros(padre, nodos);
      }
    }
    this.controlArbol.expand(nodo);
  }
}
