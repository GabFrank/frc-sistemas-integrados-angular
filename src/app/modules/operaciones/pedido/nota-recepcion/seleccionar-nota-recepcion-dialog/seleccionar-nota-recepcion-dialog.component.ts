import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Pedido } from '../../edit-pedido/pedido.model';

class SeleccionarNotaRecepcionData {
  pedido: Pedido;
}

@Component({
  selector: 'app-seleccionar-nota-recepcion-dialog',
  templateUrl: './seleccionar-nota-recepcion-dialog.component.html',
  styleUrls: ['./seleccionar-nota-recepcion-dialog.component.scss']
})
export class SeleccionarNotaRecepcionDialogComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SeleccionarNotaRecepcionData,
    private matDialogRef: MatDialogRef<SeleccionarNotaRecepcionDialogComponent>,
  ) { }

  ngOnInit(): void {
  }

}
