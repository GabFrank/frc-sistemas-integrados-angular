import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Usuario } from '../usuario.model';

@Component({
  selector: 'app-list-usuario',
  templateUrl: './list-usuario.component.html',
  styleUrls: ['./list-usuario.component.css']
})
export class ListUsuarioComponent implements OnInit {

  usuarioDataSource = new MatTableDataSource<Usuario>(null);
  selectedUsuario: Usuario;
  displayedColumns: string[] = ['id', 'nombre', 'nickname', 'telefono', 'estado', 'creadoEn', 'creadoPor', 'acciones'];
  expandedUsuario: Usuario;
  tableHeight;
  constructor(
  ) { }

  ngOnInit(): void {
  }

  onFiltrar(){

  }
  
  onCancelarFiltro(){

  }

}
