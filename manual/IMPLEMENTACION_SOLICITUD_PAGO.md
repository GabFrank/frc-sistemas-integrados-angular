# Implementación de Solicitud de Pago

## 📊 **RESUMEN EJECUTIVO**

### **Objetivo**
Implementar la funcionalidad de "Solicitud de Pago" que permite a los usuarios crear solicitudes de pago basadas en notas de recepción que han finalizado su etapa documental.

### **Enfoque Corregido**
- **Base:** Notas de recepción (documental) con estado `CONCILIADA` o `RECEPCION_COMPLETA`
- **Habilitación:** Cuando etapa `RECEPCION_NOTA` está `COMPLETADA`
- **Estructura:** Solicitud de pago por notas completas (NO por ítems individuales)

---

## 🏗️ **ARQUITECTURA DEL SISTEMA**

### **Entidades Principales**

#### **1. SolicitudPago.java** ✅ **EXISTE - MODIFICAR**
```java
@Entity
@Table(name = "solicitud_pago", schema = "operaciones")
public class SolicitudPago {
    @Id
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "proveedor_id", nullable = false)
    private Proveedor proveedor;
    
    @Column(name = "numero_solicitud", nullable = false)
    private String numeroSolicitud;
    
    @Column(name = "fecha_solicitud", nullable = false)
    private LocalDateTime fechaSolicitud;
    
    @Column(name = "fecha_pago_propuesta")
    private LocalDate fechaPagoPropuesta;
    
    @Column(name = "monto_total", nullable = false)
    private Double montoTotal;
    
    @ManyToOne
    @JoinColumn(name = "moneda_id", nullable = false)
    private Moneda moneda;
    
    @ManyToOne
    @JoinColumn(name = "forma_pago_id", nullable = false)
    private FormaPago formaPago;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private SolicitudPagoEstado estado;
    
    @Column(name = "observaciones")
    private String observaciones;
    
    @Column(name = "creado_en")
    private LocalDateTime creadoEn;
    
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = true)
    private Usuario usuario;
    
    @ManyToOne
    @JoinColumn(name = "pago_id", nullable = true)
    private Pago pago;
    
    // Relaciones
    @OneToMany(mappedBy = "solicitudPago", cascade = CascadeType.ALL)
    private List<SolicitudPagoNotaRecepcion> notasRecepcion;
}
```

#### **2. SolicitudPagoNotaRecepcion.java** 🆕 **NUEVA**
```java
@Entity
@Table(name = "solicitud_pago_nota_recepcion", schema = "operaciones")
public class SolicitudPagoNotaRecepcion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "solicitud_pago_id", nullable = false)
    private SolicitudPago solicitudPago;
    
    @ManyToOne
    @JoinColumn(name = "nota_recepcion_id", nullable = false)
    private NotaRecepcion notaRecepcion;
    
    @Column(name = "monto_incluido", nullable = false)
    private Double montoIncluido;
    
    @Column(name = "creado_en")
    private LocalDateTime creadoEn;
}
```

#### **3. SolicitudPagoEstado.java** ✅ **EXISTE**
```java
public enum SolicitudPagoEstado {
    PENDIENTE("Pendiente"),
    APROBADA("Aprobada"),
    PAGADA("Pagada"),
    CANCELADA("Cancelada");
    
    private final String displayName;
    
    SolicitudPagoEstado(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
```

### **Entidades Existentes (Sin Cambios)**

#### **NotaRecepcion.java** ✅ **EXISTE - CAMBIO MENOR**
- Campo `pagado` debe ser `NULL` por defecto (no `false`)

#### **NotaRecepcionItem.java** ✅ **EXISTE**
- Sin cambios, perfecta para cálculo de montos

#### **Pedido.java** ✅ **EXISTE**
- Sin cambios, perfecta para configuración de pago

#### **ProcesoEtapa.java** ✅ **EXISTE**
- Sin cambios, control de habilitación por etapas

---

## 📋 **MIGRACIONES NECESARIAS**

### **1. Migración V92: Modificar tabla solicitud_pago existente**
```sql
-- Agregar campos faltantes a la tabla existente
ALTER TABLE operaciones.solicitud_pago 
ADD COLUMN numero_solicitud VARCHAR(50) NOT NULL DEFAULT 'SP-001',
ADD COLUMN fecha_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN fecha_pago_propuesta DATE,
ADD COLUMN observaciones TEXT;

-- Crear índice único para número de solicitud
CREATE UNIQUE INDEX uk_solicitud_pago_numero ON operaciones.solicitud_pago(numero_solicitud);

-- Crear índices adicionales
CREATE INDEX idx_solicitud_pago_fecha ON operaciones.solicitud_pago(fecha_solicitud);
CREATE INDEX idx_solicitud_pago_estado ON operaciones.solicitud_pago(estado);
```

