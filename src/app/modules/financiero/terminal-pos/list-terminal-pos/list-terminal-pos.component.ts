import { Component, OnInit } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { GenericList } from "../../../../generics/generic-list-model";
import { TerminalPos } from "../terminal-pos.model";
import { MatTableDataSource } from "@angular/material/table";
import { PaginacionLista } from "../../../../shared/components/paginacion/paginacion-lista";
import { FormControl } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { AddTerminalPosDialogComponent } from "../add-terminal-pos-dialog/add-terminal-pos-dialog.component";
import { PrintTerminalPosDialogComponent } from "../print-terminal-pos-dialog/print-terminal-pos-dialog.component";
import { TerminalPosService } from "../terminal-pos.service";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { ConfigurarTerminalPosDialogComponent } from "../configurar-terminal-pos-dialog/configurar-terminal-pos-dialog.component";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { NotificacionColor, NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { timer } from "rxjs";
import { avisoTrasMutacion, erroresDeRechazo, RECARGA_TRAS_CORTE_MS } from "../../../../commons/core/utils/graphqlErrorUtils";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-terminal-pos',
  templateUrl: './list-terminal-pos.component.html',
  styleUrls: ['./list-terminal-pos.component.scss']
})
export class ListTerminalPosComponent implements OnInit, GenericList<TerminalPos> {

  dataSource: MatTableDataSource<TerminalPos>;
  selectedEntity: TerminalPos;
  expandedElement: TerminalPos;
  displayedColumns: string[];
  isLastPage: boolean = false;
  page = 0;

  /** Terminales paginadas en el central (#772): cada página con los filtros a la vista. */
  pag: PaginacionLista<TerminalPos> = new PaginacionLista<TerminalPos>({
    cargar: (page, size) => this.terminalPosService.onFilter(
      this.descripcionControl.value,
      this.codigoControl.value,
      this.serieControl.value,
      this.sucursalControl.value,
      this.activoControl.value,
      page,
      size
    ),
    pageSize: 15,
    alCargar: (res) => this.dataSource.data = res.getContent ?? [],
    alFallar: (filtroNuevo) => {
      if (filtroNuevo) this.dataSource.data = [];
    },
  });
  descripcionControl = new FormControl(null);
  codigoControl = new FormControl(null);
  serieControl = new FormControl(null);
  sucursalControl = new FormControl(null);
  activoControl = new FormControl(null);
  sucursales: Sucursal[] = [];

  constructor(
    private matDialog: MatDialog,
    private terminalPosService: TerminalPosService,
    private sucursalService: SucursalService,
    private dialogosService: DialogosService,
    private notificacionSnackbar: NotificacionSnackbarService
  ) {
    this.dataSource = new MatTableDataSource<TerminalPos>([]);
    this.displayedColumns = [
      'id',
      'descripcion',
      'codigo',
      'serie',
      'sucursal',
      'formato',
      'moneda',
      'proveedorServicio',
      'creadoEn',
      'creadoPor',
      'activo',
      'acciones',
    ];
  }

  ngOnInit(): void {
    this.sucursalService.onGetAllSucursales(true)
      .pipe(untilDestroyed(this))
      .subscribe(res => { this.sucursales = res ?? []; });
    this.onGetData();
  }
  
  cargarMasDatos(): void {
    this.onGetData();
   }
  
  /** Repite la página a la vista (después de crear, editar o borrar). */
  onGetData(): void {
    // El service arma su GenericCrudService en un setTimeout: se pide en el ciclo siguiente.
    setTimeout(() => this.pag.recargar(), 0);
  }

  onRowClick(entity: TerminalPos, index: any): void {
    throw new Error('Method not implemented.');
  }

  onDelete(entity: TerminalPos, index: any): void {
    this.terminalPosService
      .onDelete(entity.id)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.onGetData();
        }
      });
  }

  onAddOrEdit(entity?: TerminalPos, index?: any): void {
    this.matDialog.open(AddTerminalPosDialogComponent, {
      data: {
        terminalPos: entity,
      },
      disableClose: true,
      width: '400px',
      autoFocus: true,
      restoreFocus: true,
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.onGetData();
      }
    })
  }
  /** Filtrar vuelve a la página 1. */
  onFilter(): void {
    this.pag.filtrar();
  }

  onLimpiarFiltros(): void {
    this.descripcionControl.setValue("");
    this.codigoControl.setValue("");
    this.serieControl.setValue("");
    this.sucursalControl.setValue(null);
    this.activoControl.setValue(null);
    this.onFilter();
  }

  /**
   * Configuracion por aparato: si se puede tipear el cupon a mano y que campos son obligatorios
   * en esta terminal.
   */
  onConfigurar(entity: TerminalPos): void {
    this.matDialog.open(ConfigurarTerminalPosDialogComponent, {
      data: { terminalPos: entity },
      width: '520px',
      disableClose: false,
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.onGetData();
    });
  }

  /**
   * Saca el formato de una terminal.
   *
   * **Le bloquea la venta con tarjeta a esa caja**, asi que se confirma con el motivo a la vista.
   * Es el unico camino para dejarla sin formato: `saveTerminalPos` no lo toca si el campo no va,
   * justamente para que omitirlo no apague una caja por accidente.
   */
  onDesasignarFormato(entity: TerminalPos): void {
    if (!entity?.formatoTerminalPos) return;
    this.dialogosService.confirm(
      'Quitar el formato de esta terminal',
      `"${entity.descripcion}" usa el formato "${entity.formatoTerminalPos.nombre}".`,
      'Sin formato, esta caja NO va a poder cobrar con tarjeta en esta terminal hasta que un ' +
      'administrador le asigne otro. ¿Quitarlo igual?',
      null
    ).pipe(untilDestroyed(this)).subscribe(confirmado => {
      if (!confirmado) return;
      this.terminalPosService
        .onDesasignarFormato(entity.id)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (res) => {
            if (res) {
              this.notificacionSnackbar.notification$.next({
                color: NotificacionColor.warn,
                texto: `"${entity.descripcion}" quedó sin formato: no puede cobrar con tarjeta.`,
                duracion: 6,
              });
              this.onGetData();
            } else {
              // false: la terminal ya no existe. Antes quedaba en silencio (#501)
              this.notificacionSnackbar.openWarn('No se pudo quitar el formato: no se encontró la terminal.');
              this.onGetData();
            }
          },
          // En un rechazo el genérico ya mostró el motivo. Sin respuesta pudo quitarse y la fila seguiría mostrando el
          // formato: se avisa y se recarga cuando el central tuvo tiempo (#501)
          error: (e) => {
            if (erroresDeRechazo(e) != null) {
              return;
            }
            const aviso = avisoTrasMutacion(e, 'se quitó el formato');
            if (aviso != null) {
              this.notificacionSnackbar.openWarn(aviso, 8);
            }
            timer(RECARGA_TRAS_CORTE_MS).pipe(untilDestroyed(this)).subscribe(() => this.onGetData());
          },
        });
    });
  } 

  onPrintCode(entity: TerminalPos): void {
    this.matDialog.open(PrintTerminalPosDialogComponent, {
      data: {
        terminalPos: entity,
      },
      width: '400px',
      autoFocus: false,
      restoreFocus: true,
    });
  }
}