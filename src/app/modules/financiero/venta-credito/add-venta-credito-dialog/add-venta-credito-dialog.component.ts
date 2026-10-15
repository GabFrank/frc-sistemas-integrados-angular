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
import { BuscadorFieldComponent } from '../../../../shared/components/buscador-field/buscador-field.component';
import { DigitarContrasenaDialogComponent } from '../../../../shared/digitar-contrasena-dialog/digitar-contrasena-dialog.component';
import { QrCodeComponent, QrData } from '../../../../shared/qr-code/qr-code.component';
import { Cliente, TipoCliente } from '../../../personas/clientes/cliente.model';
import { Persona } from '../../../personas/persona/persona.model';
import { EstadoVentaCredito, TipoConfirmacion, VentaCredito, VentaCreditoCuotaInput } from '../venta-credito.model';
import { VentaCreditoService } from '../venta-credito.service';
import { isNumber } from 'util';
import { generateRandomString } from '../../../../commons/core/utils/string-utils';

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

  @ViewChild('clienteField', { static: false }) clienteField: BuscadorFieldComponent
  selectedTipoConfirmacion = 1;
  tipoConfirmacion: TipoConfirmacion;
  creditoDisponible = 0;
  isDialogOpen = false;

  selectedPersona: Persona
  selectedCliente: Cliente
  saldoEnCredito = 0;
  clienteControl = new FormControl<Cliente>(null)
  cuotasControl = new FormControl(1, [Validators.required])
  interesControl = new FormControl(0, [Validators.required])
  facturaControl = new FormControl(false);
  dataSource = new MatTableDataSource<VentaCreditoCuotaInput>([])
  displayedColumns = ['id', 'vencimiento', 'valor', 'acciones']
  total = 0;
  ventaSub: Subscription;

  vencimientoControl = new FormControl(getLastDayOfNextMonth())
  today = new Date();

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: AddVentaCreditoData,
    private dialogRef: MatDialogRef<AddVentaCreditoDialogComponent>,
    private notificacionService: NotificacionSnackbarService,
    private matDialog: MatDialog,
    private mainService: MainService,
    private ventaCreditoService: VentaCreditoService,
  ) { }


  ngOnInit(): void {
    if (this.data?.valor != null) {
      this.total = this.data?.valor;
    }
    this.cuotasControl.disable()
    this.interesControl.disable()
  }

  ngAfterViewInit(): void {

    setTimeout(() => {
      this.clienteField.focus();
    }, 500);

    this.container.nativeElement.addEventListener('keydown', (e) => {
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

  /**
   * Editar el texto o limpiar el campo deja de valer el cliente elegido: antes, si la búsqueda fallaba, quedaba
   * seleccionado con su saldo y la venta a crédito se confirmaba contra él (#390). El campo descarta además las
   * respuestas de búsquedas anteriores.
   */
  onClienteSelect(e: Cliente) {
    if (e?.id == null) {
      this.selectedCliente = null;
      this.saldoEnCredito = null;
      return;
    }
    this.selectedCliente = e;
    this.saldoEnCredito = e?.saldo;
    if (this.total <= this.saldoEnCredito) {
      setTimeout(() => {
        this.setTipoConfirmacion(2)
      }, 500);
    } else {
      this.clienteField.select()
      this.notificacionService.openWarn('No posee saldo suficiente. Verifique en el aplicativo.')
    }
  }

  addItem(valor: number) {
    let item = new VentaCreditoCuotaInput()
    item.activo = true;
    item.parcial = false;
    item.valor = valor;
    item.vencimiento = dateToString(this.vencimientoControl.value)
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
    if (this.selectedCliente?.id == null) {
      this.notificacionService.openWarn('Elegí el cliente antes de confirmar la venta a crédito.');
      return;
    }
    this.addItem(this.total)
    let ventaCredito = new VentaCredito()
    ventaCredito.cantidadCuotas = this.cuotasControl.value;
    ventaCredito.cliente = this.selectedCliente;
    ventaCredito.estado = EstadoVentaCredito.ABIERTO;
    ventaCredito.sucursal = this.mainService?.sucursalActual;
    ventaCredito.tipoConfirmacion = this.tipoConfirmacion;
    ventaCredito.valorTotal = this.total;
    ventaCredito.usuario = this.mainService.usuarioActual;
    if (ventaCredito.valorTotal <= this.selectedCliente?.saldo) {
      this.dialogRef.close({ ventaCredito: ventaCredito, itens: this.dataSource.data, factura: this.facturaControl.value })
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
    let secretKey = generateRandomString(16);
    let qrData: QrData = {
      idOrigen: id,
      tipoEntidad: TipoEntidad.VENTA_CREDITO,
      data: secretKey,
      timestamp: now,
      sucursalId: this.mainService.sucursalActual.id
    }
    let qrDialogRef = this.matDialog.open(QrCodeComponent, {
      data: {
        codigo: qrData,
        nombre: 'Convenio',
        segundos: 60
      }
    })

    // Se deja de escuchar al cerrarse el QR (escaneado, vencido o cerrado a mano): un escaneo tardío del
    // mismo código no confirma la venta con el diálogo ya cerrado (#390).
    this.ventaSub?.unsubscribe();
    const escucha = this.ventaCreditoService.ventaCreditoQrSub().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null && +res['clienteId'] == +id && +this.mainService.sucursalActual.id == +res['sucursalId'] && secretKey == res['secretKey']) {
        let diff = ((Date.now() - (+qrData.timestamp)) / 1000) / 60;
        if (diff < 60) {
          escucha.unsubscribe()
          qrDialogRef.close()
          this.tipoConfirmacion = TipoConfirmacion.QR;
          this.onConfirmVentaCredito()
        }
      }
    })
    this.ventaSub = escucha;
    // Cada QR corta su propia escucha, no la de uno abierto después.
    qrDialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(() => escucha.unsubscribe());
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
