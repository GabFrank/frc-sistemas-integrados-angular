import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, OnInit, QueryList, ViewChild, ViewChildren, ChangeDetectionStrategy } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatTableDataSource, MatTable } from "@angular/material/table";
import { Query } from "apollo-angular";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SelectionModel } from "@angular/cdk/collections";
import { PageInfo } from "../../../app.component";
import { PageEvent } from "@angular/material/paginator";

/**
 * Interfaz que define la estructura de los datos de una columna en la tabla
 * @property id - Identificador único del campo. Para campos anidados, usar notación de puntos (ej: 'pedido.proveedor.persona.nombre').
 * @property nombre - Nombre/título que se mostrará en la columna
 * @property width - Ancho de la columna (opcional)
 * @property nestedId - (Legacy) Primera parte del objeto anidado. La nueva forma es usar notación de puntos en `id`.
 * @property nestedColumnId - ID personalizado para la columna
 * @property pipe - Nombre del pipe a aplicar al valor (ej: 'date', 'number', 'currency')
 * @property pipeArgs - Argumentos para el pipe (ej: 'shortDate', '1.0-2')
 */
export interface TableData {
  id: string
  nombre: string
  width?: string
  nestedColumnId?: string
  pipe?: string
  pipeArgs?: string
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
  textHint?: string;
}

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

  // **PERFORMANCE**: Computed properties for template usage (avoid getters/functions in template)
  dialogTitleComputed = '';
  hasDataComputed = false;
  isLoadingComputed = false;
  hasSelectedItemComputed = false;
  showPaginatorComputed = false;
  showAdicionarButtonComputed = false;
  searchPlaceholderComputed = '';

  // **PERFORMANCE**: Loading states
  private isSearching = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SearchListtDialogData,
    private matDialogRef: MatDialogRef<SearchListDialogComponent>,
    private genericCrudService: GenericCrudService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize display columns
    data?.tableData.forEach(e => {
      this.displayedColumns.push(e.id);
    });
    
    // Set initial data if provided
    if (data?.inicialData != null) {
      this.dataSource.data = data.inicialData;
    }
    
    // Initialize query data
    if (data?.queryData != null) {
      this.queryData = data.queryData;
    }
    
    // Set initial search text
    const searchField = data?.searchFieldName || 'texto';
    if (data?.queryData?.[searchField] != null) {
      this.buscarControl.setValue(data.queryData[searchField]);
    } else if (data?.queryData?.texto != null) {
      this.buscarControl.setValue(data.queryData.texto);
    }
  }

  ngOnInit(): void {
    // **PERFORMANCE**: Initialize computed properties
    this.updateComputedProperties();
    
    // Perform initial search if configured
    if (this.data?.inicialSearch) {
      if (this.data?.texto != null) {
        this.buscarControl.setValue(this.data.texto);
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
    // Setup keyboard navigation for table rows
    this.container.nativeElement.addEventListener("keydown", (e) => {
      if (e.key == 'ArrowUp') {
        this.onArrowDown(true)
      } else if (e.key == 'ArrowDown') {
        this.onArrowDown(false)
      }
    });

    // this.tableRows.changes.subscribe(() => {
    //   this.focusRow(0); // Whenever the rows change, reset the focus to the first row
    // });
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
      
      // **PERFORMANCE**: Update computed properties after selection change
      this.updateComputedProperties();
    }
  }

  onBuscar(): void {
    this.onSearch()
  }

  onSearch(): void {
    // **PERFORMANCE**: Prevent multiple simultaneous searches
    if (this.isSearching) {
      return;
    }

    this.isSearching = true;
    this.isLoadingComputed = true;
    this.updateComputedProperties();

    let text = this.buscarControl.value;
    if (text != null) text = text.toUpperCase();
    
    const searchField = this.data?.searchFieldName || 'texto';
    
    if (this.queryData != null && text != null) {
      this.queryData[searchField] = text;
    } else if (this.queryData != null) {
      this.queryData[searchField] = '%';
    }
    
    if (this.data?.paginator == true) {
      this.queryData.page = this.pageIndex;
      this.queryData.size = this.pageSize;
    }
    
    this.genericCrudService
      .onCustomQuery(this.data.query, this.queryData, this.data.isServidor).pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          if (res != null) {
            if (this.data?.paginator == true) {
              this.selectedPageInfo = res;
              this.dataSource.data = this.selectedPageInfo?.getContent;
            } else {
              this.dataSource.data = res;
            }
          }
          this.isSearching = false;
          this.isLoadingComputed = false;
          this.updateComputedProperties();
        },
        error: (error) => {
          console.error('Search error:', error);
          this.dataSource.data = [];
          this.isSearching = false;
          this.isLoadingComputed = false;
          this.updateComputedProperties();
        }
      });
  }

  onRowSelect(row): void {
    if (row == this.selectedItem) {
      // Double-click behavior: close dialog with selection
      this.matDialogRef.close(row)
      return;
    }
    
    this.selectedItem = row;
    this.updateComputedProperties();
  }

  onAceptar(): void {
    this.matDialogRef.close(this.selectedItem)
  }

  onCancelar(): void {
    this.matDialogRef.close()
  }

  onAdicionar() {
    this.matDialogRef.close({adicionar: true})
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onSearch();
  }

  /**
   * **PERFORMANCE**: Update computed properties for template usage
   * This avoids function calls and getters in templates which cause performance issues
   */
  private updateComputedProperties(): void {
    // Dialog title
    this.dialogTitleComputed = this.data?.titulo || 'Buscar';
    
    // Data state
    this.hasDataComputed = this.dataSource.data.length > 0;
    
    // Selection state
    this.hasSelectedItemComputed = this.selectedItem != null;
    
    // Pagination
    this.showPaginatorComputed = this.data?.paginator === true && this.selectedPageInfo != null;
    
    // Adicionar button
    this.showAdicionarButtonComputed = this.data?.isAdicionar === true;
    
    // Search placeholder
    this.searchPlaceholderComputed = this.data?.textHint || this.data?.searchFieldName || 'Ingrese texto para buscar...';
  }

  /**
   * **PERFORMANCE**: Method to check if an item is selected (for template usage)
   */
  isItemSelected(item: any): boolean {
    return this.selectedItem === item;
  }

  /**
   * **PERFORMANCE**: Method to get total elements count (for template usage)
   */
  getTotalElementsCount(): number {
    return this.selectedPageInfo?.getTotalElements || 0;
  }

  /**
   * Clear search and reset to initial state
   */
  clearSearch(): void {
    this.buscarControl.setValue('');
    this.selectedItem = null;
    this.pageIndex = 0;
    this.dataSource.data = this.data?.inicialData || [];
    this.updateComputedProperties();
  }

  /**
   * Focus on search input field
   */
  focusSearchField(): void {
    const searchInput = this.container?.nativeElement?.querySelector('input[matInput]');
    if (searchInput) {
      searchInput.focus();
    }
  }
}