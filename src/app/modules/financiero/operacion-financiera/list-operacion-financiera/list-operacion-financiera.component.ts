import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { OperacionFinanciera } from '../operacion-financiera.model';
import { OperacionFinancieraService } from '../operacion-financiera.service';
import { AddOperacionFinancieraDialogComponent } from '../add-operacion-financiera-dialog/add-operacion-financiera-dialog.component';
import { Tab } from '../../../../layouts/tab/tab.model';
import { MainService } from '../../../../main.service';
import { ROLES } from '../../../personas/roles/roles.enum';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-operacion-financiera',
  templateUrl: './list-operacion-financiera.component.html',
  styleUrls: ['./list-operacion-financiera.component.scss']
})
export class ListOperacionFinancieraComponent implements OnInit {

  @Input() data: Tab;

  // Filas de display: la entidad + origenLabel/destinoLabel precalculados (any porque
  // el spread pierde el toInput() de la clase; es solo para la tabla, no se guarda).
  dataSource = new MatTableDataSource<any>([]);
  isSearching = false;
  pageIndex = 0;
  pageSize = 10;
  totalElements = 0;

  puedeGestionar = false;

  tipoOperacionLabels: Record<string, string> = {
    CAMBIO_DIVISA: 'Cambio de Divisa',
    DEPOSITO_BANCARIO: 'Depósito Bancario',
    RETIRO_BANCARIO: 'Retiro Bancario',
    TRANSFERENCIA_ENTRE_CAJAS: 'Transferencia entre Cajas',
    TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria',
  };

  displayedColumns = ['creadoEn', 'tipoOperacion', 'origen', 'destino', 'montoOrigen', 'montoDestino', 'descripcion', 'anulado'];

  constructor(
    private operacionFinancieraService: OperacionFinancieraService,
    private dialog: MatDialog,
    public mainService: MainService
  ) { }

  ngOnInit(): void {
    this.puedeGestionar = this.mainService.tieneAlgunRol([ROLES.TESORERIA_GESTIONAR]);
    this.onFiltrar();
  }

  onFiltrar() {
    this.isSearching = true;
    this.operacionFinancieraService.onGetOperaciones(this.pageIndex, this.pageSize)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.isSearching = false;
        if (res != null) {
          this.totalElements = res.getTotalElements;
          // Etiquetas de origen/destino pre-calculadas al cargar — evita llamar
          // funciones desde el HTML en cada fila.
          this.dataSource.data = (res.getContent || []).map(op => ({
            ...op,
            origenLabel: op.cajaMayorOrigen?.nombre
              || (op.cuentaBancariaOrigen ? `${op.cuentaBancariaOrigen.banco?.nombre} ${op.cuentaBancariaOrigen.numero}` : '-'),
            destinoLabel: op.cajaMayorDestino?.nombre
              || (op.cuentaBancariaDestino ? `${op.cuentaBancariaDestino.banco?.nombre} ${op.cuentaBancariaDestino.numero}` : '-'),
          }));
        }
      });
  }

  onAdd() {
    this.dialog.open(AddOperacionFinancieraDialogComponent, {
      width: '880px',
      maxWidth: '95vw',
      maxHeight: '92vh',
      data: null
    }).afterClosed().subscribe(res => {
      if (res != null) this.onFiltrar();
    });
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }
}
