import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { LiquidacionConcepto } from '../liquidacion-concepto.model';
import { LiquidacionConceptoService } from '../liquidacion-concepto.service';
import { EditLiquidacionConceptoDialogComponent } from '../edit-liquidacion-concepto-dialog/edit-liquidacion-concepto-dialog.component';

/**
 * ABM del catalogo de conceptos de liquidacion. El backend existia entero desde V154.0;
 * lo que faltaba era esta pantalla, asi que `es_remunerativo` -- que decide que entra a
 * la base del aguinaldo, del IPS del finiquito y de la indemnizacion -- solo se editaba
 * por SQL, y un concepto nuevo se llevaba el DEFAULT TRUE de la columna sin que nadie lo
 * decidiera.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-liquidacion-concepto',
  templateUrl: './list-liquidacion-concepto.component.html',
  styleUrls: ['./list-liquidacion-concepto.component.scss']
})
export class ListLiquidacionConceptoComponent implements OnInit {

  displayedColumns = ['id', 'codigo', 'descripcion', 'tipo', 'esRemunerativo', 'esCalculadoAuto', 'activo', 'acciones'];
  dataSource = new MatTableDataSource<LiquidacionConcepto>([]);

  textoControl = new FormControl(null);
  /** tri-state: null=Todos, true=Activos, false=Inactivos */
  activoControl = new FormControl(null);

  /** El catalogo completo tal cual vino del backend; los filtros trabajan sobre esto. */
  private conceptos: LiquidacionConcepto[] = [];

  constructor(
    private liquidacionConceptoService: LiquidacionConceptoService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService
  ) { }

  ngOnInit(): void {
    this.onCargar();
  }

  onCargar() {
    this.liquidacionConceptoService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.conceptos = res || [];
        this.onFiltrar();
      }
    });
  }

  onFiltrar() {
    const texto = this.textoControl.value ? this.textoControl.value.trim().toUpperCase() : null;
    const activo = this.activoControl.value;
    this.dataSource.data = this.conceptos.filter(c => {
      if (activo != null && (c.activo === true) !== activo) { return false; }
      if (texto == null) { return true; }
      return (c.codigo || '').toUpperCase().includes(texto)
        || (c.descripcion || '').toUpperCase().includes(texto);
    });
  }

  onResetFiltro() {
    this.textoControl.setValue(null);
    this.activoControl.setValue(null);
    this.onCargar();
  }

  onNuevo() {
    this.abrir(null);
  }

  onEditar(concepto: LiquidacionConcepto) {
    this.abrir(concepto);
  }

  private abrir(concepto: LiquidacionConcepto) {
    this.dialog.open(EditLiquidacionConceptoDialogComponent, {
      data: { concepto },
      width: '560px',
      maxWidth: '95vw',
      panelClass: 'liquidacion-concepto-panel',
      autoFocus: false,
      disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onCargar(); });
  }

  /**
   * Alternativa al borrado para un concepto ya usado: lo saca del select de item manual
   * sin tocar los recibos que lo referencian por codigo.
   */
  onCambiarEstado(concepto: LiquidacionConcepto) {
    const activar = !concepto.activo;
    this.dialogosService.confirm(
      activar ? 'Activar concepto' : 'Desactivar concepto',
      (activar ? '¿Desea activar el concepto ' : '¿Desea desactivar el concepto ') + concepto.codigo + '?',
      activar
        ? 'Vuelve a estar disponible para cargar ítems manuales.'
        : 'Deja de ofrecerse al cargar ítems manuales. Las liquidaciones ya emitidas no cambian.',
      null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        // Apollo congela los resultados: se clona antes de mutar.
        const aux = new LiquidacionConcepto();
        Object.assign(aux, concepto);
        aux.activo = activar;
        aux.usuario = this.mainService.usuarioActual;
        this.liquidacionConceptoService.onSave(aux.toInput())
          .pipe(untilDestroyed(this)).subscribe(guardado => { if (guardado != null) this.onCargar(); });
      }
    });
  }

  onEliminar(concepto: LiquidacionConcepto) {
    this.dialogosService.confirm(
      'Eliminar concepto', '¿Desea eliminar el concepto ' + concepto.codigo + '?',
      'Si ya aparece en ítems de liquidaciones emitidas, el backend lo rechaza: en ese caso desactivalo.',
      null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.liquidacionConceptoService.onDelete(concepto.id)
          .pipe(untilDestroyed(this)).subscribe(ok => { if (ok) this.onCargar(); });
      }
    });
  }
}
