import { MainService } from './../../../../main.service';
import { PdvSearchProductoData, PdvSearchProductoDialogComponent, PdvSearchProductoResponseData } from './../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component';
import { MatSelect } from '@angular/material/select';
import { FormControl, Validators } from '@angular/forms';
import { SectorService } from './../../../empresarial/sector/sector.service';
import { Zona } from './../../../empresarial/zona/zona.model';
import { MatTableDataSource } from '@angular/material/table';
import { AddProductoDialogComponent } from './../add-producto-dialog/add-producto-dialog.component';
import { UntilDestroy } from '@ngneat/until-destroy';
import { untilDestroyed } from '@ngneat/until-destroy';
import { InventarioService } from './../inventario.service';
import { CreateInventarioDialogComponent } from './../create-inventario-dialog/create-inventario-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { TabService } from './../../../../layouts/tab/tab.service';
import { Component, Input, OnInit } from '@angular/core';
import { Inventario } from '../inventario.model';
import { Tab } from '../../../../layouts/tab/tab.model';
import { Sector } from '../../../empresarial/sector/sector.model';
import { TipoEntidad } from '../../../../generics/tipo-entidad.enum';
import { QrData, QrCodeComponent } from '../../../../shared/qr-code/qr-code.component';

@UntilDestroy()
@Component({
  selector: 'app-edit-inventario',
  templateUrl: './edit-inventario.component.html',
  styleUrls: ['./edit-inventario.component.scss']
})
export class EditInventarioComponent implements OnInit {

  @Input() data: Tab;

  selectedInventario: Inventario;

  dataSource = new MatTableDataSource<Inventario>(null)

  sectorControl = new FormControl(null, Validators.required)
  zonaControl = new FormControl(null, Validators.required)

  sectorList: Sector[] = []
  zonaList: Zona[] = []

  // sucursal: Sucursal;
  // fechaInicio: Date;
  // fechaFin: Date;
  // abierto: boolean;
  // tipo: TipoInventario;
  // estado: InventarioEstado;
  // usuario: Usuario
  // observacion: string;

  // tipoInventarioControl: FormControl;
  // tipoInventarioControl: FormControl;

  constructor(
    private matDialog: MatDialog,
    private tabService: TabService,
    private inventarioService: InventarioService,
    private sectorService: SectorService,
    public mainService: MainService
  ) {

  }

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
        }
      })
  }

  onSelectSector(sector: Sector) {
    this.zonaList = sector?.zonaList;
    if (this.zonaList.length > 0) {
      this.zonaControl.setValue(this.zonaList[0])
    }
  }

  onSectorChange(e: MatSelect) {
    this.onSelectSector(e.value)
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

  addProducto(){}

}
