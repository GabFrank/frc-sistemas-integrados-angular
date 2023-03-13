import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { FacturaLegal, FacturaLegalInput, FacturaLegalItemInput } from './factura-legal.model';
import { ImprimirFacturasPorCajaGQL } from './graphql/imprimirFacturas';
import { SaveFacturaLegalGQL } from './graphql/saveFactura';
import { FacturasLegalesGQL } from './graphql/allFacturas';
import * as fileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { dateToString } from '../../../commons/core/utils/dateUtils';
import { FacturaLegalPorIdGQL } from './graphql/facturaPorId';
import { FacturasLegalesFullInfoGQL } from './graphql/allFacturasFullInfo';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

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
    private allFacturasFullInfo: FacturasLegalesFullInfoGQL

  ) { }

  onSaveFactura(input: FacturaLegalInput, facturaLegalItemInputList: FacturaLegalItemInput[]): Observable<any> {
    console.log(input);

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

  exportarExcel(
    fechaInicio: string,
    fechaFin: string,
    sucId?: number[],
    ruc?: string,
    nombre?: string,
    iva5?: boolean,
    iva10?: boolean
  ) {
    let jsonList = [];
    this.onGetAllFacturasLegales(fechaInicio,
      fechaFin,
      sucId,
      ruc,
      nombre,
      iva5,
      iva10, true).subscribe(res => {
        res.forEach(f => {
          let ven_numero = '';
          let numFacturaLenght = 7 - f.numeroFactura.toString().length;
          for (let index = 0; index < numFacturaLenght; index++) {
            ven_numero = ven_numero + '0';
          }
          ven_numero = ven_numero + f.numeroFactura;
          let item = {
            "ven_tipimp": "I",
            "ven_gra05": (f?.totalParcial5 - f?.ivaParcial5)?.toFixed(0) || '0',
            "ven_iva05": (f?.ivaParcial5)?.toFixed(0) || '0',
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
            "ven_provee": f.ruc,
            "ven_cuenta": "",
            "ven_prvnom": f.nombre?.toUpperCase(),
            "ven_tipofa": "FACTURA",
            "ven_fecha": dateToString(f.creadoEn, 'yyyy-MM-dd'),
            "ven_totfac": f.totalFinal,
            "ven_exenta": "0",
            "ven_gravad": (f?.totalParcial10 - f?.ivaParcial10)?.toFixed(0) || '0',
            "ven_iva": f?.ivaParcial10?.toFixed(0) || '0',
            "ven_retenc": "",
            "ven_aux": "",
            "ven_ctrl": "",
            "ven_con": "",
            "ven_cuota": "0",
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
          console.log('cargando item');
          jsonList.push(item);
        })
        this.exportAsExcelFile(jsonList, 'bodega_franco_fac');
      })

  }

  private exportAsExcelFile(json: any[], excelFileName: string): void {
  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
  const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
  const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  this.saveAsExcelFile(excelBuffer, excelFileName);
}
  private saveAsExcelFile(buffer: any, fileName: string): void {
  const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
  fileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
}


}
