import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
import { stringToLocalDate } from '../../../../commons/core/utils/dateUtils';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { PrecioEspecialSucursal } from '../precio-especial.model';
import { PrecioEspecialService } from '../precio-especial.service';
import { estadoPrecioEspecial } from '../precio-especial.util';

@UntilDestroy()
@Component({
  selector: 'app-list-precio-especial',
  templateUrl: './list-precio-especial.component.html',
  styleUrls: ['./list-precio-especial.component.scss'],
})
export class ListPrecioEspecialComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  dataSource = new MatTableDataSource<PrecioEspecialSucursal>([]);
  displayedColumns = ['id', 'sucursal', 'producto', 'presentacion', 'tipoPrecio', 'global', 'precio', 'vigencia', 'estado', 'usuario', 'acciones'];
  selectedPageInfo: PageInfo<PrecioEspecialSucursal>;
  pageIndex = 0;
  pageSize = 15;
  sucursalIdControl = new FormControl<number>(null);
  textoControl = new FormControl<string>(null);
  soloVigentesControl = new FormControl<boolean>(true);
  sucursales: Sucursal[] = [];
  hoy = new Date();

  constructor(
    private service: PrecioEspecialService,
    private sucursalService: SucursalService,
    private dialogosService: DialogosService
  ) {}

  ngOnInit(): void {
    this.sucursalService.onGetAllSucursales(true).pipe(untilDestroyed(this))
      .subscribe((res) => (this.sucursales = (res || []).filter((s) => Number(s.id) !== 0)));
    this.onGetData();
  }

  onGetData(): void {
    const params: any = { page: this.pageIndex, size: this.pageSize, soloVigentes: !!this.soloVigentesControl.value };
    if (this.sucursalIdControl.value != null) params.sucursalId = Number(this.sucursalIdControl.value);
    if (this.textoControl.value) params.texto = this.textoControl.value;
    this.service.onFiltrar(params).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res) {
        this.selectedPageInfo = res;
        this.dataSource.data = res.getContent ?? [];
      }
    });
  }

  onFilter(): void {
    this.pageIndex = 0;
    if (this.paginator) this.paginator.pageIndex = 0;
    this.onGetData();
  }

  onLimpiarFiltros(): void {
    this.sucursalIdControl.setValue(null);
    this.textoControl.setValue(null);
    this.soloVigentesControl.setValue(true);
    this.onFilter();
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onGetData();
  }

  estado(e: PrecioEspecialSucursal) {
    return estadoPrecioEspecial(e, this.hoy);
  }

  vigencia(e: PrecioEspecialSucursal): string {
    const f = (v: string) => (v ? stringToLocalDate(v).toLocaleDateString('es-PY') : null);
    return `${f(e.fechaDesde) ?? 'siempre'} → ${f(e.fechaHasta) ?? 'sin fin'}`;
  }

  onCortar(e: PrecioEspecialSucursal): void {
    this.dialogosService
      .confirm('Cortar precio especial', `¿Cortar el precio especial de ${e.sucursal?.nombre}?`,
        'La sucursal vuelve al precio global desde el próximo escaneo.')
      .pipe(untilDestroyed(this))
      .subscribe((ok) => {
        if (ok) this.service.onCortar(e.id).pipe(untilDestroyed(this)).subscribe({ next: () => this.onGetData(), error: () => {} });
      });
  }
}
