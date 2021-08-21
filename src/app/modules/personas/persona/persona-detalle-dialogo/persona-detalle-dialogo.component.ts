import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DisplayedLinkData } from '../../../../shared/components/generic-list/generic-list.component';
import { Persona } from '../persona.model';
import { PersonaService } from '../persona.service';

@Component({
  selector: 'app-persona-detalle-dialogo',
  templateUrl: './persona-detalle-dialogo.component.html',
  styleUrls: ['./persona-detalle-dialogo.component.css']
})
export class PersonaDetalleDialogoComponent implements OnInit{

  persona: Persona;
  isDataLoaded = false;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DisplayedLinkData,
    private service: PersonaService
  ) {
  }
  ngOnInit(): void {
    this.service.findById(this.data.el[this.data.item].id, this.service.entityQuery).subscribe((data)=>{
      if(data.errors){
      } else {
        this.persona = data.data.data;
        setTimeout(() => {
          this.isDataLoaded = true;
        }, 1000);
      }
    });
  }

}
