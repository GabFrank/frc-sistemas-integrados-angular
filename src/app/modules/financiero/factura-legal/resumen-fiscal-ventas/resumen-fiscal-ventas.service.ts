import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../../generics/generic-crud.service";
import {
  ImprimirResumenFiscalVentasGQL,
  ResumenFiscalVentasGQL,
} from "../graphql/resumen-fiscal-ventas.gql";
import { ResumenFiscalVentas } from "./resumen-fiscal-ventas.model";

@Injectable({ providedIn: "root" })
export class ResumenFiscalVentasService {
  private genericService = inject(GenericCrudService);
  private resumenGQL = inject(ResumenFiscalVentasGQL);
  private imprimirGQL = inject(ImprimirResumenFiscalVentasGQL);

  /** sucIds vacío = todas las sucursales. */
  obtenerResumen(anio: number, mes: number, sucIds: number[]): Observable<ResumenFiscalVentas> {
    return this.genericService.onCustomQuery(
      this.resumenGQL,
      { anio, mes, sucIds: sucIds?.length ? sucIds.map(String) : null },
      true,
      null,
      true
    );
  }

  /** PDF en base64. */
  imprimir(anio: number, mes: number, sucIds: number[]): Observable<string> {
    return this.genericService.onCustomQuery(
      this.imprimirGQL,
      { anio, mes, sucIds: sucIds?.length ? sucIds.map(String) : null },
      true
    );
  }
}
