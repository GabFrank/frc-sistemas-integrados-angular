import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FormaPago } from '../../../financiero/forma-pago/forma-pago.model';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { Proveedor } from '../../../personas/proveedor/proveedor.model';
import { Pedido } from '../../pedido/edit-pedido/pedido.model';

@Component({
  selector: 'app-edit-compra',
  templateUrl: './edit-compra.component.html',
  styleUrls: ['./edit-compra.component.css']
})
export class EditCompraComponent implements OnInit {

  idControl = new FormControl()
  pedidoIdControl = new FormControl()
  proveedorIdControl = new FormControl()
  fechaControl = new FormControl()
  nroNotaControl = new FormControl()
  fechaEntregaControl = new FormControl()
  monedaIdControl = new FormControl()
  descuentoControl = new FormControl()
  formaPagoIdControl = new FormControl()

  selectedPedido: Pedido;
  selectedProveedor: Proveedor;
  selectedMoneda: Moneda;
  selectedFormaPago: FormaPago; 


  constructor() { }

  ngOnInit(): void {
  }

}
