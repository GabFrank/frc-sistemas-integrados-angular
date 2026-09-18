import { Component, Inject, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotaRemisionService } from '../nota-remision.service';
import {
  MODALIDADES_TRANSPORTE,
  MOTIVOS_NOTA_REMISION,
  NotaRemision,
  NotaRemisionItem,
  NotaRemisionItemInput,
  OrigenNotaRemision,
  TipoTransporteNr
} from '../nota-remision.model';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { FuncionarioService } from '../../../personas/funcionarios/funcionario.service';

export interface AddNotaRemisionDialogData {
  origen: OrigenNotaRemision;
  /** Id de la transferencia o de la factura, según el origen. */
  referenciaId?: number;
  sucursalId?: number;
}

/**
 * Alta de una nota de remisión. El borrador lo arma el central (`prellenarNotaRemision`): acá no se
 * calcula nada fiscal, solo se muestra, se deja editar lo editable y se manda.
 */
@UntilDestroy()
@Component({
  selector: 'app-add-nota-remision-dialog',
  templateUrl: './add-nota-remision-dialog.component.html',
  styleUrls: ['./add-nota-remision-dialog.component.scss']
})
export class AddNotaRemisionDialogComponent implements OnInit {

  motivos = MOTIVOS_NOTA_REMISION;
  modalidades = MODALIDADES_TRANSPORTE;
  tiposTransporte = [TipoTransporteNr.PROPIO, TipoTransporteNr.TERCERO];

  nota: NotaRemision = {};
  items: NotaRemisionItem[] = [];
  columnasItems = ['descripcion', 'cantidad', 'unidadMedida', 'acciones'];

  cargando = false;
  guardando = false;

  /** Control del paso 0 cuando se entra sin referencia (origen manual o búsqueda). */
  referenciaControl = new FormControl(null);

  /**
   * Solo para el buscador de funcionarios: no se guarda en la nota, que referencia a la persona
   * (`choferPersonaId`) porque el chofer puede ser un tercero que no es funcionario.
   */
  choferFuncionarioId: number = null;

  constructor(
    private service: NotaRemisionService,
    private mainService: MainService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    private funcionarioService: FuncionarioService,
    private dialogRef: MatDialogRef<AddNotaRemisionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddNotaRemisionDialogData
  ) {}

  /**
   * Completa los tres campos del chofer con los datos del funcionario elegido.
   *
   * Se vuelve a pedir el funcionario por id porque `funcionariosSearch` —la query del buscador—
   * trae de la persona solo id, nombre y teléfono: el documento y la dirección, que es lo que
   * SIFEN exige, llegan recién con `funcionario(id)`.
   */
  onChoferFuncionarioSeleccionado(funcionario: any): void {
    if (funcionario == null) {
      this.choferFuncionarioId = null;
      return;
    }
    this.choferFuncionarioId = funcionario.id;
    this.funcionarioService.onGetFuncionarioById(funcionario.id)
      .pipe(untilDestroyed(this))
      .subscribe(completo => {
        const persona = completo?.persona ?? funcionario.persona;
        if (persona == null) return;
        this.nota.choferPersonaId = persona.id;
        this.nota.choferNombre = persona.nombre;
        this.nota.choferDocumento = persona.documento;
        this.nota.choferDireccion = persona.direccion;
      });
  }

  ngOnInit(): void {
    this.referenciaControl.setValue(this.data?.referenciaId ?? null);
    this.prellenar();
  }

