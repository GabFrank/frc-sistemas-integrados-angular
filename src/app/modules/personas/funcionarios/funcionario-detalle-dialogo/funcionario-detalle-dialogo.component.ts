import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

interface Data {
  res: boolean;
}

@Component({
  selector: 'app-funcionario-detalle-dialogo',
  templateUrl: './funcionario-detalle-dialogo.component.html',
  styleUrls: ['./funcionario-detalle-dialogo.component.css']
})
export class FuncionarioDetalleDialogoComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: Data) {}

  ngOnInit(): void {
  }

}
