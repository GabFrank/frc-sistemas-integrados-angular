import { Component, OnInit } from '@angular/core';
import { CargandoDialogService } from './cargando-dialog.service';

@Component({
  selector: 'app-cargando-dialog',
  templateUrl: './cargando-dialog.component.html',
  styleUrls: ['./cargando-dialog.component.css']
})
export class CargandoDialogComponent implements OnInit {


  constructor(
    public cargandoService: CargandoDialogService
  ) {}

  ngOnInit(): void {

  }

}
