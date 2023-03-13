import { AfterViewInit, Component, ElementRef, HostListener, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription } from 'rxjs';
import { dateToString, getLastDayOfNextMonth } from '../../../../commons/core/utils/dateUtils';
import { updateDataSource } from '../../../../commons/core/utils/numbersUtils';
import { TipoEntidad } from '../../../../generics/tipo-entidad.enum';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { BotonComponent } from '../../../../shared/components/boton/boton.component';
import { DigitarContrasenaDialogComponent } from '../../../../shared/digitar-contrasena-dialog/digitar-contrasena-dialog.component';
import { QrCodeComponent, QrData } from '../../../../shared/qr-code/qr-code.component';
import { Cliente, TipoCliente } from '../../../personas/clientes/cliente.model';
import { ClienteService } from '../../../personas/clientes/cliente.service';
import { Persona } from '../../../personas/persona/persona.model';
import { PersonaService } from '../../../personas/persona/persona.service';
import { EstadoVentaCredito, TipoConfirmacion, VentaCredito, VentaCreditoCuotaInput } from '../venta-credito.model';
import { VentaCreditoService } from '../venta-credito.service';
import { isNumber } from 'util';

export class AddVentaCreditoData {
  valor: number;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-add-venta-credito-dialog',
  templateUrl: './add-venta-credito-dialog.component.html',
  styleUrls: ['./add-venta-credito-dialog.component.scss']
})
export class AddVentaCreditoDialogComponent implements OnInit, OnDestroy, AfterViewInit {

  readonly TipoCliente = TipoCliente

  @ViewChild('firmaBtn', { static: false }) firmaBtn: BotonComponent;
  @ViewChild('contraBtn', { static: false }) contraBtn: BotonComponent;
  @ViewChild('qrBtn', { read: BotonComponent }) qrBtn: BotonComponent;
  @ViewChild('appBtn', { static: false }) appBtn: BotonComponent;
  @ViewChild('container', { read: ElementRef }) container: ElementRef;

  @ViewChild('idInput', { static: false }) idInput: ElementRef
  @ViewChild('nombreInput', { static: false }) nombreInput: ElementRef
  selectedTipoConfirmacion = 1;
  tipoConfirmacion: TipoConfirmacion;
  creditoDisponible = 0;
  isDialogOpen = false;

