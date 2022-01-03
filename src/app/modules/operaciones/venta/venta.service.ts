import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { MainService } from '../../../main.service';
import { CobroDetalle, CobroDetalleInput } from './cobro/cobro-detalle.model';
import { Cobro, CobroInput } from './cobro/cobro.model';
import { VentaEstado } from './enums/venta-estado.enums';
import { SaveVentaGQL } from './graphql/saveVenta';
import { VentaItem, VentaItemInput } from './venta-item.model';
import { saveVentaItemList, ventaItemListPorVentaIdQuery } from './venta-item/graphql/graphql-query';
import { SaveVentaItemListGQL } from './venta-item/graphql/saveVentaItemList';
import { Venta, VentaInput } from './venta.model';

@Injectable({
  providedIn: 'root'
})
export class VentaService {

  constructor(
    private genericService: GenericCrudService,
    private saveVenta: SaveVentaGQL,
    private saveVentaItemList: SaveVentaItemListGQL,
    private mainService: MainService
  ) { }

  // $venta:VentaInput!, $venteItemList: [VentaItemInput], $cobro: CobroInput, $cobroDetalleList: [CobroDetalleInput]

  onSaveVenta(venta: Venta, cobro: Cobro): Observable<any>{
    let ventaItemInputList: VentaItemInput[] = []
    let cobroDetalleInputList: CobroDetalleInput[] = []
    let ventaInput: VentaInput = venta.toInput()
    let cobroInput: CobroInput = cobro.toInput()
    ventaInput.estado = VentaEstado.CONCLUIDA;
    ventaInput.usuarioId = this.mainService?.usuarioActual?.id;
    cobroInput.usuarioId = this.mainService?.usuarioActual?.id;
    console.log(ventaInput, cobroInput)
    venta.ventaItemList.forEach(e => {
      ventaItemInputList.push(e.toInput())
    });
    cobro.cobroDetalleList.forEach(e => {
      cobroDetalleInputList.push(e.toInput())
    });
    return new Observable(obs => {
      this.saveVenta.mutate({
        ventaInput: ventaInput, 
        ventaItemList: ventaItemInputList, 
        cobro: cobroInput, 
        cobroDetalleList: cobroDetalleInputList
      }, {
        errorPolicy: 'all',
        fetchPolicy: 'no-cache'
      }).subscribe(res => {
        console.log(res)
        obs.next(res.data['data'])
      })
    })
  }
}
