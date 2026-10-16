import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LogicalReplicationService } from '../logical-replication.service';
import { LogicalReplication } from '../logical-replication.model';
import { Observable, forkJoin, of } from 'rxjs';

export interface EditRemoteSubscriptionDialogData {
  branchSucursalId: number;
  subscription?: LogicalReplication;
  isEdit: boolean;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-remote-subscription-dialog',
  templateUrl: './edit-remote-subscription-dialog.component.html',
  styleUrls: ['./edit-remote-subscription-dialog.component.scss']
})
export class EditRemoteSubscriptionDialogComponent implements OnInit {
  
  form: FormGroup;
  isLoading = false;
  errorMessage: string = null;
  /** Hubo un guardado sin respuesta: pudo aplicarse, así que al cancelar la lista se recarga (#501). */
  private sinConfirmar = false;
  useCentralConnection = true;
  centralConnectionString: string = '';
  isCentralConnectionLoading = false;

  // Connection string field visibility
  showPassword = false;

  constructor(
    private dialogRef: MatDialogRef<EditRemoteSubscriptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditRemoteSubscriptionDialogData,
    private formBuilder: FormBuilder,
    private logicalReplicationService: LogicalReplicationService
  ) { }

  ngOnInit(): void {
    // Initialize form
    this.form = this.formBuilder.group({
      subscriptionName: ['', Validators.required],
      publicationName: ['', Validators.required],
      
      // Connection string fields
      connectionString: [''],
      host: ['localhost'],
      port: [5432, [Validators.required, Validators.min(1), Validators.max(65535)]],
      dbName: ['postgres', Validators.required],
      username: ['postgres', Validators.required],
      password: ['', Validators.required]
    });

    // Load central connection string
    this.isCentralConnectionLoading = true;
    this.logicalReplicationService.generateCentralConnectionString()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (connectionString) => {
          this.centralConnectionString = connectionString;
          if (this.useCentralConnection) {
            this.form.get('connectionString').setValue(connectionString);
          }
          this.isCentralConnectionLoading = false;
        },
        error: (error) => {
          console.error('Error generating central connection string', error);
          this.isCentralConnectionLoading = false;
        }
      });

    if (this.data.isEdit) {
      // We're editing an existing subscription
      this.form.get('subscriptionName').setValue(this.data.subscription.name);
      this.form.get('subscriptionName').disable(); // Can't change subscription name
      
      // In edit mode, publication name is optional (connection fields: aplicarValidadoresDeConexion)
      this.form.get('publicationName').clearValidators();
      this.form.get('publicationName').updateValueAndValidity();
    } else {
      // Generate a suggested subscription name
      this.logicalReplicationService.generateBranchSubscriptionName(this.data.branchSucursalId)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (name) => {
            this.form.get('subscriptionName').setValue(name);
          },
          error: (error) => {
            console.error('Error generating subscription name', error);
          }
        });
      
      // For new subscriptions, generate a suggested publication name
      this.logicalReplicationService.generateCentralToBranchPublicationName(this.data.branchSucursalId)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (name) => {
            this.form.get('publicationName').setValue(name);
          },
          error: (error) => {
            console.error('Error generating publication name', error);
          }
        });
    }

    this.aplicarValidadoresDeConexion();
  }

  onSave(): void {
    if (this.form.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const subscriptionName = this.data.isEdit ? 
      this.data.subscription.name : 
      this.form.get('subscriptionName').value;
    
    const publicationName = this.form.get('publicationName').value;
    
    // Get the connection string
    let connectionString = this.form.get('connectionString').value;
    
    // Manual: la cadena sale de los campos. Al editar, con la contraseña vacía la conexión no se cambia (antes, al
    // editar, los campos se ignoraban siempre)
    if (!this.useCentralConnection) {
      const sinCambiarConexion = this.data.isEdit && !this.form.get('password').value;
      connectionString = sinCambiarConexion ? null : this.generateConnectionStringFromFields();
    }

    const operation: Observable<any> = this.data.isEdit ?
      this.logicalReplicationService.editRemoteSubscription(
        this.data.branchSucursalId, 
        subscriptionName, 
        connectionString || undefined, 
        publicationName || undefined
      ) :
      this.logicalReplicationService.createRemoteSubscription(
        this.data.branchSucursalId, 
        subscriptionName, 
        connectionString, 
        publicationName
      );

    operation.pipe(untilDestroyed(this))
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          if (result && result.success) {
            this.dialogRef.close(true);
          } else {
            this.errorMessage = result?.message || 'Error desconocido al guardar la suscripción';
            this.sinConfirmar = this.sinConfirmar || result?.sinConfirmar === true;
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error?.message || 'Error al comunicarse con el servidor';
          console.error('Error saving subscription', error);
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close(this.sinConfirmar);
  }

  toggleConnectionType(): void {
    this.useCentralConnection = !this.useCentralConnection;
    // Central: la cadena que genera el central. Manual: se arma con los campos al guardar
    this.form.get('connectionString').setValue(this.useCentralConnection ? this.centralConnectionString : '');
    this.aplicarValidadoresDeConexion();
  }

  /**
   * Validadores según el modo de conexión. Antes solo los ponía el interruptor: al abrir en modo central los campos
   * manuales nacían obligatorios y «Crear» no se habilitaba, y en modo manual la cadena oculta seguía obligatoria.
   * Al editar nada es obligatorio: con la contraseña vacía la conexión queda como está.
   */
  private aplicarValidadoresDeConexion(): void {
    const exigirCadena = this.useCentralConnection && !this.data.isEdit;
    const exigirCampos = !this.useCentralConnection && !this.data.isEdit;
    const rangoPuerto = [Validators.min(1), Validators.max(65535)];
    const reglas = {
      connectionString: exigirCadena ? [Validators.required] : [],
      host: exigirCampos ? [Validators.required] : [],
      port: exigirCampos ? [Validators.required, ...rangoPuerto] : rangoPuerto,
      dbName: exigirCampos ? [Validators.required] : [],
      username: exigirCampos ? [Validators.required] : [],
      password: exigirCampos ? [Validators.required] : []
    };
    for (const campo of Object.keys(reglas)) {
      this.form.get(campo).setValidators(reglas[campo]);
      this.form.get(campo).updateValueAndValidity();
    }
  }

  generateConnectionStringFromFields(): string {
    const host = this.form.get('host').value;
    const port = this.form.get('port').value;
    const dbName = this.form.get('dbName').value;
    const username = this.form.get('username').value;
    const password = this.form.get('password').value;
    
    // Generate connection string manually instead of calling the service to avoid another async call.
    // Usuario y contraseña van codificados: un @, : o / en la contraseña rompería la URI
    return `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${dbName}`;
  }
} 