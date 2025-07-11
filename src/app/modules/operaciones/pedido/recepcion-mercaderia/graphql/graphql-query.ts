import gql from "graphql-tag";

// Fragmento para RecepcionMercaderiaItem
export const RecepcionMercaderiaItemFragment = gql`
  fragment RecepcionMercaderiaItemFragment on RecepcionMercaderiaItem {
    id
    producto {
      id
      descripcion
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
    observacion
  }
`;

// Fragmento para la cabecera de RecepcionMercaderia
export const RecepcionMercaderiaFragment = gql`
  fragment RecepcionMercaderiaFragment on RecepcionMercaderia {
    id
    proveedor {
      id
      persona {
        nombre
      }
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
    recepcionMercaderiaItemList {
      ...RecepcionMercaderiaItemFragment
    }
    recepcionCostoAdicionalList {
        id
        descripcion
        monto
        moneda {
            id
            denominacion
        }
    }
    notaRecepcionList {
        id
        numero
        fecha
    }
  }
  ${RecepcionMercaderiaItemFragment}
`;

// Query para obtener una RecepcionMercaderia por ID
export const getRecepcionMercaderiaById = gql`
  query getRecepcionMercaderiaById($id: ID!) {
    data: recepcionMercaderia(id: $id) {
      ...RecepcionMercaderiaFragment
    }
  }
  ${RecepcionMercaderiaFragment}
`;

// Mutation para crear/actualizar una RecepcionMercaderia
export const saveRecepcionMercaderia = gql`
  mutation saveRecepcionMercaderia($entity: RecepcionMercaderiaInput!) {
    data: saveRecepcionMercaderia(entity: $entity) {
      ...RecepcionMercaderiaFragment
    }
  }
  ${RecepcionMercaderiaFragment}
`;

// Mutation para finalizar una RecepcionMercaderia
export const finalizarRecepcionMercaderia = gql`
    mutation finalizarRecepcionMercaderia($id: ID!) {
        data: finalizarRecepcionMercaderia(id: $id)
    }
`; 