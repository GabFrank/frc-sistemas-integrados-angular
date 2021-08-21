import { Component, OnInit } from '@angular/core';
import { CiudadService } from '../ciudad.service';

@Component({
  selector: 'app-list-ciudad',
  templateUrl: './list-ciudad.component.html',
  styleUrls: ['./list-ciudad.component.css']
})
export class ListCiudadComponent implements OnInit {

  displayedColumnsId: string[] = ['id', 'descripcion', 'codigo'];
  displayedColumns: string[] = ['Id', 'Descripción', 'Código'];

  constructor(
    public service: CiudadService
  ) { }

  ngOnInit(): void {
  }

}
