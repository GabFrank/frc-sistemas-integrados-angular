import { gql } from 'apollo-angular';

// Query para obtener recepciones de mercadería por pedido
export const RECEPCION_MERCADERIA_POR_PEDIDO_QUERY = gql`
  query recepcionMercaderiaPorPedido($pedidoId: ID!) {
    recepcionMercaderiaConFiltros(
      proveedorId: $pedidoId
      page: 0
      size: 100
    ) {
      getContent {
        id
        proveedor {
          id
          nombre
        }
        sucursalRecepcion {
          id
          nombre
        }
        fecha
        moneda {
          id
          denominacion
        }
        cotizacion
        estado
        usuario {
          id
          persona {
            nombre
          }
        }
      }
      getTotalElements
      getTotalPages
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
    }
  }
`;

// Query para obtener ítems de recepción por recepción
export const RECEPCION_MERCADERIA_ITEMS_POR_RECEPCION_QUERY = gql`
  query recepcionMercaderiaItemsPorRecepcion($recepcionId: ID!) {
    recepcionMercaderiaItemsPorRecepcion(recepcionId: $recepcionId) {
      id
      recepcionMercaderia {
        id
      }
      notaRecepcionItem {
        id
        producto {
          id
          descripcion
          codigo
        }
        presentacionEnNota {
          id
          descripcion
          cantidad
        }
        cantidadEnNota
        precioUnitarioEnNota
        esBonificacion
        vencimientoEnNota
        estado
      }
      producto {
        id
        descripcion
        codigo
      }
      presentacionRecibida {
        id
        descripcion
        cantidad
      }
      sucursalEntrega {
        id
        nombre
      }
      cantidadRecibida
      cantidadRechazada
      esBonificacion
      vencimientoRecibido
      lote
      motivoRechazo
      observaciones
    }
  }
`;

// Query para obtener notas de recepción disponibles para recepción física
export const NOTAS_RECEPCION_DISPONIBLES_QUERY = gql`
  query notasRecepcionDisponibles($pedidoId: ID!) {
    notaRecepcionPorPedidoIdAndNumeroPage(
      pedidoId: $pedidoId
      page: 0
      size: 100
    ) {
      getContent {
        id
        numero
        fecha
        tipoBoleta
        timbrado
        moneda {
          id
          denominacion
        }
        cotizacion
        estado
        esNotaRechazo
        notaRecepcionItems {
          id
          producto {
            id
            descripcion
            codigo
          }
          presentacionEnNota {
            id
            descripcion
            cantidad
          }
          cantidadEnNota
          precioUnitarioEnNota
          esBonificacion
          vencimientoEnNota
          estado
          notaRecepcionItemDistribuciones {
            id
            sucursalEntrega {
              id
              nombre
            }
            cantidadDistribuida
          }
        }
      }
      getTotalElements
      getTotalPages
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
    }
  }
`;

// Query para obtener sucursales disponibles para recepción física
export const SUCURSALES_DISPONIBLES_RECEPCION_FISICA_QUERY = gql`
  query sucursalesDisponiblesRecepcionFisica($pedidoId: ID!) {
    sucursalesDisponiblesRecepcionFisica(pedidoId: $pedidoId) {
      id
      nombre
      localizacion
      direccion
      nroDelivery
      deposito
      depositoPredeterminado
      isConfigured
      ciudad {
        id
        nombre
      }
    }
  }
`;

// Mutation para guardar recepción de mercadería
export const SAVE_RECEPCION_MERCADERIA_MUTATION = gql`
  mutation saveRecepcionMercaderia($entity: RecepcionMercaderiaInput!) {
    saveRecepcionMercaderia(entity: $entity) {
      id
      proveedor {
        id
        nombre
      }
      sucursalRecepcion {
        id
        nombre
      }
      fecha
      moneda {
        id
        denominacion
      }
      cotizacion
      estado
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

// Mutation para guardar ítem de recepción de mercadería
export const SAVE_RECEPCION_MERCADERIA_ITEM_MUTATION = gql`
  mutation saveRecepcionMercaderiaItem($entity: RecepcionMercaderiaItemInput!) {
    data: saveRecepcionMercaderiaItem(entity: $entity) {
      id
      recepcionMercaderia {
        id
      }
      notaRecepcionItem {
        id
      }
      producto {
        id
        descripcion
        codigoPrincipal
      }
      presentacionRecibida {
        id
        descripcion
        cantidad
      }
      sucursalEntrega {
        id
        nombre
      }
      cantidadRecibida
      cantidadRechazada
      esBonificacion
      vencimientoRecibido
      lote
      motivoRechazo
      observaciones
    }
  }
`;

// Mutation para finalizar recepción de mercadería
export const FINALIZAR_RECEPCION_MERCADERIA_MUTATION = gql`
  mutation finalizarRecepcionMercaderia($recepcionId: ID!) {
    finalizarRecepcionMercaderia(recepcionId: $recepcionId) {
      id
      estado
      fecha
    }
  }
`;

// Mutation para asociar notas a recepción
export const ASOCIAR_NOTAS_A_RECEPCION_MUTATION = gql`
  mutation asociarNotasARecepcion($recepcionId: ID!, $notaRecepcionIds: [ID!]!) {
    asociarNotasARecepcion(recepcionId: $recepcionId, notaRecepcionIds: $notaRecepcionIds)
  }
`;

// Mutation para cancelar verificación
export const CANCELAR_VERIFICACION_MUTATION = gql`
  mutation cancelarVerificacion($notaRecepcionItemId: ID!, $sucursalId: ID!) {
    data: cancelarVerificacion(notaRecepcionItemId: $notaRecepcionItemId, sucursalId: $sucursalId)
  }
`;

// Mutation para cancelar rechazo
export const CANCELAR_RECHAZO_MUTATION = gql`
  mutation cancelarRechazo($notaRecepcionItemId: ID!, $sucursalId: ID!) {
    data: cancelarRechazo(notaRecepcionItemId: $notaRecepcionItemId, sucursalId: $sucursalId)
  }
`;

// Mutation para validar finalización de recepción por pedido
export const VALIDAR_FINALIZACION_RECEPCION_POR_PEDIDO_MUTATION = gql`
  mutation validarFinalizacionRecepcionPorPedido($pedidoId: ID!, $sucursalesIds: [ID!]!) {
    data: validarFinalizacionRecepcionPorPedido(pedidoId: $pedidoId, sucursalesIds: $sucursalesIds) {
      puedeFinalizar
      itemsPendientes {
        itemId
        descripcionProducto
        numeroNota
        motivo
        cantidadEsperada
        cantidadRecibida
        cantidadRechazada
      }
      cantidadItemsPendientes
      mensaje
    }
  }
`;

// Mutation para finalizar recepción física por pedido
export const FINALIZAR_RECEPCION_FISICA_POR_PEDIDO_MUTATION = gql`
  mutation finalizarRecepcionFisicaPorPedido($pedidoId: ID!, $sucursalesIds: [ID!]!) {
    data: finalizarRecepcionFisicaPorPedido(pedidoId: $pedidoId, sucursalesIds: $sucursalesIds)
  }
`; 