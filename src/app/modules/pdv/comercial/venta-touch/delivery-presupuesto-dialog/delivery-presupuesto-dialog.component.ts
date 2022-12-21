import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import {
  copyBlobToClipboard
} from 'copy-image-clipboard';
import html2canvas from 'html2canvas';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { CargandoDialogService } from '../../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { Delivery } from '../../../../operaciones/delivery/delivery.model';
import { BehaviorSubject, Subscription } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

export class DeliveryPresupuestoData {
  delivery: Delivery;
  cambioRs: number;
  cambioDs: number;
  totalFinal: number;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-delivery-presupuesto-dialog',
  templateUrl: './delivery-presupuesto-dialog.component.html',
  styleUrls: ['./delivery-presupuesto-dialog.component.scss']
})
export class DeliveryPresupuestoDialogComponent implements OnInit {

  @ViewChild('image', { read: ElementRef }) image: ElementRef;

  @Input()
  delivery: Delivery;
  @Input()
  cambioRs: number;
  @Input()
  cambioDs: number;
  @Input()
  totalFinal: number;
  @Input()
  calcularVueltoEvent = new BehaviorSubject<void>(null);

  vueltoParaGs = 0;
  vueltoParaRs = 0;
  vueltoParaDs = 0;

  constructor(
    // @Inject(MAT_DIALOG_DATA) public data: DeliveryPresupuestoData,
    private cargandoDialog: CargandoDialogService,
    private notificacionService: NotificacionSnackbarService
  ) {

  }

  ngOnInit(): void {
    this.calcularVueltoEvent.pipe(untilDestroyed(this)).subscribe(res => {
      console.log('calcular vuelto');

      this.calcularVuelto()
    })
  }

  copyToClipboard(): void {
    let data = this.image.nativeElement;
    html2canvas(data as any).then(canvas => {
      canvas.toBlob((blob) => {
        copyBlobToClipboard(blob).then(() => {
          this.notificacionService.openSucess('Copiado con éxito');
        })
      }, 'image/png')

    });
  }

  onCancel() {

  }

  calcularVuelto() {
    this.vueltoParaGs = 0;
    this.vueltoParaRs = 0;
    this.vueltoParaDs = 0;
    if (this.delivery?.venta?.cobro?.cobroDetalleList != null) {
      this.delivery?.venta?.cobro?.cobroDetalleList.forEach(c => {
        console.log(c);
        if (c.pago == true) {
          switch (c.moneda.denominacion) {
            case 'GUARANI':
              this.vueltoParaGs += c.valor
              break;
            case 'REAL':
              this.vueltoParaRs += c.valor
              break;
            case 'DOLAR':
              this.vueltoParaDs += c.valor
              break;
            default:
              break;
          }
        }
      })
    }
  }

}
