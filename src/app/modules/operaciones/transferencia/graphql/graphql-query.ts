import gql from "graphql-tag";

export const transferenciasQuery = gql`
  {
    data: transferencias {
      id
      sucursalOrigen {
        id
        nombre
      }
      sucursalDestino {
        id
        nombre
      }
      isOrigen
      isDestino
      tipo
      estado
      etapa
      observacion
      creadoEn
      usuarioPreTransferencia {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const transferenciaQuery = gql`
  query ($id: ID!) {
    data: transferencia(id: $id) {
      id
      sucursalOrigen {
        id
        nombre
      }
      sucursalDestino {
        id
        nombre
      }
      isOrigen
      isDestino
      tipo
      estado
      etapa
      observacion
      creadoEn
      usuarioPreTransferencia {
        id
        persona {
          nombre
        }
      }
      usuarioPreparacion {
        id
        persona {
          nombre
        }
      }
      usuarioTransporte {
        id
        persona {
          nombre
        }
      }
      usuarioRecepcion {
        id
        persona {
          nombre
        }
      }
      transferenciaItemList {
        id
        transferencia {
          id
        }
        presentacionPreTransferencia {
          id
          producto {
            id
            descripcion
            codigoPrincipal
            costo {
              costoMedio
              ultimoPrecioCompra
            }
          }
          cantidad
          imagenPrincipal
          precioPrincipal {
            precio
          }
        }
        presentacionPreparacion {
          id
          producto {
            id
            descripcion
            codigoPrincipal
            costo {
              costoMedio
              ultimoPrecioCompra
            }
          }
          cantidad
          imagenPrincipal
          precioPrincipal {
            precio
          }
        }
        presentacionTransporte {
          id
          producto {
            id
            descripcion
            codigoPrincipal
            costo {
              costoMedio
              ultimoPrecioCompra
            }
          }
          cantidad
          imagenPrincipal
          precioPrincipal {
            precio
          }
        }
        presentacionRecepcion {
          id
          producto {
            id
            descripcion
            codigoPrincipal
            costo {
              costoMedio
              ultimoPrecioCompra
            }
          }
          cantidad
          imagenPrincipal
          precioPrincipal {
            precio
          }
        }
        cantidadPreTransferencia
        cantidadPreparacion
        cantidadTransporte
        cantidadRecepcion
        observacionPreTransferencia
        observacionPreparacion
        observacionTransporte
        observacionRecepcion
        vencimientoPreTransferencia
        vencimientoPreparacion
        vencimientoTransporte
        vencimientoRecepcion
        motivoModificacionPreTransferencia
        motivoModificacionPreparacion
        motivoModificacionTransporte
        motivoModificacionRecepcion
        motivoRechazoPreTransferencia
        motivoRechazoPreparacion
        motivoRechazoTransporte
        motivoRechazoRecepcion
        activo
        poseeVencimiento
        creadoEn
      }
    }
  }
