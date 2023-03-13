import { Component, OnInit, Type } from '@angular/core';
import { TabService } from '../../../../layouts/tab/tab.service';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { MatDialog } from '@angular/material/dialog';
import { PrecioDelivery } from '../precio-delivery.model';
import { PrecioDeliveryComponent } from '../precio-delivery/precio-delivery.component';

interface DeliveryItemDashboard {
  titulo: string;
  component: Type<any>;
  descripcion: string;
  icon: string;
}

@Component({
  selector: 'app-delivery-dashboard',
  templateUrl: './delivery-dashboard.component.html',
  styleUrls: ['./delivery-dashboard.component.scss']
})
export class DeliveryDashboardComponent implements OnInit {
  itemList: DeliveryItemDashboard[];
  cardWidth;

  constructor(
    public tabService: TabService,
    public matDialog: MatDialog
  ) { }

  ngOnInit(): void {
  }

  onInfoGenerales() { }

  onDeliveryPrecio() { 
    this.matDialog.open(PrecioDeliveryComponent, {
      width: '600px',
    })
  }

}
