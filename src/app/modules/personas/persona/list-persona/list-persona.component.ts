import { Component, OnInit} from '@angular/core';
import { PersonaService } from '../persona.service';




@Component({
  selector: 'app-list-persona',
  templateUrl: './list-persona.component.html',
  styleUrls: ['./list-persona.component.css']
})
export class ListPersonaComponent implements OnInit {

  displayedColumnsId: string[] = ['id', 'nombre', 'apodo', 'telefono'];
  displayedColumns: string[] = ['Id', 'Nombre', 'Apodo', 'Teléfono'];
  displayedLinks: any[] = [null, null, null, null];

  constructor(
    public service: PersonaService
  ) { }

  ngOnInit(): void {
  }

}
