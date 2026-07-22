import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
import { MainService } from '../../../../main.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { ConfiguracionRrhh, ConfiguracionRrhhTipo } from '../configuracion-rrhh.model';
import { ConfiguracionRrhhService } from '../configuracion-rrhh.service';
import { EditConfiguracionRrhhDialogComponent } from '../edit-configuracion-rrhh-dialog/edit-configuracion-rrhh-dialog.component';
import { ConfigInfoDialogComponent } from '../config-info-dialog/config-info-dialog.component';
import { AjusteSalarioMinimoDialogComponent } from '../ajuste-salario-minimo-dialog/ajuste-salario-minimo-dialog.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-configuracion-rrhh',
  templateUrl: './list-configuracion-rrhh.component.html',
  styleUrls: ['./list-configuracion-rrhh.component.scss']
})
export class ListConfiguracionRrhhComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  readonly ROLES = ROLES;

  displayedColumns = ['clave', 'valor', 'tipo', 'descripcion', 'activo', 'acciones'];
  dataSource = new MatTableDataSource<ConfiguracionRrhh>([]);

  textoControl = new FormControl(null);
  tipoControl = new FormControl(null);

  tipoOpciones: ConfiguracionRrhhTipo[] = ['NUMBER', 'STRING', 'BOOLEAN', 'DATE'];

  pageIndex = 0;
  pageSize = 25;
  selectedPageInfo: PageInfo<ConfiguracionRrhh>;

  constructor(
    private configuracionRrhhService: ConfiguracionRrhhService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService
  ) { }

  ngOnInit(): void {
    this.onFiltrar();
  }

  onFiltrar() {
    this.configuracionRrhhService.onGetPage(
      this.pageIndex,
      this.pageSize,
      this.textoControl.value,
      this.tipoControl.value
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.selectedPageInfo = res;
        // La clave es un identificador tecnico (SALARIO_MINIMO_LEGAL_PYG). Se muestra
        // legible; la original queda en el tooltip porque es la que se usa en el codigo
        // y en soporte. Se precalcula aca: llamar una funcion desde el HTML se re-evalua
        // en cada ciclo de deteccion de cambios.
        this.dataSource.data = (res.getContent || []).map(c => ({
          ...c,
          claveLabel: this.humanizarClave(c.clave)
        }));
      }
    });
  }

  /** SALARIO_MINIMO_LEGAL_PYG -> "Salario minimo legal pyg" */
  private humanizarClave(clave: string): string {
    if (!clave) return '';
    const texto = clave.replace(/_/g, ' ').toLowerCase();
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  onResetFiltro() {
    this.textoControl.setValue(null);
    this.tipoControl.setValue(null);
    this.pageIndex = 0;
    this.onFiltrar();
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }

  onNuevo() {
    this.dialog.open(EditConfiguracionRrhhDialogComponent, {
      width: '520px',
      disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.onFiltrar();
      }
    });
  }

  onInfo(configuracion: ConfiguracionRrhh) {
    this.dialog.open(ConfigInfoDialogComponent, {
      data: { clave: configuracion.clave, valor: configuracion.valor, descripcion: configuracion.descripcion },
      width: '560px'
    });
  }

  onEditar(configuracion: ConfiguracionRrhh) {
    const valorAnterior = configuracion?.valor;
    this.dialog.open(EditConfiguracionRrhhDialogComponent, {
      data: { configuracion },
      width: '520px',
      disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.onFiltrar();
        this.revisarImpacto(res, valorAnterior);
      }
    });
  }

  /**
   * TODO-8: algunos parametros estan materializados en registros y no se corrigen
   * solos al cambiarlos. El unico caso hoy es el salario minimo legal: si subio,
   * se ofrece (no se impone) ajustar a los funcionarios que quedaron por debajo.
   *
   * Los parametros que se leen al calcular (IPS, recargos de HE, dias de vacaciones)
   * NO entran aca: cambiarlos ya afecta todo calculo futuro y reescribir el historico
   * seria incorrecto.
   */
  private revisarImpacto(guardado: ConfiguracionRrhh, valorAnterior: string) {
    if (guardado?.clave !== 'SALARIO_MINIMO_LEGAL_PYG') return;
    const nuevo = Number(guardado?.valor);
    const anterior = Number(valorAnterior);
    if (isNaN(nuevo)) return;
    // Solo importa cuando SUBE: si baja, nadie queda por debajo por este cambio.
    if (!isNaN(anterior) && nuevo <= anterior) return;

    this.dialog.open(AjusteSalarioMinimoDialogComponent, {
      data: { minimo: nuevo },
      width: '760px',
      disableClose: true
    });
  }

  onEliminar(configuracion: ConfiguracionRrhh) {
    this.dialogosService.confirm(
      'Eliminar configuración',
      '¿Desea eliminar la configuración ' + configuracion.clave + '?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.configuracionRrhhService.onDelete(configuracion.id)
          .pipe(untilDestroyed(this))
          .subscribe(ok => {
            if (ok) {
              this.onFiltrar();
            }
          });
      }
    });
  }
}
