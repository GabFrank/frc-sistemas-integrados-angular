import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CargandoDialogService } from './cargando-dialog.service';

class Data {
  texto: string
}

@Component({
  selector: 'app-cargando-dialog',
  templateUrl: './cargando-dialog.component.html',
  styleUrls: ['./cargando-dialog.component.css']
})
export class CargandoDialogComponent implements OnInit {

  itemList: string[];

  constructor(
    private cargandoDialoService: CargandoDialogService
  ) { 
    this.itemList = []
  }

  ngOnInit(): void {
    this.cargandoDialoService.cargandoTextSub.subscribe(res =>{
      if(res!=null){
        this.itemList.push(res)
      }
    })
  }

}
