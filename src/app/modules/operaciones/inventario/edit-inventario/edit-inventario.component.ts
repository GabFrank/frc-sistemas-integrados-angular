import { MainService } from './../../../../main.service';
import { FormControl, Validators } from '@angular/forms';
import { SectorService } from './../../../empresarial/sector/sector.service';
import { Zona } from './../../../empresarial/zona/zona.model';
import { MatTableDataSource } from '@angular/material/table';
import { AddProductoDialogComponent } from './../add-producto-dialog/add-producto-dialog.component';
import { AgregarZonaDialogComponent } from '../agregar-zona-dialog/agregar-zona-dialog.component';
import { UntilDestroy } from '@ngneat/until-destroy';
import { untilDestroyed } from '@ngneat/until-destroy';
import { InventarioService } from './../inventario.service';
import { CreateInventarioDialogComponent } from './../create-inventario-dialog/create-inventario-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { TabService } from './../../../../layouts/tab/tab.service';
import { Component, Input, OnInit } from '@angular/core';
import { Inventario, InventarioEstado, InventarioProducto, InventarioProductoItem } from '../inventario.model';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TipoEntidad } from '../../../../generics/tipo-entidad.enum';
import { QrData, QrCodeComponent } from '../../../../shared/qr-code/qr-code.component';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';

interface ZonaDisplay {
  inventarioProducto: InventarioProducto;
  displayName: string;
  itemCount: number;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-inventario',
  templateUrl: './edit-inventario.component.html',
  styleUrls: ['./edit-inventario.component.scss']
})
export class EditInventarioComponent implements OnInit {

  @Input() data: Tab;

  selectedInventario: Inventario;
  currentInventarioProducto: InventarioProducto | null = null;
  
  zonasTrabajadasDataSource = new MatTableDataSource<ZonaDisplay>([]);
  productosZonaDataSource = new MatTableDataSource<InventarioProductoItem>([]);

  zonaControl = new FormControl(null, Validators.required);
  
  zonasDisponibles: InventarioProducto[] = [];
  zonasDisponiblesDisplay: ZonaDisplay[] = [];
  zonasTrabajadasColumns: string[] = ['zona', 'items', 'estado', 'acciones'];
  productosColumns: string[] = ['producto', 'cantidad', 'vencimiento', 'estado', 'acciones'];
  isEstadoAbierto: boolean = false;
  hasProductosInZona: boolean = false;
  inventarioStatusClass: string = '';
  selectedZonaDisplayName: string = '';
  isZonaConcluida: boolean = false;

  constructor(
    private matDialog: MatDialog,
    private tabService: TabService,
    private inventarioService: InventarioService,
    private sectorService: SectorService,
    public mainService: MainService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService
  ) {}

  ngOnInit(): void {
    if (this.data?.tabData?.id == null) {
      setTimeout(() => {
        this.matDialog.open(CreateInventarioDialogComponent, {
          width: '50%'
        }).afterClosed().subscribe(res => {
          if (res == null) {
            this.tabService.removeTab(this.tabService.currentIndex)
          } else {
            setTimeout(() => {
              this.cargarDatos(res?.id)
            }, 1000);
          }
        })
      }, 1000);
    } else {
      this.cargarDatos(+this.data.tabData.id)
    }
  }

