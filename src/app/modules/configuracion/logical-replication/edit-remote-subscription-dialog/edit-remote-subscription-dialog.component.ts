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
      
      // In edit mode, connection string and publication name are optional
      // and we don't have access to the current values, so we make them non-required
      this.form.get('connectionString').clearValidators();
      this.form.get('publicationName').clearValidators();
      this.form.get('connectionString').updateValueAndValidity();
      this.form.get('publicationName').updateValueAndValidity();
      
      // Other fields also become non-required in edit mode
      this.form.get('host').clearValidators();
      this.form.get('port').clearValidators();
      this.form.get('dbName').clearValidators();
      this.form.get('username').clearValidators();
      this.form.get('password').clearValidators();
      this.form.get('host').updateValueAndValidity();
      this.form.get('port').updateValueAndValidity();
      this.form.get('dbName').updateValueAndValidity();
      this.form.get('username').updateValueAndValidity();
      this.form.get('password').updateValueAndValidity();
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
      
      // Add validator for connection string when creating new subscription
      this.form.get('connectionString').setValidators([Validators.required]);
      this.form.get('connectionString').updateValueAndValidity();
    }
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
    
    // If not using central connection and this is a new subscription, generate it
    if (!this.useCentralConnection && !this.data.isEdit && !connectionString) {
      connectionString = this.generateConnectionStringFromFields();
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
    this.dialogRef.close(false);
  }

  toggleConnectionType(): void {
    this.useCentralConnection = !this.useCentralConnection;
    
    if (this.useCentralConnection) {
      // Use the central server connection string
      this.form.get('connectionString').setValue(this.centralConnectionString);
      
      // Make manual fields non-required
      this.form.get('host').clearValidators();
      this.form.get('port').clearValidators();
      this.form.get('dbName').clearValidators();
      this.form.get('username').clearValidators();
      this.form.get('password').clearValidators();
    } else {
      // Clear the connection string field
      this.form.get('connectionString').setValue('');
      
      // Make manual fields required
      this.form.get('host').setValidators([Validators.required]);
      this.form.get('port').setValidators([Validators.required, Validators.min(1), Validators.max(65535)]);
      this.form.get('dbName').setValidators([Validators.required]);
      this.form.get('username').setValidators([Validators.required]);
      this.form.get('password').setValidators([Validators.required]);
    }
    
    // Update validity
    this.form.get('host').updateValueAndValidity();
    this.form.get('port').updateValueAndValidity();
    this.form.get('dbName').updateValueAndValidity();
    this.form.get('username').updateValueAndValidity();
    this.form.get('password').updateValueAndValidity();
  }

  generateConnectionStringFromFields(): string {
    const host = this.form.get('host').value;
    const port = this.form.get('port').value;
    const dbName = this.form.get('dbName').value;
    const username = this.form.get('username').value;
    const password = this.form.get('password').value;
    
    // Generate connection string manually instead of calling the service to avoid another async call
    return `postgresql://${username}:${password}@${host}:${port}/${dbName}`;
  }
} 