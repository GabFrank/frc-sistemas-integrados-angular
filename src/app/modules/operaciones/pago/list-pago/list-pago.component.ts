import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { formatDate } from '@angular/common';
import { Pago, PagoEstado } from '../pago.model';
import { PagoService } from '../pago.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';

@Component({
  selector: 'app-list-pago',
  templateUrl: './list-pago.component.html',
  styleUrls: ['./list-pago.component.scss']
})
export class ListPagoComponent implements OnInit {
  pagos: Pago[] = [];
  dataSource = new MatTableDataSource<Pago>(this.pagos);
  displayedColumns: string[] = ['id', 'solicitudPago', 'estado', 'creadoEn', 'acciones'];
  filterForm: FormGroup;
  loading = false;
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  estadoOptions = Object.values(PagoEstado);
  
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private pagoService: PagoService,
    private fb: FormBuilder,
    private router: Router,
    private dialog: MatDialog,
    private dialogosService: DialogosService
  ) {
    this.createFilterForm();
  }

  ngOnInit(): void {
    this.loadPagos();
  }

  /**
   * Crea el formulario de filtros
   */
  createFilterForm(): void {
    this.filterForm = this.fb.group({
      pagoId: [''],
      solicitudPagoId: [''],
      estado: [''],
      programado: [''],
      fechaInicio: [''],
      fechaFin: ['']
    });
  }

  /**
   * Carga los pagos con filtros
   */
  loadPagos(): void {
    this.loading = true;
    
    const filters = this.filterForm.value;
    const pagoId = filters.pagoId ? parseInt(filters.pagoId, 10) : null;
    const solicitudPagoId = filters.solicitudPagoId ? parseInt(filters.solicitudPagoId, 10) : null;
    
    // Parse programado string to boolean if it has a value
    let programado = null;
    if (filters.programado === 'true') programado = true;
    if (filters.programado === 'false') programado = false;
    
    // Format dates if provided
    let fechaInicio = null;
    let fechaFin = null;
    
    if (filters.fechaInicio) {
      fechaInicio = formatDate(filters.fechaInicio, 'yyyy-MM-dd', 'en-US');
    }
    
    if (filters.fechaFin) {
      fechaFin = formatDate(filters.fechaFin, 'yyyy-MM-dd', 'en-US');
    }

    this.pagoService.onSearchConFiltros(
      pagoId,
      solicitudPagoId,
      filters.estado,
      programado,
      fechaInicio,
      fechaFin,
      this.pageIndex,
      this.pageSize
    ).subscribe(
      response => {
        this.pagos = response.getContent;
        this.dataSource.data = this.pagos;
        this.totalItems = response.getTotalElements;
        this.loading = false;
      },
      error => {
        console.error('Error al cargar pagos', error);
        this.loading = false;
      }
    );
  }

  /**
   * Reinicia los filtros
   */
  resetFilters(): void {
    this.dialogosService.confirm(
      'REINICIAR FILTROS',
      '¿ESTÁ SEGURO DE REINICIAR TODOS LOS FILTROS?'
    ).subscribe(result => {
      if (result) {
        this.filterForm.reset();
        this.pageIndex = 0;
        this.loadPagos();
      }
    });
  }

  /**
   * Navega a la página de detalle de un pago
   * @param pagoId ID del pago
   */
  verDetalle(pagoId: number): void {
    this.router.navigate(['/operaciones/pagos/detalle', pagoId]);
  }

  /**
   * Maneja el evento de cambio de página
   * @param event Evento de paginación
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPagos();
  }
} 