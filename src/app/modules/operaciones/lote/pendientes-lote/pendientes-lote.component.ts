import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { PROPAGAR_ERROR_DE_RED } from '../../../../generics/generic-crud.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { PendienteLote } from '../lote.model';
import { LoteService } from '../lote.service';
import { CompletarLotePendienteDialogComponent } from './completar-lote-pendiente-dialog.component';

/**
 * «Pendientes de lote» (#429 fase 2, entrega 3): recepciones que entraron con «Cargar lote
 * después». Quien tiene EDITAR PRODUCTOS las completa o descarta; el resto solo las ve.
 */
@UntilDestroy()
@Component({
  selector: 'app-pendientes-lote',
  templateUrl: './pendientes-lote.component.html',
  styleUrls: ['./pendientes-lote.component.scss']
})
export class PendientesLoteComponent implements OnInit {
  sucursales: Sucursal[] = [];
  sucursalId: number = null;
  desde = '';
  hasta = '';
  filas: PendienteLote[] = [];
  total = 0;
  page = 0;
  readonly size = 20;
  cargando = false;
  error: string = null;
  puedeEditar = false;

  constructor(
    private loteService: LoteService,
    private sucursalService: SucursalService,
    private mainService: MainService,
    private dialog: MatDialog,
    private notificacion: NotificacionSnackbarService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const roles = this.mainService.usuarioActual?.roles || [];
    this.puedeEditar = roles.includes(ROLES.ADMIN) || roles.includes(ROLES.EDITAR_PRODUCTOS);
    this.sucursalService.onGetAllSucursales(true, PROPAGAR_ERROR_DE_RED)
      .pipe(untilDestroyed(this))
      .subscribe({ next: (res) => { this.sucursales = (res || []).filter((s) => s.nombre !== 'SERVIDOR'); this.cdr.markForCheck(); } });
    this.buscar();
  }

  buscar(page = 0): void {
    this.page = page;
    this.cargando = true;
    this.error = null;
    this.loteService.onRecepcionesConLotePendiente(this.sucursalId, this.desde || null, this.hasta || null, page, this.size)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.filas = res?.content || [];
          this.total = res?.totalElements || 0;
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargando = false;
          this.error = 'No se pudieron cargar los pendientes. Si el central no está actualizado, esta pantalla requiere actualizarlo.';
          this.cdr.markForCheck();
        }
      });
  }

  completar(p: PendienteLote): void {
    this.dialog.open(CompletarLotePendienteDialogComponent, { data: { pendiente: p }, width: '640px' })
      .afterClosed().pipe(untilDestroyed(this)).subscribe((res) => {
        if (res) {
          this.notificacion.openSucess('Atribuidas ' + res.cantidadAtribuida + ' unidades al lote ' + res.numeroLote + '.');
          this.buscar(this.page);
        }
      });
  }

  /** Descartar va en línea (Electron no tiene window.prompt): se elige la fila y se escribe el motivo. */
  descartando: PendienteLote = null;
  motivoDescarte = '';

  descartar(p: PendienteLote): void {
    this.descartando = p;
    this.motivoDescarte = '';
  }

  confirmarDescarte(): void {
    const p = this.descartando;
    if (!p || !this.motivoDescarte.trim()) return;
    this.loteService.onDescartarLotePendiente(p.mslId, p.sucursalId, this.motivoDescarte.trim())
      .pipe(untilDestroyed(this))
      .subscribe({ next: () => { this.descartando = null; this.buscar(this.page); } });
  }

  get paginas(): number {
    return Math.max(1, Math.ceil(this.total / this.size));
  }
}
