import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, OnInit, QueryList, ViewChild, ViewChildren, ChangeDetectionStrategy } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatTableDataSource, MatTable } from "@angular/material/table";
import { Query } from "apollo-angular";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SelectionModel } from "@angular/cdk/collections";
import { Observable } from "rxjs";
import { timeout, catchError, skip } from 'rxjs/operators';
import { PaginacionLista } from "../paginacion/paginacion-lista";

/**
 * Interfaz que define la estructura de los datos de una columna en la tabla
 * @property id - Identificador único del campo. Para campos anidados, usar notación de puntos (ej: 'pedido.proveedor.persona.nombre').
 * @property nombre - Nombre/título que se mostrará en la columna
 * @property width - Ancho de la columna (opcional)
 * @property nested - Si true, la columna muestra un objeto anidado (usar con nestedId/nestedColumnId)
 * @property nestedId - (Legacy) Primera parte del objeto anidado. La nueva forma es usar notación de puntos en `id`.
 * @property nestedColumnId - ID personalizado para la columna
 * @property pipe - Nombre del pipe a aplicar al valor (ej: 'date', 'number', 'currency')
 * @property pipeArgs - Argumentos para el pipe (ej: 'shortDate', '1.0-2')
 */
export interface TableData {
  id: string
  nombre: string
  width?: string
  nested?: boolean
  nestedId?: string
  nestedColumnId?: string
  pipe?: string
  pipeArgs?: string
}

export class SearchListtDialogData {
  titulo: string;
  tableData: TableData[];
  query: Query;
  multiple? = false;
  seleccionadosIniciales?: any[];
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
  fallbackToLocal?: boolean = false;
  /**
   * Predicado opcional para descartar filas que no se deben poder elegir en esta pantalla
   * (ej. funcionarios inactivos al cargar un bono). Sin filtro, la lista no cambia.
   */
  filtro?: (item: any) => boolean;
  /** Texto del boton de confirmacion en modo multiple. Default: 'Aplicar filtro' */
  labelAceptar?: string;
  /**
   * Con `query` e `inicialData`: la busqueda sin texto vuelve a mostrar `inicialData` (una lista
   * sugerida) en vez de traer todo del servidor; con texto se busca en el servidor como siempre.
   */
  inicialDataSiVacio?: boolean;
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
  /** Modo `paginator: true`: el central pagina; esto guarda página, tamaño y total (#772). */
  readonly pag = new PaginacionLista<any>({
    cargar: (page, size) => this.consultar({ ...this.armarQueryData(), page, size }),
    pageSize: 15,
  });
  seleccionadosMap = new Map<number, any>();

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

