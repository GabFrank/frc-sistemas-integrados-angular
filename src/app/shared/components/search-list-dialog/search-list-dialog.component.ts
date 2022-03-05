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
}

export class SearchListtDialogData {
  titulo: string;
  tableData: TableData[];
  query: Query;
  multiple? = false;
  search? = true;
  inicialSearch? = false;
}

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
    console.log(data.titulo)
    data?.tableData.forEach(e => {
      this.displayedColumns.push(e.id)
    })
  }

  ngOnInit(): void {
    if(this.data?.inicialSearch){
      this.onSearch();
    }
  }

  onBuscar(){
    this.onSearch()
  }

  onSearch() {
    this.genericCrudService
      .onGetByTexto(this.data.query, this.buscarControl.value)
      .subscribe((res) => {
        if (res != null) {
          this.dataSource.data = res;
        }
      });
  }

  onRowSelect(row){
    if(row==this.selectedItem) this.matDialogRef.close(row)
    this.selectedItem = row;
  }

  onAceptar(){
    this.matDialogRef.close(this.selectedItem)
  }

  onCancelar(){
    this.matDialogRef.close()
  }
}
