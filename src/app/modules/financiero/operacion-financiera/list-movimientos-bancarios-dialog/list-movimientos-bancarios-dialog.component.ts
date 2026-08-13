import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MovimientoBancario } from '../operacion-financiera.model';
import { OperacionFinancieraService } from '../operacion-financiera.service';
import { CuentaBancaria } from '../../cuenta-bancaria/cuenta-bancaria.model';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-movimientos-bancarios-dialog',
  templateUrl: './list-movimientos-bancarios-dialog.component.html',
  styleUrls: ['./list-movimientos-bancarios-dialog.component.scss']
})
export class ListMovimientosBancariosDialogComponent implements OnInit {

  dataSource = new MatTableDataSource<MovimientoBancario>([]);
  isSearching = false;
  pageIndex = 0;
  pageSize = 20;
  totalElements = 0;

  displayedColumns = ['creadoEn', 'tipoMovimiento', 'monto', 'saldoAnterior', 'saldoPosterior', 'descripcion', 'anulado'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public cuentaBancaria: CuentaBancaria,
    private operacionFinancieraService: OperacionFinancieraService,
  ) { }

  ngOnInit(): void {
    this.onFiltrar();
  }

  onFiltrar() {
    if (!this.cuentaBancaria?.id) return;
    this.isSearching = true;
    this.operacionFinancieraService.onGetMovimientosBancarios(this.cuentaBancaria.id, this.pageIndex, this.pageSize)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.isSearching = false;
        if (res != null) {
          this.totalElements = res.getTotalElements;
          this.dataSource.data = res.getContent;
        }
      });
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }
}
