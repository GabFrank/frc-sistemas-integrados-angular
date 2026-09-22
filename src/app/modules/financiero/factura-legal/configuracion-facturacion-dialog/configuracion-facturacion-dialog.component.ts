import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { ConfiguracionFacturacion, ConfiguracionFacturacionInput, ModoFacturacion } from './configuracion-facturacion.model';
import { ConfiguracionFacturacionService } from './configuracion-facturacion.service';

/** Lo que muestra cada fila de la tabla, ya calculado: el template no llama funciones. */
interface FilaConfiguracion {
  config: ConfiguracionFacturacion;
  sucursalNombre: string;
  modoLabel: string;
  ventasSinFacturaLabel: string;
  respetaLabel: string;
  modificadoPor: string;
  modificadoEn: Date;
}

const MODO_LABELS: { [modo: string]: string } = {
  [ModoFacturacion.TODAS]: 'TODAS LAS VENTAS',
  [ModoFacturacion.INTERVALO]: 'CADA N VENTAS',
  [ModoFacturacion.A_PEDIDO]: 'SOLO A PEDIDO'
};

/**
 * ABM de la política de facturación automática del filial (issue filial #127). Una fila global y
 * overrides por sucursal. Sin filas, cada filial sigue con su contador local (facturaCountDown).
 */
@Component({
  selector: 'app-configuracion-facturacion-dialog',
  templateUrl: './configuracion-facturacion-dialog.component.html',
  styleUrls: ['./configuracion-facturacion-dialog.component.scss']
})
export class ConfiguracionFacturacionDialogComponent implements OnInit {

  readonly modos = [
    { value: ModoFacturacion.TODAS, label: MODO_LABELS[ModoFacturacion.TODAS] },
    { value: ModoFacturacion.INTERVALO, label: MODO_LABELS[ModoFacturacion.INTERVALO] },
    { value: ModoFacturacion.A_PEDIDO, label: MODO_LABELS[ModoFacturacion.A_PEDIDO] }
  ];

  filas: FilaConfiguracion[] = [];
  sucursales: Sucursal[] = [];
  editandoId: number = null;
  esIntervalo = true;
  isLoading = true;

  form = new FormGroup({
    sucursalId: new FormControl<number>(null),
    modo: new FormControl<ModoFacturacion>(ModoFacturacion.INTERVALO, Validators.required),
    ventasSinFactura: new FormControl<number>(0, [Validators.required, Validators.min(0)]),
    ventaTicketRespetaPolitica: new FormControl<boolean>(false)
  });

  constructor(
    public dialogRef: MatDialogRef<ConfiguracionFacturacionDialogComponent>,
    private configuracionService: ConfiguracionFacturacionService,
    private sucursalService: SucursalService,
    private notificacionService: NotificacionSnackbarService,
    public mainService: MainService
  ) { }

  ngOnInit(): void {
    this.sucursalService.onGetAllSucursales(true).subscribe((res) => {
      this.sucursales = res != null ? res : [];
    });
    this.cargar();
  }

  private cargar(): void {
    this.isLoading = true;
    this.configuracionService.onGetConfiguraciones().subscribe({
      next: (res) => {
        const configs = (res != null ? res : []).map((r) => Object.assign(new ConfiguracionFacturacion(), r));
        // La global primero; después las sucursales por nombre.
        configs.sort((a, b) => {
          if (a.sucursal == null) return -1;
          if (b.sucursal == null) return 1;
          return (a.sucursal.nombre || '').localeCompare(b.sucursal.nombre || '');
        });
        this.filas = configs.map((c) => this.toFila(c));
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notificacionService.openAlgoSalioMal('Error al cargar la configuración de facturación');
      }
    });
  }

  private toFila(c: ConfiguracionFacturacion): FilaConfiguracion {
    return {
      config: c,
      sucursalNombre: c.sucursal != null ? c.sucursal.nombre : 'GLOBAL (TODAS LAS SUCURSALES)',
      modoLabel: MODO_LABELS[c.modo] || c.modo,
      ventasSinFacturaLabel: c.modo === ModoFacturacion.INTERVALO ? String(c.ventasSinFactura) : '-',
      respetaLabel: c.ventaTicketRespetaPolitica ? 'RESPETA LA POLÍTICA' : 'FACTURA SIEMPRE',
      modificadoPor: c.usuario?.nickname || '-',
      modificadoEn: c.modificadoEn
    };
  }

  onModoChange(): void {
    this.esIntervalo = this.form.controls.modo.value === ModoFacturacion.INTERVALO;
    if (this.esIntervalo) {
      this.form.controls.ventasSinFactura.enable();
    } else {
      this.form.controls.ventasSinFactura.disable();
    }
  }

  onEditar(fila: FilaConfiguracion): void {
    const c = fila.config;
    this.editandoId = c.id;
    this.form.setValue({
      sucursalId: c.sucursal?.id ?? null,
      modo: c.modo,
      ventasSinFactura: c.ventasSinFactura ?? 0,
      ventaTicketRespetaPolitica: c.ventaTicketRespetaPolitica === true
    });
    this.onModoChange();
  }

  onNuevo(): void {
    this.editandoId = null;
    this.form.reset({
      sucursalId: null,
      modo: ModoFacturacion.INTERVALO,
      ventasSinFactura: 0,
      ventaTicketRespetaPolitica: false
    });
    this.onModoChange();
  }

  onGuardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const input = new ConfiguracionFacturacionInput();
    input.id = this.editandoId;
    input.sucursalId = v.sucursalId;
    input.modo = v.modo;
    input.ventasSinFactura = this.esIntervalo ? v.ventasSinFactura : 0;
    input.ventaTicketRespetaPolitica = v.ventaTicketRespetaPolitica === true;
    input.usuarioId = this.mainService.usuarioActual?.id;
    this.configuracionService.onSaveConfiguracion(input).subscribe({
      next: (res) => {
        if (res != null) {
          this.notificacionService.openSucess('Configuración de facturación guardada');
          this.onNuevo();
          this.cargar();
        }
      },
      error: () => {
        this.notificacionService.openAlgoSalioMal('Error al guardar la configuración de facturación');
      }
    });
  }

  onEliminar(fila: FilaConfiguracion): void {
    const mensaje = fila.config.sucursal != null
      ? `${fila.sucursalNombre} vuelve a usar la configuración global. ¿Continuar?`
      : 'Las sucursales sin configuración propia vuelven a su contador local (facturaCountDown). ¿Continuar?';
    this.configuracionService.onDeleteConfiguracion(fila.config.id, mensaje).subscribe((res) => {
      if (res) {
        if (this.editandoId === fila.config.id) {
          this.onNuevo();
        }
        this.cargar();
      }
    });
  }

  onCerrar(): void {
    this.dialogRef.close();
  }
}
