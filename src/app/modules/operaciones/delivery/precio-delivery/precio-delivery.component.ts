import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { PrecioDelivery } from '../precio-delivery.model';
import { DeliveryService } from '../../../pdv/comercial/venta-touch/delivery-dialog/delivery.service';

@Component({
  selector: 'app-precio-delivery',
  templateUrl: './precio-delivery.component.html',
  styleUrls: ['./precio-delivery.component.scss']
})
export class PrecioDeliveryComponent implements OnInit {

  precioDeliveryForm: FormGroup;
  dataSource = new MatTableDataSource<PrecioDelivery>([]);
  displayedColumns: string[] = ['id', 'descripcion', 'valor', 'activo', 'creadoEn', 'usuario'];

  constructor(private formBuilder: FormBuilder, private precioDelivery: DeliveryService) {
  }
  ngOnInit(): void {
  }


}
