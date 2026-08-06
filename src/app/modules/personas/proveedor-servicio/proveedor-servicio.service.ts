import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { UntilDestroy } from "@ngneat/until-destroy";
import { Observable, switchMap } from "rxjs";
import { map } from "rxjs/operators";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import {
  SearchListDialogComponent,
  SearchListtDialogData,
  TableData,
} from "../../../shared/components/search-list-dialog/search-list-dialog.component";
import { EditProveedorServicioComponent } from "./edit-proveedor-servicio/edit-proveedor-servicio.component";
import { DeleteProveedorServicioGQL } from "./graphql/deleteProveedorServicio";
import { ProveedorServicioByIdGQL } from "./graphql/proveedorServicioById";
import { ProveedorServicioPorPersonaGQL } from "./graphql/proveedorServicioPorPersona";
import { ProveedorServicioSearchPageGQL } from "./graphql/proveedorServicioSearchPage";
import { SaveProveedorServicioGQL } from "./graphql/saveProveedorServicio";
import { ProveedorServicio } from "./proveedor-servicio.model";

export interface ProveedorServicioPageResult {
  getContent?: ProveedorServicio[];
  getTotalElements?: number;
}

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class ProveedorServicioService {
  constructor(
    private genericService: GenericCrudService,
    private proveedorServicioSearchPage: ProveedorServicioSearchPageGQL,
    private proveedorServicioPorId: ProveedorServicioByIdGQL,
    private proveedorServicioPorPersona: ProveedorServicioPorPersonaGQL,
    private saveProveedorServicio: SaveProveedorServicioGQL,
    private deleteProveedorServicio: DeleteProveedorServicioGQL,
    private dialog: MatDialog
  ) {}

  onGetPaginated(
    page: number,
    size: number,
    texto?: string
  ): Observable<ProveedorServicioPageResult> {
    return this.genericService
      .onCustomQuery(
        this.proveedorServicioSearchPage,
        { texto: texto?.trim() || null, page, size },
        true,
        null,
        true
      )
      .pipe(
        map((pageResult: ProveedorServicioPageResult) => ({
          getContent: pageResult?.getContent ?? [],
          getTotalElements: pageResult?.getTotalElements ?? 0,
        }))
      );
  }

  onGetPorId(id: number): Observable<ProveedorServicio> {
    return this.genericService.onGetById(this.proveedorServicioPorId, id);
  }

  onGetPorPersona(id: number): Observable<ProveedorServicio> {
    return this.genericService.onCustomQuery(this.proveedorServicioPorPersona, {
      personaId: id,
    });
  }

  onSave(input): Observable<ProveedorServicio> {
    return this.genericService.onSave(this.saveProveedorServicio, input);
  }

  onDelete(id: number): Observable<boolean> {
    return this.genericService.onDelete(
      this.deleteProveedorServicio,
      id,
      "Eliminar proveedor de servicio",
      null,
      true,
      true,
      "¿Realmente desea eliminar este proveedor de servicio?"
    );
  }

  /**
   * Selector reutilizable (lupa) para elegir un proveedor de servicio.
   * Lo usa el diálogo de terminal POS.
   */
  onSearchProveedorServicioPorTexto(
    texto: string
  ): Observable<ProveedorServicio> {
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
        id: "persona.documento",
        nombre: "RUC/CI",
      },
      {
        id: "nombreContacto",
        nombre: "Contacto",
      },
      {
        id: "numeroContacto",
        nombre: "Nro. contacto",
      },
    ];

    let data: SearchListtDialogData = {
      query: this.proveedorServicioSearchPage,
      tableData: tableData,
      titulo: "Buscar proveedor de servicio",
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

    return new Observable<ProveedorServicio>((observer) => {
      this.dialog
        .open(SearchListDialogComponent, {
          data: data,
          width: "60%",
          height: "80%",
        })
        .afterClosed()
        .pipe(
          switchMap((res) => {
            if (res != null) {
              if (res["adicionar"] === true) {
                return this.dialog
                  .open(EditProveedorServicioComponent, {
                    width: "600px",
                    data: {},
                  })
                  .afterClosed();
              } else if (res?.id != null) {
                return new Observable<ProveedorServicio>((obs) => {
                  obs.next(res);
                  obs.complete();
                });
              }
            }
            return new Observable<ProveedorServicio>((obs) => {
              obs.complete();
            });
          })
        )
        .subscribe({
          next: (result) => {
            if (result) {
              const proveedorServicio =
                result?.proveedorServicio ?? result;
              if (proveedorServicio?.id) {
                observer.next(proveedorServicio);
              }
            }
          },
          error: (err) => {
            observer.error(err);
          },
          complete: () => {
            observer.complete();
          },
        });
    });
  }
}