`;

export const transferenciasPorUsuarioQuery = gql`
  query ($id: ID!) {
    data: transferenciasPorUsuario(id: $id) {
      id
      sucursalOrigen {
        id
        nombre
      }
      sucursalDestino {
        id
        nombre
      }
      isOrigen
      isDestino
      tipo
      estado
      etapa
      observacion
      creadoEn
      usuarioPreTransferencia {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const saveTransferencia = gql`
  mutation saveTransferencia($entity: TransferenciaInput!) {
    data: saveTransferencia(transferencia: $entity) {
      id
      sucursalOrigen {
        id
        nombre
      }
      sucursalDestino {
        id
        nombre
      }
      isOrigen
      isDestino
      tipo
      estado
      etapa
      observacion
      creadoEn
      usuarioPreTransferencia {
        id
        persona {
          nombre
        }
      }
      usuarioPreparacion {
        id
        persona {
          nombre
        }
      }
      usuarioTransporte {
        id
        persona {
          nombre
        }
      }
      usuarioRecepcion {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const deleteTransferenciaQuery = gql`
  mutation deleteTransferencia($id: ID!) {
    deleteTransferencia(id: $id)
  }
`;

export const transferenciaPorFechaQuery = gql`
  query ($inicio: String, $fin: String) {
    data: transferenciaPorFecha(inicio: $inicio, fin: $fin) {
      id
      sucursalOrigen {
        id
        nombre
      }
      sucursalDestino {
        id
        nombre
      }
      isOrigen
      isDestino
      tipo
      estado
      etapa
      observacion
      creadoEn
      usuarioPreTransferencia {
        id
        persona {
          nombre
        }
      }
      usuarioPreparacion {
        id
        persona {
          nombre
        }
      }
      usuarioTransporte {
        id
        persona {
          nombre
        }
      }
      usuarioRecepcion {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const imprimirTransferenciaQuery = gql`
  query ($id: ID!, $printerName: String!, $ticket: Boolean) {
    data: imprimirTransferencia(
      id: $id
      ticket: $ticket
      printerName: $printerName
    )
  }
`;

export const transferenciaWithFiltersQuery = gql`
  query (
    $sucursalOrigenId: Int
    $sucursalDestinoId: Int
    $estado: TransferenciaEstado
    $tipo: TipoTransferencia
    $etapa: EtapaTransferencia
    $isOrigen: Boolean
    $isDestino: Boolean
    $creadoDesde: String
    $creadoHasta: String
    $page: Int
    $size: Int
  ) {
    data: transferenciasWithFilters(
      sucursalOrigenId: $sucursalOrigenId
      sucursalDestinoId: $sucursalDestinoId
      estado: $estado
      tipo: $tipo
      etapa: $etapa
      isOrigen: $isOrigen
      isDestino: $isDestino
      creadoDesde: $creadoDesde
      creadoHasta: $creadoHasta
      page: $page
      size: $size
    ) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getPageable {
        getPageNumber
        getPageSize
      }
      getContent {
        id
        sucursalOrigen {
          id
          nombre
        }
        sucursalDestino {
          id
          nombre
        }
        isOrigen
        isDestino
        tipo
        estado
        etapa
        observacion
        creadoEn
        usuarioPreTransferencia {
          id
          persona {
            nombre
          }
        }
        usuarioPreparacion {
          id
          persona {
            nombre
          }
        }
        usuarioTransporte {
          id
          persona {
            nombre
          }
        }
        usuarioRecepcion {
          id
          persona {
            nombre
          }
        }
      }
    }
  }
`;

export const finalizarTransferencia = gql`
  mutation finalizarTransferencia($id: ID!, $usuarioId: ID!) {
    finalizarTransferencia(id: $id, usuarioId: $usuarioId)
  }
`;

export const prepararTransferencia = gql`
  mutation avanzarEtapaTransferencia(
    $id: ID!
    $etapa: EtapaTransferencia!
    $usuarioId: ID!
  ) {
    avanzarEtapaTransferencia(id: $id, etapa: $etapa, usuarioId: $usuarioId)
  }
`;

export const imprimirTransferencia = gql`
  query imprimirTransferencia($id: ID!) {
    imprimirTransferencia(id: $id)
  }
`;

export const saveTransferenciaItem = gql`
  mutation saveTransferenciaItem(
    $entity: TransferenciaItemInput!
    $precioCosto: Float
  ) {
    data: saveTransferenciaItem(
      transferenciaItem: $entity
      precioCosto: $precioCosto
    ) {
      id
      transferencia {
        id
      }
      presentacionPreTransferencia {
        id
        producto {
          id
          descripcion
          codigoPrincipal
          costo {
            costoMedio
            ultimoPrecioCompra
          }
        }
        cantidad
        imagenPrincipal
        precioPrincipal {
          precio
        }
      }
      presentacionPreparacion {
        id
        producto {
          id
          descripcion
          codigoPrincipal
          costo {
            costoMedio
            ultimoPrecioCompra
          }
        }
        cantidad
        imagenPrincipal
        precioPrincipal {
          precio
        }
      }
      presentacionTransporte {
        id
        producto {
          id
          descripcion
          codigoPrincipal
          costo {
            costoMedio
            ultimoPrecioCompra
          }
        }
        cantidad
        imagenPrincipal
        precioPrincipal {
          precio
        }
      }
      presentacionRecepcion {
        id
        producto {
          id
          descripcion
          codigoPrincipal
          costo {
            costoMedio
            ultimoPrecioCompra
          }
        }
        cantidad
        imagenPrincipal
        precioPrincipal {
          precio
        }
      }
      cantidadPreTransferencia
      cantidadPreparacion
      cantidadTransporte
      cantidadRecepcion
      observacionPreTransferencia
      observacionPreparacion
      observacionTransporte
      observacionRecepcion
      vencimientoPreTransferencia
      vencimientoPreparacion
      vencimientoTransporte
      vencimientoRecepcion
      motivoModificacionPreTransferencia
      motivoModificacionPreparacion
      motivoModificacionTransporte
      motivoModificacionRecepcion
      motivoRechazoPreTransferencia
      motivoRechazoPreparacion
      motivoRechazoTransporte
      motivoRechazoRecepcion
      activo
      poseeVencimiento
      usuario {
        id
        persona {
          nombre
        }
      }
      creadoEn
    }
  }
`;

export const deleteTransferenciaItemQuery = gql`
  mutation deleteTransferenciaItem($id: ID!) {
    deleteTransferenciaItem(id: $id)
  }
`;

export const saveTransferenciaItemDetalle = gql`
  mutation saveTransferenciaItemDetalle(
    $entity: TransferenciaItemDetalleInput!
  ) {
    data: saveTransferenciaItemDetalle(transferenciaItemDetalle: $entity) {
      id
      transferencia {
        id
      }
      presentacionPreTransferencia {
        id
        producto {
          id
          descripcion
          codigoPrincipal
          costo {
            costoMedio
            ultimoPrecioCompra
          }
        }
        cantidad
        imagenPrincipal
        precioPrincipal {
          precio
        }
      }
      presentacionPreparacion {
        id
        producto {
          id
          descripcion
          codigoPrincipal
          costo {
            costoMedio
            ultimoPrecioCompra
          }
        }
        cantidad
        imagenPrincipal
        precioPrincipal {
          precio
        }
      }
      presentacionTransporte {
        id
        producto {
          id
          descripcion
          codigoPrincipal
          costo {
            costoMedio
            ultimoPrecioCompra
          }
        }
        cantidad
        imagenPrincipal
        precioPrincipal {
          precio
        }
      }
      presentacionRecepcion {
        id
        producto {
          id
          descripcion
          codigoPrincipal
          costo {
            costoMedio
            ultimoPrecioCompra
          }
        }
        cantidad
        imagenPrincipal
        precioPrincipal {
          precio
        }
      }
      cantidadPreTransferencia
      cantidadPreparacion
      cantidadTransporte
      cantidadRecepcion
      observacionPreTransferencia
      observacionPreparacion
      observacionTransporte
      observacionRecepcion
      vencimientoPreTransferencia
      vencimientoPreparacion
      vencimientoTransporte
      vencimientoRecepcion
      motivoModificacionPreTransferencia
      motivoModificacionPreparacion
      motivoModificacionTransporte
      motivoModificacionRecepcion
      motivoRechazoPreTransferencia
      motivoRechazoPreparacion
      motivoRechazoTransporte
      motivoRechazoRecepcion
      activo
      poseeVencimiento
      usuario {
        id
        persona {
          nombre
        }
      }
      creadoEn
    }
  }
`;

export const deleteTransferenciaItemDetalleQuery = gql`
  mutation deleteTransferenciaItemDetalle($id: ID!) {
    deleteTransferenciaItemDetalle(id: $id)
  }
`;

export const transferenciaItemPorTransferenciaIdQuery = gql`
  query ($id: ID!, $page: Int, $size: Int) {
    data: transferenciaItensPorTransferenciaId(
      id: $id
      page: $page
      size: $size
    ) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getPageable {
        getPageNumber
        getPageSize
      }
      getContent {
        id
        transferencia {
          id
        }
        presentacionPreTransferencia {
          id
          producto {
            id
            descripcion
            descripcionFactura
            codigoPrincipal
            costo {
              costoMedio
              ultimoPrecioCompra
            }
          }
          cantidad
          imagenPrincipal
          precioPrincipal {
            precio
          }
        }
        presentacionPreparacion {
          id
          producto {
            id
            descripcion
            descripcionFactura
            codigoPrincipal
            costo {
              costoMedio
              ultimoPrecioCompra
            }
          }
          cantidad
          imagenPrincipal
          precioPrincipal {
            precio
          }
        }
        presentacionTransporte {
          id
          producto {
            id
            descripcion
            codigoPrincipal
            costo {
              costoMedio
              ultimoPrecioCompra
            }
          }
          cantidad
          imagenPrincipal
          precioPrincipal {
            precio
          }
        }
        presentacionRecepcion {
          id
          producto {
            id
            descripcion
            codigoPrincipal
            costo {
              costoMedio
              ultimoPrecioCompra
            }
          }
          cantidad
          imagenPrincipal
          precioPrincipal {
            precio
          }
        }
        cantidadPreTransferencia
        cantidadPreparacion
        cantidadTransporte
        cantidadRecepcion
        observacionPreTransferencia
        observacionPreparacion
        observacionTransporte
        observacionRecepcion
        vencimientoPreTransferencia
        vencimientoPreparacion
        vencimientoTransporte
        vencimientoRecepcion
        motivoModificacionPreTransferencia
        motivoModificacionPreparacion
        motivoModificacionTransporte
        motivoModificacionRecepcion
        motivoRechazoPreTransferencia
        motivoRechazoPreparacion
        motivoRechazoTransporte
        motivoRechazoRecepcion
        activo
        poseeVencimiento
        creadoEn
      }
    }
  }
`;

export const transferenciaItemQuery = gql`
  query ($id: ID!) {
    data: transferenciaItem(id: $id) {
      id
      transferencia {
        id
        sucursalOrigen {
          id
          nombre
        }
        sucursalDestino {
          id
          nombre
        }
      }
      presentacionPreTransferencia {
        id
        producto {
          id
          descripcion
          descripcionFactura
          codigoPrincipal
          costo {
            costoMedio
            ultimoPrecioCompra
          }
        }
        cantidad
        imagenPrincipal
        precioPrincipal {
          precio
        }
      }
      presentacionPreparacion {
        id
        producto {
          id
          descripcion
          descripcionFactura
          codigoPrincipal
          costo {
            costoMedio
            ultimoPrecioCompra
          }
        }
        cantidad
        imagenPrincipal
        precioPrincipal {
          precio
        }
      }
      presentacionTransporte {
        id
        producto {
          id
          descripcion
          codigoPrincipal
          costo {
            costoMedio
            ultimoPrecioCompra
          }
        }
        cantidad
        imagenPrincipal
        precioPrincipal {
          precio
        }
      }
      presentacionRecepcion {
        id
        producto {
          id
          descripcion
          codigoPrincipal
          costo {
            costoMedio
            ultimoPrecioCompra
          }
        }
        cantidad
        imagenPrincipal
        precioPrincipal {
          precio
        }
      }
      cantidadPreTransferencia
      cantidadPreparacion
      cantidadTransporte
      cantidadRecepcion
      observacionPreTransferencia
      observacionPreparacion
      observacionTransporte
      observacionRecepcion
      vencimientoPreTransferencia
      vencimientoPreparacion
      vencimientoTransporte
      vencimientoRecepcion
      motivoModificacionPreTransferencia
      motivoModificacionPreparacion
      motivoModificacionTransporte
      motivoModificacionRecepcion
      motivoRechazoPreTransferencia
      motivoRechazoPreparacion
      motivoRechazoTransporte
      motivoRechazoRecepcion
      activo
      poseeVencimiento
      creadoEn
    }
  }
`;
