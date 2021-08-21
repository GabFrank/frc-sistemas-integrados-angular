import { Component, OnInit } from '@angular/core';
import { PaisService } from '../pais.service';

@Component({
  selector: 'app-list-pais',
  templateUrl: './list-pais.component.html',
  styleUrls: ['./list-pais.component.css']
})
export class ListPaisComponent implements OnInit {

  displayedColumnsId: string[] = ['id', 'descripcion', 'codigo'];
  displayedColumns: string[] = ['Id', 'Descripción', 'Código'];

  constructor(
    public service: PaisService
  ) { }

  ngOnInit(): void {
  }

}
