import { Component, OnInit } from '@angular/core';
import { Maletin } from '../../maletin/maletin.model';


export interface SinMaletinDialogResponse {
  sinMaletin: boolean,
  maletin: Maletin
}

@Component({
  selector: 'app-sin-maletin-dialog',
  templateUrl: './sin-maletin-dialog.component.html',
  styleUrls: ['./sin-maletin-dialog.component.scss']
})
export class SinMaletinDialogComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
