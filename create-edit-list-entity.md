# Create or Edit List Component

This rule provides guidelines for creating or modifying list components for entities in the system.

## Component Structure

A list component typically consists of three files:
- `list-[entity-name].component.ts` - TypeScript logic file
- `list-[entity-name].component.html` - HTML template
- `list-[entity-name].component.scss` - Styling (usually minimal)

## TypeScript Implementation

Follow this structure for your TypeScript file:

```typescript
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { MainService } from '../../../../main.service';
import { TabService } from '../../../../layouts/tab/tab.service';
import { ROLES } from '../../roles/roles.enum';
import { updateDataSource, updateDataSourceWithId } from '../../../../commons/core/utils/numbersUtils';
import { PageInfo } from '../../../../app.component';

// Import your entity model, service, and dialogs
import { YourEntity } from '../your-entity.model';
import { YourEntityService } from '../your-entity.service';
// Import any additional components needed (edit dialog, detail view, etc.)

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-[entity-name]',
  templateUrl: './list-[entity-name].component.html',
  styleUrls: ['./list-[entity-name].component.scss'],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      ),
    ]),
  ],
})
export class List[EntityName]Component implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<any>;

  readonly ROLES = ROLES;

  // Define displayed columns based on your entity properties
  displayedColumns = [
    "id",
    // Add other entity properties here
    "usuario",
    "acciones"
  ]

  // Create form controls for filters based on entity attributes
  buscarControl = new FormControl(null);
  // Add other filter controls as needed
  
  dataSource = new MatTableDataSource<YourEntity>([]);
  isLastPage = false;
  isSearching = false;
  expandedEntity: YourEntity;
  timer;
  
  // Add enum lists for select filters if needed
  // enumList = Object.keys(YourEnum)

  length = 25;
  pageSize = 25;
  pageIndex = 0;
  pageEvent: PageEvent;
  selectedPageInfo: PageInfo<YourEntity>;

  constructor(
    private entityService: YourEntityService,
    public mainService: MainService,
    private tabService: TabService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    // Initialize pagination
    setTimeout(() => {
      this.paginator._changePageSize(this.paginator.pageSizeOptions[1])
      this.pageSize = this.paginator.pageSizeOptions[1]
      this.onFiltrar()
    }, 0);

    // Set up search control with debounce
    this.buscarControl.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      this.pageIndex = 0;
      if (this.timer != null) {
        clearTimeout(this.timer);
      }
      if (res != null && res?.length > 0) {
        this.timer = setTimeout(() => {
          this.onFiltrar()
        }, 500);
      } else {
        this.dataSource.data = []
      }
    })
    
    // Subscribe to other filter controls if needed
  }

  onFiltrar() {
    // Call service search method with filters
    this.entityService.onSearchConFiltros(
      this.buscarControl.value, 
      // Add other filter values here
      this.pageIndex, 
      this.pageSize
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if(res != null){
        this.selectedPageInfo = res;
        this.dataSource.data = this.selectedPageInfo?.getContent;
      }
    })
  }

  resetFiltro() {
    this.pageIndex = 0;
    this.dataSource.data = [];
    this.selectedPageInfo = null;
    this.buscarControl.setValue(null)
    // Reset other filter controls
  }

  onEditEntity(entity: YourEntity, i) {
    // Open edit dialog and update datasource when closed
    this.dialog.open(EditEntityDialogComponent, {
      data: {
        entity: entity
      },
      width: '60%',
      disableClose: true
    }).afterClosed().subscribe(res => {
      if (res != null) {
        this.dataSource.data = updateDataSourceWithId(this.dataSource.data, res, entity.id);
        this.table.renderRows();
      }
    })
  }

  onNewEntity() {
    // Open new entity dialog and handle result
    this.dialog.open(EditEntityDialogComponent, {
      width: '60%',
      disableClose: true
    }).afterClosed().subscribe((res: YourEntity) => {
      if (res != null) {
        // Update view with new entity
        this.onFiltrar();
      }
    })
  }

  // Add custom action methods as needed

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }
}
```

## HTML Template

Follow this structure for your HTML template:

```html
<app-generic-list
  [data]="dataSource.data"
  (filtrar)="onFiltrar()"
  (resetFiltro)="resetFiltro()"
  (adicionar)="onNewEntity()"
  [isAdicionar]="true"
>
  <div filtros>
    <div
      fxLayout="row wrap"
      fxLayoutAlign="start center"
      fxLayoutGap="10px"
      style="width: 100%"
    >
      <!-- Main search filter -->
      <div fxFlex="40%">
        <mat-form-field style="width: 90%">
          <mat-label>Search term (customize for your entity)</mat-label>
          <input
            #buscar
            type="text"
            matInput
            [formControl]="buscarControl"
            (keyup.enter)="onFiltrar()"
          />
        </mat-form-field>
      </div>
      
      <!-- Additional filters - add according to entity attributes -->
      <div fxFlex="20%">
        <mat-form-field style="width: 100%">
          <mat-label>Enum filter example</mat-label>
          <mat-select [formControl]="enumFilterControl" name="enumFilter">
            <mat-option [value]="null"> Todas </mat-option>
            <mat-option *ngFor="let item of enumList" [value]="item">
              {{ item | titlecase }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      
      <!-- Other filters (dates, checkboxes, etc.) -->
    </div>
  </div>
  
  <div
    table
    style="height: 100%; background-color: rgb(70, 70, 70)"
    fxLayout="column"
    fxLayoutAlign="space-between start"
  >
    <table
      mat-table
      [dataSource]="dataSource"
      multiTemplateDataRows
      class="mat-elevation-z8"
      style="width: 100%"
    >
      <!-- ID Column -->
      <ng-container matColumnDef="id" style="width: 5%">
        <th mat-header-cell *matHeaderCellDef style="text-align: center; width: 5%">
          Id
        </th>
        <td mat-cell *matCellDef="let entity" style="text-align: center; width: 5%">
          {{ entity?.id }}
        </td>
      </ng-container>

      <!-- Add columns for each entity property -->
      <!-- Example column definition: -->
      <ng-container matColumnDef="propertyName">
        <th mat-header-cell *matHeaderCellDef style="text-align: center">
          Property Label
        </th>
        <td mat-cell *matCellDef="let entity" style="text-align: center">
          {{ entity?.propertyName }}
          <!-- Use pipes if needed: {{ entity?.date | date:'short' }} -->
        </td>
      </ng-container>

      <!-- Action column -->
      <ng-container matColumnDef="acciones">
        <th
          mat-header-cell
          *matHeaderCellDef
          style="width: 5%; text-align: center"
        >
          ...
        </th>
        <td
          mat-cell
          *matCellDef="let entity; let i = index"
          style="text-align: center; width: 5%"
        >
          <button
            mat-icon-button
            [matMenuTriggerFor]="menu"
            (click)="$event.stopPropagation()"
          >
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button
              mat-menu-item
              (click)="onEditEntity(entity, i)"
              *ngIf="mainService.usuarioActual?.roles.includes(ROLES.ADMIN)"
            >
              Editar
            </button>
            <!-- Add more action buttons as needed -->
          </mat-menu>
        </td>
      </ng-container>

      <!-- Row definitions -->
      <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
      <tr
        mat-row
        *matRowDef="let row; columns: displayedColumns; let i = dataIndex"
      ></tr>

      <!-- Expandable row detail (optional) -->
      <ng-container matColumnDef="expandedDetail">
        <td
          mat-cell
          *matCellDef="let entity"
          [attr.colspan]="displayedColumns.length"
          class="expanded"
        >
          <div
            class="example-entity-detail"
            [@detailExpand]="
              entity == expandedEntity ? 'expanded' : 'collapsed'
            "
            style="text-align: center"
            fxLayout="column"
            fxLayoutAlign="start start"
          >
            <!-- Expanded detail content goes here -->
          </div>
        </td>
      </ng-container>
      <tr
        mat-row
        *matRowDef="let row; columns: ['expandedDetail']"
        class="example-detail-row"
      ></tr>
    </table>
    
    <!-- Pagination -->
    <mat-paginator
      itemsPerPageLabel="Itens por pagina"
      [pageSizeOptions]="[15, 25, 50, 100]"
      (page)="handlePageEvent($event)"
      [length]="selectedPageInfo?.getTotalElements"
      style="width: 100%"
      showFirstLastButtons
    ></mat-paginator>
  </div>
</app-generic-list>
```

## SCSS Styling

Basic styling for your component:

```scss
table {
    width: 100%;
}

tr.example-detail-row {
    height: 0;
}

input {
    text-transform: uppercase;
}

// Add custom styling as needed
```

## Service Implementation

Make sure your entity service includes a search method that supports pagination and filtering:

```typescript
onSearchConFiltros(term, filter1, pageIndex, pageSize): Observable<PageInfo<YourEntity>> {
  return this.genericService.onSearch(this.searchQuery, 
    { 
      texto: term, 
      filter1: filter1,
      page: pageIndex,
      size: pageSize
    });
}
```

## Recommendations

1. **Column Definitions**: Create columns based on the most important entity attributes. Don't show all fields if there are many.

2. **Filters**: Include filters for the most common search criteria. Always include a text search for main identifiers.

3. **Actions**: Define appropriate actions (edit, view details, delete, etc.) based on user roles.

4. **Pagination**: Always implement pagination for performance with large data sets.

5. **Expandable Rows**: Use expandable rows for showing additional details when needed.

6. **Responsive Design**: Consider responsive layout for different screen sizes.

7. **Error Handling**: Implement proper error handling for API requests.

## Example Reference

See the implemented list-clientes component for a complete working example:
- `list-clientes.component.ts`
- `list-clientes.component.html`
- `list-clientes.component.scss`

## SolicitudPago Example

For a more specific example, see the implemented SolicitudPago list component which shows how to:

1. Create filters for enum types (Estado, Tipo)
2. Display date fields with proper formatting
3. Set up multiple filters that work together
4. Handle entity-specific fields and relationships

Files:
- `list-solicitud-pago.component.ts`
- `list-solicitud-pago.component.html`
- `list-solicitud-pago.component.scss` 