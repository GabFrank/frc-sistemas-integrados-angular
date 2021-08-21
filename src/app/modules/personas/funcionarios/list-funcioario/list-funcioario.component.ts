import { Component, OnInit } from '@angular/core';
import { PersonaDetalleDialogoComponent } from '../../persona/persona-detalle-dialogo/persona-detalle-dialogo.component';
import { PersonaService } from '../../persona/persona.service';
import { FuncionarioService } from '../funcionario.service';

@Component({
  selector: 'app-list-funcioario',
  templateUrl: './list-funcioario.component.html',
  styleUrls: ['./list-funcioario.component.css']
})
export class ListFuncioarioComponent implements OnInit {

  displayedColumnsId: string[] = ['id', 'nombrePersona', 'nombreSucursal', 'nombreCargo', 'nombreSupervisor', 'sueldo', 'telefono'];
  displayedColumns: string[] = ['Id', 'Nombre', 'Sucursal', 'Cargo', 'Supervisor' , 'Sueldo', 'Teléfono'];
  displayedLinks: any[] = [ null, {service: PersonaService, item: 'persona', dialogComponent: PersonaDetalleDialogoComponent}, null, null, null, null, null]
  constructor(
    public service: FuncionarioService
  ) { }

  ngOnInit(): void {
  }

  rowSelectedEvent(e){
  }

}
