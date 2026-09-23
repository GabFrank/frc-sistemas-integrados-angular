import { Component, OnInit, ViewChild } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { GenericList } from "../../../../generics/generic-list-model";
import { TerminalPos } from "../terminal-pos.model";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { FormControl } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { AddTerminalPosDialogComponent } from "../add-terminal-pos-dialog/add-terminal-pos-dialog.component";
import { PrintTerminalPosDialogComponent } from "../print-terminal-pos-dialog/print-terminal-pos-dialog.component";
import { PageInfo } from "../../../../app.component";
import { TerminalPosService } from "../terminal-pos.service";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { ConfigurarTerminalPosDialogComponent } from "../configurar-terminal-pos-dialog/configurar-terminal-pos-dialog.component";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { NotificacionColor, NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";

@UntilDestroy()
@Component({
  selector: 'app-list-terminal-pos',
  templateUrl: './list-terminal-pos.component.html',
  styleUrls: ['./list-terminal-pos.component.scss']
})
export class ListTerminalPosComponent implements OnInit, GenericList<TerminalPos> {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  dataSource: MatTableDataSource<TerminalPos>;
  selectedEntity: TerminalPos;
  expandedElement: TerminalPos;
  displayedColumns: string[];
  isLastPage: boolean = false;
  page = 0;
  pageIndex = 0;
  pageSize = 15;
  selectedPageInfo: PageInfo<TerminalPos>;
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
  
  onGetData(): void {
    setTimeout(() => {
      this.terminalPosService
        .onFilter(
          this.descripcionControl.value,
          this.codigoControl.value,
          this.serieControl.value,
          this.sucursalControl.value,
          this.activoControl.value,
          this.pageIndex,
          this.pageSize
        )
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          if (res != null) {
            this.selectedPageInfo = res;
            this.dataSource.data = res.getContent;
          }
        })
    }, 0);
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onGetData();
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
  onFilter(): void {
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.onGetData();
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
        .subscribe(res => {
          if (res) {
            this.notificacionSnackbar.notification$.next({
              color: NotificacionColor.warn,
              texto: `"${entity.descripcion}" quedó sin formato: no puede cobrar con tarjeta.`,
              duracion: 6,
            });
            this.onGetData();
          }
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