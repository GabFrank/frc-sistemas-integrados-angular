import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { updateDataSource, updateDataSourceWithId } from '../../../../../commons/core/utils/numbersUtils';
import { BotonComponent } from '../../../../../shared/components/boton/boton.component';
import { FormaPago } from '../../../../financiero/forma-pago/forma-pago.model';
import { Moneda } from '../../../../financiero/moneda/moneda.model';
import { CajaService } from '../../../../financiero/pdv/caja/caja.service';
import { Delivery } from '../../../../operaciones/delivery/delivery.model';
import { DeliveryEstado } from '../../../../operaciones/delivery/enums';
import { DeliveryService } from '../delivery-dialog/delivery.service';
import { DeliveryPresupuestoDialogComponent } from '../delivery-presupuesto-dialog/delivery-presupuesto-dialog.component';
import { DeliveryOpcionesDialogComponent } from './delivery-opciones-dialog/delivery-opciones-dialog.component';
import { EditDeliveryDialogComponent } from './edit-delivery-dialog/edit-delivery-dialog.component';

export interface ListDeliveryData {
  delivery?: Delivery;
  cambioRs?: number;
  cambioDs?: number;
  monedaList?: Moneda[];
  formaPagoList?: FormaPago[];
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-delivery',
  templateUrl: './list-delivery.component.html',
  styleUrls: ['./list-delivery.component.scss']
})
export class ListDeliveryComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('presupuesto', { read: DeliveryPresupuestoDialogComponent }) presupuesto: DeliveryPresupuestoDialogComponent;
  @ViewChild('newBtn', { read: BotonComponent }) newBtn: BotonComponent;
  @ViewChild('container', { read: ElementRef }) container: ElementRef;
  selectedDelivery: Delivery;
  selectedDeliveryIndex: number;
  dataSource = new MatTableDataSource<Delivery>([])
  selection = new SelectionModel<Delivery>(null)
  calcularVueltoSub = new BehaviorSubject<void>(null);

  displayedColumns = [
    'id',
    'telefono',
    'cliente',
    'direccion',
    'valor',
    'creadoEn',
    'estado'
  ]
  cambioRs = 1;
  cambioDs = 1;
  isDialogOpen = false;

  timerList: any[] = []
  duracionList: string[] = []

  deliveryEstadoList = [DeliveryEstado.ABIERTO, DeliveryEstado.EN_CAMINO, DeliveryEstado.PARA_ENTREGA, DeliveryEstado.CONCLUIDO, DeliveryEstado.CANCELADO]
  filteredDeliveryEstados = [DeliveryEstado.ABIERTO, DeliveryEstado.EN_CAMINO, DeliveryEstado.PARA_ENTREGA]
  selectedEstadosControl = new FormControl(this.filteredDeliveryEstados)

  constructor(
    private deliveryService: DeliveryService,
    private matDialog: MatDialog,
    private matDialogRef: MatDialogRef<ListDeliveryComponent>,
    @Inject(MAT_DIALOG_DATA) private data: ListDeliveryData,
    private cajaService: CajaService
  ) {
    if (data.delivery != null) {
      this.selectedDelivery = data.delivery;
    }
    this.cambioRs = data.cambioRs;
    this.cambioDs = data.cambioDs;
  }
  ngOnDestroy(): void {
    this.timerList?.forEach(t => {
      clearInterval(t)
    })
  }

  ngAfterViewInit(): void {
    this.newBtn?.onGetFocus()
    this.deliveryService.onGetDeliverysByEstadoList([DeliveryEstado.ABIERTO, DeliveryEstado.EN_CAMINO, DeliveryEstado.PARA_ENTREGA], this.cajaService?.selectedCaja?.id).subscribe(res => {
      this.dataSource.data = res;
      this.calcularDuracion()
      // verificar si hay algun delivery seleccionado al iniciar el dialogo, si es asi, buscar el index y dar focus al row correspondiente
      if (res.length > 0) {
        if (this.selectedDelivery?.id != null) { // hay delivery seleccionado anteriormente

        } else if (this.selectedDelivery?.venta?.ventaItemList?.length > 0) { // el delivery es nuevo y tiene itens
          this.onNuevoDelivery()
        } else {
        }
      } else if (this.selectedDelivery?.venta?.ventaItemList?.length > 0) { // el delivery es nuevo y tiene itens
        this.onNuevoDelivery()
      }
    })

    this.container.nativeElement.addEventListener('keydown', (e) => {
      if (!this.isDialogOpen) {
        switch (e.key) {
          case "F12":
            break;
          case "F11":
            break;
          case "F10":

            this.onNuevoDelivery()
            break;
          case "F9":
            break;
          case "F8":
            break;
          case "F7":
            break;
          case "F6":
            break;
          case "F5":
            break;
          case "F4":
            break;
          case "F3":
            break;
          case "F2":
            break;
          case "F1":
            break;
          case "Escape":
            break;
          default:
            break;
        }
      }
    })
  }

  ngOnInit(): void {
    // buscar todos los deliverys abiertos, en camino o para entrega

  }

  onFiltrarDeliverys() {
    if (this.selectedEstadosControl.value.length > 0) {
      this.deliveryService.onGetDeliverysByEstadoList(this.selectedEstadosControl.value, this.cajaService?.selectedCaja?.id).subscribe(res => {
        this.dataSource.data = res;
        this.calcularDuracion()
        // verificar si hay algun delivery seleccionado al iniciar el dialogo, si es asi, buscar el index y dar focus al row correspondiente
        if (res.length > 0) {
          if (this.selectedDelivery?.id != null) { // hay delivery seleccionado anteriormente

          } else if (this.selectedDelivery?.venta?.ventaItemList?.length > 0) { // el delivery es nuevo y tiene itens
            this.onNuevoDelivery()
          } else {
          }
        }
      })
    }
  }

  setFocusToNew() {

  }

  calcularDuracion() {
    this.timerList.forEach(i => {
      clearInterval(i);
    })
    this.dataSource.data.forEach((e, i) => {
      if (e.estado == DeliveryEstado.ABIERTO || e.estado == DeliveryEstado.EN_CAMINO || e.estado == DeliveryEstado.PARA_ENTREGA) {
        let date = new Date(e.creadoEn)
        let time = date.getTime() / 1000;
        let timer = setInterval(() => {
          let now = new Date().getTime() / 1000;
          let result = new Date((now - time) * 1000).toISOString().slice(11, 16);
          this.duracionList[i] = result;
        }, 1000);
        this.timerList.push(timer);
      } else {
        this.duracionList[i] = '';
      }
    })
  }

  onDeliveryClick(row, index) {
    this.calcularVueltoSub.next(null)
    if (this.selectedDelivery == row) {
      this.matDialog.open(DeliveryOpcionesDialogComponent, {
        width: '90%',
        data: this.selectedDelivery
      }).afterClosed().subscribe(res => {
        if (res != null) {
          this.selectedDelivery = res['delivery']
          switch (res['role']) {
            case 'edit-itens':
              this.matDialogRef.close({
                delivery: this.selectedDelivery,
                role: 'edit'
              })
              break;
            case 'enviar':

              break;
            case 'edit-info':
              this.onNuevoDelivery(this.selectedDelivery)
              break;
            case 'para-entrega':
              this.selectedDelivery.estado = DeliveryEstado.PARA_ENTREGA;
              this.deliveryService.onSaveDeliveryEstado(this.selectedDelivery?.id, DeliveryEstado.PARA_ENTREGA).subscribe(res => {
                if (res != null) {
                  this.selectedDelivery.estado = res.estado;
                  this.dataSource.data = updateDataSourceWithId(this.dataSource.data, this.selectedDelivery, this.selectedDelivery?.id)
                  this.calcularDuracion()
                }
              })
              break;
            case 'finalizar':
              this.matDialogRef.close({ role: 'finalizar', delivery: this.selectedDelivery })
              break;
            case 'reimprimir':
              this.deliveryService.onReimprimirDelivery(this.selectedDelivery.id).subscribe()
              break;
            default:
              break;
          }
        }
      })
    } else {
      this.selectedDelivery = row;
    }

  }

  onEditItens() {

  }

  onNuevoDelivery(delivery?: Delivery) {
    this.matDialog.open(EditDeliveryDialogComponent, {
      width: '700px',
      data: {
        delivery: delivery != null ? delivery : this.data?.delivery,
        monedaList: this.data?.monedaList,
        cambioRs: this.cambioRs,
        cambioDs: this.cambioDs,
        formaPagoList: this.data.formaPagoList
      }
    }).afterClosed().subscribe(res => {
      if (res != null && res['delivery'] != null) {
        if (delivery != null) {
          this.dataSource.data = updateDataSourceWithId(this.dataSource.data, res['delivery'], delivery.id)
        } else {
          this.dataSource.data = updateDataSource(this.dataSource.data, res['delivery'])
        }
        this.selectedDelivery = res['delivery']
        this.onDeliveryClick(this.selectedDelivery, null);
        this.calcularDuracion()
      }
    })
  }


  onEditDelivery(delivery: Delivery, index) {
    this.matDialog.open(EditDeliveryDialogComponent, {
      width: '700px',
      data: {
        delivery: delivery,
        monedaList: this.data?.monedaList,
        cambioRs: this.cambioRs,
        cambioDs: this.cambioDs
      }
    }).afterClosed().subscribe(res => {
      if (res != null && res['delivery'] != null) {
        this.dataSource.data = updateDataSource(this.dataSource.data, res['delivery'], index)
        this.selectedDelivery = res['delivery']
        this.onDeliveryClick(this.selectedDelivery, index);
        this.calcularDuracion()
      }
    })
  }

  onGetPresupuesto() {
    this.presupuesto.copyToClipboard()
  }

  onVer(e) {

  }

  onFinalizar(e) {

  }

  onVuelto(e) {

  }

  onSalir() {
    this.matDialogRef.close()
  }

}
