import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Moneda } from './moneda.model';
import { MonedaService } from './moneda.service';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { DialogosService } from '../../../shared/components/dialogos/dialogos.service';
import { AddMonedaDialogComponent, AddMonedaDialogData } from './add-moneda-dialog/add-moneda-dialog.component';
import { MainService } from '../../../main.service';
import { ROLES } from '../../personas/roles/roles.enum';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-moneda',
  templateUrl: './moneda.component.html',
  styleUrls: ['./moneda.component.scss']
})
export class MonedaComponent implements OnInit {

  dataSource = new MatTableDataSource<Moneda>([]);
  isSearching = false;
  private readonly columnasBase = ['id', 'denominacion', 'simbolo', 'decimales', 'principal', 'activo', 'acciones'];
  displayedColumns = this.columnasBase;
  puedeGestionar = false;
  /**
   * El central conoce `codigoIso`. Se sabe al cargar: si la consulta del ABM (que lo pide) falla, se
   * vuelve a la de siempre y el código ISO no se muestra ni se envía.
   */
  soportaCodigoIso = false;

  constructor(
    private monedaService: MonedaService,
    private dialog: MatDialog,
    private notificacion: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    public mainService: MainService
  ) {}

  ngOnInit(): void {
    this.puedeGestionar = this.mainService.tieneAlgunRol([ROLES.TESORERIA_GESTIONAR, ROLES.ADMIN]);
    this.cargar();
  }

  cargar() {
    this.isSearching = true;
    this.monedaService.onGetAllAbm().pipe(untilDestroyed(this)).subscribe({
      next: res => {
        this.isSearching = false;
        this.setSoportaCodigoIso(true);
        if (res != null) this.dataSource.data = res;
      },
      // Central anterior al código ISO (o sin red): la consulta de siempre, sin el campo.
      error: () => this.cargarSinCodigoIso(),
    });
  }

  private cargarSinCodigoIso() {
    this.setSoportaCodigoIso(false);
    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      this.isSearching = false;
      if (res != null) this.dataSource.data = res;
    });
  }

  private setSoportaCodigoIso(soporta: boolean) {
    this.soportaCodigoIso = soporta;
    this.displayedColumns = soporta
      ? ['id', 'denominacion', 'simbolo', 'codigoIso', 'decimales', 'principal', 'activo', 'acciones']
      : this.columnasBase;
  }

  onAdd() {
    this.abrirDialogo(null);
  }

  onEdit(item: Moneda) {
    this.abrirDialogo(item);
  }

  private abrirDialogo(moneda: Moneda | null) {
    const data: AddMonedaDialogData = { moneda, soportaCodigoIso: this.soportaCodigoIso };
    this.dialog.open(AddMonedaDialogComponent, { width: '480px', data })
      .afterClosed().subscribe(res => { if (res) this.cargar(); });
  }

  onDelete(item: Moneda) {
    this.dialogosService.confirm(
      'Eliminar Moneda',
      `¿Eliminar la moneda "${item.denominacion}"?`,
      null, null, true, 'Sí, eliminar', 'No'
    ).subscribe(res => {
      if (res === true) {
        // El aviso de error (negocio o red) ya lo muestra GenericCrudService.onSaveCustom.
        this.monedaService.onDelete(item.id, { avisarExito: false }).pipe(untilDestroyed(this)).subscribe({
          next: ok => {
            if (ok) { this.notificacion.openSucess('Moneda eliminada'); this.cargar(); }
            else this.notificacion.openAlgoSalioMal('No se pudo eliminar la moneda');
          },
          error: () => {}
        });
      }
    });
  }
}
