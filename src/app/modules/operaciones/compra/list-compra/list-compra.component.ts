import { Component, OnInit } from '@angular/core';
import { CompraService } from '../compra.service';

@Component({
  selector: 'app-list-compra',
  templateUrl: './list-compra.component.html',
  styleUrls: ['./list-compra.component.css']
})
export class ListCompraComponent implements OnInit {


  displayedColumnsId: string[] = [
    'id',
    'descripcion',
    'iva',
    'unidadPorCaja',
    'balanza',
    'garantia',
    'ingredientes',
    'combo',
    'promocion',
  ];
  displayedColumns: string[] = [
    'Id',
    'Descripción',
    'Iva',
    'Unid. Caja',
    'Balanza',
    'Garantía',
    'Ingredientes',
    'Combo',
    'Promoción'
  ];

  constructor(
    public service: CompraService
  ) { }

  ngOnInit(): void {
  }


}
