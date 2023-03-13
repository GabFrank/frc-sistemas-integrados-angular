import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Codigo } from '../codigo.model';

export interface BuscarCodigoData {
  codigos: Codigo[]
}

@Component({
  selector: 'app-crear-codigos-dialog',
  templateUrl: './crear-codigos-dialog.component.html',
  styleUrls: ['./crear-codigos-dialog.component.scss']
})
export class CrearCodigosDialogComponent implements OnInit {

  dataSource = new MatTableDataSource<Codigo>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: BuscarCodigoData,
    public dialogRef: MatDialogRef<CrearCodigosDialogComponent>, 
  ) { 
  }

  ngOnInit(): void {

    this.dataSource.data = this.data.codigos;

  }

  onSelectCodigoRow(row: Codigo){
    this.dialogRef.close(row);
  }

}
