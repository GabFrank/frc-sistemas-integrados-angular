import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { MainService } from "../../../../main.service";
import { Producto } from "../../producto/producto.model";
import { ProductoService } from "../../producto/producto.service";

class Data {
  producto: Producto;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-search-envase-dialog",
  templateUrl: "./search-envase-dialog.component.html",
  styleUrls: ["./search-envase-dialog.component.scss"],
})
export class SearchEnvaseDialogComponent implements OnInit {
  @ViewChild("buscarInput", { static: true }) buscarInput: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  buscarField = new FormControl(null);
  dataSource = new MatTableDataSource<Producto>([]);
  selectedEnvase: Producto;
  displayedColumns = ["id", "descripcion", "precioPrincipal"];
  isSearching = false;
  onSearchTimer;
  selectedRowIndex;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Data,
    private dialogRef: MatDialogRef<SearchEnvaseDialogComponent>,
    private mainService: MainService,
    private service: ProductoService
  ) {}

  ngOnInit(): void {
    this.buscarField.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      if (value != null) this.onSearchProducto(value);
    });

    setTimeout(() => {
      this.buscarInput.nativeElement.focus();
    }, 100);
  }

  onSearchProducto(text: string, offset?: number) {
    this.isSearching = true;
    if (this.onSearchTimer != null) {
      clearTimeout(this.onSearchTimer);
    }
    this.onSearchTimer = setTimeout(() => {
      this.service.onEnvaseSearch(text, offset, true).pipe(untilDestroyed(this)).subscribe((res) => {
        if (offset == null) {
          console.log("offset es nulo");
          this.dataSource.data = res;
        } else {
          console.log("offset es: ", offset);
          const arr = [...this.dataSource.data.concat(res)];
          this.dataSource.data = arr;
        }
        this.isSearching = false;
      });
    }, 1000);
  }

  onRowClick(envase: Producto){
    this.dialogRef.close(envase)
  }

  highlight(row: any, i?) {
    this.onRowClick(row);
    this.selectedRowIndex = i;
  }

  arrowUpEvent() {
    if (this.selectedRowIndex > 0) {
      // if(this.selectedRowIndex-1 == this.paginator.pageSize){
      //   this.paginator.nextPage()
      // }
      this.selectedRowIndex--;
      var nextrow = this.dataSource.data[this.selectedRowIndex];
      // this.expandedProducto = nextrow;
    }
    this.highlight(nextrow, this.selectedRowIndex);
  }

  arrowDownEvent() {
    console.log(
      this.selectedRowIndex,
      this.paginator.pageSize,
      this.dataSource?.data.length - 1
    );
    if (this.selectedRowIndex < this.dataSource?.data.length - 1) {
      if (this.selectedRowIndex + 1 == this.paginator.pageSize) {
        this.paginator.nextPage();
      }
      this.selectedRowIndex++;
      var nextrow = this.dataSource.data[this.selectedRowIndex];
      // this.expandedProducto = nextrow;
    }
    this.highlight(nextrow, this.selectedRowIndex);
  }
cargarMasDatos() {
    this.onSearchProducto(this.buscarField.value, this.dataSource.data.length);
  }
}
