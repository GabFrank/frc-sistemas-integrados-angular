import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CargandoDialogService } from './cargando-dialog.service';

class Data {
  texto: string
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
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
    this.cargandoDialoService.cargandoTextSub.pipe(untilDestroyed(this)).subscribe(res =>{
      if(res!=null){
        this.itemList.push(res)
      }
    })
  }

}
