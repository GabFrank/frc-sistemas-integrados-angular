import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { Usuario } from '../../modules/personas/usuarios/usuario.model';

export interface TimelineData {
  texto: string;
  fecha: Date;
  usuario: Usuario;
  terminado: boolean;
}

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit {

  @Input()
  length: number;

  constructor(
  ) {}

  ngOnInit(): void {

  }

}
