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
      cantidadItensVerificadoRecepcionMercaderia
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
      }
      valor
      descuento
      tipoBoleta
      pagado
      numero
      timbrado
      creadoEn
      cantidadItensVerificadoRecepcionMercaderia
      usuario {
        id
        persona {
          nombre
        }
      }
      cantidadItens
      fecha
    }
  }
`;

export const saveNotaRecepcion = gql`
  mutation saveNotaRecepcion($entity: NotaRecepcionInput!) {
    data: saveNotaRecepcion(entity: $entity) {
      id
      valor
    }
  }
`;

export const deleteNotaRecepcionQuery = gql`
  mutation deleteNotaRecepcion($id: ID!) {
    deleteNotaRecepcion(id: $id)
  }
`;

export const notaRecepcionPorPedidoIdAndNumeroQuery = gql`
  query ($id: ID!, $numero: Int, $page: Int, $size: Int) {
    data: notaRecepcionPorPedidoIdAndNumero(
      id: $id
      numero: $numero
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
      getContent {
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
        }
        valor
        descuento
        tipoBoleta
        pagado
        numero
        timbrado
        creadoEn
        cantidadItensVerificadoRecepcionMercaderia
        usuario {
          id
          persona {
            nombre
          }
        }
        cantidadItens
        fecha
      }
    }
  }
`;

export const countNotaRecepcionPorPedidoId = gql`
  query ($id: ID!) {
    data: countNotaRecepcionPorPedidoId(id: $id)
  }
`;
