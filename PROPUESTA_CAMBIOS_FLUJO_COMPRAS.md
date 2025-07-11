# Propuesta de Cambios en Backend para Soportar Lógica de Compras Avanzada

## 1. Resumen

Tras un análisis detallado de los nuevos requerimientos del flujo de compras, se han identificado las siguientes modificaciones necesarias en el backend para darles soporte. Estos cambios se centran en añadir campos para manejar estados más granulares y nuevos conceptos como "bonificación planificada" e "sucursales de influencia".

---

## 2. Cambios en Entidades y Tablas

### 2.1. `PedidoItem`

-   **Requerimiento:** Poder especificar que un ítem se solicita como bonificación desde el inicio del pedido.
-   **Cambio Propuesto:** Añadir un campo para marcar la bonificación.

#### **Entidad: `PedidoItem.java`**
```java
// ... otros campos
@Column(name = "es_bonificacion")
private Boolean esBonificacion = false;
```

#### **Tabla: `operaciones.pedido_item` (para un futuro script de migración)**
```sql
ALTER TABLE operaciones.pedido_item
ADD COLUMN es_bonificacion BOOLEAN DEFAULT FALSE;
```

---

### 2.2. `NotaRecepcionItem`

-   **Requerimiento:** Poder "rechazar" un ítem a nivel documental (en la nota) y registrar el motivo, antes de la recepción física.
-   **Cambio Propuesto:** Añadir un campo de estado y un campo de motivo a la entidad.

#### **Entidad: `NotaRecepcionItem.java`**
```java
// ... otros campos

// Nuevo Enum a crear: NotaRecepcionItemEstado
public enum NotaRecepcionItemEstado {
    PENDIENTE_CONCILIACION,
    CONCILIADO,
    RECHAZADO,
    DISCREPANCIA
}

// ... en la entidad

@Enumerated(EnumType.STRING)
@Column(name = "estado")
@Type(type = "nota_recepcion_item_estado") // Se necesita un nuevo TypeDef
private NotaRecepcionItemEstado estado;

@Column(name = "motivo_rechazo")
private String motivoRechazo;
```

#### **Tabla: `operaciones.nota_recepcion_item` (para un futuro script de migración)**
```sql
CREATE TYPE operaciones.nota_recepcion_item_estado AS ENUM (
    'PENDIENTE_CONCILIACION',
    'CONCILIADO',
    'RECHAZADO',
    'DISCREPANCIA'
);

ALTER TABLE operaciones.nota_recepcion_item
ADD COLUMN estado operaciones.nota_recepcion_item_estado DEFAULT 'PENDIENTE_CONCILIACION',
ADD COLUMN motivo_rechazo TEXT;
```

---

### 2.3. `PedidoSucursalInfluencia` (Nueva Entidad)

-   **Requerimiento:** Registrar las "sucursales de influencia" en la creación del pedido, además de las de entrega.
-   **Cambio Propuesto:** Crear una nueva entidad y tabla para modelar esta relación.

#### **Entidad: `PedidoSucursalInfluencia.java`**
```java
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "pedido_sucursal_influencia", schema = "operaciones")
public class PedidoSucursalInfluencia implements Identifiable<Long> {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sucursal_id", nullable = false)
    private Sucursal sucursal;

    @Column(name = "creado_en")
    private LocalDateTime creadoEn;
}
```

#### **Tabla: `operaciones.pedido_sucursal_influencia` (para un futuro script de migración)**
```sql
CREATE TABLE operaciones.pedido_sucursal_influencia (
    id BIGSERIAL PRIMARY KEY,
    pedido_id BIGINT NOT NULL,
    sucursal_id BIGINT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_psi_pedido FOREIGN KEY (pedido_id) REFERENCES operaciones.pedido(id),
    CONSTRAINT fk_psi_sucursal FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id),
    CONSTRAINT uk_psi_pedido_sucursal UNIQUE (pedido_id, sucursal_id)
);
```

---
## 3. Conclusión

Estos cambios permitirán implementar la lógica de negocio completa y granular solicitada para el flujo de compras, proveyendo la flexibilidad necesaria para los casos de uso del mundo real. 