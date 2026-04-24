import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { EditSucursalDialogComponent } from '../../../empresarial/sucursal/edit-sucursal-dialog/edit-sucursal-dialog.component';
import { EnabledReplicationTablesGQL } from '../graphql/enabled-replication-tables-gql';
import { LogicalReplicationService } from '../logical-replication.service';
import { ReplicationTable, ReplicationDirection } from '../replication-table.model';
import { ReplicationSetupState } from '../graphql/get-replication-setup-state-gql';

interface PreviewTable extends ReplicationTable {
  directionLabel: string;
}

@UntilDestroy()
@Component({
  selector: 'app-setup-replication-dialog',
  templateUrl: './setup-replication-dialog.component.html',
  styleUrls: ['./setup-replication-dialog.component.scss']
})
export class SetupReplicationDialogComponent implements OnInit {

  form: FormGroup;
  isLoadingSucursales = false;
  isLoadingTables = false;
  isSubmitting = false;

  sucursales: Sucursal[] = [];
  enabledTables: PreviewTable[] = [];

  selectedSucursal: Sucursal | null = null;
  canConfigureSucursal = false;
  tableCountMainToAll = 0;
  tableCountMainToSpecific = 0;
  tableCountBranchToMain = 0;

  /** Current replication state for selected sucursal (null when none selected or loading). */
  setupState: ReplicationSetupState | null = null;
  isLoadingSetupState = false;
  /** True if current target+scope would create something that already exists (or filial not reachable when scope needs it). */
  wouldCreateExisting = false;

  errorMessage: string = null;
  /** Step-by-step log from backend after setup finishes (null while not yet run or after reset). */
  resultLog: string | null = null;
  resultSuccess: boolean | null = null;

  readonly targetOptions: { value: string; label: string }[] = [
    { value: 'BOTH', label: 'TODO' },
    { value: 'PUBLICATION', label: 'PUBLICACIONES' },
    { value: 'SUBSCRIPTION', label: 'SUSCRIPCIONES' }
  ];
  readonly scopeOptions: { value: string; label: string }[] = [
    { value: 'BOTH', label: 'AMBOS' },
    { value: 'CENTRAL', label: 'CENTRAL' },
    { value: 'FILIAL', label: 'FILIAL' }
  ];

