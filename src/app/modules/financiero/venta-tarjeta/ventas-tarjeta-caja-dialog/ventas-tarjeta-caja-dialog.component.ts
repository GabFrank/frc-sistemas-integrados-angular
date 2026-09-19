import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
import { MainService } from '../../../../main.service';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { TerminalPos } from '../../terminal-pos/terminal-pos.model';
import { TerminalPosService } from '../../terminal-pos/terminal-pos.service';
import { VentaTarjeta } from '../venta-tarjeta.model';
import { VentaTarjetaService } from '../venta-tarjeta.service';
import { RegistrarVentaTarjetaDialogComponent } from '../qr-pos/registrar-venta-tarjeta-dialog/registrar-venta-tarjeta-dialog.component';
import { TipoEntidad } from '../../../../generics/tipo-entidad.enum';

export interface VentasTarjetaCajaDialogData {
  cajaId: number;
}

/**
 * Ventas con tarjeta de la caja abierta, para el cajero, desde el PDV (Utilitarios F1).
 *
 * Distinta de `ListVentaTarjetaComponent` a proposito:
 *
 * - **Consulta al FILIAL**, no al central. El PDV tiene que operar sin internet, y `completar()`
 *   corre contra el filial de todas formas.
 * - **El aislamiento sale por construccion**: la query exige `cajaId` y `sucId` del lado del
 *   servidor, asi que no puede devolver datos de otra caja ni de otra sucursal aunque alguien
 *   manipule los filtros.
 * - **Paginada del lado del servidor.** Una caja puede acumular cientos de cobros en un turno;
 *   traerlos todos para mostrar quince seria pagar por datos que nadie mira.
 *
 * La pantalla del sidebar sigue existiendo para auditar la red: son dos necesidades distintas.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-ventas-tarjeta-caja-dialog',
  templateUrl: './ventas-tarjeta-caja-dialog.component.html',
  styleUrls: ['./ventas-tarjeta-caja-dialog.component.scss'],
})
export class VentasTarjetaCajaDialogComponent implements OnInit {
  dataSource = new MatTableDataSource<VentaTarjeta>([]);
  displayedColumns = ['id', 'terminal', 'monto', 'escaneado', 'estado', 'acciones'];

  estadoControl = new FormControl(null);
  terminalPosIdControl = new FormControl(null);
  monedaIdControl = new FormControl(null);
  montoDesdeControl = new FormControl(null);
  montoHastaControl = new FormControl(null);

  estados = ['PENDIENTE', 'COMPLETADO', 'NO_COMPLETADO', 'CANCELADO'];
  terminales: TerminalPos[] = [];
  monedas: Moneda[] = [];

  decimalesPorMoneda: { [id: number]: number } = {};
  selectedPageInfo: PageInfo<VentaTarjeta>;
  pageIndex = 0;
  pageSize = 15;
  cargando = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: VentasTarjetaCajaDialogData,
    public dialogRef: MatDialogRef<VentasTarjetaCajaDialogComponent>,
    private ventaTarjetaService: VentaTarjetaService,
    private monedaService: MonedaService,
    private terminalPosService: TerminalPosService,
    private matDialog: MatDialog,
    public mainService: MainService
  ) {}

  ngOnInit(): void {
    // Todo contra el filial (`false`): esta pantalla tiene que funcionar sin internet.
    this.monedaService.onGetAll(false).pipe(untilDestroyed(this)).subscribe({
      next: (monedas) => {
        this.monedas = monedas || [];
        this.monedas.forEach((m) => (this.decimalesPorMoneda[Number(m.id)] = m.decimales ?? 0));
        this.onGetData();
      },
      error: () => this.onGetData(),
    });

    this.terminalPosService.onGetAll(null, null, false).pipe(untilDestroyed(this)).subscribe({
      next: (res) => (this.terminales = res || []),
      error: () => (this.terminales = []),
    });
  }

  onGetData(): void {
    this.cargando = true;
    const params: any = {
      cajaId: this.data.cajaId,
      sucId: Number(this.mainService.sucursalActual?.id),
      page: this.pageIndex,
      size: this.pageSize,
    };
    if (this.estadoControl.value) params.estado = this.estadoControl.value;
    if (this.terminalPosIdControl.value) params.terminalPosId = Number(this.terminalPosIdControl.value);
    if (this.monedaIdControl.value) params.monedaId = Number(this.monedaIdControl.value);
    if (this.montoDesdeControl.value != null && this.montoDesdeControl.value !== '') {
      params.montoDesde = Number(this.montoDesdeControl.value);
    }
    if (this.montoHastaControl.value != null && this.montoHastaControl.value !== '') {
      params.montoHasta = Number(this.montoHastaControl.value);
    }

    this.ventaTarjetaService
      .onFiltrarPorCaja(params)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.selectedPageInfo = res;
          this.dataSource.data = (res?.getContent ?? []).map((item) => this.aFilaConMoneda(item));
          this.cargando = false;
        },
        error: () => {
          this.dataSource.data = [];
          this.cargando = false;
        },
      });
  }

  onFilter(): void {
    this.pageIndex = 0;
    this.onGetData();
  }

  onLimpiarFiltros(): void {
    this.estadoControl.setValue(null);
    this.terminalPosIdControl.setValue(null);
    this.monedaIdControl.setValue(null);
    this.montoDesdeControl.setValue(null);
    this.montoHastaControl.setValue(null);
    this.pageIndex = 0;
    this.onGetData();
  }

  handlePageEvent(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.onGetData();
  }

  /**
   * Apollo congela los resultados, asi que se clona antes de agregar los campos de display.
   * Los decimales dependen de la moneda: Gs. no lleva ninguno y R$ lleva dos, asi que un `1.0-2`
   * fijo mostraba "50 R$" en vez de "50,00 R$".
   */
  private aFilaConMoneda(item: VentaTarjeta): VentaTarjeta {
    const moneda = item?.moneda ?? item?.terminalPos?.moneda;
    const decimales = moneda?.decimales ?? 0;
    return {
      ...item,
      simboloMoneda: moneda?.simbolo ?? 'Gs.',
      digitosMoneda: `1.${decimales}-${decimales}`,
    };
  }

  onCompletar(item: VentaTarjeta): void {
    this.matDialog
      .open(RegistrarVentaTarjetaDialogComponent, {
        data: {
          ventaTarjetaId: item.id,
          sucursalId: item.sucursalId,
          ventaId: item.ventaId,
          qrPayload: {
            sucursalId: item.sucursalId,
            tipoEntidad: TipoEntidad.VENTA_TARJETA,
            idOrigen: item.ventaId,
            idCentral: item.ventaId,
            componentToOpen: 'RegistroVentaTarjetaComponent',
            data: (item.cajaId ?? '') + '|' + item.monto + '|' + item.id,
            timestamp: Date.now(),
          },
          monto: item.monto,
          monedaSimbolo: item.simboloMoneda,
          terminalDescripcion: [item.terminalPos?.descripcion, item.terminalPos?.codigo]
            .filter(Boolean)
            .join(' - '),
          proveedorServicioId: item.terminalPos?.proveedorServicio?.id,
          decimalesPorMoneda: this.decimalesPorMoneda,
          titulo: 'Completar venta con tarjeta',
          segundos: 120,
        },
        disableClose: false,
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe(() => this.onGetData());
  }

  cerrar(): void {
    this.dialogRef.close(null);
  }
}