### **2. Migración V93: Crear tabla solicitud_pago_nota_recepcion**
```sql
CREATE TABLE operaciones.solicitud_pago_nota_recepcion (
    id BIGSERIAL PRIMARY KEY,
    solicitud_pago_id BIGINT NOT NULL,
    nota_recepcion_id BIGINT NOT NULL,
    monto_incluido DECIMAL(15,2) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_solicitud_nota_solicitud FOREIGN KEY (solicitud_pago_id) REFERENCES operaciones.solicitud_pago(id),
    CONSTRAINT fk_solicitud_nota_nota FOREIGN KEY (nota_recepcion_id) REFERENCES operaciones.nota_recepcion(id),
    CONSTRAINT uk_solicitud_nota UNIQUE (solicitud_pago_id, nota_recepcion_id)
);

-- Índices
CREATE INDEX idx_solicitud_nota_solicitud ON operaciones.solicitud_pago_nota_recepcion(solicitud_pago_id);
CREATE INDEX idx_solicitud_nota_nota ON operaciones.solicitud_pago_nota_recepcion(nota_recepcion_id);
```

### **3. Migración V94: Modificar campo pagado en nota_recepcion**
```sql
-- Cambiar valor por defecto de pagado
ALTER TABLE operaciones.nota_recepcion 
ALTER COLUMN pagado SET DEFAULT NULL;

-- Actualizar registros existentes
UPDATE operaciones.nota_recepcion 
SET pagado = NULL 
WHERE pagado = false;
```

### **4. Migración V95: Eliminar tabla obsoleta**
```sql
-- Eliminar tabla que relacionaba con recepciones físicas (incorrecto)
DROP TABLE IF EXISTS operaciones.solicitud_pago_recepcion;
```

---

## 🔧 **BACKEND - IMPLEMENTACIÓN**

### **FASE 1: ENTIDADES Y REPOSITORIOS**

#### **1.1 Modificar SolicitudPago.java**
- [ ] Agregar campos: `numeroSolicitud`, `fechaSolicitud`, `fechaPagoPropuesta`, `observaciones`
- [ ] Agregar relación: `List<SolicitudPagoNotaRecepcion> notasRecepcion`
- [ ] Mantener campos existentes: `proveedor`, `montoTotal`, `moneda`, `formaPago`, `estado`, `pago`, `usuario`

#### **1.2 Crear SolicitudPagoNotaRecepcion.java**
- [ ] Crear entidad con relaciones a `SolicitudPago` y `NotaRecepcion`
- [ ] Campo `montoIncluido` para el monto de cada nota
- [ ] Campo `creadoEn` para auditoría

#### **1.3 Crear Repositorios**
- [ ] `SolicitudPagoRepository.java`
  - `findByPedidoId(Long pedidoId)`
  - `findByEstado(SolicitudPagoEstado estado)`
  - `findByProveedorId(Long proveedorId)`
- [ ] `SolicitudPagoNotaRecepcionRepository.java`
  - `findBySolicitudPagoId(Long solicitudPagoId)`
  - `findByNotaRecepcionId(Long notaRecepcionId)`

### **FASE 2: SERVICIOS**

#### **2.1 SolicitudPagoService.java**
```java
@Service
public class SolicitudPagoService {
    
    // Crear solicitud de pago
    public SolicitudPago crearSolicitudPago(SolicitudPagoInput input) {
        // Validar que las notas estén en estado correcto
        // Calcular monto total
        // Generar número de solicitud único
        // Guardar solicitud y relaciones
    }
    
    // Obtener solicitudes por pedido
    public List<SolicitudPago> getSolicitudesPorPedido(Long pedidoId) {
        // Retornar todas las solicitudes del pedido
    }
    
    // Obtener notas disponibles para pago
    public List<NotaRecepcion> getNotasDisponiblesParaPago(Long pedidoId) {
        // Filtrar notas con estado CONCILIADA o RECEPCION_COMPLETA
        // Excluir notas ya pagadas
    }
    
    // Calcular monto de nota
    public Double calcularMontoNota(NotaRecepcion nota) {
        // Sumar todos los ítems de la nota
        // Considerar bonificaciones
    }
    
    // Actualizar estado
    public SolicitudPago actualizarEstado(Long solicitudId, SolicitudPagoEstado nuevoEstado) {
        // Validar transiciones de estado
        // Actualizar estado
    }
    
    // Eliminar solicitud
    public Boolean eliminarSolicitud(Long solicitudId) {
        // Validar que esté en estado PENDIENTE
        // Eliminar solicitud y relaciones
    }
}
```

