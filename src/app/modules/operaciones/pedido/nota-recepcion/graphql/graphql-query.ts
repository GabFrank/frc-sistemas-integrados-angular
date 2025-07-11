import gql from "graphql-tag";

export const NotaRecepcionFragment = gql`
  fragment NotaRecepcionFragment on NotaRecepcion {
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
    cantidadItensNecesitanDistribucion
    usuario {
      id
      persona {
        nombre
      }
    }
    cantidadItens
    fecha
    # NUEVOS CAMPOS
    moneda {
      id
      denominacion
      simbolo
    }
    cotizacion
  }
`;

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
      ...NotaRecepcionFragment
    }
  }
  ${NotaRecepcionFragment}
`;

export const notaRecepcionPorPedidoIdQuery = gql`
  query ($id: ID!) {
    data: notaRecepcionPorPedidoId(id: $id) {
      ...NotaRecepcionFragment
    }
  }
  ${NotaRecepcionFragment}
`;

export const saveNotaRecepcion = gql`
  mutation saveNotaRecepcion($entity: NotaRecepcionInput!) {
    data: saveNotaRecepcion(entity: $entity) {
      id
      valor
      # Devuelve los nuevos campos también para mantener el objeto actualizado
      moneda {
        id
        denominacion
        simbolo
      }
      cotizacion
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
        ...NotaRecepcionFragment
      }
    }
  }
  ${NotaRecepcionFragment}
`;

export const countNotaRecepcionPorPedidoId = gql`
  query ($id: ID!) {
    data: countNotaRecepcionPorPedidoId(id: $id)
  }
`;
