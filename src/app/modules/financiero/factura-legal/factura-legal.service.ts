import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { catchError, timeout } from "rxjs/operators";
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
import { ConfiguracionService } from "../../../shared/services/configuracion.service";
import { TimbradoDetalle } from "../timbrado/timbrado.modal";
import { FacturaLegalByCdcGQL } from "./graphql/get-factura-legal-by-cdc.gql";
import { UpdateFacturaLegalGQL } from "./graphql/updateFacturaLegal";
import { NominarFacturaElectronicaGQL } from "./graphql/nominarFacturaElectronica";
import { CancelarFacturaLegalGQL } from "./graphql/cancelarFacturaLegal";
import { SaveFacturaLegalToFilialGQL, SaveFacturaLegalToFilialResponse } from "./graphql/saveFacturaLegalToFilial";
import { DescargarXmlFacturaElectronicaGQL } from "./graphql/descargarXmlFacturaElectronica";
import { DescargarPdfFacturaElectronicaGQL } from "./graphql/descargarPdfFacturaElectronica";
import { ImprimirTicketFacturaEnImpresoraGQL } from "./graphql/imprimirTicketFacturaEnImpresora";
import { ImprimirPdfFacturaEnImpresoraGQL } from "./graphql/imprimirPdfFacturaEnImpresora";
import { VincularFacturaLegalAVentaGQL } from "./graphql/vincularFacturaLegalAVenta";
import { FacturaSimilarRecienteGQL } from "./graphql/facturaSimilarReciente";
import { FacturaSimilar } from "./factura-similar.model";