#### **2.2 SolicitudPagoNotaRecepcionService.java**
```java
@Service
public class SolicitudPagoNotaRecepcionService {
    
    // Agregar nota a solicitud
    public SolicitudPagoNotaRecepcion agregarNotaASolicitud(Long solicitudId, Long notaId, Double monto) {
        // Validar que la nota no esté ya incluida
        // Crear relación con monto
    }
    
    // Remover nota de solicitud
    public Boolean removerNotaDeSolicitud(Long solicitudId, Long notaId) {
        // Eliminar relación
        // Recalcular monto total de la solicitud
    }
    
    // Obtener notas de una solicitud
    public List<SolicitudPagoNotaRecepcion> getNotasDeSolicitud(Long solicitudId) {
        // Retornar todas las notas de la solicitud
    }
}
```

### **FASE 3: GRAPHQL**

#### **3.1 solicitud-pago.graphqls**
```graphql
type SolicitudPago {
    id: ID!
    proveedor: Proveedor!
    numeroSolicitud: String!
    fechaSolicitud: Date!
    fechaPagoPropuesta: Date
    montoTotal: Float!
    moneda: Moneda!
    formaPago: FormaPago!
    estado: SolicitudPagoEstado!
    observaciones: String
    creadoEn: Date
    usuario: Usuario
    pago: Pago
    notasRecepcion: [SolicitudPagoNotaRecepcion]
}

type SolicitudPagoNotaRecepcion {
    id: ID!
    solicitudPago: SolicitudPago!
    notaRecepcion: NotaRecepcion!
    montoIncluido: Float!
    creadoEn: Date
}

input SolicitudPagoInput {
    id: ID
    proveedorId: Int!
    numeroSolicitud: String
    fechaSolicitud: String
    fechaPagoPropuesta: String
    montoTotal: Float!
    monedaId: Int!
    formaPagoId: Int!
    estado: SolicitudPagoEstado!
    observaciones: String
    notaRecepcionIds: [ID!]!
}

extend type Query {
    solicitudPago(id: ID!): SolicitudPago
    solicitudesPagoPorPedido(pedidoId: ID!): [SolicitudPago]
    notasDisponiblesParaPago(pedidoId: ID!): [NotaRecepcion]
}

extend type Mutation {
    saveSolicitudPago(entity: SolicitudPagoInput!): SolicitudPago!
    deleteSolicitudPago(id: ID!): Boolean!
    actualizarEstadoSolicitudPago(id: ID!, estado: SolicitudPagoEstado!): SolicitudPago!
}

enum SolicitudPagoEstado {
    PENDIENTE
    APROBADA
    PAGADA
    CANCELADA
}
```

#### **3.2 SolicitudPagoGraphQL.java**
```java
@Component
public class SolicitudPagoGraphQL {
    
    @Autowired
    private SolicitudPagoService solicitudPagoService;
    
    @Autowired
    private SolicitudPagoNotaRecepcionService solicitudPagoNotaRecepcionService;
    
    // Queries
    public SolicitudPago solicitudPago(Long id) {
        return solicitudPagoService.findById(id);
    }
    
    public List<SolicitudPago> solicitudesPagoPorPedido(Long pedidoId) {
        return solicitudPagoService.getSolicitudesPorPedido(pedidoId);
    }
    
    public List<NotaRecepcion> notasDisponiblesParaPago(Long pedidoId) {
        return solicitudPagoService.getNotasDisponiblesParaPago(pedidoId);
    }
    
    // Mutations
    public SolicitudPago saveSolicitudPago(SolicitudPagoInput input) {
        return solicitudPagoService.crearSolicitudPago(input);
    }
    
    public Boolean deleteSolicitudPago(Long id) {
        return solicitudPagoService.eliminarSolicitud(id);
    }
    
    public SolicitudPago actualizarEstadoSolicitudPago(Long id, SolicitudPagoEstado estado) {
        return solicitudPagoService.actualizarEstado(id, estado);
    }
}
```

---

