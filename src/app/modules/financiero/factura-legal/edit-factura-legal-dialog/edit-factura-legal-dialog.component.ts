import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { FacturaLegal, FacturaLegalInput } from '../factura-legal.model';
import { FacturaLegalService } from '../factura-legal.service';
import { Cliente, ClienteResponse } from '../../../personas/clientes/cliente.model';
import { ClienteService } from '../../../personas/clientes/cliente.service';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { SearchListDialogComponent, SearchListtDialogData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { PersonaSearchGQL } from '../../../personas/persona/graphql/personaSearch';
import { Persona } from '../../../personas/persona/persona.model';
import { EstadoDE } from '../../documento-electronico/documento-electronico.model';
import { facturaActiva } from '../factura-legal-estado';
import { avisoTrasMutacion, erroresDeRechazo, motivoDelRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';
import { MainService } from '../../../../main.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';

/**
 * Un cliente va a SIFEN como innominado si no tiene persona, se llama «SIN NOMBRE» o no tiene documento
 * (misma regla que SifenReceptorHelper del central). Hasta 09/2026 las innominadas se emitían con el
 * cliente 0 «SIN NOMBRE», así que tener cliente no quiere decir estar nominada.
 */
export function esClienteInnominado(cliente: Cliente): boolean {
  const persona = cliente?.persona;
  const nombre = (persona?.nombre || '').trim().toUpperCase();
  const documento = (persona?.documento || '').trim();
  return !persona || nombre === '' || nombre === 'SIN NOMBRE' || documento === '' || documento === '0';
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-edit-factura-legal-dialog',
  templateUrl: './edit-factura-legal-dialog.component.html',
  styleUrls: ['./edit-factura-legal-dialog.component.scss']
})
export class EditFacturaLegalDialogComponent implements OnInit {

  factura: FacturaLegal;
  formGroup: FormGroup;
  clienteControl = new FormControl(null);
  nombreControl = new FormControl('', Validators.required);
  rucControl = new FormControl('', Validators.required);
  direccionControl = new FormControl('');
  
  // Computed properties
  esElectronicaComputed = false;
  esInnominadaComputed = false;
  puedeEditarComputed = false;
  /** Nominar es emisión fiscal: mismo rol que emitir una nota de crédito (el central lo exige igual). */
  puedeNominar = false;
  tipoFacturaDisplayComputed = '';
  estadoDEDisplayComputed = '';
  estadoFacturaDisplayComputed = '';
  
  // Selected cliente
  selectedCliente: Cliente = null;

  // Sugerencias de clientes mientras se escribe el nombre o el RUC
  sugerencias: Cliente[] = [];
  buscandoSugerencias = false;
  /** RUC escrito que se puede ir a buscar a la SET; null si lo escrito no parece un RUC. */
  rucParaSet: string = null;
  /** Lo que se le muestra al usuario sobre el cliente que queda vinculado a la factura. */
  clienteVinculadoTexto: string = null;
  clienteVinculadoEmail: string = null;
  private busqueda$ = new Subject<string>();
  
  // Table columns
  displayedColumns = ['producto', 'cantidad', 'precioUnitario', 'subtotal'];

  constructor(
    public dialogRef: MatDialogRef<EditFacturaLegalDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { factura: FacturaLegal },
    private facturaLegalService: FacturaLegalService,
    private clienteService: ClienteService,
    private cargandoService: CargandoDialogService,
    private notificacionSnackbar: NotificacionSnackbarService,
    private matDialog: MatDialog,
    private personaSearch: PersonaSearchGQL,
    private mainService: MainService
  ) {
    this.factura = Object.assign(new FacturaLegal(), data.factura);
  }

  ngOnInit(): void {
    this.puedeNominar = this.mainService.tieneAlgunRol([ROLES.FACTURACION_EMITIR, ROLES.ADMIN]);
    this.initForm(); // Inicializar el formulario de inmediato
    this.escucharBusqueda();

    const { requestId } = this.cargandoService.openDialog();
    this.facturaLegalService.onGetFacturaLegal(this.factura.id, this.factura.sucursalId)
      .pipe(untilDestroyed(this))
      .subscribe(facturaCompleta => {
        // GraphQL devuelve un objeto plano; hay que instanciar la clase para usar toInput()
        this.factura = Object.assign(new FacturaLegal(), facturaCompleta);

        // Actualizar los valores del formulario con los datos completos
        this.formGroup.patchValue({
          nombre: this.factura.nombre || '',
          ruc: this.factura.ruc || '',
          direccion: this.factura.direccion || ''
        });
        
        this.updateComputedProperties();

        // Set selected cliente if factura has one
        if (this.factura.cliente) {
          this.selectedCliente = this.factura.cliente;
          this.clienteControl.setValue(this.displayCliente(this.selectedCliente));
        }
        this.actualizarClienteVinculado();
        this.cargandoService.closeDialog(requestId);
      }, err => {
        this.cargandoService.closeDialog(requestId);
        this.notificacionSnackbar.openAlgoSalioMal('No se pudo cargar la información completa de la factura.');
        this.dialogRef.close();
      });
  }

  initForm(): void {
    this.formGroup = new FormGroup({
      cliente: this.clienteControl,
      nombre: this.nombreControl,
      ruc: this.rucControl,
      direccion: this.direccionControl
    });

    // Set initial values
    this.nombreControl.setValue(this.factura.nombre || '');
    this.rucControl.setValue(this.factura.ruc || '');
    this.direccionControl.setValue(this.factura.direccion || '');
  }

  updateComputedProperties(): void {
    // Es electrónica si tiene CDC
    this.esElectronicaComputed = !!(this.factura.cdc && this.factura.cdc.trim().length > 0);
    
    this.esInnominadaComputed = esClienteInnominado(this.factura.cliente);

    // Una electrónica solo se abre para nominarla; la de papel se edita siempre
    this.puedeEditarComputed = !this.esElectronicaComputed || this.esInnominadaComputed;
    
    // Tipo de factura display
    this.tipoFacturaDisplayComputed = this.esElectronicaComputed ? 'Electrónica' : 'Papel';
    
    // Estado DE display
    if (this.esElectronicaComputed) {
      this.estadoFacturaDisplayComputed = this.factura.documentoElectronico?.estado || 'N/A';
    } else {
      this.estadoFacturaDisplayComputed = facturaActiva(this.factura) ? 'Activa' : 'Inactiva';
    }

    // Deshabilitar formulario si no se puede editar
    if (!this.puedeEditarComputed) {
      this.formGroup.disable();
    } else {
      this.formGroup.enable();
    }
  }

  /** Busca clientes en la base a medida que se escribe, sin disparar una consulta por tecla. */
  private escucharBusqueda(): void {
    this.busqueda$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        tap((texto) => { this.buscandoSugerencias = texto.length >= 3; }),
        switchMap((texto) => texto.length < 3
          ? of([] as Cliente[])
          : this.clienteService.onSugerir(texto).pipe(catchError(() => of([] as Cliente[])))),
        untilDestroyed(this)
      )
      .subscribe((clientes) => {
        this.sugerencias = clientes;
        this.buscandoSugerencias = false;
      });
  }

  /** El usuario escribió en nombre o RUC: lo escrito ya no es el cliente elegido antes. */
  onEscribir(valor: string, esRuc: boolean): void {
    const texto = (valor || '').trim().toUpperCase();
    if (this.selectedCliente) {
      this.selectedCliente = null;
      this.clienteControl.setValue('');
      this.actualizarClienteVinculado();
    }
    if (esRuc) {
      const documento = texto.split('-')[0];
      this.rucParaSet = /^\d{5,}$/.test(documento) ? documento : null;
    }
    this.busqueda$.next(texto);
  }

  onSugerenciaElegida(evento: MatAutocompleteSelectedEvent): void {
    const valor = evento.option.value;
    if (valor?.buscarEnSet) {
      this.rucControl.setValue(valor.buscarEnSet);
      this.buscarEnSet(valor.buscarEnSet);
      return;
    }
    this.elegirCliente(valor as Cliente);
  }

  private elegirCliente(cliente: Cliente): void {
    this.selectedCliente = cliente;
    this.clienteControl.setValue(this.displayCliente(cliente));
    this.nombreControl.setValue(cliente.persona?.nombre || '');
    this.rucControl.setValue(cliente.persona?.documento || '');
    this.direccionControl.setValue(cliente.persona?.direccion || this.direccionControl.value || '');
    this.sugerencias = [];
    this.rucParaSet = null;
    this.actualizarClienteVinculado();
  }

  /**
   * Va a la SET con el RUC escrito. El central, si lo encuentra, lo da de alta como cliente: por
   * eso es una opción que se elige y no algo que corre solo con cada RUC a medio escribir.
   */
  private buscarEnSet(documento: string): void {
    this.clienteService.onGetClientePorPersonaDocumentoDetallado(documento, true)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (respuesta: ClienteResponse) => {
          if (respuesta?.cliente?.id) {
            this.elegirCliente(respuesta.cliente);
            return;
          }
          const razonSocial = respuesta?.datosBasicos?.razonSocial || respuesta?.datosBasicos?.nombreFantasia;
          if (razonSocial) {
            this.nombreControl.setValue(razonSocial);
            this.direccionControl.setValue(respuesta.datosBasicos.direccion || this.direccionControl.value || '');
          }
          this.notificacionSnackbar.openWarn(
            respuesta?.errores?.[0] || `No se encontró el RUC ${documento} en la SET.`, 6);
        },
        error: () => {
          this.notificacionSnackbar.openWarn(`No se pudo consultar el RUC ${documento} en la SET.`, 6);
        }
      });
  }

  /** Para los dos autocomplete: la opción es un cliente, pero en el campo va solo su texto. */
  mostrarNombre = (valor: any): string => typeof valor === 'string' ? valor : (valor?.persona?.nombre || '');
  mostrarRuc = (valor: any): string =>
    typeof valor === 'string' ? valor : (valor?.buscarEnSet || valor?.persona?.documento || '');

  private actualizarClienteVinculado(): void {
    const cliente = this.selectedCliente ?? this.factura.cliente;
    this.clienteVinculadoTexto = cliente?.persona ? this.displayCliente(cliente) : null;
    this.clienteVinculadoEmail = cliente?.persona?.email || null;
  }

  onClienteSearch(): void {
    const data: SearchListtDialogData = {
      titulo: 'Buscar Persona',
      query: this.personaSearch,
      tableData: [
        { id: 'id', nombre: 'Id', width: '10%' },
        { id: 'nombre', nombre: 'Nombre', width: '70%' },
        { id: 'documento', nombre: 'Documento/Ruc', width: '20%' }
      ],
      search: true
    };

    this.matDialog
      .open(SearchListDialogComponent, {
        data,
        height: '50%',
        width: '50%'
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: Persona) => {
        if (res != null) {
          // Check if persona is already a cliente
          this.clienteService.onGetByPersonaId(res.id)
            .pipe(untilDestroyed(this))
            .subscribe({
              next: (cliente: Cliente) => {
                if (cliente) {
                  this.selectedCliente = cliente;
                  this.clienteControl.setValue(this.displayCliente(cliente));
                  // Update form fields with cliente data
                  this.nombreControl.setValue(res.nombre || '');
                  this.rucControl.setValue(res.documento || '');
                  this.direccionControl.setValue(res.direccion || '');
                } else {
                  // Persona exists but not a cliente yet - just fill form fields
                  this.selectedCliente = null;
                  this.clienteControl.setValue(res.nombre);
                  this.nombreControl.setValue(res.nombre || '');
                  this.rucControl.setValue(res.documento || '');
                  this.direccionControl.setValue(res.direccion || '');
                }
              },
              // No se sabe si la persona es cliente: tratarla como «todavía no es cliente» y rellenar la
              // factura con sus datos sería decidir sobre una lectura que falló. No se toca nada (#390).
              error: () => {
                this.notificacionSnackbar.openWarn('No se pudo comprobar si la persona ya es cliente: elegila de nuevo.', 6);
              }
            });
        }
      });
  }

  displayCliente(cliente: Cliente): string {
    if (!cliente || !cliente.persona) return '';
    return `${cliente.persona.nombre} - ${cliente.persona.documento || 'Sin RUC'}`;
  }

  onClearCliente(): void {
    this.selectedCliente = null;
    this.clienteControl.setValue('');
  }

  onGuardar(): void {
    if (!this.puedeEditarComputed) {
      this.notificacionSnackbar.openAlgoSalioMal('Esta factura no puede ser editada');
      return;
    }

    // Una electrónica no se edita: se nomina, y la factura toma el cliente cuando SIFEN aprueba (#433)
    if (this.esElectronicaComputed) {
      if (!this.puedeNominar) {
        this.notificacionSnackbar.openWarn('Nominar una factura electrónica requiere el rol FACTURACION EMITIR.', 6);
        return;
      }
      if (!this.selectedCliente?.id || esClienteInnominado(this.selectedCliente)) {
        this.notificacionSnackbar.openWarn('Elegí un cliente identificado para nominar la factura.', 6);
        return;
      }
      this.nominarFactura(this.selectedCliente.id, this.cargandoService.openDialog().requestId);
      return;
    }

    if (this.formGroup.invalid) {
      this.notificacionSnackbar.openAlgoSalioMal('Por favor complete los campos requeridos');
      return;
    }

    const { requestId } = this.cargandoService.openDialog();

    try {
      // Solo enviar campos editables: enviar toInput() completo falla porque
      // fecha llega como "yyyy-MM-dd HH:mm" y el backend no puede parsearlo a LocalDateTime.
      const input = new FacturaLegalInput();
      input.id = this.factura.id;
      input.sucursalId = this.factura.sucursalId;
      input.nombre = this.nombreControl.value?.toUpperCase();
      input.ruc = this.rucControl.value?.toUpperCase();
      input.direccion = this.direccionControl.value?.toUpperCase() || null;
      input.clienteId = this.selectedCliente?.id ?? this.factura.cliente?.id ?? null;

      this.facturaLegalService.onUpdateFacturaLegal(input)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (updatedFactura) => {
            this.cargandoService.closeDialog(requestId);
            this.notificacionSnackbar.openGuardadoConExito();
            this.dialogRef.close(updatedFactura);
          },
          error: (err) => {
            this.cargandoService.closeDialog(requestId);
            console.error('Error updating factura:', err);
            // En un rechazo el genérico ya mostró el motivo; editar es idempotente y el diálogo queda (#488)
            const aviso = avisoTrasMutacion(err, 'se actualizó la factura');
            if (aviso != null) {
              this.notificacionSnackbar.openWarn(aviso, 8);
            }
          }
        });
    } catch (err) {
      this.cargandoService.closeDialog(requestId);
      console.error('Error preparando actualización de factura:', err);
      this.notificacionSnackbar.openAlgoSalioMal('Error al preparar la actualización de la factura');
    }
  }

  nominarFactura(clienteId: number, requestId: number): void {
    this.facturaLegalService.onNominarFacturaElectronica(
      this.factura.id,
      this.factura.sucursalId,
      clienteId
    )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (success) => {
          this.cargandoService.closeDialog(requestId);
          if (success) {
            this.notificacionSnackbar.openSucess('Factura nominada en SIFEN');
          } else {
            this.notificacionSnackbar.openWarn(
              'SIFEN recibió la nominación pero todavía no la aprobó: revisá antes de repetir.', 8);
          }
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.cargandoService.closeDialog(requestId);
          console.error('Error nominando factura:', err);
          // El motivo de un rechazo ya lo mostró el genérico; sin respuesta no se sabe qué hizo SIFEN (#488)
          if (erroresDeRechazo(err) != null) {
            // El toast del genérico dura 3 s y el diálogo se cierra: el motivo va también en el aviso largo
            const motivo = motivoDelRechazo(err);
            this.notificacionSnackbar.openWarn(motivo ? `No se nominó la factura. ${motivo}` : 'No se nominó la factura.', 8);
          } else if (!esTimeoutDeLink(err)) {
            this.notificacionSnackbar.openWarn(
              'No se pudo confirmar si se nominó en SIFEN: revisá antes de repetir.', 8);
          }
          this.dialogRef.close(true);
        }
      });
  }

  onSalir(): void {
    this.dialogRef.close();
  }

  getNumeroFactura(): string {
    if (!this.factura.timbradoDetalle || !this.factura.numeroFactura) {
      return 'N/A';
    }
    const establecimiento = this.factura.sucursal?.codigoEstablecimientoFactura || '000';
    const puntoExpedicion = this.factura.timbradoDetalle.puntoExpedicion || '000';
    const numero = String(this.factura.numeroFactura).padStart(7, '0');
    return `${establecimiento}-${puntoExpedicion}-${numero}`;
  }
}