    // Modo paginado: cada página que llega (o el fallo) se dibuja en la misma tabla.
    if (data?.paginator === true) {
      this.pag.estado$.pipe(skip(1), untilDestroyed(this)).subscribe(e => {
        this.isLoadingComputed = e.cargando;
        if (!e.cargando) this.mostrarFilas(e.items);
        this.updateComputedProperties();
      });
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
    this.displayedColumns = [];
    this.data?.tableData.forEach(e => {
      const columnId = e.nestedColumnId != null ? e.nestedColumnId : e.id;
      this.displayedColumns.push(columnId);
    })

    console.log('Columnas a mostrar en ngOnInit:', this.displayedColumns);
    if (this.displayedColumns.length === 0) {
      this.displayedColumns = ['id', 'nombre'];
    }

    if (this.data?.multiple) {
      this.displayedColumns = ['seleccion', ...this.displayedColumns];
      (this.data.seleccionadosIniciales || []).forEach((item) => {
        if (item?.id != null) {
          this.seleccionadosMap.set(item.id, item);
        }
      });
    }

    // **PERFORMANCE**: Initialize computed properties
    this.updateComputedProperties();

    // Perform initial search if configured
    if (this.data?.inicialSearch) {
      if (this.data?.texto != null) {
        this.buscarControl.setValue(this.data.texto);
      }
      const searchField = this.data?.searchFieldName || 'texto';
      if (!this.buscarControl.value && this.data?.queryData?.[searchField]) {
        const prefillValue = this.data.queryData[searchField];
        // Never show '%' in the input - it's used internally for "search all"
        this.buscarControl.setValue(prefillValue === '%' ? '' : prefillValue);
      }
      // Do NOT set '%' in the input - user should see empty field; '%' is passed only to the query in onSearch()
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

  /** Buscar o Enter: un filtro nuevo, que en modo paginado arranca en la página 1. */
  onBuscar(): void {
    this.onSearch();
  }

  onSearch(): void {
    if (this.data?.query == null) {
      this.filterLocalData();
      return;
    }

    const textoActual = String(this.buscarControl.value ?? '').trim();
    if (this.data?.inicialDataSiVacio && (textoActual === '' || textoActual === '%')) {
      this.filterLocalData();
      return;
    }

    if (this.data?.paginator == true) {
      // PaginacionLista descarta la respuesta de una búsqueda o página vieja: gana la última pedida.
      this.pag.filtrar();
      return;
    }

    // Sin paginar: una búsqueda en curso descarta la nueva.
    if (this.isSearching) {
      return;
    }
    this.isSearching = true;
    this.isLoadingComputed = true;
    this.updateComputedProperties();

    const finishSearch = () => {
      this.isSearching = false;
      this.isLoadingComputed = false;
      this.updateComputedProperties();
    };

    this.consultar(this.armarQueryData()).pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        this.procesarResultados(res);
        finishSearch();
      },
      error: (error) => {
        console.error('Search error:', error);
        this.dataSource.data = [];
        finishSearch();
      }
    });
  }

  /** Los parámetros de la consulta con el texto del buscador ('%' = todos), en mayúsculas. */
  private armarQueryData(): any {
    const searchField = this.data?.searchFieldName || 'texto';
    if (!this.queryData) {
      this.queryData = {};
    }
    const text = this.buscarControl.value;
    this.queryData[searchField] = text != null && String(text).trim() !== '' && String(text).trim() !== '%'
      ? String(text).toUpperCase()
      : '%';
    return this.queryData;
  }

  /** La consulta al servidor; con `fallbackToLocal`, si el central no responde en 5 s se pregunta a la local. */
  private consultar(queryData: any): Observable<any> {
    if (this.data?.fallbackToLocal) {
      return this.genericCrudService
        .onCustomQuery(this.data.query, queryData, true, { networkError: { propagate: true, show: false } }, true)
        .pipe(
          timeout(5000),
          catchError(err => {
            console.warn('Búsqueda en servidor central falló, intentando en local...', err);
            return this.genericCrudService.onCustomQuery(this.data.query, queryData, false, undefined, true);
          })
        );
    }
    return this.genericCrudService.onCustomQuery(this.data.query, queryData, this.data.isServidor);
  }

  private filterLocalData(): void {
    const baseData = Array.isArray(this.data?.inicialData) ? this.data.inicialData : [];
    let text = this.buscarControl.value;

    if (text == null || String(text).trim() === '' || String(text).trim() === '%') {
      this.dataSource.data = [...baseData];
    } else {
      text = String(text).toUpperCase();
      this.dataSource.data = baseData.filter(item => this.matchesLocalSearch(item, text));
    }

    this.selectedItem = null;
    this.procesarResultados(this.dataSource.data);
  }

  private matchesLocalSearch(item: any, text: string): boolean {
    const fields = this.data?.tableData?.map(c => c.id) || ['id', 'nombre'];
    return fields.some(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], item);
      return value != null && String(value).toUpperCase().includes(text);
    });
  }

  /** Resultado sin paginar (una lista). */
  private procesarResultados(res: any): void {
    this.mostrarFilas(res ?? []);
  }

  private mostrarFilas(filas: any[]): void {
    this.dataSource.data = this.data?.filtro ? (filas || []).filter(this.data.filtro) : (filas || []);
    if (typeof (this.dataSource as any)._updateChangeSubscription === 'function') {
      (this.dataSource as any)._updateChangeSubscription();
    }
    setTimeout(() => {
      this.cdr.detectChanges();
      if (this.table) {
        this.table.renderRows();
      }
    }, 0);
    this.cdr.markForCheck();
  }

  onRowSelect(row): void {
    if (this.data?.multiple) {
      this.toggleSeleccion(row);
      this.selectedItem = row;
      this.updateComputedProperties();
      return;
    }

    if (row == this.selectedItem) {
      // Double-click behavior: close dialog with selection
      this.matDialogRef.close(row)
      return;
    }

    this.selectedItem = row;
    this.updateComputedProperties();
  }

  toggleSeleccion(item: any, event?: Event): void {
    event?.stopPropagation();
    if (item?.id == null) return;
    if (this.seleccionadosMap.has(item.id)) {
      this.seleccionadosMap.delete(item.id);
    } else {
      this.seleccionadosMap.set(item.id, item);
    }
    this.updateComputedProperties();
    this.cdr.markForCheck();
  }

  isSeleccionado(item: any): boolean {
    return item?.id != null && this.seleccionadosMap.has(item.id);
  }

  cantidadSeleccionados(): number {
    return this.seleccionadosMap.size;
  }

  onAplicarFiltro(): void {
    this.matDialogRef.close(Array.from(this.seleccionadosMap.values()));
  }

  onAceptar(): void {
    if (this.data?.multiple) {
      this.onAplicarFiltro();
      return;
    }
    this.matDialogRef.close(this.selectedItem)
  }

  onCancelar(): void {
    this.matDialogRef.close()
  }

  onAdicionar() {
    this.matDialogRef.close({ adicionar: true })
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
    this.hasSelectedItemComputed = this.data?.multiple
      ? this.seleccionadosMap.size > 0
      : this.selectedItem != null;

    // Pagination
    this.showPaginatorComputed = this.data?.paginator === true;

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
   * Clear search and reset to initial state
   */
  clearSearch(): void {
    this.buscarControl.setValue('');
    this.selectedItem = null;
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