## 🎨 **FRONTEND - IMPLEMENTACIÓN**

### **FASE 1: MODELOS**

#### **1.1 solicitud-pago.model.ts**
```typescript
export interface SolicitudPago {
    id?: number;
    proveedor: Proveedor;
    numeroSolicitud: string;
    fechaSolicitud: Date;
    fechaPagoPropuesta?: Date;
    montoTotal: number;
    moneda: Moneda;
    formaPago: FormaPago;
    estado: SolicitudPagoEstado;
    observaciones?: string;
    creadoEn: Date;
    usuario?: Usuario;
    pago?: Pago;
    
    // Relaciones
    notasRecepcion?: SolicitudPagoNotaRecepcion[];
    
    // Propiedades computadas
    estadoDisplayNameComputed?: string;
    estadoChipColorComputed?: string;
    fechaSolicitudFormattedComputed?: string;
    fechaPagoPropuestaFormattedComputed?: string;
    montoTotalFormattedComputed?: string;
}

export interface SolicitudPagoNotaRecepcion {
    id?: number;
    solicitudPago: SolicitudPago;
    notaRecepcion: NotaRecepcion;
    montoIncluido: number;
    creadoEn: Date;
}

export interface SolicitudPagoInput {
    id?: number;
    proveedorId: number;
    numeroSolicitud?: string;
    fechaSolicitud?: string;
    fechaPagoPropuesta?: string;
    montoTotal: number;
    monedaId: number;
    formaPagoId: number;
    estado: SolicitudPagoEstado;
    observaciones?: string;
    notaRecepcionIds: number[];
}

export enum SolicitudPagoEstado {
    PENDIENTE = 'PENDIENTE',
    APROBADA = 'APROBADA',
    PAGADA = 'PAGADA',
    CANCELADA = 'CANCELADA'
}
```

### **FASE 2: GRAPHQL QUERIES**

#### **2.1 solicitud-pago-graphql-query.ts**
```typescript
import { gql } from 'apollo-angular';

export const GET_SOLICITUDES_POR_PEDIDO = gql`
  query GetSolicitudesPorPedido($pedidoId: ID!) {
    solicitudesPagoPorPedido(pedidoId: $pedidoId) {
      id
      numeroSolicitud
      fechaSolicitud
      fechaPagoPropuesta
      montoTotal
      estado
      observaciones
      creadoEn
      proveedor {
        id
        nombre
      }
      moneda {
        id
        nombre
      }
      formaPago {
        id
        nombre
      }
      usuario {
        id
        persona {
          nombre
        }
      }
      notasRecepcion {
        id
        montoIncluido
        notaRecepcion {
          id
          numero
          fecha
          estado
        }
      }
    }
  }
`;

export const GET_NOTAS_DISPONIBLES_PARA_PAGO = gql`
  query GetNotasDisponiblesParaPago($pedidoId: ID!) {
    notasDisponiblesParaPago(pedidoId: $pedidoId) {
      id
      numero
      fecha
      estado
      montoTotal
      moneda {
        id
        nombre
      }
      items {
        id
        producto {
          id
          nombre
        }
        cantidadEnNota
        precioUnitarioEnNota
        subtotal
      }
    }
  }
`;

export const SAVE_SOLICITUD_PAGO = gql`
  mutation SaveSolicitudPago($entity: SolicitudPagoInput!) {
    saveSolicitudPago(entity: $entity) {
      id
      numeroSolicitud
      montoTotal
      estado
    }
  }
`;

export const DELETE_SOLICITUD_PAGO = gql`
  mutation DeleteSolicitudPago($id: ID!) {
    deleteSolicitudPago(id: $id)
  }
`;

export const ACTUALIZAR_ESTADO_SOLICITUD_PAGO = gql`
  mutation ActualizarEstadoSolicitudPago($id: ID!, $estado: SolicitudPagoEstado!) {
    actualizarEstadoSolicitudPago(id: $id, estado: $estado) {
      id
      estado
    }
  }
`;
```

### **FASE 3: SERVICIOS APOLLO**

#### **3.1 GetSolicitudesPorPedidoGQL.ts**
```typescript
import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GET_SOLICITUDES_POR_PEDIDO, SolicitudPago } from './solicitud-pago-graphql-query';

@Injectable({
  providedIn: 'root'
})
export class GetSolicitudesPorPedidoGQL {
  constructor(private apollo: Apollo) {}

  fetch(pedidoId: number): Observable<SolicitudPago[]> {
    return this.apollo.watchQuery<{ solicitudesPagoPorPedido: SolicitudPago[] }>({
      query: GET_SOLICITUDES_POR_PEDIDO,
      variables: { pedidoId }
    }).valueChanges.pipe(
      map(result => result.data.solicitudesPagoPorPedido)
    );
  }
}
```

