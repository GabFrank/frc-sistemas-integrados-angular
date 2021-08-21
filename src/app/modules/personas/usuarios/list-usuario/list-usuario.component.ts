import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../usuario.service';

@Component({
  selector: 'app-list-usuario',
  templateUrl: './list-usuario.component.html',
  styleUrls: ['./list-usuario.component.css']
})
export class ListUsuarioComponent implements OnInit {

  displayedColumnsId: string[] = ['id', 'nombre', 'nickname', 'creadoEn'];
  displayedColumns: string[] = ['Id', 'Nombre', 'Nickname', 'Creación'];

  constructor(
    public service: UsuarioService
  ) { }

  ngOnInit(): void {
  }

}