  selectedPersona: Persona
  selectedCliente: Cliente
  clienteList: Cliente[]
  saldoEnCredito = 0;
  idClienteControl = new FormControl(null, [Validators.required, Validators.minLength(1)])
  nombreClienteControl = new FormControl(null, [Validators.required, Validators.minLength(1)])
  cuotasControl = new FormControl(1, [Validators.required])
  interesControl = new FormControl(0, [Validators.required])
  dataSource = new MatTableDataSource<VentaCreditoCuotaInput>([])
  displayedColumns = ['id', 'vencimiento', 'valor', 'acciones']
  total = 0;
  ventaSub: Subscription;
  searchTimer;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: AddVentaCreditoData,
    private dialogRef: MatDialogRef<AddVentaCreditoDialogComponent>,
    private personaService: PersonaService,
    private clienteService: ClienteService,
    private notificacionService: NotificacionSnackbarService,
    private matDialog: MatDialog,
    private mainService: MainService,
    private ventaCreditoService: VentaCreditoService
  ) { }


  ngOnInit(): void {
    if (this.data?.valor != null) {
      this.total = this.data?.valor;
      this.addItem(this.total)
    }
    this.cuotasControl.disable()
    this.interesControl.disable()

    this.nombreClienteControl.valueChanges.subscribe(res => {
      if (this.nombreClienteControl.dirty) {
        if (res == "") this.onClienteSelect(null);
        if (this.searchTimer != null) {
          clearTimeout(this.searchTimer);
        }
        if (this.nombreClienteControl.valid) {
          this.searchTimer = setTimeout(() => {
            console.log('on search');
            this.onSearch()
          }, 500);
        } else {
          this.clienteList = [];
        }
      }

    })
  }

  ngAfterViewInit(): void {
    this.container.nativeElement.addEventListener('keydown', (e) => {
      console.log(e);

      if (!this.isDialogOpen && this.total <= this.selectedCliente?.saldo) {
        switch (e.key) {
          case "F1":
            break;
          case "F3":
            this.firmaBtn.clickEvent.emit(true)
            break;
          case "F2":
            this.qrBtn.clickEvent.emit(true)
            break;
          case "F4":
            this.appBtn.clickEvent.emit(true)
            break;
          case "ArrowUp":
            if (this.selectedTipoConfirmacion == 2) {
              this.setTipoConfirmacion(4)
            } else {
              this.setTipoConfirmacion(this.selectedTipoConfirmacion - 1)
            }
            break;
          case "ArrowDown":
            if (this.selectedTipoConfirmacion == 4) {
              this.setTipoConfirmacion(2)
            } else {
              this.setTipoConfirmacion(this.selectedTipoConfirmacion + 1)
            }
            break;
          default:
            break;
        }
      }

    })
  }

  onSearch() {
    if (this.nombreClienteControl.valid) {
      if (isNaN(this.nombreClienteControl.value) == false) {
        console.log('is numero');
        this.clienteService.onGetByPersonaIdFromServer(this.nombreClienteControl.value).subscribe(res => {
          if (res != null) {
            this.onClienteSelect(res)
          } else {
            this.onSearchByNombre()
          }
        })
      } else {
        console.log('not a numero');
        this.onSearchByNombre()
      }

      this.nombreClienteControl.markAsPristine()
      this.nombreInput.nativeElement.select()
    }
  }

  onSearchByNombre() {
    this.clienteService.onSearchFromServer(this.nombreClienteControl.value).subscribe(res2 => {
      console.log(res2);
      
      if (res2 != null) {
        if (res2.length == 1) {
          this.onClienteSelect(res2[0])
          this.onClienteAutocompleteClose();
        } else if (res2.length > 1) {
          this.clienteList = res2;
          console.log(this.clienteList);
          
        } else {
          this.onClienteAutocompleteClose();
          this.onClienteSelect(null);
        }
      }
    })
  }

  onClienteSelect(e) {
    if (e?.id != null) {
      this.selectedCliente = e;
      this.nombreClienteControl.setValue(
        this.selectedCliente?.persona?.id +
        " - " +
        this.selectedCliente?.persona?.nombre
      );
      this.saldoEnCredito = this.selectedCliente?.saldo;
      if (this.total <= this.saldoEnCredito) {
        setTimeout(() => {
          this.setTipoConfirmacion(2)
        }, 500);
      } else {
        this.nombreInput.nativeElement.select()
        this.notificacionService.openWarn('No posee saldo suficiente. Verifique en el aplicativo.')
      }
    }
  }

  onClienteAutocompleteClose() {
    setTimeout(() => {
      this.nombreInput.nativeElement.select();
    }, 100);
  }

  addItem(valor: number) {
    let item = new VentaCreditoCuotaInput()
    item.activo = true;
    item.parcial = false;
    item.valor = valor;
    item.vencimiento = dateToString(getLastDayOfNextMonth())
    this.dataSource.data = updateDataSource(this.dataSource.data, item)
  }

  setTipoConfirmacion(confirmacion) {
    this.selectedTipoConfirmacion = confirmacion;
  }

  onContrasenaClick() {
    this.tipoConfirmacion = TipoConfirmacion.CONTRASENA;
    this.matDialog.open(DigitarContrasenaDialogComponent, { data: { password: this.selectedCliente?.codigo } }).afterClosed().subscribe(res => {
      if (res['match'] == true) {
        this.onConfirmVentaCredito()
      }
    })
  }

  onFirmaClick() {
    this.tipoConfirmacion = TipoConfirmacion.FIRMA;
    this.onConfirmVentaCredito()
  }

  onConfirmVentaCredito() {
    let ventaCredito = new VentaCredito()
    ventaCredito.cantidadCuotas = this.cuotasControl.value;
    ventaCredito.cliente = this.selectedCliente;
    ventaCredito.estado = EstadoVentaCredito.ABIERTO;
    ventaCredito.sucursal = this.mainService?.sucursalActual;
    ventaCredito.tipoConfirmacion = this.tipoConfirmacion;
    ventaCredito.valorTotal = this.total;
    if (ventaCredito.valorTotal <= this.selectedCliente?.saldo) {
      this.dialogRef.close({ ventaCredito: ventaCredito, itens: this.dataSource.data })
    } else {
      this.notificacionService.openWarn('No posee saldo suficiente. Verifique en el aplicativo.')
    }
  }

  onCancelar() {
    this.dialogRef.close(null)
  }
  onGuardar() { }



  onQrClick() {
    let now = Date.now()
    let id = this.selectedCliente.persona.id;
    let qrData: QrData = {
      idOrigen: this.mainService.sucursalActual.id,
      tipoEntidad: TipoEntidad.VENTA_CREDITO,
      data: id,
      timestamp: now
    }
    let qrDialogRef = this.matDialog.open(QrCodeComponent, {
      data: {
        codigo: qrData,
        nombre: 'Convenio',
        segundos: 60
      }
    })

    this.ventaSub = this.ventaCreditoService.ventaCreditoQrSub().subscribe(res => {
      if (res['clienteId'] == qrData.data) {
        let diff = ((Date.now() - (+qrData.timestamp)) / 1000) / 60;
        console.log(diff);

        if (diff < 60) {
          this.ventaSub.unsubscribe()
          qrDialogRef.close()
          this.tipoConfirmacion = TipoConfirmacion.QR;
          this.onConfirmVentaCredito()
        }
      } else {
        this.notificacionService.openWarn('Cliente incorrecto.')
      }
    })
  }

  onVer(gasto) { }
  onVuelto(gasto) { }
  onFinalizar(gasto) { }
  onSelectEntradaItem(row) { }

  ngOnDestroy(): void {
    if (this.ventaSub != null) {
      this.ventaSub.unsubscribe()
    }
  }
}