#### **3.2 GetNotasDisponiblesParaPagoGQL.ts**
```typescript
import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GET_NOTAS_DISPONIBLES_PARA_PAGO, NotaRecepcion } from './solicitud-pago-graphql-query';

@Injectable({
  providedIn: 'root'
})
export class GetNotasDisponiblesParaPagoGQL {
  constructor(private apollo: Apollo) {}

  fetch(pedidoId: number): Observable<NotaRecepcion[]> {
    return this.apollo.watchQuery<{ notasDisponiblesParaPago: NotaRecepcion[] }>({
      query: GET_NOTAS_DISPONIBLES_PARA_PAGO,
      variables: { pedidoId }
    }).valueChanges.pipe(
      map(result => result.data.notasDisponiblesParaPago)
    );
  }
}
```

#### **3.3 SaveSolicitudPagoGQL.ts**
```typescript
import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SAVE_SOLICITUD_PAGO, SolicitudPagoInput, SolicitudPago } from './solicitud-pago-graphql-query';

@Injectable({
  providedIn: 'root'
})
export class SaveSolicitudPagoGQL {
  constructor(private apollo: Apollo) {}

  mutate(input: SolicitudPagoInput): Observable<SolicitudPago> {
    return this.apollo.mutate<{ saveSolicitudPago: SolicitudPago }>({
      mutation: SAVE_SOLICITUD_PAGO,
      variables: { entity: input }
    }).pipe(
      map(result => result.data!.saveSolicitudPago)
    );
  }
}
```

### **FASE 4: COMPONENTE PRINCIPAL**

#### **4.1 solicitud-pago.component.ts**
```typescript
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { SolicitudPago, SolicitudPagoEstado, NotaRecepcion } from './solicitud-pago.model';
import { GetSolicitudesPorPedidoGQL } from './graphql/GetSolicitudesPorPedidoGQL';
import { GetNotasDisponiblesParaPagoGQL } from './graphql/GetNotasDisponiblesParaPagoGQL';
import { SaveSolicitudPagoGQL } from './graphql/SaveSolicitudPagoGQL';
import { DeleteSolicitudPagoGQL } from './graphql/DeleteSolicitudPagoGQL';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { DialogosService } from '../../../shared/components/dialogos/dialogos.service';

@UntilDestroy()
@Component({
  selector: 'app-solicitud-pago',
  templateUrl: './solicitud-pago.component.html',
  styleUrls: ['./solicitud-pago.component.scss']
})
export class SolicitudPagoComponent implements OnInit, OnDestroy {
  @Input() pedidoId!: number;
  
  // Data
  solicitudesPago: SolicitudPago[] = [];
  notasDisponibles: NotaRecepcion[] = [];
  
  // Forms
  solicitudForm!: FormGroup;
  
  // UI State
  loading = false;
  showForm = false;
  
  // Computed properties
  solicitudesPagoComputed: SolicitudPago[] = [];
  notasDisponiblesComputed: NotaRecepcion[] = [];
  totalSolicitudesComputed = 0;
  totalMontoComputed = 0;
  
  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private getSolicitudesPorPedidoGQL: GetSolicitudesPorPedidoGQL,
    private getNotasDisponiblesParaPagoGQL: GetNotasDisponiblesParaPagoGQL,
    private saveSolicitudPagoGQL: SaveSolicitudPagoGQL,
    private deleteSolicitudPagoGQL: DeleteSolicitudPagoGQL,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService
  ) {}
  
  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }
  
  private initForm(): void {
    this.solicitudForm = this.fb.group({
      proveedorId: ['', Validators.required],
      monedaId: ['', Validators.required],
      formaPagoId: ['', Validators.required],
      fechaPagoPropuesta: [''],
      observaciones: [''],
      notaRecepcionIds: [[], Validators.required]
    });
  }
  
  private loadData(): void {
    this.loading = true;
    
    // Cargar solicitudes existentes
    this.getSolicitudesPorPedidoGQL.fetch(this.pedidoId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (solicitudes) => {
          this.solicitudesPago = solicitudes;
          this.updateComputedProperties();
        },
        error: (error) => {
          this.notificacionService.mostrarError('Error al cargar solicitudes de pago');
        }
      });
    
    // Cargar notas disponibles
    this.getNotasDisponiblesParaPagoGQL.fetch(this.pedidoId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (notas) => {
          this.notasDisponibles = notas;
          this.updateComputedProperties();
        },
        error: (error) => {
          this.notificacionService.mostrarError('Error al cargar notas disponibles');
        },
        complete: () => {
          this.loading = false;
        }
      });
  }
  
  private updateComputedProperties(): void {
    this.solicitudesPagoComputed = this.solicitudesPago;
    this.notasDisponiblesComputed = this.notasDisponibles;
    this.totalSolicitudesComputed = this.solicitudesPago.length;
    this.totalMontoComputed = this.solicitudesPago.reduce((total, solicitud) => total + solicitud.montoTotal, 0);
  }
  
  onCreateSolicitud(): void {
    this.showForm = true;
  }
  
  onSaveSolicitud(): void {
    if (this.solicitudForm.valid) {
      this.loading = true;
      
      const input = this.solicitudForm.value;
      input.pedidoId = this.pedidoId;
      input.estado = SolicitudPagoEstado.PENDIENTE;
      
      this.saveSolicitudPagoGQL.mutate(input)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (solicitud) => {
            this.notificacionService.mostrarExito('Solicitud de pago creada exitosamente');
            this.showForm = false;
            this.solicitudForm.reset();
            this.loadData();
          },
          error: (error) => {
            this.notificacionService.mostrarError('Error al crear solicitud de pago');
            this.loading = false;
          }
        });
    }
  }
  
  onDeleteSolicitud(solicitud: SolicitudPago): void {
    this.dialogosService.confirm(
      'Eliminar Solicitud',
      `¿Está seguro que desea eliminar la solicitud ${solicitud.numeroSolicitud}?`
    ).subscribe(confirm => {
      if (confirm) {
        this.loading = true;
        
        this.deleteSolicitudPagoGQL.mutate(solicitud.id!)
          .pipe(untilDestroyed(this))
          .subscribe({
            next: () => {
              this.notificacionService.mostrarExito('Solicitud eliminada exitosamente');
              this.loadData();
            },
            error: (error) => {
              this.notificacionService.mostrarError('Error al eliminar solicitud');
              this.loading = false;
            }
          });
      }
    });
  }
  
  onPrintSolicitud(solicitud: SolicitudPago): void {
    // Implementar impresión usando solicitud-pago.jrxml
    console.log('Imprimir solicitud:', solicitud);
  }
}
```

