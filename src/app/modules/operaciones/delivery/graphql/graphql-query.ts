import gql from 'graphql-tag';

export const deliverysQuery = gql`
  query {
    data: deliverys {
      id
      entregador {
        id
        persona {
          nombre
        }
      }
      direccion
      telefono
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      estado
      valor
      barrio {
        id
      }
      precio {
        id
      }
    }
  }
`;

export const deliverysSubsUltimos10Query = gql`
  subscription deliverys {
    deliverys{
      id
      entregador {
        id
        persona {
          nombre
        }
      }
      direccion
      telefono
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      estado
      valor
      barrio {
        id
      }
      precio {
        id
      }
    }
  }
`;

export const deliverysUltimos10Query = gql`
  query {
    data: deliverysUltimos10 {
      id
      entregador {
        id
        persona {
          nombre
        }
      }
      direccion
      telefono
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      estado
      valor
      barrio {
        id
      }
      precio {
        id
      }
    }
  }
`;

export const deliverysSearch = gql`
  query ($texto: String) {
    data: deliverySearch(texto: $texto) {
      id
      entregador {
        id
        persona {
          nombre
        }
      }
      direccion
      telefono
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      estado
      valor
      barrio {
        id
      }
      precio {
        id
      }
    }
  }
`;

export const deliverysByEstado = gql`
  query ($estado: DeliveryEstado) {
    data: deliverysByEstado(estado: $estado) {
      id
      entregador {
        id
        persona {
          nombre
        }
      }
      direccion
      telefono
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      estado
      valor
      barrio {
        id
      }
      precio {
        id
      }
    }
  }
`;

export const deliverysByEstadoNotIn = gql`
  query ($estado: DeliveryEstado) {
    data: deliverysByEstadoNotIn(estado: $estado) {
      id
      entregador {
        id
        persona {
          nombre
        }
      }
      direccion
      telefono
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      estado
      valor
      barrio {
        id
      }
      precio {
        id
      }
    }
  }
`;

export const deliveryQuery = gql`
  query ($id: ID!) {
    data: delivery(id: $id) {
      id
      entregador {
        id
        persona {
          nombre
        }
      }
      direccion
      telefono
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      estado
      valor
      barrio {
        id
      }
      precio {
        id
      }
    }
  }
`;

export const saveDelivery = gql`
  mutation saveDelivery($entity: DeliveryInput!) {
    data: saveDelivery(delivery: $entity) {
      id
      entregador {
        id
        persona {
          nombre
        }
      }
      direccion
      telefono
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      estado
      valor
      barrio {
        id
      }
      precio {
        id
      }
    }
  }
`;

export const deleteDeliveryQuery = gql`
  mutation deleteDelivery($id: ID!) {
    deleteDelivery(id: $id)
  }
`;