  cargarDatos(id: number) {
    this.inventarioService.onGetInventario(id)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.selectedInventario = res;
          this.isEstadoAbierto = res.estado === InventarioEstado.ABIERTO;
          this.updateInventarioStatusClass();
          this.cargarZonasDisponibles();
        }
      })
  }

  private updateInventarioStatusClass() {
    if (this.selectedInventario?.estado === InventarioEstado.ABIERTO) {
      this.inventarioStatusClass = 'estado-abierto';
    } else if (this.selectedInventario?.estado === InventarioEstado.CONCLUIDO) {
      this.inventarioStatusClass = 'estado-concluido';
    } else {
      this.inventarioStatusClass = 'estado-cancelado';
    }
  }

  private cargarZonasDisponibles() {
    if (!this.selectedInventario?.inventarioProductoList) {
      this.zonasDisponibles = [];
      this.zonasDisponiblesDisplay = [];
      return;
    }

    this.zonasDisponibles = this.selectedInventario.inventarioProductoList;
    this.zonasDisponiblesDisplay = this.zonasDisponibles.map(ip => ({
      inventarioProducto: ip,
      displayName: this.getZonaDisplayName(ip.zona),
      itemCount: ip.inventarioProductoItemList?.length || 0
    }));

    this.actualizarZonasTrabajadas();
    
    if (this.zonasDisponiblesDisplay.length > 0 && !this.currentInventarioProducto) {
      this.seleccionarZona(this.zonasDisponiblesDisplay[0]);
    }
  }

  private getZonaDisplayName(zona: Zona): string {
    if (!zona) return '';
    const sector = zona.sector?.descripcion || '';
    const zonaDesc = zona.descripcion || '';
    return sector && zonaDesc ? `${sector} - ${zonaDesc}` : (zonaDesc || sector);
  }

  private actualizarZonasTrabajadas() {
    this.zonasTrabajadasDataSource.data = this.zonasDisponiblesDisplay;
  }

  onZonaChange(zona: ZonaDisplay) {
    if (zona) {
      this.seleccionarZona(zona);
    }
  }

  private seleccionarZona(zonaDisplay: ZonaDisplay) {
    this.currentInventarioProducto = zonaDisplay.inventarioProducto;
    this.zonaControl.setValue(zonaDisplay);
    this.selectedZonaDisplayName = this.getZonaDisplayName(zonaDisplay.inventarioProducto.zona);
    this.isZonaConcluida = zonaDisplay.inventarioProducto.concluido === true;
    this.cargarProductosZona();
  }

  private cargarProductosZona() {
    if (!this.currentInventarioProducto) {
      this.productosZonaDataSource.data = [];
      this.hasProductosInZona = false;
      this.selectedZonaDisplayName = '';
      this.isZonaConcluida = false;
      return;
    }

    const items = this.currentInventarioProducto.inventarioProductoItemList || [];
    this.productosZonaDataSource.data = items;
    this.hasProductosInZona = items.length > 0;
  }

  onAgregarProducto() {
    if (!this.currentInventarioProducto) {
      this.notificacionService.openWarn('Debe seleccionar una zona primero');
      return;
    }

    const dialogRef = this.matDialog.open(AddProductoDialogComponent, {
      width: '80%',
      height: '85%',
      data: {
        inventarioProducto: this.currentInventarioProducto,
        inventario: this.selectedInventario
      }
    });

    dialogRef.afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((itemCreado: InventarioProductoItem) => {
        if (itemCreado) {
          const zonaActualId = this.currentInventarioProducto.id;
          this.inventarioService.onGetInventario(this.selectedInventario.id)
            .pipe(untilDestroyed(this))
            .subscribe(inventario => {
              if (inventario) {
                this.selectedInventario = inventario;
                this.isEstadoAbierto = inventario.estado === InventarioEstado.ABIERTO;
                this.updateInventarioStatusClass();
                this.cargarZonasDisponibles();
                
                const zonaActual = this.zonasDisponiblesDisplay.find(
                  z => z.inventarioProducto.id === zonaActualId
                );
                if (zonaActual) {
                  this.seleccionarZona(zonaActual);
                }
              }
            });
        }
      });
  }

  onFinalizarZona() {
    if (!this.currentInventarioProducto) {
      this.notificacionService.openWarn('Debe seleccionar una zona');
      return;
    }

    if (!this.hasProductosInZona) {
      this.notificacionService.openWarn('La zona debe tener al menos un producto');
      return;
    }

    this.dialogosService.confirm(
      '¿Finalizar Zona?',
      `¿Está seguro que desea finalizar la zona ${this.getZonaDisplayName(this.currentInventarioProducto.zona)}?`
    ).pipe(untilDestroyed(this))
      .subscribe(confirmado => {
        if (confirmado) {
          this.finalizarZonaActual();
        }
      });
  }

  private finalizarZonaActual() {
    const input = {
      id: this.currentInventarioProducto?.id,
      inventarioId: this.currentInventarioProducto?.inventario?.id || this.selectedInventario?.id,
      zonaId: this.currentInventarioProducto?.zona?.id,
      concluido: true,
      usuarioId: this.currentInventarioProducto?.usuario?.id || this.mainService.usuarioActual?.id
    };

    this.inventarioService.onSaveInventarioProducto(input)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          if (res) {
            this.notificacionService.openSucess('Zona finalizada correctamente');
            this.inventarioService.onGetInventario(this.selectedInventario.id)
              .pipe(untilDestroyed(this))
              .subscribe(inventario => {
                if (inventario) {
                  this.selectedInventario = inventario;
                  this.isEstadoAbierto = inventario.estado === InventarioEstado.ABIERTO;
                  this.updateInventarioStatusClass();
                  this.cargarZonasDisponibles();
                  
                  this.currentInventarioProducto = null;
                  this.zonaControl.setValue(null);
                  this.productosZonaDataSource.data = [];
                  this.hasProductosInZona = false;
                  this.selectedZonaDisplayName = '';
                }
              });
          }
        },
        error: (err) => {
          console.error('Error al finalizar zona:', err);
          this.notificacionService.openAlgoSalioMal('No se pudo finalizar la zona');
        }
      });
  }

  onNuevaZona() {
    const dialogRef = this.matDialog.open(AgregarZonaDialogComponent, {
      width: '600px',
      data: {
        inventario: this.selectedInventario
      }
    });

    dialogRef.afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((inventarioProductoCreado: InventarioProducto) => {
        if (inventarioProductoCreado) {
          this.inventarioService.onGetInventario(this.selectedInventario.id)
            .pipe(untilDestroyed(this))
            .subscribe(inventario => {
              if (inventario) {
                this.selectedInventario = inventario;
                this.isEstadoAbierto = inventario.estado === InventarioEstado.ABIERTO;
                this.updateInventarioStatusClass();
                this.cargarZonasDisponibles();
                
                const zonaCreada = this.zonasDisponiblesDisplay.find(
                  z => z.inventarioProducto.id === inventarioProductoCreado.id
                );
                if (zonaCreada) {
                  this.seleccionarZona(zonaCreada);
                }
              }
            });
        }
      });
  }

  onFinalizarInventario() {
    const zonasAbiertas = this.zonasDisponibles.filter(z => !z.concluido);
    
    if (zonasAbiertas.length > 0) {
      this.notificacionService.openWarn('Debe finalizar todas las zonas antes de finalizar el inventario');
      return;
    }

    this.dialogosService.confirm(
      '¿Finalizar Inventario?',
      '¿Está seguro que desea finalizar este inventario? Esta acción no se puede deshacer.'
    ).pipe(untilDestroyed(this))
      .subscribe(confirmado => {
        if (confirmado) {
          this.finalizarInventario();
        }
      });
  }

  private finalizarInventario() {
    this.inventarioService.onFinalizarInventario(this.selectedInventario.id)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.notificacionService.openSucess('Inventario finalizado correctamente');
          this.cargarDatos(this.selectedInventario.id);
        }
      });
  }

  onQrClick() {
    let codigo: QrData = {
      'sucursalId': this.mainService.sucursalActual.id,
      'tipoEntidad': TipoEntidad.INVENTARIO,
      'idOrigen': +this.selectedInventario.idOrigen,
      'idCentral': +this.selectedInventario.idCentral,
      'componentToOpen': 'EditInventarioComponent'
    }
    this.matDialog.open(QrCodeComponent, {
      data: {
        codigo: codigo,
        nombre: 'Inventario'
      }
    }).afterClosed().subscribe(res => {

    })
  }

  onVerProductosZona(zonaDisplay: ZonaDisplay) {
    this.seleccionarZona(zonaDisplay);
  }

  onReabrirZona() {
    if (!this.currentInventarioProducto) {
      this.notificacionService.openWarn('Debe seleccionar una zona');
      return;
    }

    this.dialogosService.confirm(
      '¿Reabrir Zona?',
      `¿Está seguro que desea reabrir la zona ${this.getZonaDisplayName(this.currentInventarioProducto.zona)}?`
    ).pipe(untilDestroyed(this))
      .subscribe(confirmado => {
        if (confirmado) {
          this.reabrirZonaActual();
        }
      });
  }

  private reabrirZonaActual() {
    const input = {
      id: this.currentInventarioProducto?.id,
      inventarioId: this.currentInventarioProducto?.inventario?.id || this.selectedInventario?.id,
      zonaId: this.currentInventarioProducto?.zona?.id,
      concluido: false,
      usuarioId: this.mainService.usuarioActual?.id
    };

    this.inventarioService.onSaveInventarioProducto(input)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          if (res) {
            this.notificacionService.openSucess('Zona reabierta correctamente');
            const zonaActualId = this.currentInventarioProducto.id;
            this.inventarioService.onGetInventario(this.selectedInventario.id)
              .pipe(untilDestroyed(this))
              .subscribe(inventario => {
                if (inventario) {
                  this.selectedInventario = inventario;
                  this.isEstadoAbierto = inventario.estado === InventarioEstado.ABIERTO;
                  this.updateInventarioStatusClass();
                  this.cargarZonasDisponibles();
                  
                  const zonaReabierta = this.zonasDisponiblesDisplay.find(
                    z => z.inventarioProducto.id === zonaActualId
                  );
                  if (zonaReabierta) {
                    this.seleccionarZona(zonaReabierta);
                  }
                }
              });
          }
        },
        error: (err) => {
          console.error('Error al reabrir zona:', err);
          this.notificacionService.openAlgoSalioMal('No se pudo reabrir la zona');
        }
      });
  }

  onEliminarProducto(item: InventarioProductoItem) {
    if (this.isZonaConcluida) {
      this.notificacionService.openWarn('No puede eliminar productos de una zona concluida. Debe reabrirla primero.');
      return;
    }

    this.inventarioService.onDeleteInventarioProductoItem(item.id)
      .pipe(untilDestroyed(this))
      .subscribe(deleted => {
        if (deleted) {
          this.notificacionService.openSucess('Producto eliminado');
          const zonaActualId = this.currentInventarioProducto.id;
          this.inventarioService.onGetInventario(this.selectedInventario.id)
            .pipe(untilDestroyed(this))
            .subscribe(inventario => {
              if (inventario) {
                this.selectedInventario = inventario;
                this.cargarZonasDisponibles();
                
                const zonaActual = this.zonasDisponiblesDisplay.find(
                  z => z.inventarioProducto.id === zonaActualId
                );
                if (zonaActual) {
                  this.seleccionarZona(zonaActual);
                }
              }
            });
        }
      });
  }

}