#### **4.2 solicitud-pago.component.html**
```html
<div class="solicitud-pago-container">
  <!-- Header -->
  <div class="header">
    <h2 class="titulo-center">Solicitud de Pago</h2>
    <button 
      mat-raised-button 
      color="primary" 
      (click)="onCreateSolicitud()"
      [disabled]="loading">
      <mat-icon>add</mat-icon>
      Nueva Solicitud
    </button>
  </div>
  
  <!-- Summary Cards -->
  <div class="summary-cards" *ngIf="!showForm">
    <mat-card class="summary-card">
      <mat-card-content>
        <div class="card-value">{{ totalSolicitudesComputed }}</div>
        <div class="card-label">Solicitudes</div>
      </mat-card-content>
    </mat-card>
    
    <mat-card class="summary-card">
      <mat-card-content>
        <div class="card-value">{{ totalMontoComputed | currency:'':'':'1.0-0' }}</div>
        <div class="card-label">Total a Pagar</div>
      </mat-card-content>
    </mat-card>
  </div>
  
  <!-- Form -->
  <div class="form-container" *ngIf="showForm">
    <mat-card>
      <mat-card-header>
        <mat-card-title>Nueva Solicitud de Pago</mat-card-title>
      </mat-card-header>
      
      <mat-card-content>
        <form [formGroup]="solicitudForm" (ngSubmit)="onSaveSolicitud()">
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Proveedor</mat-label>
              <mat-select formControlName="proveedorId">
                <mat-option *ngFor="let nota of notasDisponiblesComputed" [value]="nota.proveedor?.id">
                  {{ nota.proveedor?.nombre }}
                </mat-option>
              </mat-select>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Moneda</mat-label>
              <mat-select formControlName="monedaId">
                <mat-option *ngFor="let nota of notasDisponiblesComputed" [value]="nota.moneda?.id">
                  {{ nota.moneda?.nombre }}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Forma de Pago</mat-label>
              <mat-select formControlName="formaPagoId">
                <mat-option value="1">Efectivo</mat-option>
                <mat-option value="2">Transferencia</mat-option>
                <mat-option value="3">Cheque</mat-option>
              </mat-select>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Fecha de Pago Propuesta</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="fechaPagoPropuesta">
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>
          </div>
          
          <div class="form-row">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Observaciones</mat-label>
              <textarea matInput formControlName="observaciones" rows="3"></textarea>
            </mat-form-field>
          </div>
          
          <div class="notas-selection">
            <h3>Notas de Recepción Disponibles</h3>
            <mat-selection-list formControlName="notaRecepcionIds">
              <mat-list-option 
                *ngFor="let nota of notasDisponiblesComputed" 
                [value]="nota.id">
                <div class="nota-option">
                  <div class="nota-info">
                    <strong>Nota {{ nota.numero }}</strong>
                    <span>{{ nota.fecha | date:'dd/MM/yyyy' }}</span>
                    <span>{{ nota.montoTotal | currency:'':'':'1.0-0' }}</span>
                  </div>
                  <div class="nota-status">
                    <mat-chip [color]="nota.estado === 'CONCILIADA' ? 'primary' : 'accent'">
                      {{ nota.estado }}
                    </mat-chip>
                  </div>
                </div>
              </mat-list-option>
            </mat-selection-list>
          </div>
          
          <div class="form-actions">
            <button 
              mat-button 
              type="button" 
              (click)="showForm = false">
              Cancelar
            </button>
            <button 
              mat-raised-button 
              color="primary" 
              type="submit"
              [disabled]="solicitudForm.invalid || loading">
              <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
              Crear Solicitud
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  </div>
  
  <!-- Table -->
  <div class="table-container" *ngIf="!showForm">
    <mat-card>
      <mat-card-content>
        <table mat-table [dataSource]="solicitudesPagoComputed" class="full-width">
          <!-- Número -->
          <ng-container matColumnDef="numero">
            <th mat-header-cell *matHeaderCellDef>Número</th>
            <td mat-cell *matCellDef="let solicitud">{{ solicitud.numeroSolicitud }}</td>
          </ng-container>
          
          <!-- Fecha -->
          <ng-container matColumnDef="fecha">
            <th mat-header-cell *matHeaderCellDef>Fecha</th>
            <td mat-cell *matCellDef="let solicitud">{{ solicitud.fechaSolicitud | date:'dd/MM/yyyy' }}</td>
          </ng-container>
          
          <!-- Monto -->
          <ng-container matColumnDef="monto">
            <th mat-header-cell *matHeaderCellDef>Monto</th>
            <td mat-cell *matCellDef="let solicitud">{{ solicitud.montoTotal | currency:'':'':'1.0-0' }}</td>
          </ng-container>
          
          <!-- Estado -->
          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let solicitud">
              <mat-chip [color]="solicitud.estado === 'PENDIENTE' ? 'warn' : 'primary'">
                {{ solicitud.estado }}
              </mat-chip>
            </td>
          </ng-container>
          
          <!-- Notas -->
          <ng-container matColumnDef="notas">
            <th mat-header-cell *matHeaderCellDef>Notas</th>
            <td mat-cell *matCellDef="let solicitud">
              {{ solicitud.notasRecepcion?.length || 0 }} notas
            </td>
          </ng-container>
          
          <!-- Acciones -->
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let solicitud">
              <button 
                mat-icon-button 
                color="primary"
                (click)="onPrintSolicitud(solicitud)"
                matTooltip="Imprimir">
                <mat-icon>print</mat-icon>
              </button>
              
              <button 
                mat-icon-button 
                color="warn"
                (click)="onDeleteSolicitud(solicitud)"
                matTooltip="Eliminar"
                *ngIf="solicitud.estado === 'PENDIENTE'">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>
          
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        
        <mat-paginator [pageSizeOptions]="[5, 10, 25]" showFirstLastButtons></mat-paginator>
      </mat-card-content>
    </mat-card>
  </div>
</div>
```

