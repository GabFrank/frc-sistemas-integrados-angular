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
  activoControl = new FormControl(null);

  constructor(
    private matDialog: MatDialog,
    private terminalPosService: TerminalPosService
  ) {
    this.dataSource = new MatTableDataSource<TerminalPos>([]);
    this.displayedColumns = [
      'id',
      'descripcion',
      'codigo',
      'moneda',
      'creadoEn',
      'creadoPor',
      'activo',
      'acciones',
    ];
  }

  ngOnInit(): void {
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
    this.activoControl.setValue(null);
    this.onFilter();
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