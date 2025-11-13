import { Injectable, Injector } from "@angular/core";
import { Observable } from "rxjs";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
import { SucursalesGQL } from "./graphql/sucursalesQuery";
import { Sucursal } from "./sucursal.model";

import { HttpClient, HttpHeaders } from "@angular/common/http";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { environment } from "../../../../environments/environment";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { SucursalActualGQL } from "./graphql/sucursalActual";
import { SucursalByIdGQL } from "./graphql/sucursalById";
import { CargandoDialogService } from "../../../shared/components/cargando-dialog/cargando-dialog.service";
import { SearchListDialogComponent, SearchListtDialogData } from "../../../shared/components/search-list-dialog/search-list-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs';
import { SucursalesSearchGQL } from "./graphql/sucursalesSearch";
import { PageInfo } from "../../../app.component";
import { QueryRef } from 'apollo-angular';
import { SaveSucursalGQL } from "./graphql/saveSucursal";
import { DeleteSucursalGQL } from "./graphql/deleteSucursal";
import { DialogosService } from "../../../shared/components/dialogos/dialogos.service";
import { SucursalesByNombreGQL } from "./graphql/sucursalesByNombre";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class SucursalService {
  httpOptions = {
    headers: new HttpHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
  };

  isLoading = false;

  constructor(
    private getAllSucursales: SucursalesGQL,
    private sucursalesSearch: SucursalesSearchGQL,
    private sucursalesByNombre: SucursalesByNombreGQL,
    private notificacionBar: NotificacionSnackbarService,
    private getSucursalActual: SucursalActualGQL,
    private http: HttpClient,
    private injector: Injector,
    private sucursalPorId: SucursalByIdGQL,
    private cargandoService: CargandoDialogService,
    private notificacionSnackBar: NotificacionSnackbarService,
    private genericService: GenericCrudService,
    private matDialog: MatDialog,
    private apollo: Apollo,
    private saveSucursalGQL: SaveSucursalGQL,
    private deleteSucursalGQL: DeleteSucursalGQL,
    private dialogoService: DialogosService
  ) {
  }

  onSearchConFiltros(term: string, deposito: boolean, activo: boolean, pageIndex: number, pageSize: number, servidor: boolean = true): Observable<PageInfo<Sucursal>> {
    return this.genericService.onCustomQuery(
      this.sucursalesByNombre,
      {
        texto: term,
        deposito: deposito,
        activo: activo,
        page: pageIndex,
        size: pageSize
      },
      servidor
    ).pipe(
      map((res: any) => {
        const pageInfo = new PageInfo<Sucursal>();
        pageInfo.getContent = res.getContent || [];
        pageInfo.getTotalElements = res.getTotalElements || 0;
        pageInfo.getNumberOfElements = res.getNumberOfElements || 0;
        pageInfo.getTotalPages = res.getTotalPages || 0;
        pageInfo.isFirst = res.isFirst || false;
        pageInfo.isLast = res.isLast || false;
        pageInfo.hasNext = res.hasNext || false;
        pageInfo.hasPrevious = res.hasPrevious || false;
        if (deposito !== null && deposito !== undefined) {
          pageInfo.getContent = pageInfo.getContent.filter(s => s.deposito === deposito);
          pageInfo.getTotalElements = pageInfo.getContent.length;
          pageInfo.getNumberOfElements = pageInfo.getContent.length;
        }

        return pageInfo;
      })
    );
  }

  onGetSucursal(id, servidor: boolean = true): Observable<Sucursal> {
    return this.genericService.onCustomQuery(this.sucursalPorId, { id }, servidor);
  }

  onGetAllSucursalesByActive(servidor: boolean = true, onlyActive: boolean = false): Observable<Sucursal[]> {
    return this.genericService.onCustomQuery(this.getAllSucursales, {}, servidor).pipe(
      map((sucursales: Sucursal[]) => {
        if (onlyActive) {
          return sucursales.filter(s => s.activo === true && s.id !== 0);
        }
        return sucursales;
      })
    );
  }

  onGetAllSucursales(servidor: boolean = true): Observable<Sucursal[]> {
    return this.genericService.onCustomQuery(this.getAllSucursales, {}, servidor);
  }

  onGetSucursalesActivas(servidor: boolean = true): Observable<Sucursal[]> {
    return this.onGetAllSucursalesByActive(servidor, true);
  }

  onGetSucursalActual(servidor: boolean = true): Observable<Sucursal> {
    return this.genericService.onCustomQuery(this.getSucursalActual, {}, servidor);
  }

  // getSucursalesAdmin(servidor: boolean = true): Observable<any> {
  //   return new Observable((obs) => {
  //     let httpBody = {
  //       nickname: "ADMIN",
  //       password: "ADMIN",
  //     };

  //     // Only proceed with the HTTP request if servidor is true
  //     if (servidor) {
  //       this.http
  //         .post(
  //           `http://${environment['serverIp']}:${environment['serverPort']}/sucursales`,
  //           httpBody,
  //           this.httpOptions
  //         )
  //         .pipe(untilDestroyed(this))
  //         .subscribe({
  //           next: (res) => {
  //             obs.next(res);
  //             obs.complete();
  //           },
  //           error: (error) => {
  //             obs.error(error);
  //             obs.complete();
  //           }
  //         });
  //     } else {
  //       // If servidor is false, return empty or cached data if available
  //       obs.next([]);
  //       obs.complete();
  //     }
  //   });
  // }

  // getSucursalActualAdmin(servidor: boolean = true): Observable<any> {
  //   return new Observable((obs) => {
  //     let httpBody = {
  //       nickname: "ADMIN",
  //       password: "ADMIN",
  //     };

  //     // Only proceed with the HTTP request if servidor is true
  //     if (servidor) {
  //       this.http
  //         .post(
  //           `http://${environment['ip']}:${environment['port']}/public/sucursal-actual`,
  //           httpBody,
  //           this.httpOptions
  //         )
  //         .pipe(untilDestroyed(this))
  //         .subscribe({
  //           next: (res) => {
  //             obs.next(res);
  //             obs.complete();
  //           },
  //           error: (error) => {
  //             obs.error(error);
  //             obs.complete();
  //           }
  //         });
  //     } else {
  //       // If servidor is false, return empty or cached data if available
  //       obs.next(null);
  //       obs.complete();
  //     }
  //   });
  // }

  onSearchSucursal(filtro: any, servidor: boolean = true): Observable<Sucursal[]> {
    return this.genericService.onCustomQuery(this.sucursalesSearch, {
      filtro: filtro,
    }, servidor);
  }

  onSaveSucursal(sucursalInput: any, servidor: boolean = true): Observable<Sucursal> {
    return this.genericService.onSave(this.saveSucursalGQL, sucursalInput, null, null, servidor);
  }

  onDeleteSucursal(id: number, showDialog: boolean = true, servidor: boolean = true): Observable<boolean> {
    return this.genericService.onDelete(this.deleteSucursalGQL, id, "¿Eliminar sucursal?", null, showDialog, servidor, "¿Está seguro que desea eliminar esta sucursal?");
  }

  openSearchDialog(title?: string, message?: string, servidor: boolean = true): Observable<Sucursal> {
    return new Observable((obs) => {
      const dialogData = new SearchListtDialogData();
      dialogData.titulo = title || 'Seleccionar Sucursal';
      dialogData.query = this.sucursalesSearch;
      dialogData.tableData = [
        { id: 'id', nombre: 'Id', width: '5%' },
        { id: 'nombre', nombre: 'Nombre', width: '50%' },
        { id: 'descripcion', nombre: 'Ciudad', width: '22%', nested: true, nestedId: 'ciudad' }
      ];
      dialogData.search = true;
      dialogData.inicialSearch = true;
      dialogData.paginator = false;
      dialogData.isServidor = servidor;
      dialogData.searchFieldName = 'texto';
      dialogData.queryData = { texto: '%' };

      const dialogRef = this.matDialog.open(SearchListDialogComponent, {
        data: dialogData,
        height: '80vh',
        width: '70vw',
        restoreFocus: true
      });

      dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe((result: Sucursal) => {
        if (result) {
          obs.next(result);
        }
        obs.complete();
      });
    });
  }

  toggleSucursalDeposito(sucursal: Sucursal, servidor: boolean = true): Observable<Sucursal> {
    sucursal.deposito = !sucursal.deposito;
    return this.onSaveSucursal(sucursal, servidor);
  }

  configureSucursal(sucursalId: number, ipAddress: string, puerto: string, servidor: boolean = true): Observable<Sucursal> {
    return new Observable((obs) => {
      this.onGetSucursal(sucursalId, servidor).pipe(untilDestroyed(this)).subscribe((sucursal) => {
        if (sucursal) {
          sucursal.ip = ipAddress.toUpperCase();
          sucursal.puerto = Number(puerto);
          sucursal.isConfigured = true;

          this.onSaveSucursal(sucursal, servidor).pipe(untilDestroyed(this)).subscribe({
            next: (updatedSucursal) => {
              this.notificacionBar.notification$.next({
                texto: "Sucursal configurada correctamente",
                color: NotificacionColor.success,
                duracion: 3
              });
              obs.next(updatedSucursal);
              obs.complete();
            },
            error: (err) => {
              this.notificacionBar.notification$.next({
                texto: "Error al configurar sucursal: " + err,
                color: NotificacionColor.danger,
                duracion: 3
              });
              obs.error(err);
              obs.complete();
            }
          });
        } else {
          this.notificacionBar.notification$.next({
            texto: "No se encontró la sucursal",
            color: NotificacionColor.warn,
            duracion: 3
          });
          obs.error("Sucursal no encontrada");
          obs.complete();
        }
      });
    });
  }
}
