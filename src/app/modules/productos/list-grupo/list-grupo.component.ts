import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { GenericList } from '../../../generics/generic-list-model';
import { PdvGrupo } from '../../pdv/comercial/venta-touch/pdv-grupo/pdv-grupo.model';

@Component({
  selector: 'app-list-grupo',
  templateUrl: './list-grupo.component.html',
  styleUrls: ['./list-grupo.component.scss']
})
export class ListGrupoComponent implements OnInit, GenericList<PdvGrupo> {

  constructor() { }
  dataSource: MatTableDataSource<PdvGrupo>;
  selectedEntity: PdvGrupo;
  expandedElement: PdvGrupo;
  displayedColumns: string[];
  isLastPage: boolean;
  page: number;
  
  ngOnInit(): void {
  }

  onGetData(): void {
    throw new Error('Method not implemented.');
  }
  onRowClick(entity: PdvGrupo, index: any): void {
    throw new Error('Method not implemented.');
  }
  onDelete(entity: PdvGrupo, index: any): void {
    throw new Error('Method not implemented.');
  }
  onAddOrEdit(entity?: PdvGrupo, index?: any): void {
    throw new Error('Method not implemented.');
  }
  onFilter(): void {
    throw new Error('Method not implemented.');
  }
  cargarMasDatos(): void {
    throw new Error('Method not implemented.');
  }

}
