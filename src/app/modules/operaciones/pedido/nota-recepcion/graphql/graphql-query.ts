import gql from "graphql-tag";

export const notaRecepcionsQuery = gql`
  {
    id
    pedido {
      id
    }
    compra {
      id
    }
    documento {
      id
      descripcion
      activo
    }
    valor
    descuento
    pagado
    numero
    timbrado
    creadoEn
    usuario {
      id
    }
  }
`;

export const notaRecepcionQuery = gql`
  query ($id: ID!) {
    data: notaRecepcion(id: $id) {
      id
      pedido {
        id
      }
      compra {
        id
      }
      documento {
        id
        descripcion
        activo
      }
      valor
      descuento
      pagado
      numero
      timbrado
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const notaRecepcionPorPedidoIdQuery = gql`
  query ($id: ID!) {
    data: notaRecepcionPorPedidoId(id: $id) {
      id
      pedido {
        id
      }
      compra {
        id
      }
      documento {
        id
        descripcion
        activo
      }
      valor
      descuento
      pagado
      numero
      timbrado
      creadoEn
      pedidoItemList {
        id
        producto {
          id
          descripcion
        }
        compraItem {
          id
          cantidad
          verificado
          lote
          vencimiento
          presentacion{
            id
            cantidad
          }
          producto{
            id
          }
          pedidoItem{
            id
          }
          precioUnitario
          descuentoUnitario
          estado
        }
        notaRecepcion {
          id
        }
        presentacion {
          id
          cantidad
          imagenPrincipal
        }
        precioUnitario
        descuentoUnitario
        bonificacion
        bonificacionDetalle
        estado
        vencimiento
        creadoEn
        cantidad
        valorTotal
      }
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const saveNotaRecepcion = gql`
  mutation saveNotaRecepcion($entity: NotaRecepcionInput!) {
    data: saveNotaRecepcion(entity: $entity) {
      id
    }
  }
`;

export const deleteNotaRecepcionQuery = gql`
  mutation deleteNotaRecepcion($id: ID!) {
    deleteNotaRecepcion(id: $id)
  }
`;

// buscarSobrantes
