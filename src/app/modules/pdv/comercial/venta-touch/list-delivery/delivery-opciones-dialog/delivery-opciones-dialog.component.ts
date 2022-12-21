import { AfterViewInit, Component, Inject, Input, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BotonComponent } from '../../../../../../shared/components/boton/boton.component';
import { Delivery } from '../../../../../operaciones/delivery/delivery.model';
import { DeliveryService } from '../../delivery-dialog/delivery.service';

@Component({
  selector: 'app-delivery-opciones-dialog',
  templateUrl: './delivery-opciones-dialog.component.html',
  styleUrls: ['./delivery-opciones-dialog.component.scss']
})
export class DeliveryOpcionesDialogComponent implements OnInit, AfterViewInit {

  @ViewChildren('btn') botonesList: QueryList<BotonComponent>;

  selectedIndex: number = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public selectedDelivery: Delivery,
    private matDialogRef: MatDialogRef<DeliveryOpcionesDialogComponent>,
    private deliveryService: DeliveryService
  ) { }

  ngOnInit(): void {
    this.deliveryService.onGetById(this.selectedDelivery.id).subscribe(res => {
      if(res!=null){
        this.selectedDelivery = res;
      }
    })
  }

  ngAfterViewInit(): void {
    this.botonesList['_results'][0].color = 'accent';
  }

  onKeyup(e: any) {
    this.botonesList['_results'].forEach(e => {
      e.color = 'primary'
    });
    switch (e.key) {
      case 'ArrowLeft':
        if (this.selectedIndex > 0) {
          this.selectedIndex--;
          this.botonesList['_results'][this.selectedIndex].onGetFocus()
          this.botonesList['_results'][this.selectedIndex].color = 'accent';
        }
        break;
      case 'ArrowRight':
        if (this.selectedIndex < 4) {
          this.selectedIndex++;
          this.botonesList['_results'][this.selectedIndex].onGetFocus()
          this.botonesList['_results'][this.selectedIndex].color = 'accent';
        }
        break;
    }
  }

  onClick(role){
    this.matDialogRef.close({role: role, delivery: this.selectedDelivery})
  }


}
