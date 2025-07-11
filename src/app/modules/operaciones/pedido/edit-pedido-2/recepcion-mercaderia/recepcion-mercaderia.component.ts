import { Component, EventEmitter, Input, OnInit, Output, ViewChild, SimpleChanges, OnChanges } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

// Modelos y Servicios (asumimos que existen, pero comentamos su uso por ahora)
// import { RecepcionMercaderia } from './recepcion-mercaderia.model';
// import { RecepcionMercaderiaService } from './recepcion-mercaderia.service';
// import { RecepcionMercaderiaItem } from './recepcion-mercaderia-item.model';
import { Pedido } from '../../edit-pedido/pedido.model';

import { MainService } from '../../../../../main.service';
import { DialogosService } from '../../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-recepcion-mercaderia',
  templateUrl: './recepcion-mercaderia.component.html',
  styleUrls: ['./recepcion-mercaderia.component.scss']
})
export class RecepcionMercaderiaComponent implements OnInit, OnChanges {

  @Input() pedido: Pedido | null = null;
  @Input() recepcionMercaderiaId: number | null = null;
  
  @Output() stepValidChange = new EventEmitter<boolean>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  // Modelo principal del componente (temporalmente any)
  recepcion: any | null = null;
  dataSource = new MatTableDataSource<any>([]);
  isLoading = false;

  constructor(
    private mainService: MainService,
    private matDialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacionService: NotificacionSnackbarService,
    // private recepcionMercaderiaService: RecepcionMercaderiaService, // Comentado temporalmente
  ) {}

  ngOnInit(): void {
    // Vacío por ahora
  }

  ngOnChanges(changes: SimpleChanges): void {
    // if (changes['recepcionMercaderiaId']) {
    //   this.loadRecepcionData();
    // }
  }

  /*
  loadRecepcionData(): void {
    if (!this.recepcionMercaderiaId) {
      this.recepcion = {}; // new RecepcionMercaderia();
      this.dataSource.data = [];
      return;
    }

    this.isLoading = true;
    this.recepcionMercaderiaService.onGetById(this.recepcionMercaderiaId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (data) => {
          this.recepcion = data;
          this.dataSource.data = data.recepcionMercaderiaItemList || [];
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }
  */
  
  // TODOS LOS DEMÁS MÉTODOS (loadData, clearData, loadNotaRecepcions, loadPedidoItems, 
  // loadSummary, updateComputedProperties, etc.) HAN SIDO ELIMINADOS.
} 