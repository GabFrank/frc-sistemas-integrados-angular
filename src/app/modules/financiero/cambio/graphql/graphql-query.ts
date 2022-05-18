import gql from "graphql-tag";

export const cambiosQuery = gql`
  {
    data: cambios {
      id
      valorEnGs
      activo
      moneda {
        id
        denominacion
      }
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
    }
  }
`;

export const cambiosSearch = gql`
  query ($texto: String) {
    data: cambiosSearch(texto: $texto) {
      id
      valorEnGs
      activo
      moneda {
        id
        denominacion
      }
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
    }
  }
`;

export const cambioQuery = gql`
  query ($id: ID!) {
    data: cambio(id: $id) {
      id
      valorEnGs
      valorEnGsCambio
      activo
      moneda {
        id
        denominacion
      }
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
    }
  }
`;

export const saveCambio = gql`
  mutation saveCambio($entity: CambioInput!) {
    data: saveCambio(cambio: $entity) {
      id
      valorEnGs
      activo
      moneda {
        id
        denominacion
      }
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
    }
  }
`;

export const deleteCambioQuery = gql`
  mutation deleteCambio($id: ID!) {
    deleteCambio(id: $id)
  }
`;

export const cambioPorFechaQuery = gql`
  query ($inicio: String, $fin: String) {
    data: cambioPorFecha(inicio: $inicio, fin: $fin) {
      id
      valorEnGs
      activo
      moneda {
        id
        denominacion
      }
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
    }
  }
`;
