import { Component, Inject, OnInit } from "@angular/core";
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
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-search-list-dialog",
  templateUrl: "./search-list-dialog.component.html",
  styleUrls: ["./search-list-dialog.component.scss"],
})
export class SearchListDialogComponent implements OnInit {
  dataSource = new MatTableDataSource<any>([]);
  buscarControl = new FormControl("");
  displayedColumns = []
  selectedItem;

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

  onBuscar() {
    this.onSearch()
  }

  onSearch() {
    let text = this.buscarControl.value;
    if (text != null) text = text.toUpperCase()
    this.genericCrudService
      .onGetByTexto(this.data.query, text).pipe(untilDestroyed(this))
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
}