#### **4.3 solicitud-pago.component.scss**
```scss
.solicitud-pago-container {
  padding: 20px;
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      color: #fff;
    }
  }
  
  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
    
    .summary-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      
      .card-value {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .card-label {
        font-size: 0.9rem;
        opacity: 0.9;
      }
    }
  }
  
  .form-container {
    margin-bottom: 30px;
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
      
      .full-width {
        grid-column: 1 / -1;
      }
    }
    
    .notas-selection {
      margin: 20px 0;
      
      h3 {
        margin-bottom: 15px;
        color: #fff;
      }
      
      .nota-option {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        
        .nota-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
          
          span {
            font-size: 0.9rem;
            opacity: 0.8;
          }
        }
      }
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
  }
  
  .table-container {
    .full-width {
      width: 100%;
    }
    
    table {
      background: transparent;
      
      th {
        color: #fff;
        font-weight: 500;
        text-align: center;
      }
      
      td {
        text-align: center;
        color: #fff;
      }
    }
  }
}

// Dark theme adjustments
::ng-deep {
  .mat-card {
    background: #2a2a2a;
    color: #fff;
  }
  
  .mat-form-field {
    .mat-form-field-label {
      color: #fff;
    }
    
    .mat-form-field-outline {
      color: #666;
    }
  }
  
  .mat-select-panel {
    background: #2a2a2a;
    color: #fff;
  }
  
  .mat-option {
    color: #fff;
    
    &:hover {
      background: #444;
    }
  }
}
```