@Injectable({
  providedIn: "root",
})
export class FacturaLegalService {
  /** El aviso de duplicado no puede demorar la emisión: si no responde a tiempo, se ignora */
  private readonly TIMEOUT_VERIFICACION_MS = 5000;

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
    private generarExcelFacturas: GenerarExcelFacturasGQL,
    private configService: ConfiguracionService,
    private facturaLegalByCdcGQL: FacturaLegalByCdcGQL,
    private updateFacturaLegalGQL: UpdateFacturaLegalGQL,
    private nominarFacturaElectronicaGQL: NominarFacturaElectronicaGQL,
    private cancelarFacturaLegalGQL: CancelarFacturaLegalGQL,
    private saveFacturaLegalToFilialGQL: SaveFacturaLegalToFilialGQL,
    private descargarXmlFacturaElectronicaGQL: DescargarXmlFacturaElectronicaGQL,
    private descargarPdfFacturaElectronicaGQL: DescargarPdfFacturaElectronicaGQL,
    private imprimirTicketFacturaEnImpresoraGQL: ImprimirTicketFacturaEnImpresoraGQL,
    private imprimirPdfFacturaEnImpresoraGQL: ImprimirPdfFacturaEnImpresoraGQL,
    private vincularFacturaLegalAVentaGQL: VincularFacturaLegalAVentaGQL,
    private facturaSimilarRecienteGQL: FacturaSimilarRecienteGQL
  ) {}

  /**
   * Busca una factura de hoy, del mismo cajero y con el mismo cliente, total e items,
   * para avisar al cajero ANTES de emitir un duplicado (emitir imprime y consume un
   * número de timbrado, así que después no hay vuelta atrás).
   *
   * Solo aplica con cliente identificado: sin cliente, o con un cliente nuevo todavía
   * sin id, no hay contra qué comparar.
   *
   * Nunca bloquea la emisión: si la consulta falla o tarda, resuelve en null.
   */
  onVerificarFacturaSimilar(
    usuarioId: number,
    clienteId: number,
    totalFinal: number,
    items: FacturaLegalItemInput[],
    servidor: boolean = false
  ): Observable<FacturaSimilar> {
    if (
      usuarioId == null ||
      clienteId == null ||
      clienteId <= 0 ||
      totalFinal == null ||
      items == null ||
      items.length === 0
    ) {
      return of(null);
    }

    return this.genericService
      .onCustomQuery(
        this.facturaSimilarRecienteGQL,
        { usuarioId, clienteId, totalFinal, items },
        servidor,
        null,
        true
      )
      .pipe(
        timeout(this.TIMEOUT_VERIFICACION_MS),
        catchError(() => of(null))
      );
  }

  onVincularFacturaAVenta(
    facturaLegalId: number,
    ventaId: number,
    servidor: boolean = false
  ): Observable<any> {
    return this.genericService.onCustomMutation(
      this.vincularFacturaLegalAVentaGQL,
      { facturaLegalId, ventaId },
      servidor
    );
  }

  onSaveFactura(
    input: FacturaLegalInput,
    facturaLegalItemInputList: FacturaLegalItemInput[],
    servidor: boolean = true
  ): Observable<any> {
    if (input?.nombre != null) input.nombre = input.nombre.toUpperCase();
    return this.genericService.onSaveConDetalle(
      this.saveFactura,
      input,
      facturaLegalItemInputList,
      null,
      this.configService?.getConfig()?.printers?.ticket,
      this.configService?.getConfig()?.pdvId, servidor
    );
  }

  onImprimirFacturasPorCaja(id: number, servidor: boolean = true) {
    return this.genericService
      .onCustomQuery(this.imprimirFacturasPorCaja, {
        id: id,
        printerName: this.configService?.getConfig()?.printers?.ticket
      }, servidor)
      .subscribe((res) => {
        if (res) {
          this.notificacionService.openGuardadoConExito();
        }
      });
  }

  onReimprimirFactura(id: number, sucId: number, servidor: boolean = true) {
    return this.genericService
      .onCustomQuery(this.imprimirFactura, {
        id,
        sucId,
        printerName: this.configService?.getConfig()?.printers?.ticket,
      }, servidor)
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
    full?: boolean,
    isElectronico?: boolean,
    activo?: boolean,
    sinNombre?: boolean,
    ventaId?: number,
    servidor: boolean = true
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
        isElectronico,
        activo,
        sinNombre,
        ventaId
      },
      servidor
    );
  }

  // silentLoad evita el modal bloqueante de "Buscando...", para consultas que
  // acompanan una interaccion liviana (ej. expandir una fila de la lista).
  onGetFacturaLegal(id, sucId, servidor: boolean = true, silentLoad = false): Observable<FacturaLegal> {
    return this.genericService.onGetById(
      this.facturaLegalPorId, id, null, null, servidor, sucId, null, null, silentLoad
    );
  }

  onGetFacturaLegalByCdc(cdc: string, servidor: boolean = true): Observable<FacturaLegal>{
    return this.genericService.onCustomQuery(this.facturaLegalByCdcGQL, {cdc}, servidor)
  }

  onGenerarExcelFacturas(
    fechaInicio: string,
    fechaFin: string,
    sucId?: number,
    servidor: boolean = true
  ): Observable<string> {
    return this.genericService.onCustomQuery(this.generarExcelFacturas, {
      fechaInicio,
      fechaFin,
      sucId,
    }, servidor);
  }

  onGenerarExcelFacturasZip(
    fechaInicio: string,
    fechaFin: string,
    sucId?: number[],
    servidor: boolean = true
  ): Observable<string> {
    return this.genericService.onCustomQuery(this.generarExcelFacturasZip, {
      fechaInicio,
      fechaFin,
      sucId,
    }, servidor);
  }

  onGetResumenFacturas(
    fechaInicio: string,
    fechaFin: string,
    sucId?: number[],
    ruc?: string,
    nombre?: string,
    iva5?: boolean,
    iva10?: boolean,
    sinNombre?: boolean,
    servidor: boolean = true
  ): Observable<ResumenFacturasDto> {
    return this.genericService.onCustomQuery(this.getResumenFacturas, {
      fechaInicio,
      fechaFin,
      sucId,
      ruc,
      nombre,
      iva5,
      iva10,
      sinNombre
    }, servidor);
  }

  //create a function to show warning if timbradoDetalle.timbrado.fechaFin about to expire, show it 15 days before
  onShowWarningIfTimbradoAboutToExpire(timbradoDetalle: TimbradoDetalle) {
    console.log('on show warning if timbrado about to expire');
    const fechaFin = new Date(timbradoDetalle.timbrado.fechaFin);
    const fechaActual = new Date();
    const diferencia = fechaFin.getTime() - fechaActual.getTime();
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    // si la fecha es menor a 15 dias y el timbrado no es electronico, show warning
    if (dias < 15 && !timbradoDetalle.timbrado.isElectronico) {
      //add set timeout of 2 seconds
      setTimeout(() => {
        this.notificacionService.openWarn("El timbrado está por llegar a su fecha de fin. Favor contactar con RRHH para solicitar un nuevo timbrado.", 5);
      }, 2000);
    }
  }

  //create a function to show warning if timbradoDetalle.rangoHasta - timbradoDetalle.numeroActual < rangoHasta * 0.1
  onShowWarningIfTimbradoRangoAboutToExpire(timbradoDetalle: TimbradoDetalle) {
    console.log('on show warning if timbrado rango about to expire');
    
    const rangoHasta = timbradoDetalle.rangoHasta;
    const numeroActual = timbradoDetalle.numeroActual;
    const diferencia = rangoHasta - numeroActual;
    // si la diferencia es menor a 10% del rango hasta y el timbrado no es electronico, show warning
    if ((rangoHasta * 0.1) > diferencia && !timbradoDetalle.timbrado.isElectronico) {
      setTimeout(() => {
        this.notificacionService.openWarn("El timbrado está por llegar a su rango máximo. Favor contactar con RRHH para solicitar un nuevo timbrado.", 5);
      }, 2000);
    }
  }

  onUpdateFacturaLegal(input: FacturaLegalInput, servidor: boolean = true): Observable<FacturaLegal> {
    if (input?.nombre != null) input.nombre = input.nombre.toUpperCase();
    if (input?.ruc != null) input.ruc = input.ruc.toUpperCase();
    if (input?.direccion != null) input.direccion = input.direccion.toUpperCase();
    
    return this.genericService.onCustomMutation(
      this.updateFacturaLegalGQL,
      { input },
      servidor
    );
  }

  onNominarFacturaElectronica(
    facturaLegalId: number,
    sucursalId: number,
    clienteId: number,
    servidor: boolean = true
  ): Observable<boolean> {
    return this.genericService.onCustomMutation(
      this.nominarFacturaElectronicaGQL,
      { facturaLegalId, sucursalId, clienteId },
      servidor
    );
  }

  onCancelarFacturaLegal(
    facturaLegalId: number,
    sucursalId: number,
    cancelarVenta: boolean,
    servidor: boolean = true
  ): Observable<string> {
    return this.genericService.onCustomMutation(
      this.cancelarFacturaLegalGQL,
      { facturaLegalId, sucursalId, cancelarVenta },
      servidor
    );
  }

  onSaveFacturaToFilial(
    facturaInput: FacturaLegalInput,
    facturaItemInputList: FacturaLegalItemInput[],
    sucursalId: number,
    timbradoDetalleId: number,
    monedaId: number,
    tipoCambio: number
  ): Observable<SaveFacturaLegalToFilialResponse> {
    return this.genericService.onCustomMutation(
      this.saveFacturaLegalToFilialGQL,
      {
        entity: facturaInput,
        detalleList: facturaItemInputList,
        sucursalId,
        timbradoDetalleId,
        monedaId,
        tipoCambio
      },
      true
    );
  }

  pollFacturaLegal(
    facturaId: number,
    sucursalId: number,
    maxRetries: number = 3,
    intervalMs: number = 5000
  ): Observable<FacturaLegal> {
    return new Observable<FacturaLegal>((observer) => {
      let retries = 0;
      
      const checkFactura = () => {
        if (retries >= maxRetries) {
          observer.next(null);
          observer.complete();
          return;
        }
        
        retries++;
        
        this.onGetFacturaLegal(facturaId, sucursalId, true).subscribe({
          next: (factura: FacturaLegal) => {
            if (factura) {
              observer.next(factura);
              observer.complete();
            } else {
              // No encontrada, intentar de nuevo después del intervalo
              setTimeout(checkFactura, intervalMs);
            }
          },
          error: () => {
            // Error, intentar de nuevo después del intervalo
            if (retries < maxRetries) {
              setTimeout(checkFactura, intervalMs);
            } else {
              observer.next(null);
              observer.complete();
            }
          }
        });
      };
      
      // Iniciar el primer intento
      checkFactura();
    });
  }

  onDescargarXmlFacturaElectronica(id: number, sucId: number, servidor: boolean = true): Observable<string> {
    return this.genericService.onCustomQuery(
      this.descargarXmlFacturaElectronicaGQL,
      { id, sucId },
      servidor
    );
  }

  onDescargarPdfFacturaElectronica(id: number, sucId: number, servidor: boolean = true): Observable<string> {
    return this.genericService.onCustomQuery(
      this.descargarPdfFacturaElectronicaGQL,
      { id, sucId },
      servidor
    );
  }

  /**
   * "Imprimir en la sucursal": genera el mismo ticket de "Reimprimir" pero lo manda a una
   * impresora registrada (posiblemente en otra sucursal) vía PrintRouterService, en vez de
   * imprimir local. Aditivo, no reemplaza onReimprimirFactura.
   */
  onImprimirTicketFacturaEnImpresora(
    facturaId: number,
    sucId: number,
    impresoraId: number,
    servidor: boolean = true
  ): Observable<boolean> {
    return this.genericService.onCustomMutation(
      this.imprimirTicketFacturaEnImpresoraGQL,
      { facturaId, sucId, impresoraId },
      servidor
    );
  }

  /**
   * "Imprimir en la sucursal": genera el mismo PDF de "Descargar/Abrir PDF" pero lo manda a una
   * impresora registrada vía PrintRouterService. Aditivo, no reemplaza onDescargarPdfFacturaElectronica.
   */
  onImprimirPdfFacturaEnImpresora(
    facturaId: number,
    sucId: number,
    impresoraId: number,
    servidor: boolean = true
  ): Observable<boolean> {
    return this.genericService.onCustomMutation(
      this.imprimirPdfFacturaEnImpresoraGQL,
      { facturaId, sucId, impresoraId },
      servidor
    );
  }
}



