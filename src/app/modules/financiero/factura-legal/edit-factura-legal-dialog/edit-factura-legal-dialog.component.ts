import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FacturaLegal, FacturaLegalInput } from '../factura-legal.model';
import { FacturaLegalService } from '../factura-legal.service';
import { Cliente } from '../../../personas/clientes/cliente.model';
import { ClienteService } from '../../../personas/clientes/cliente.service';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { SearchListDialogComponent, SearchListtDialogData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { PersonaSearchGQL } from '../../../personas/persona/graphql/personaSearch';
import { Persona } from '../../../personas/persona/persona.model';
import { EstadoDE } from '../../documento-electronico/documento-electronico.model';

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
  tipoFacturaDisplayComputed = '';
  estadoDEDisplayComputed = '';
  estadoFacturaDisplayComputed = '';
  
  // Selected cliente
  selectedCliente: Cliente = null;
  
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
    private personaSearch: PersonaSearchGQL
  ) {
    this.factura = data.factura;
  }

  ngOnInit(): void {
    this.initForm(); // Inicializar el formulario de inmediato

    this.cargandoService.openDialog();
    this.facturaLegalService.onGetFacturaLegal(this.factura.id, this.factura.sucursalId)
      .pipe(untilDestroyed(this))
      .subscribe(facturaCompleta => {
        this.factura = facturaCompleta;

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
        this.cargandoService.closeDialog();
      }, err => {
        this.cargandoService.closeDialog();
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
    
    // Es innominada si no tiene cliente
    this.esInnominadaComputed = !this.factura.cliente;
    
    // Validación para edición
    if (this.esElectronicaComputed && this.factura.nombre !== 'SIN NOMBRE') {
      this.puedeEditarComputed = false;
    } else {
      this.puedeEditarComputed = true;
    }
    
    // Tipo de factura display
    this.tipoFacturaDisplayComputed = this.esElectronicaComputed ? 'Electrónica' : 'Papel';
    
    // Estado DE display
    if (this.esElectronicaComputed) {
      this.estadoFacturaDisplayComputed = this.factura.documentoElectronico?.estado || 'N/A';
    } else {
      this.estadoFacturaDisplayComputed = this.factura.activo ? 'Activa' : 'Inactiva';
    }

    // Deshabilitar formulario si no se puede editar
    if (!this.puedeEditarComputed) {
      this.formGroup.disable();
    } else {
      this.formGroup.enable();
    }
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
              error: (err) => {
                // Persona exists but not a cliente - fill form fields
                this.selectedCliente = null;
                this.clienteControl.setValue(res.nombre);
                this.nombreControl.setValue(res.nombre || '');
                this.rucControl.setValue(res.documento || '');
                this.direccionControl.setValue(res.direccion || '');
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

    if (this.formGroup.invalid) {
      this.notificacionSnackbar.openAlgoSalioMal('Por favor complete los campos requeridos');
      return;
    }

    this.cargandoService.openDialog();

    const input = this.factura.toInput();
    input.nombre = this.nombreControl.value?.toUpperCase();
    input.ruc = this.rucControl.value?.toUpperCase();
    input.direccion = this.direccionControl.value?.toUpperCase();
    
    if (this.selectedCliente) {
      input.clienteId = this.selectedCliente.id;
    }

    this.facturaLegalService.onUpdateFacturaLegal(input)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (updatedFactura) => {
          // If electronic and we assigned a cliente, nominate
          if (this.esElectronicaComputed && input.clienteId && !this.factura.cliente) {
            this.nominarFactura(input.clienteId);
          } else {
            this.cargandoService.closeDialog();
            this.notificacionSnackbar.openGuardadoConExito();
            this.dialogRef.close(updatedFactura);
          }
        },
        error: (err) => {
          this.cargandoService.closeDialog();
          console.error('Error updating factura:', err);
          this.notificacionSnackbar.openAlgoSalioMal(err?.message || 'Error al actualizar factura');
        }
      });
  }

  nominarFactura(clienteId: number): void {
    this.facturaLegalService.onNominarFacturaElectronica(
      this.factura.id,
      this.factura.sucursalId,
      clienteId
    )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (success) => {
          this.cargandoService.closeDialog();
          if (success) {
            this.notificacionSnackbar.openSucess('Factura actualizada y nominada correctamente');
          } else {
            this.notificacionSnackbar.openWarn('Factura actualizada pero no se pudo nominar');
          }
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.cargandoService.closeDialog();
          console.error('Error nominando factura:', err);
          this.notificacionSnackbar.openWarn('Factura actualizada pero error al nominar: ' + (err?.message || ''));
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

