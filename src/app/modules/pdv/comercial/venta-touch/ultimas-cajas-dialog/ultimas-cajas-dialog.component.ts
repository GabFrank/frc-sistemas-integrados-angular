import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy } from '@ngneat/until-destroy';
import { PdvCaja } from '../../../../financiero/pdv/caja/caja.model';
import { CajaService } from '../../../../financiero/pdv/caja/caja.service';

@UntilDestroy({checkProperties: true})
@Component({
  selector: 'app-ultimas-cajas-dialog',
  templateUrl: './ultimas-cajas-dialog.component.html',
  styleUrls: ['./ultimas-cajas-dialog.component.scss']
})
export class UltimasCajasDialogComponent implements OnInit {

  dataSource = new MatTableDataSource<PdvCaja>([])
  isLastPage = false;
  displayedColumns = ['id', 'responsable', 'fechaApertura', 'fechaCierre', 'acciones']

  constructor(
    public dialogRef: MatDialogRef<UltimasCajasDialogComponent>,
    private cajaService: CajaService
  ) { }

  ngOnInit(): void {
    let hoy = new Date()
    let ayer = new Date()
    let manana = new Date()
    manana.setDate(manana.getDate() + 1)
    ayer.setDate(ayer.getDate() - 2)
    this.cajaService.onGetByDate(ayer, manana).subscribe(res => {
      this.dataSource.data = res;
    })
  }

  onImprimirBalance(caja: PdvCaja){
    this.cajaService.onImprimirBalance(caja.id, caja.sucursalId);
  }

  cargarMasDatos(){}

}
