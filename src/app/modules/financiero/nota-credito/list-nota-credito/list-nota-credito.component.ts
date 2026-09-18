import { Component, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { PageInfo } from '../../../../app.component';
import { MainService } from '../../../../main.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { NotaCredito } from '../nota-credito.model';
import { NotaCreditoService } from '../nota-credito.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { ImpresionService } from '../../../../shared/components/imprimir/impresion.service';
import { MatDialog } from '@angular/material/dialog';
import {
  SearchListDialogComponent,
  SearchListtDialogData
} from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { FacturasParaNotaCreditoGQL } from '../graphql/facturasParaNotaCredito';
import { AddNotaCreditoDialogComponent } from '../add-nota-credito-dialog/add-nota-credito-dialog.component';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

/** Lista de notas de crédito electrónicas. Permisos en flags de ngOnInit, nunca en el HTML. */
@UntilDestroy()
@Component({
  selector: 'app-list-nota-credito',
  templateUrl: './list-nota-credito.component.html',
  styleUrls: ['./list-nota-credito.component.scss']
})
export class ListNotaCreditoComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  dataSource = new MatTableDataSource<NotaCredito>([]);
  displayedColumns = ['numero', 'fecha', 'factura', 'cliente', 'motivo', 'total', 'estadoDe', 'acciones'];

  sucursalIdControl = new FormControl(null);
  fechaDesdeControl = new FormControl(null);
  fechaHastaControl = new FormControl(null);

  sucursales: Sucursal[] = [];
  selectedPageInfo: PageInfo<NotaCredito>;
  pageIndex = 0;
  pageSize = 15;

  estadoDePorNota: { [notaId: number]: string } = {};
  cdcPorNota: { [notaId: number]: string } = {};

  puedeEmitir = false;
  puedeAnular = false;

  constructor(
    private service: NotaCreditoService,
    private sucursalService: SucursalService,
    private mainService: MainService,
    private dialogosService: DialogosService,
    private notificacionService: NotificacionSnackbarService,
    private impresionService: ImpresionService,
    private matDialog: MatDialog,
    private facturasParaNotaCreditoGQL: FacturasParaNotaCreditoGQL
  ) {}

  ngOnInit(): void {
    this.puedeEmitir = this.mainService.tieneAlgunRol([ROLES.FACTURACION_EMITIR, ROLES.ADMIN]);
    // Mismo rol que emitir: quien emite puede anular lo que emitió. Se deja el flag aparte porque
    // son botones distintos y la separación puede volver si algún día se parten los roles.
    this.puedeAnular = this.puedeEmitir;

    this.sucursalService.onGetAllSucursales(true).pipe(untilDestroyed(this)).subscribe(res => {
      this.sucursales = res ?? [];
    });

    this.sucursalIdControl.setValue(this.mainService.sucursalActual?.id ?? null);
    this.buscar();
  }

  /**
   * Alta desde la lista: se elige la factura con un buscador en vez de entrar por su menú.
   * El central devuelve solo candidatas reales, y el buscador muestra cliente, RUC, fecha y
   * total para que el operador confirme que eligió bien: una NC aprobada es irreversible.
   */
  onAdicionar(): void {
    const sucursalId = this.sucursalIdControl.value ?? this.mainService.sucursalActual?.id;
    if (!sucursalId) {
      this.notificacionService.openWarn('Elegí primero la sucursal');
      return;
    }
    const data: SearchListtDialogData = {
      titulo: 'Buscar factura para la nota de crédito',
      tableData: [
        { id: 'numeroFactura', nombre: 'Factura', width: '15%' },
        { id: 'fecha', nombre: 'Fecha', width: '20%' },
        { id: 'cliente', nombre: 'Cliente', width: '30%' },
        { id: 'ruc', nombre: 'RUC', width: '15%' },
        { id: 'total', nombre: 'Total', width: '20%' }
      ],
      query: this.facturasParaNotaCreditoGQL,
      queryData: { sucursalId, page: 0, size: 15 },
      searchFieldName: 'numero',
      search: true,
      textHint: 'Buscar por número de factura…',
      fallbackToLocal: true
    };
    this.matDialog.open(SearchListDialogComponent, {
      data,
      height: '80vh',
      width: '70vw',
      panelClass: 'search-dialog-dark'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe((factura: any) => {
      if (factura == null) return;
      this.matDialog.open(AddNotaCreditoDialogComponent, {
        width: '520px',
        data: {
          facturaLegalId: factura.facturaLegalId,
          sucursalId: factura.sucursalId,
          numeroFactura: factura.numeroFactura,
          cliente: factura.cliente,
          totalFactura: factura.total,
          moneda: factura.moneda
        }
      }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
        if (res) this.buscar();
      });
    });
  }

  buscar(): void {
    this.service.onGetPorFiltro(
      this.sucursalIdControl.value,
      this.fechaDesdeControl.value ? dateToString(this.fechaDesdeControl.value) : null,
      this.fechaHastaControl.value ? dateToString(this.fechaHastaControl.value) : null,
      this.pageIndex,
      this.pageSize
    ).pipe(untilDestroyed(this)).subscribe(res => {
      this.selectedPageInfo = res;
      this.dataSource.data = res?.getContent ?? [];
      this.cargarEstados();
    });
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.buscar();
  }

  onEnviar(nota: NotaCredito): void {
    this.service.onGenerarYEnviar(nota.id, nota.sucursalId).pipe(untilDestroyed(this)).subscribe(de => {
      if (de?.cdc) {
        this.notificacionService.openSucess(`Enviada a SIFEN. CDC ${de.cdc}`, 5);
      }
      this.buscar();
    });
  }

  onReenviar(nota: NotaCredito): void {
    this.service.onReenviar(nota.id, nota.sucursalId).pipe(untilDestroyed(this)).subscribe(() => this.buscar());
  }

  onImprimir(nota: NotaCredito): void {
    // El nombre es también el del archivo al descargar el PDF: «Nota de crédito» dejaba todos
    // los KuDE con el mismo nombre en la carpeta de descargas. Con el número se distinguen.
    this.impresionService.imprimir(
      this.nombreArchivo(nota),
      () => this.service.onImprimir(nota.id, nota.sucursalId),
      true
    );
  }

  private nombreArchivo(nota: NotaCredito): string {
    const numero = this.numeroFormateado(nota);
    return numero ? `KuDE-NC-${numero}` : 'KuDE-NC';
  }

  onAnular(nota: NotaCredito): void {
    this.dialogosService.confirm(
      'Anular nota de crédito',
      `Se va a cancelar ante SIFEN la nota ${this.numeroFormateado(nota)}.`,
      '¿Confirmás?'
    ).pipe(untilDestroyed(this)).subscribe(confirmado => {
      if (confirmado) {
        this.service.onAnular(nota.id, nota.sucursalId).pipe(untilDestroyed(this)).subscribe(() => this.buscar());
      }
    });
  }

  numeroFormateado(nota: NotaCredito): string {
    if (!nota?.numeroNotaCredito) return '';
    return `001-001-${String(nota.numeroNotaCredito).padStart(7, '0')}`;
  }

  private cargarEstados(): void {
    (this.dataSource.data ?? []).forEach(nota => {
      this.service.onGetDocumentoElectronico(nota.id, nota.sucursalId)
        .pipe(untilDestroyed(this))
        .subscribe(de => {
          this.estadoDePorNota[nota.id] = de?.estado ?? 'SIN ENVIAR';
          this.cdcPorNota[nota.id] = de?.cdc ?? '';
        });
    });
  }
}
