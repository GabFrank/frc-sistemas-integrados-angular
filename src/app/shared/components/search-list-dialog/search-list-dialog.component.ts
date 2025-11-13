import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, OnInit, QueryList, ViewChild, ViewChildren, ChangeDetectionStrategy } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatTableDataSource, MatTable } from "@angular/material/table";
import { Query } from "apollo-angular";
import { GenericCrudService } from "../../../generics/generic-crud.service";

export interface TableData {
  id: string
  nombre: string
  width?: string
  nested?: boolean
  nestedId?: string
  nestedColumnId?: string
}

export class SearchListtDialogData {
  titulo: string;
  tableData: TableData[];
  query: Query;
  multiple? = false;
  search? = true;
  inicialSearch? = false;
  inicialData?: any;
  texto?: string;
  isAdicionar?: boolean;
  queryData?: any;
  paginator?: boolean;
  isServidor?: boolean = true;
  searchFieldName?: string;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from "../../../app.component";
import { PageEvent } from "@angular/material/paginator";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-search-list-dialog",
  templateUrl: "./search-list-dialog.component.html",
  styleUrls: ["./search-list-dialog.component.scss"],
  changeDetection: ChangeDetectionStrategy.Default
})
export class SearchListDialogComponent implements OnInit, AfterViewInit {

  @ViewChildren('tableRows', { read: ElementRef }) tableRows: QueryList<ElementRef>;
  @ViewChild('container', { read: ElementRef }) container: ElementRef;
  @ViewChild('table', { static: false }) table: MatTable<any>;

  dataSource = new MatTableDataSource<any>([]);
  buscarControl = new FormControl("");
  displayedColumns = []
  selectedItem;
  queryData: any;
  selectedPageInfo: PageInfo<any> = new PageInfo<any>();
  pageIndex = 0;
  pageSize = 15;


  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SearchListtDialogData,
    private matDialogRef: MatDialogRef<SearchListDialogComponent>,
    private genericCrudService: GenericCrudService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('Inicializando search-list-dialog con data:', data);
    if (data?.inicialData != null) {
      this.dataSource.data = data.inicialData;
    }
    if (data?.queryData != null) {
      this.queryData = data.queryData;
    }
    const searchField = data?.searchFieldName || 'texto';
    if (data?.queryData?.[searchField] != null) {
      this.buscarControl.setValue(data.queryData[searchField])
    } else if (data?.queryData?.texto != null) {
      this.buscarControl.setValue(data?.queryData?.texto)
    }
  }

  ngOnInit(): void {
    this.displayedColumns = [];
    const availableColumns = ['id', 'nombre', 'descripcion', 'codigo', 'documento'];

    this.data?.tableData.forEach(e => {
      const columnId = e.nestedColumnId != null ? e.nestedColumnId : e.id;
      if (availableColumns.includes(columnId)) {
        this.displayedColumns.push(columnId);
      }
    })

    console.log('Columnas a mostrar en ngOnInit:', this.displayedColumns);
    if (this.displayedColumns.length === 0) {
      this.displayedColumns = ['id', 'nombre'];
    }

    if (this.data?.inicialSearch) {
      if (this.data?.texto != null) {
        this.buscarControl.setValue(this.data.texto)
      }
      const searchField = this.data?.searchFieldName || 'texto';
      if (!this.buscarControl.value && this.data?.queryData?.[searchField]) {
        this.buscarControl.setValue(this.data.queryData[searchField]);
      }
      if (!this.buscarControl.value) {
        this.buscarControl.setValue('%');
      }
      setTimeout(() => {
        this.onSearch();
      }, 100);
    }

  }

  ngAfterViewInit(): void {
    this.container.nativeElement.addEventListener("keydown", (e) => {
      if (e.key == 'ArrowUp') {
        this.onArrowDown(true)
      } else if (e.key == 'ArrowDown') {
        this.onArrowDown(false)
      }
    });
  }

  onArrowDown(up: boolean): void {
    if (this.dataSource.data?.length > 0) {
      let currentIndex = this.dataSource.data.indexOf(this.selectedItem);
      if (currentIndex === -1) {
        this.selectedItem = this.dataSource.data[0];
        currentIndex = 0;
      } else {
        currentIndex = up ? currentIndex - 1 : currentIndex + 1;
        if (currentIndex < 0) currentIndex = 0;
        if (currentIndex >= this.dataSource.data.length)
          currentIndex = this.dataSource.data.length - 1;
        this.selectedItem = this.dataSource.data[currentIndex];
      }
      this.tableRows.toArray()[currentIndex].nativeElement.focus();
    }
  }

  onBuscar() {
    this.onSearch()
  }

  onSearch() {
    let text = this.buscarControl.value;
    const searchField = this.data?.searchFieldName || 'texto';
    if (!this.queryData) {
      this.queryData = {};
    }
    if (text != null && text.trim() !== '' && text.trim() !== '%') {
      text = text.toUpperCase();
      this.queryData[searchField] = text;
    } else {
      this.queryData[searchField] = '%';
    }

    if (this.data?.paginator == true) {
      this.queryData.page = this.pageIndex;
      this.queryData.size = this.pageSize;
    }

    this.genericCrudService
      .onCustomQuery(this.data.query, this.queryData, this.data.isServidor).pipe(untilDestroyed(this))
      .subscribe((res) => {
        console.log('Respuesta recibida en search-list-dialog:', res);
        if (res != null) {
          if (this.data?.paginator == true) {
            this.selectedPageInfo = res;
            const content = res?.getContent || [];
            console.log('Contenido a mostrar en tabla:', content);
            console.log('Total elementos:', res?.getTotalElements);
            console.log('Tipo de content:', typeof content, Array.isArray(content));
            console.log('displayedColumns:', this.displayedColumns);
            console.log('Primer elemento del content:', content.length > 0 ? content[0] : 'Sin datos');
            this.dataSource.data = content;
            if (typeof (this.dataSource as any)._updateChangeSubscription === 'function') {
              (this.dataSource as any)._updateChangeSubscription();
            }
            console.log('DataSource.data después de asignar:', this.dataSource.data);
            console.log('DataSource.data.length:', this.dataSource.data.length);
            setTimeout(() => {
              this.cdr.detectChanges();
              if (this.table) {
                this.table.renderRows();
              }
            }, 0);
          } else {
            this.dataSource.data = res || [];
            if (typeof (this.dataSource as any)._updateChangeSubscription === 'function') {
              (this.dataSource as any)._updateChangeSubscription();
            }
            if (this.displayedColumns.length === 0) {
              this.displayedColumns = ['id', 'nombre'];
            }
            setTimeout(() => {
              this.cdr.detectChanges();
              if (this.table) {
                this.table.renderRows();
              }
            }, 0);
          }
        } else {
          console.log('Respuesta es null');
          this.dataSource.data = [];
        }
      });
  }

  onRowSelect(row) {
    if (row == this.selectedItem) this.matDialogRef.close(row)
    this.selectedItem = row;
  }

  onAceptar() {
    this.matDialogRef.close(this.selectedItem)
  }

  onCancelar() {
    this.matDialogRef.close()
  }

  onAdicionar() {
    this.matDialogRef.close({ adicionar: true })
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onSearch();
  }



}
