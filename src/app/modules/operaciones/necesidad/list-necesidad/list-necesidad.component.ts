import { Component, OnInit } from '@angular/core';
import { NecesidadService } from '../necesidad.service';

@Component({
  selector: 'app-list-necesidad',
  templateUrl: './list-necesidad.component.html',
  styleUrls: ['./list-necesidad.component.css']
})
export class ListNecesidadComponent implements OnInit {


  displayedColumnsId: string[] = ['id','nombreSucursal', 'nombreUsuario', 'fecha', 'estado'];
  displayedColumns: string[] = ['Id', 'Sucursal', 'Usuario', 'Fecha', 'Estado'];
  displayedLinks: any[] = [null, null, null];

  constructor(
    public service: NecesidadService
  ) { }

  ngOnInit(): void {
  }

}
