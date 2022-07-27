import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { updateDataSource } from '../../../../commons/core/utils/numbersUtils';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { VentaItem } from '../../../operaciones/venta/venta-item.model';
import { Venta } from '../../../operaciones/venta/venta.model';
import { Cliente } from '../../../personas/clientes/cliente.model';
import { ClienteService } from '../../../personas/clientes/cliente.service';
import { EditFacturaLegalItemComponent } from '../edit-factura-legal-item/edit-factura-legal-item.component';
import { FacturaLegal, FacturaLegalInput, FacturaLegalItem, FacturaLegalItemInput } from '../factura-legal.model';
import { FacturaLegalService } from '../factura-legal.service';

export interface FacturaLegalData {
  venta?: Venta;
  ventaItemList: VentaItem[]
}

@UntilDestroy()
@Component({
  selector: 'app-add-factura-legal-dialog',
  templateUrl: './add-factura-legal-dialog.component.html',
  styleUrls: ['./add-factura-legal-dialog.component.scss']
})
export class AddFacturaLegalDialogComponent implements OnInit {

  @ViewChild('imprimirBtn', { static: false }) imprimirBtn: ElementRef

  selectedCliente: Cliente;
  selectedVenta: Venta;

  clienteIdControl = new FormControl(null, Validators.required)
  clienteDescripcionControl = new FormControl(null, Validators.required)
  fechaControl = new FormControl(new Date())
  creditoControl = new FormControl(false)
  rucControl = new FormControl(null, [Validators.required, Validators.minLength(7)])
  direccionControl = new FormControl('')
  totalFinalControl = new FormControl(0, [Validators.required, Validators.min(1)])

  dataSource = new MatTableDataSource<FacturaLegalItem>([])
  selectedFacturaItem: FacturaLegalItem;
  cantidadHojas = 1;
  constructor(
    @Inject(MAT_DIALOG_DATA) private data: FacturaLegalData,
    private matDialogRef: MatDialogRef<AddFacturaLegalDialogComponent>,
    private facturaService: FacturaLegalService,
    private clienteService: ClienteService,
    private notificacionService: NotificacionSnackbarService,
    private cargandoService: CargandoDialogService,
    private dialogoService: DialogosService,
    private matDialog: MatDialog
  ) {
    console.log(data);
  }

  ngOnInit(): void {
    this.clienteDescripcionControl.disable()
    this.direccionControl.disable()
    this.cargarDatos()
  }

  cargarDatos() {
    if (this.data.venta != null) {
      this.totalFinalControl.setValue(this.data?.venta?.totalGs)
    }
    if (this.data.ventaItemList != null) {
      let facturaItemList: FacturaLegalItem[] = []
      this.data.ventaItemList.forEach(v => {
        let facturaItem = new FacturaLegalItem;
        facturaItem.cantidad = v.cantidad;
        facturaItem.descripcion = v.producto.descripcionFactura;
        facturaItem.precioUnitario = v.precioVenta.precio;
        facturaItem.total = v.cantidad * v.precioVenta.precio;
        facturaItemList.push(facturaItem)
      })
      this.cantidadHojas = Math.floor(facturaItemList.length / 7) + 1;
      this.dataSource.data = facturaItemList;
    }
  }

  buscarCliente() {
    if (this.rucControl.valid) {
      this.cargandoService.openDialog()
      this.clienteService.onGetClientePorPersonaDocumento(this.rucControl.value)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          this.cargandoService.closeDialog()
          if (res != null) {
            this.setCliente(res)
            this.imprimirBtn.nativeElement.focus()
          } else {
            this.clienteService.onSearch(this.rucControl.value).pipe(untilDestroyed(this)).subscribe(res => {
              if (res.length == 0) {
                this.notificacionService.openWarn('Cliente no encontrado')
                setTimeout(() => {
                  this.dialogoService.confirm(
                    'Cliente no encontrado',
                    'Desea crear un nuevo cliente?',
                    'Verifique si el número de documento/ruc esta correcto antes de crear un nuevo cliente'
                  ).subscribe(res => {
                    if (res) {
                      this.crearNuevoCliente()
                    }
                  });
                }, 500);
              } else if (res.length == 1) {
                this.setCliente(res[0])
              } else {
                
              }
            })

          }
        })
    } else {
    }
  }

  setCliente(res: Cliente){
    this.selectedCliente = res;
    this.notificacionService.openSucess('Cliente encontrado')
    this.clienteDescripcionControl.enable()
    this.direccionControl.enable()
    this.clienteDescripcionControl.setValue(res.persona?.nombre)
    this.direccionControl.setValue(res?.persona?.direccion)
    this.clienteDescripcionControl.disable()
    this.direccionControl.disable()
  }

  crearNuevoCliente() {

  }


  editItem(item, i) {

  }

  deleteItem(item, i) {
    this.dataSource.data = updateDataSource(this.dataSource.data, null, i)
    this.calcularTotal()
  }

  onSelectItem(row) {

  }

  addItem(item, i?) {
    console.log(i);

    this.matDialog.open(EditFacturaLegalItemComponent, {
      data: {
        facturaItem: item
      },
      width: '100%'
    }).afterClosed().subscribe(res => {
      if (res != null) {
        this.dataSource.data = updateDataSource(this.dataSource.data, res, i)
        this.calcularTotal()
      }
    })
  }

  calcularTotal() {
    let total = 0;
    this.dataSource.data.forEach(f => {
      total += f.cantidad * f.precioUnitario
    })
    this.totalFinalControl.setValue(total)
  }

  onCancelar() {
    this.matDialogRef.close(null)
  }

  onGuardar() {
    this.dialogoService.confirm('Atención', 'Verificar si hay hoja en la impresora', 'Desea imprimir?').subscribe(res => {
      if (res) {
        let factura = new FacturaLegal()
        factura.cliente = this.selectedCliente;
        factura.credito = this.creditoControl.value;
        factura.direccion = this.direccionControl.value;
        factura.fecha = this.fechaControl.value;
        factura.nombre = this.clienteDescripcionControl.value;
        factura.ruc = this.rucControl.value;
        let facturaItemInputList: FacturaLegalItemInput[] = []
        this.dataSource.data.forEach(f => {
          facturaItemInputList.push(f.toInput())
        })
        // this.facturaService.onSaveFactura(factura.toInput(), facturaItemInputList).pipe(untilDestroyed(this)).subscribe(res => {
        //   if(res != null){
        //     this.matDialogRef.close(null)
        //   } else {

        //   }
        // })
      }
    })
  }

  onClienteSearch(){
    
  }

}