---

## 🎯 **TODO DE IMPLEMENTACIÓN**

### **FASE 1: BACKEND - MIGRACIONES** 🔥 **ALTA PRIORIDAD**
- [ ] **V92:** Modificar tabla `solicitud_pago` existente
- [ ] **V93:** Crear tabla `solicitud_pago_nota_recepcion`
- [ ] **V94:** Modificar campo `pagado` en `nota_recepcion`
- [ ] **V95:** Eliminar tabla `solicitud_pago_recepcion` obsoleta

### **FASE 2: BACKEND - ENTIDADES** 🔥 **ALTA PRIORIDAD**
- [ ] Modificar `SolicitudPago.java` (agregar campos faltantes)
- [ ] Crear `SolicitudPagoNotaRecepcion.java`
- [ ] Crear `SolicitudPagoRepository.java`
- [ ] Crear `SolicitudPagoNotaRecepcionRepository.java`

### **FASE 3: BACKEND - SERVICIOS** 🔥 **MEDIA PRIORIDAD**
- [ ] Crear `SolicitudPagoService.java`
- [ ] Crear `SolicitudPagoNotaRecepcionService.java`
- [ ] Implementar lógica de negocio

### **FASE 4: BACKEND - GRAPHQL** 🔥 **MEDIA PRIORIDAD**
- [ ] Crear `solicitud-pago.graphqls`
- [ ] Crear `SolicitudPagoGraphQL.java`
- [ ] Implementar queries y mutations

### **FASE 5: FRONTEND - MODELOS** 🔥 **MEDIA PRIORIDAD**
- [ ] Crear `solicitud-pago.model.ts`
- [ ] Crear `solicitud-pago-graphql-query.ts`
- [ ] Crear servicios Apollo

### **FASE 6: FRONTEND - COMPONENTE** 🔥 **BAJA PRIORIDAD**
- [ ] Crear `solicitud-pago.component.ts`
- [ ] Crear `solicitud-pago.component.html`
- [ ] Crear `solicitud-pago.component.scss`
- [ ] Integrar con `gestion-compras.component.ts`

### **FASE 7: INTEGRACIÓN** 🔥 **BAJA PRIORIDAD**
- [ ] Integrar tab en `gestion-compras.component.html`
- [ ] Implementar impresión con `solicitud-pago.jrxml`
- [ ] Testing y optimización

---

## ✅ **RESUMEN DE CAMBIOS**

### **✅ ENTIDADES QUE NO CAMBIAN:**
- `NotaRecepcion.java` - Solo cambio menor en campo `pagado`
- `NotaRecepcionItem.java` - Sin cambios
- `Pedido.java` - Sin cambios
- `ProcesoEtapa.java` - Sin cambios

### **🔄 ENTIDADES A MODIFICAR:**
- `SolicitudPago.java` - Agregar campos faltantes

### **🆕 NUEVAS ENTIDADES:**
- `SolicitudPagoNotaRecepcion.java` - Relación N-N con notas
- `SolicitudPagoEstado.java` - Enum de estados (ya existe)

### **🗑️ ENTIDADES A ELIMINAR:**
- Tabla `solicitud_pago_recepcion` (V73)

### **❌ NO SE NECESITA:**
- `SolicitudPagoItem.java` - Simplificación de arquitectura

**¿Procedemos con la implementación siguiendo esta estructura simplificada?** 