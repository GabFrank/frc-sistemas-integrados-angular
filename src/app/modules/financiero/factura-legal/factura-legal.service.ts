import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { NotificacionSnackbarService } from "../../../notificacion-snackbar.service";
import {
  FacturaLegal,
  FacturaLegalInput,
  FacturaLegalItemInput,
  ResumenFacturasDto,
} from "./factura-legal.model";
import { ImprimirFacturasPorCajaGQL } from "./graphql/imprimirFacturas";
import { SaveFacturaLegalGQL } from "./graphql/saveFactura";
import { FacturasLegalesGQL } from "./graphql/allFacturas";
import { dateToString } from "../../../commons/core/utils/dateUtils";
import { FacturaLegalPorIdGQL } from "./graphql/facturaPorId";
import { FacturasLegalesFullInfoGQL } from "./graphql/allFacturasFullInfo";
import { ImprimirFacturaGQL } from "./graphql/imprimirFactura";
import { environment } from "../../../../environments/environment";
import { CrearExcelService } from "../../../shared/crear-excel/crear-excel.service";
import { removeSecondDigito } from "../../../commons/core/utils/rucUtils";
import { ResumenFacturasGQL } from "./graphql/resumenFacturas";
import { GenerarExcelFacturasGQL } from "./graphql/generarExcelFacturas";
import { GenerarExcelFacturasZipGQL } from "./graphql/generarExcelFacturasZip";

@Injectable({
  providedIn: "root",
})
export class FacturaLegalService {
  constructor(
    private saveFactura: SaveFacturaLegalGQL,
    private genericService: GenericCrudService,
    private notificacionService: NotificacionSnackbarService,
    private imprimirFacturasPorCaja: ImprimirFacturasPorCajaGQL,
    private allFacturas: FacturasLegalesGQL,
    private facturaLegalPorId: FacturaLegalPorIdGQL,
    private allFacturasFullInfo: FacturasLegalesFullInfoGQL,
    private imprimirFactura: ImprimirFacturaGQL,
    private crearExcelService: CrearExcelService,
    private getResumenFacturas: ResumenFacturasGQL,
    private generarExcelFacturasZip: GenerarExcelFacturasZipGQL,
    private generarExcelFacturas: GenerarExcelFacturasGQL
  ) {}

  onSaveFactura(
    input: FacturaLegalInput,
    facturaLegalItemInputList: FacturaLegalItemInput[]
  ): Observable<any> {
    if (input?.nombre != null) input.nombre = input.nombre.toUpperCase();
    return this.genericService.onSaveConDetalle(
      this.saveFactura,
      input,
      facturaLegalItemInputList,
      null,
      environment["printers"]["ticket"],
      environment["pdvId"]
    );
  }

  onImprimirFacturasPorCaja(id: number) {
    return this.genericService
      .onCustomQuery(this.imprimirFacturasPorCaja, {
        id: id,
        printerName: environment["printers"]["ticket"],
      })
      .subscribe((res) => {
        if (res) {
          this.notificacionService.openGuardadoConExito();
        }
      });
  }

  onReimprimirFactura(id: number, sucId: number) {
    return this.genericService
      .onCustomQuery(this.imprimirFactura, {
        id,
        sucId,
        printerName: environment["printers"]["ticket"],
      })
      .subscribe((res) => {
        if (res) {
          this.notificacionService.openGuardadoConExito();
        }
      });
  }

  onGetAllFacturasLegales(
    page,
    size,
    fechaInicio: string,
    fechaFin: string,
    sucId?: number[],
    ruc?: string,
    nombre?: string,
    iva5?: boolean,
    iva10?: boolean,
    full?: boolean
  ) {
    return this.genericService.onCustomQuery(
      full == true ? this.allFacturasFullInfo : this.allFacturas,
      {
        page,
        size,
        fechaInicio,
        fechaFin,
        sucId,
        ruc,
        nombre,
        iva5,
        iva10,
      }
    );
  }

  onGetFacturaLegal(id, sucId): Observable<FacturaLegal> {
    return this.genericService.onGetById(this.facturaLegalPorId, id, sucId);
  }

  onGenerarExcelFacturas(
    fechaInicio: string,
    fechaFin: string,
    sucId?: number
  ): Observable<string> {
    return this.genericService.onCustomQuery(this.generarExcelFacturas, {
      fechaInicio,
      fechaFin,
      sucId,
    });
  }

  onGenerarExcelFacturasZip(
    fechaInicio: string,
    fechaFin: string,
    sucId?: number[]
  ): Observable<string> {
    return this.genericService.onCustomQuery(this.generarExcelFacturasZip, {
      fechaInicio,
      fechaFin,
      sucId,
    });
  }

  onGetResumenFacturas(
    fechaInicio: string,
    fechaFin: string,
    sucId?: number[],
    ruc?: string,
    nombre?: string,
    iva5?: boolean,
    iva10?: boolean
  ): Observable<ResumenFacturasDto> {
    return this.genericService.onCustomQuery(this.getResumenFacturas, {
      fechaInicio,
      fechaFin,
      sucId,
      ruc,
      nombre,
      iva5,
      iva10,
    });
  }
}