  prellenar(): void {
    const sucursalId = this.data?.sucursalId ?? this.mainService.sucursalActual?.id;
    this.cargando = true;
    this.service.onPrellenar(this.data.origen, this.referenciaControl.value, sucursalId)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.cargando = false;
        if (!res?.notaRemision) return;
        this.nota = res.notaRemision;
        this.items = res.items ?? [];
      });
  }

  agregarItem(): void {
    this.items = [...this.items, { descripcion: '', cantidad: 1, unidadMedida: 'UNI' }];
  }

  quitarItem(indice: number): void {
    this.items = this.items.filter((_, i) => i !== indice);
  }

  /**
   * Guarda y, si el usuario quiere, envía a SIFEN. Son dos pasos separados a propósito: si el envío
   * falla, la nota ya existe con su número y se puede reintentar sin volver a cargarla.
   */
  guardar(): void {
    if (!this.validar()) return;

    this.guardando = true;
    // Campo por campo, sin spread: lo que vuelve de la query trae __typename de Apollo y el input
    // de GraphQL lo rechaza ("field name '__typename' that is not defined for input object type").
    const input: any = {
      sucursalId: this.nota.sucursalId,
      timbradoDetalleId: this.nota.timbradoDetalleId,
      fecha: this.nota.fecha ? dateToString(new Date(this.nota.fecha)) : null,
      origen: this.nota.origen,
      transferenciaId: this.nota.transferenciaId,
      facturaLegalId: this.nota.facturaLegalId,
      motivoEmision: this.nota.motivoEmision,
      responsableEmision: this.nota.responsableEmision,
      kmEstimado: this.nota.kmEstimado,
      fechaInicioTraslado: this.nota.fechaInicioTraslado
        ? dateToString(new Date(this.nota.fechaInicioTraslado)) : null,
      fechaFinTraslado: this.nota.fechaFinTraslado
        ? dateToString(new Date(this.nota.fechaFinTraslado)) : null,
      fechaEstimadaFactura: this.nota.fechaEstimadaFactura
        ? dateToString(new Date(this.nota.fechaEstimadaFactura)) : null,
      clienteId: this.nota.clienteId,
      receptorNombre: this.nota.receptorNombre,
      receptorRuc: this.nota.receptorRuc,
      receptorDireccion: this.nota.receptorDireccion,
      receptorDepartamento: this.nota.receptorDepartamento,
      receptorCodigoCiudad: this.nota.receptorCodigoCiudad,
      receptorCiudad: this.nota.receptorCiudad,
      salidaDireccion: this.nota.salidaDireccion,
      salidaDepartamento: this.nota.salidaDepartamento,
      salidaCodigoCiudad: this.nota.salidaCodigoCiudad,
      salidaCiudad: this.nota.salidaCiudad,
      entregaDireccion: this.nota.entregaDireccion,
      entregaDepartamento: this.nota.entregaDepartamento,
      entregaCodigoCiudad: this.nota.entregaCodigoCiudad,
      entregaCiudad: this.nota.entregaCiudad,
      tipoTransporte: this.nota.tipoTransporte,
      modalidadTransporte: this.nota.modalidadTransporte,
      transportistaNombre: this.nota.transportistaNombre,
      transportistaRuc: this.nota.transportistaRuc,
      transportistaDireccion: this.nota.transportistaDireccion,
      vehiculoId: this.nota.vehiculoId,
      vehiculoMarca: this.nota.vehiculoMarca,
      vehiculoMatricula: this.nota.vehiculoMatricula,
      choferPersonaId: this.nota.choferPersonaId,
      choferNombre: this.nota.choferNombre,
      choferDocumento: this.nota.choferDocumento,
      choferDireccion: this.nota.choferDireccion,
      usuarioId: this.mainService.usuarioActual?.id
    };

    const itemsInput: NotaRemisionItemInput[] = this.items.map(item => ({
      productoId: item.productoId,
      presentacionId: item.presentacionId,
      codigo: item.codigo,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      unidadMedida: item.unidadMedida
    }));

    this.service.onSave(input, itemsInput).pipe(untilDestroyed(this)).subscribe(guardada => {
      this.guardando = false;
      if (!guardada) return;
      this.dialogosService.confirm(
        'Nota de remisión creada',
        `Quedó con el número ${guardada.numeroNotaRemision}.`,
        '¿Enviarla a SIFEN ahora?'
      ).pipe(untilDestroyed(this)).subscribe(confirmado => {
        if (!confirmado) {
          this.dialogRef.close(guardada);
          return;
        }
        this.service.onGenerarYEnviar(guardada.id, guardada.sucursalId)
          .pipe(untilDestroyed(this))
          .subscribe(de => {
            if (de?.cdc) {
              this.notificacionService.openSucess(`Enviada a SIFEN. CDC ${de.cdc}`, 5);
            }
            this.dialogRef.close(guardada);
          });
      });
    });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }

  /** Lo mínimo para no ir al backend con una nota que sabemos que va a rechazar. */
  private validar(): boolean {
    if (!this.items.length) {
      this.notificacionService.openWarn('La nota necesita al menos un ítem');
      return false;
    }
    if (this.items.some(i => !i.descripcion || !i.cantidad || i.cantidad <= 0)) {
      this.notificacionService.openWarn('Cada ítem necesita descripción y cantidad mayor a cero');
      return false;
    }
    if (!this.nota.receptorNombre || !this.nota.receptorRuc) {
      this.notificacionService.openWarn('SIFEN no admite receptor sin nombre y documento en una nota de remisión');
      return false;
    }
    if (!this.nota.motivoEmision) {
      this.notificacionService.openWarn('Falta el motivo del traslado');
      return false;
    }
    if (!this.nota.salidaCodigoCiudad || !this.nota.entregaCodigoCiudad) {
      this.notificacionService.openWarn('Faltan las ciudades de salida y de entrega');
      return false;
    }
    if (this.nota.vehiculoMarca && this.nota.vehiculoMarca.length > 10) {
      // El central la abrevia igual, pero conviene avisarlo antes de emitir.
      this.notificacionService.openWarn('SIFEN acepta hasta 10 caracteres en la marca: se va a abreviar');
    }
    return true;
  }
}
