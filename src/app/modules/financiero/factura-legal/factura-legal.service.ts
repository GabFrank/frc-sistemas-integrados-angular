import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { FacturaLegal, FacturaLegalInput, FacturaLegalItemInput } from './factura-legal.model';
import { ImprimirFacturasPorCajaGQL } from './graphql/imprimirFacturas';
import { SaveFacturaLegalGQL } from './graphql/saveFactura';
import { FacturasLegalesGQL } from './graphql/allFacturas';
import { dateToString } from '../../../commons/core/utils/dateUtils';
import { FacturaLegalPorIdGQL } from './graphql/facturaPorId';
import { FacturasLegalesFullInfoGQL } from './graphql/allFacturasFullInfo';
import { ImprimirFacturaGQL } from './graphql/imprimirFactura';
import { environment } from '../../../../environments/environment';
import { CrearExcelService } from '../../../shared/crear-excel/crear-excel.service';
import { removeSecondDigito } from '../../../commons/core/utils/rucUtils';

@Injectable({
  providedIn: 'root'
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
    private crearExcelService: CrearExcelService
  ) { }

  onSaveFactura(input: FacturaLegalInput, facturaLegalItemInputList: FacturaLegalItemInput[]): Observable<any> {

    if (input?.nombre != null) input.nombre = input.nombre.toUpperCase()
    return this.genericService.onSaveConDetalle(this.saveFactura, input, facturaLegalItemInputList, null, environment['printers']['ticket'], environment['pdvId']);
  }

  onImprimirFacturasPorCaja(id: number) {
    return this.genericService.onCustomQuery(this.imprimirFacturasPorCaja, { id: id, printerName: environment['printers']['ticket'] }).subscribe(res => {
      if (res) {
        this.notificacionService.openGuardadoConExito()
      }
    })
  }

  onReimprimirFactura(id: number, sucId: number) {
    return this.genericService.onCustomQuery(this.imprimirFactura, { id, sucId, printerName: environment['printers']['ticket'] }).subscribe(res => {
      if (res) {
        this.notificacionService.openGuardadoConExito()
      }
    })
  }

  onGetAllFacturasLegales(
    fechaInicio: string,
    fechaFin: string,
    sucId?: number[],
    ruc?: string,
    nombre?: string,
    iva5?: boolean,
    iva10?: boolean,
    full?: boolean
  ) {
    return this.genericService.onCustomQuery(full == true ? this.allFacturasFullInfo : this.allFacturas, {
      fechaInicio,
      fechaFin,
      sucId,
      ruc,
      nombre,
      iva5,
      iva10
    })
  }

  onGetFacturaLegal(id, sucId): Observable<FacturaLegal> {
    return this.genericService.onGetById(this.facturaLegalPorId, id, sucId);
  }

  async exportarExcel(
    fechaInicio: string,
    fechaFin: string,
    sucId?: number[],
    ruc?: string,
    nombre?: string,
    iva5?: boolean,
    iva10?: boolean,
    filename?: string
  ) {

    const headers = [
      "ven_tipimp",
      "ven_gra05",
      "ven_iva05",
      "ven_disg05",
      "cta_iva05",
      "ven_rubgra",
      "ven_rubg05",
      "ven_disexe",
      "ven_numero",
      "ven_imputa",
      "ven_sucurs",
      "generar",
      "form_pag",
      "ven_centro",
      "ven_provee",
      "ven_cuenta",
      "ven_prvnom",
      "ven_tipofa",
      "ven_fecha",
      "ven_totfac",
      "ven_exenta",
      "ven_gravad",
      "ven_iva",
      "ven_retenc",
      "ven_aux",
      "ven_ctrl",
      "ven_con",
      "ven_cuota",
      "ven_fecven",
      "cant_dias",
      "origen",
      "cambio",
      "valor",
      "moneda",
      "exen_dolar",
      "concepto",
      "cta_iva",
      "cta_caja",
      "tkdesde",
      "tkhasta",
      "caja",
      "ven_disgra",
      "forma_devo",
      "ven_cuense",
      "anular",
      "reproceso",
      "cuenta_exe",
      "usu_ide",
      "rucvennrotim",
      "clieasi",
      "ventirptip",
      "ventirpgra",
      "ventirpexe",
      "irpc",
      "ivasimplificado",
      "venirprygc",
      "venbconom",
      "venbcoctacte",
      "nofacnotcre",
      "notimbfacnotcre",
      "ventipodoc",
      "ventanoiva",
      "identifclie",
      "gdcbienid",
      "gdctipobien",
      "gdcimpcosto",
      "gdcimpventagrav"
    ];

    let jsonList = [];

    this.onGetAllFacturasLegales(fechaInicio,
      fechaFin,
      sucId,
      ruc,
      nombre,
      iva5,
      iva10, true).subscribe(async res => {
        res.forEach(f => {
          let ven_numero = '';
          let numFacturaLenght = 7 - f.numeroFactura.toString().length;
          for (let index = 0; index < numFacturaLenght; index++) {
            ven_numero = ven_numero + '0';
          }
          ven_numero = ven_numero + f.numeroFactura;
          let item = {
            "ven_tipimp": "I",
            "ven_gra05": +((f?.totalParcial5 - f?.ivaParcial5)?.toFixed(0) || 0),
            "ven_iva05": +((f?.ivaParcial5)?.toFixed(0) || 0),
            "ven_disg05": "",
            "cta_iva05": "",
            "ven_rubgra": "",
            "ven_rubg05": "",
            "ven_disexe": "",
            "ven_numero": `${f.sucursal?.codigoEstablecimientoFactura}-${f.timbradoDetalle?.puntoExpedicion}-${ven_numero}`,
            "ven_imputa": "",
            "ven_sucurs": f.sucursal?.codigoEstablecimientoFactura,
            "generar": "",
            "form_pag": f.credito ? 'CREDITO' : 'CONTADO',
            "ven_centro": "",
            "ven_provee": removeSecondDigito(f.ruc),
            "ven_cuenta": "",
            "ven_prvnom": f.nombre?.toUpperCase(),
            "ven_tipofa": "FACTURA",
            "ven_fecha": dateToString(f.creadoEn, 'yyyy-MM-dd'),
            "ven_totfac": f.totalFinal,
            "ven_exenta": 0,
            "ven_gravad": +((f?.totalParcial10 - f?.ivaParcial10)?.toFixed(0) || 0),
            "ven_iva": +(f?.ivaParcial10?.toFixed(0) || 0),
            "ven_retenc": "",
            "ven_aux": "",
            "ven_ctrl": "",
            "ven_con": "",
            "ven_cuota": 0,
            "ven_fecven": dateToString(f.creadoEn, 'yyyy-MM-dd'),
            "cant_dias": "",
            "origen": "",
            "cambio": "",
            "valor": "",
            "moneda": "",
            "exen_dolar": "",
            "concepto": "",
            "cta_iva": "",
            "cta_caja": "",
            "tkdesde": "",
            "tkhasta": "",
            "caja": "",
            "ven_disgra": "",
            "forma_devo": "",
            "ven_cuense": "",
            "anular": "",
            "reproceso": "",
            "cuenta_exe": "",
            "usu_ide": "",
            "rucvennrotim": f?.timbradoDetalle?.timbrado?.numero,
            "clieasi": "",
            "ventirptip": "",
            "ventirpgra": "",
            "ventirpexe": "",
            "irpc": "",
            "ivasimplificado": "",
            "venirprygc": "",
            "venbconom": "",
            "venbcoctacte": "",
            "nofacnotcre": "",
            "notimbfacnotcre": "",
            "ventipodoc": "",
            "ventanoiva": "",
            "identifclie": "",
            "gdcbienid": "",
            "gdctipobien": "",
            "gdcimpcosto": "",
            "gdcimpventagrav": ""
          }
          jsonList.push(item);
        })
        this.crearExcelService.onCreateAndExport(headers, jsonList, filename)
      })
  }

}
