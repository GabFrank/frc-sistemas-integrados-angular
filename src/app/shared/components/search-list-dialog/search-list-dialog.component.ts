import { AfterViewInit, Component, ElementRef, Inject, OnInit, QueryList, ViewChild, ViewChildren } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { Query } from "apollo-angular";
import { GenericCrudService } from "../../../generics/generic-crud.service";

export interface TableData {
  id: string
  nombre: string
  width?: string
  nested?: boolean
  nestedId?: string
}

export class SearchListtDialogData {
  titulo: string;
  tableData: TableData[];
  query: Query;
  multiple?= false;
  search?= true;
  inicialSearch?= false;
  inicialData?: any;
  texto?: string;
  isAdicionar?: boolean;
  queryData?: any;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SelectionModel } from "@angular/cdk/collections";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-search-list-dialog",
  templateUrl: "./search-list-dialog.component.html",
  styleUrls: ["./search-list-dialog.component.scss"],
})
export class SearchListDialogComponent implements OnInit, AfterViewInit {

  @ViewChildren('tableRows', { read: ElementRef }) tableRows: QueryList<ElementRef>;
  @ViewChild('container', { read: ElementRef }) container: ElementRef;

  dataSource = new MatTableDataSource<any>([]);
  buscarControl = new FormControl("");
  displayedColumns = []
  selectedItem;
  queryData;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SearchListtDialogData,
    private matDialogRef: MatDialogRef<SearchListDialogComponent>,
    private genericCrudService: GenericCrudService
  ) {
    data?.tableData.forEach(e => {
      this.displayedColumns.push(e.id)
    })
    if (data?.inicialData != null) {
      this.dataSource.data = data.inicialData;
    }
    if(data?.queryData != null){
      this.queryData = data.queryData;
    }
  }

  ngOnInit(): void {
    if (this.data?.inicialSearch) {
      if (this.data?.texto != null) {
        this.buscarControl.setValue(this.data.texto)
      }
      setTimeout(() => {
        this.onSearch();
      }, 500);
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
    }
  }

  onBuscar() {
    this.onSearch()
  }

  onSearch() {
    let text = this.buscarControl.value;
    if (text != null) text = text.toUpperCase()
    if( this.queryData!=null && text != null){
      this.queryData.texto = text;
    } else {
      this.queryData = {texto: text}
    }
    this.genericCrudService
      .onCustomQuery(this.data.query, this.queryData).pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.dataSource.data = res;
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
    this.matDialogRef.close({adicionar: true})
  }


}
