import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-tarjeta-dialog',
  templateUrl: './tarjeta-dialog.component.html',
  styleUrls: ['./tarjeta-dialog.component.css']
})
export class TarjetaDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<TarjetaDialogComponent>
  ) { }

  ngOnInit(): void {
  }

}
