import { Component, ElementRef, HostListener, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy } from '@ngneat/until-destroy';
import { QrcodeComponent } from '@techiediaries/ngx-qrcode';
import { Apollo } from 'apollo-angular';
import { Subscription } from 'rxjs';
import { dateToString, getLastDayOfNextMonth } from '../../../../commons/core/utils/dateUtils';
import { updateDataSource } from '../../../../commons/core/utils/numbersUtils';
import { TipoEntidad } from '../../../../generics/tipo-entidad.enum';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { BotonComponent } from '../../../../shared/components/boton/boton.component';
import { DigitarContrasenaDialogComponent } from '../../../../shared/digitar-contrasena-dialog/digitar-contrasena-dialog.component';
import { QrCodeComponent, QrCodeDialogData, QrData } from '../../../../shared/qr-code/qr-code.component';
import { Cliente, TipoCliente } from '../../../personas/clientes/cliente.model';
import { ClienteService } from '../../../personas/clientes/cliente.service';
import { Persona } from '../../../personas/persona/persona.model';
import { PersonaService } from '../../../personas/persona/persona.service';
import { EstadoVentaCredito, TipoConfirmacion, VentaCredito, VentaCreditoCuota, VentaCreditoCuotaInput } from '../venta-credito.model';
import { VentaCreditoService } from '../venta-credito.service';

export class AddVentaCreditoData {
  valor: number;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-add-venta-credito-dialog',
  templateUrl: './add-venta-credito-dialog.component.html',
  styleUrls: ['./add-venta-credito-dialog.component.scss']
})
export class AddVentaCreditoDialogComponent implements OnInit, OnDestroy {

  readonly TipoCliente = TipoCliente

  @ViewChild('firmaBtn', { static: false }) firmaBtn: BotonComponent;
  @ViewChild('contraBtn', { static: false }) contraBtn: BotonComponent;
  @ViewChild('qrBtn', { static: false }) qrBtn: BotonComponent;
  @ViewChild('appBtn', { static: false }) appBtn: BotonComponent;

  @ViewChild('idInput', { static: false }) idInput: ElementRef
  @ViewChild('nombreInput', { static: false }) nombreInput: ElementRef
  selectedTipoConfirmacion = 1;
  tipoConfirmacion: TipoConfirmacion;
  creditoDisponible = 0;
  isDialogOpen = false;

  selectedPersona: Persona
  selectedCliente: Cliente
  saldoEnCredito = 0;
  idClienteControl = new FormControl(null, [Validators.required, Validators.minLength(1)])
  nombreClienteControl = new FormControl(null, [Validators.required, Validators.minLength(1)])
  cuotasControl = new FormControl(1, [Validators.required])
  interesControl = new FormControl(0, [Validators.required])
  dataSource = new MatTableDataSource<VentaCreditoCuotaInput>([])
  displayedColumns = ['id', 'vencimiento', 'valor', 'acciones']
  total = 0;
  ventaSub: Subscription;

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
    this.nombreClienteControl.disable()

  }

  buscarPersonaPorId() {
    if (this.idClienteControl.valid) {
      if (this.idClienteControl.value == this.selectedCliente?.persona.id) {
        switch (this.selectedTipoConfirmacion) {
          case 1:
            this.tipoConfirmacion = TipoConfirmacion.CONTRASENA;
            this.contraBtn.clickEvent.emit(true)
            break;
          case 2:
            this.tipoConfirmacion = TipoConfirmacion.FIRMA;
            this.firmaBtn.clickEvent.emit(true)
            break;
          case 3:
            this.tipoConfirmacion = TipoConfirmacion.QR;
            this.qrBtn.clickEvent.emit(true)
            break;
          case 4:
            this.tipoConfirmacion = TipoConfirmacion.APP;
            this.appBtn.clickEvent.emit(true)
            break;
          default:
            break;
        }
      } else {
        this.clienteService.onGetByPersonaIdFromServer(this.idClienteControl.value).subscribe(res => {
          if (res != null) {
            this.setCliente(res)
          } else {
            this.setCliente(null)
            this.idInput.nativeElement.select()
          }
        })
      }
    } else {
      this.idInput.nativeElement.focus()
    }
  }

  setCliente(cliente: Cliente) {
    console.log(cliente);
    this.selectedCliente = cliente;
    this.nombreClienteControl.enable()
    this.nombreClienteControl.setValue(this.selectedCliente != null ? cliente.persona.nombre : null)
    this.nombreClienteControl.disable()
    this.saldoEnCredito = this.selectedCliente.saldo;
    if (this.total <= this.saldoEnCredito) {

    } else {
      this.notificacionService.openWarn('No posee saldo suficiente. Verifique en el aplicativo.')
    }
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
    this.dialogRef.close({ ventaCredito: ventaCredito, itens: this.dataSource.data })
  }

  onCancelar() {
    this.dialogRef.close(null)
  }
  onGuardar() { }

  @HostListener("document:keydown", ["$event"]) onKeydownHandler(
    event: KeyboardEvent
  ) {
    if (!this.isDialogOpen) {
      switch (event.key) {
        case "F1":
          this.contraBtn.clickEvent.emit(true)
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
          if (this.selectedTipoConfirmacion == 1) {
            this.setTipoConfirmacion(4)
          } else {
            this.setTipoConfirmacion(this.selectedTipoConfirmacion - 1)
          }
          break;
        case "ArrowDown":
          if (this.selectedTipoConfirmacion == 4) {
            this.setTipoConfirmacion(1)
          } else {
            this.setTipoConfirmacion(this.selectedTipoConfirmacion + 1)
          }
          break;
        default:
          break;
      }
    }

  }

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
      console.log(res);
      
      if(res['clienteId'] == qrData.data){
        let diff = ((Date.now() - (+qrData.timestamp))/1000)/60;
        console.log(diff);
        
        if(diff<60){
          this.ventaSub.unsubscribe()
          qrDialogRef.close()
          this.tipoConfirmacion = TipoConfirmacion.QR;
          this.onConfirmVentaCredito()
        }
      }
    })
  }

  onVer(gasto) { }
  onVuelto(gasto) { }
  onFinalizar(gasto) { }
  onSelectEntradaItem(row) { }

  ngOnDestroy(): void {
    if(this.ventaSub!=null){
      this.ventaSub.unsubscribe()
    }
  }
}
