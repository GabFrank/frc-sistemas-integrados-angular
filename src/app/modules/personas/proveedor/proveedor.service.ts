import { Injectable } from "@angular/core";
import { Observable, switchMap } from "rxjs";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { ProveedoresSearchByPersonaGQL } from "./graphql/proveedorSearchByPersona";
import { SaveProveedorGQL } from "./graphql/saveProveedor";
import { Proveedor } from "./proveedor.model";
import { ProveedorByIdGQL } from "./graphql/proveedorById";
import { ProveedorPorPersonaGQL } from "./graphql/proveedorPorPersona";
import { MatDialog } from "@angular/material/dialog";
import {
  SearchListDialogComponent,
  SearchListtDialogData,
  TableData,
} from "../../../shared/components/search-list-dialog/search-list-dialog.component";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { AdicionarProveedorDialogComponent } from "./adicionar-proveedor-dialog/adicionar-proveedor-dialog.component";
import { ProveedoresSearchByPersonaPageGQL } from "./graphql/proveedorSearchByPersonaPage";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class ProveedorService {
  constructor(
    private genericService: GenericCrudService,
    public proveedorSearch: ProveedoresSearchByPersonaGQL,
    private saveProveedor: SaveProveedorGQL,
    private proveedorPorId: ProveedorByIdGQL,
    private proveedorPorPersona: ProveedorPorPersonaGQL,
    private proveedorSearchByPersonaPage: ProveedoresSearchByPersonaPageGQL,
    private dialog: MatDialog
  ) {}

  onSearch(text: string): Observable<Proveedor[]> {
    return this.genericService.onGetByTexto(this.proveedorSearch, text);
  }

  onSave(input): Observable<Proveedor> {
    return this.genericService.onSave(this.saveProveedor, input);
  }

  onGetPorId(id: number): Observable<Proveedor> {
    return this.genericService.onGetById(this.proveedorPorId, id);
  }

  onGetPorPersona(id: number): Observable<Proveedor> {
    return this.genericService.onCustomQuery(this.proveedorPorPersona, {
      personaId: id,
    });
  }

  onSearchProveedorPorTexto(texto: string): Observable<Proveedor> {
    let tableData: TableData[] = [
      {
        id: "id",
        nombre: "Id",
      },
      {
        id: "persona.nombre",
        nombre: "Razon Social",
      },
      {
        id: "persona.apodo",
        nombre: "Nombre Comercial",
      },
      {
        id: "persona.documento",
        nombre: "RUC/CI",
      },
    ];

    let data: SearchListtDialogData = {
      query: this.proveedorSearchByPersonaPage,
      tableData: tableData,
      titulo: "Buscar proveedor",
      search: true,
      texto: texto,
      inicialSearch: texto != null && texto.trim() !== "",
      isAdicionar: true,
      paginator: true,
      queryData: {
        texto: texto,
        page: 0,
        size: 10,
      },
    };

    // Return an observable that chains the dialog operations
    return new Observable<Proveedor>((observer) => {
      this.dialog
        .open(SearchListDialogComponent, {
          data: data,
          width: "60%",
          height: "80%",
        })
        .afterClosed()
        .pipe(
          // Handle the result of the first dialog
          switchMap((res) => {
            if (res != null) {
              if (res["adicionar"] === true) {
                // If "adicionar", open the AdicionarProveedorDialogComponent
                return this.dialog
                  .open(AdicionarProveedorDialogComponent, { width: "600px" })
                  .afterClosed();
              } else if (res?.id != null) {
                // If a valid result is selected, emit it as an observable
                return new Observable<Proveedor>((obs) => {
                  obs.next(res);
                  obs.complete();
                });
              }
            }
            // If no valid result, return an empty observable
            return new Observable<Proveedor>((obs) => {
              obs.complete();
            });
          })
        )
        .subscribe({
          next: (result) => {
            if (result) {
              observer.next(result); // Emit the result to the observer
            }
          },
          error: (err) => {
            observer.error(err); // Forward any errors
          },
          complete: () => {
            observer.complete(); // Signal completion
          },
        });
    });
  }
}