  constructor(
    private dialogRef: MatDialogRef<SetupReplicationDialogComponent>,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private sucursalService: SucursalService,
    private enabledReplicationTablesGQL: EnabledReplicationTablesGQL,
    private logicalReplicationService: LogicalReplicationService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      sucursalId: [null, Validators.required],
      target: ['BOTH'],
      scope: ['BOTH']
    });

    this.form.get('sucursalId')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(id => this.updateSelectedSucursal(id));

    this.form.get('target')?.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.updateWouldCreateExisting());
    this.form.get('scope')?.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.updateWouldCreateExisting());

    this.loadSucursales();
    this.loadEnabledTables();
  }

  private updateSelectedSucursal(sucursalId: number | null): void {
    if (sucursalId == null) {
      this.selectedSucursal = null;
      this.canConfigureSucursal = false;
      this.setupState = null;
      this.wouldCreateExisting = false;
      return;
    }
    const s = this.sucursales.find(x => x.id === sucursalId) || null;
    this.selectedSucursal = s;
    this.canConfigureSucursal = !!(s?.ip != null && s.ip !== '' && s?.puerto != null && s.puerto > 0);
    this.setupState = null;
    this.loadSetupState(sucursalId);
  }

  private loadSetupState(sucursalId: number): void {
    this.isLoadingSetupState = true;
    this.logicalReplicationService.getReplicationSetupState(sucursalId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (state) => {
          this.setupState = state ?? null;
          this.isLoadingSetupState = false;
          this.updateWouldCreateExisting();
        },
        error: () => {
          this.setupState = null;
          this.isLoadingSetupState = false;
          this.updateWouldCreateExisting();
        }
      });
  }

  private updateWouldCreateExisting(): void {
    const state = this.setupState;
    const target = this.form.get('target')?.value ?? 'BOTH';
    const scope = this.form.get('scope')?.value ?? 'BOTH';
    if (!state) {
      this.wouldCreateExisting = false;
      return;
    }
    const onCentral = scope === 'CENTRAL' || scope === 'BOTH';
    const onFilial = scope === 'FILIAL' || scope === 'BOTH';
    const doPub = target === 'PUBLICATION' || target === 'BOTH';
    const doSub = target === 'SUBSCRIPTION' || target === 'BOTH';
    const centralPubExists = state.centralPublicationExists;
    const centralSubExists = state.centralSubscriptionExists;
    const filialOk = state.filialReachable;
    const filialPubExists = state.filialPublicationExists;
    const filialSubBidiExists = state.filialSubscriptionBidiExists;
    const filialSubCentralExists = state.filialSubscriptionCentralExists;

    let would = false;
    if (doPub && onCentral && centralPubExists) {
      would = true;
    }
    if (doPub && onFilial && (!filialOk || filialPubExists)) {
      would = true;
    }
    if (doSub && onCentral && centralSubExists) {
      would = true;
    }
    if (doSub && onFilial && (!filialOk || filialSubBidiExists || filialSubCentralExists)) {
      would = true;
    }
    this.wouldCreateExisting = would;
  }

  private loadSucursales(): void {
    this.isLoadingSucursales = true;
    this.sucursalService.onGetSucursalesActivas()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (sucursales) => {
          this.sucursales = sucursales || [];
          this.isLoadingSucursales = false;
          this.updateSelectedSucursal(this.form.get('sucursalId')?.value ?? null);
        },
        error: () => {
          this.isLoadingSucursales = false;
          this.errorMessage = 'Error al cargar sucursales activas';
        }
      });
  }

  private loadEnabledTables(): void {
    this.isLoadingTables = true;

    this.enabledReplicationTablesGQL
      .watch()
      .valueChanges
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (result) => {
          const data = result?.data as { data: ReplicationTable[] };
          const tables = data?.data || [];

          this.enabledTables = tables.map(table => ({
            ...table,
            directionLabel: this.getDirectionLabel(table.direction)
          }));
          this.updateTableCounts();
          this.isLoadingTables = false;
        },
        error: () => {
          this.isLoadingTables = false;
          this.errorMessage = 'Error al cargar tablas habilitadas para replicación';
        }
      });
  }

  private updateTableCounts(): void {
    this.tableCountMainToAll = this.enabledTables.filter(t => t.direction === ReplicationDirection.MAIN_TO_ALL).length;
    this.tableCountMainToSpecific = this.enabledTables.filter(t => t.direction === ReplicationDirection.MAIN_TO_SPECIFIC).length;
    this.tableCountBranchToMain = this.enabledTables.filter(t => t.direction === ReplicationDirection.BRANCH_TO_MAIN).length;
  }

  openEditSucursal(): void {
    if (!this.selectedSucursal || !this.canConfigureSucursal) {
      return;
    }
    this.dialog.open(EditSucursalDialogComponent, {
      data: { sucursal: this.selectedSucursal },
      width: '500px',
      disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(() => {
      this.sucursalService.onGetSucursalesActivas()
        .pipe(untilDestroyed(this))
        .subscribe(sucursales => {
          this.sucursales = sucursales || [];
          this.updateSelectedSucursal(this.form.get('sucursalId')?.value ?? null);
        });
    });
  }

  private getDirectionLabel(direction: ReplicationDirection): string {
    switch (direction) {
      case ReplicationDirection.MAIN_TO_ALL:
        return 'Principal a Todas';
      case ReplicationDirection.MAIN_TO_SPECIFIC:
        return 'Principal a Específica';
      case ReplicationDirection.BRANCH_TO_MAIN:
        return 'Sucursal a Principal';
      default:
        return 'Desconocido';
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const sucursalId = this.form.get('sucursalId')?.value;
    const target = this.form.get('target')?.value ?? 'BOTH';
    const scope = this.form.get('scope')?.value ?? 'BOTH';

    this.logicalReplicationService.setupReplicationAdvanced(sucursalId, target, scope)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (status) => {
          this.isSubmitting = false;
          this.errorMessage = null;
          this.resultLog = status?.message ?? '';
          this.resultSuccess = status?.success ?? false;
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error?.message || 'Error al configurar la replicación';
        }
      });
  }

  clearResult(): void {
    this.resultLog = null;
    this.resultSuccess = null;
    this.errorMessage = null;
  }

  closeAfterResult(): void {
    this.dialogRef.close(this.resultSuccess === true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

