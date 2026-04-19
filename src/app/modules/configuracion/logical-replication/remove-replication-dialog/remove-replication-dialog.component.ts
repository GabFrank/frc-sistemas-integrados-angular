import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LogicalReplicationService } from '../logical-replication.service';

export interface RemoveReplicationDialogData {
  sucursalId: number;
  sucursalNombre: string;
  origin: 'SUBSCRIPTION' | 'PUBLICATION';
}

const TARGET_OPTIONS: { value: string; label: string }[] = [
  { value: 'SUBSCRIPTION', label: 'Solo suscripción(es)' },
  { value: 'PUBLICATION', label: 'Solo publicación(es)' },
  { value: 'BOTH', label: 'Ambos (suscripción y publicación)' }
];

const SCOPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'CENTRAL', label: 'Solo en servidor central' },
  { value: 'FILIAL', label: 'Solo en filial' },
  { value: 'BOTH', label: 'En ambos' }
];

@UntilDestroy()
@Component({
  selector: 'app-remove-replication-dialog',
  templateUrl: './remove-replication-dialog.component.html',
  styleUrls: ['./remove-replication-dialog.component.scss']
})
export class RemoveReplicationDialogComponent {

  form: FormGroup;
  isSubmitting = false;
  targetOptions = TARGET_OPTIONS;
  scopeOptions = SCOPE_OPTIONS;
  resultLog: string | null = null;
  resultSuccess: boolean | null = null;
  sucursalNombre: string;

  constructor(
    private dialogRef: MatDialogRef<RemoveReplicationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RemoveReplicationDialogData,
    private fb: FormBuilder,
    private logicalReplicationService: LogicalReplicationService
  ) {
    this.sucursalNombre = data?.sucursalNombre ?? '';
    const defaultTarget = data?.origin === 'PUBLICATION' ? 'PUBLICATION' : data?.origin === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'BOTH';
    this.form = this.fb.group({
      target: [defaultTarget, Validators.required],
      scope: ['BOTH', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting || !this.data?.sucursalId) {
      return;
    }
    this.isSubmitting = true;
    const target = this.form.get('target')?.value;
    const scope = this.form.get('scope')?.value;
    this.logicalReplicationService.removeReplicationAdvanced(this.data.sucursalId, target, scope)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (status) => {
          this.isSubmitting = false;
          this.resultLog = status?.message ?? '';
          this.resultSuccess = status?.success ?? false;
        },
        error: () => {
          this.isSubmitting = false;
          this.resultLog = 'Error al ejecutar la eliminación.';
          this.resultSuccess = false;
        }
      });
  }

  clearResult(): void {
    this.resultLog = null;
    this.resultSuccess = null;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  closeAfterResult(): void {
    this.dialogRef.close(this.resultSuccess === true);
  }
}
