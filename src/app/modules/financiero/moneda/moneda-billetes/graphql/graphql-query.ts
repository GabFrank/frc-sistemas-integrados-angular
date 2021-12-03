import gql from "graphql-tag";

export const monedaBilletessQuery = gql`
  {
    data: monedaBilletess {
      id
      moneda {
        id
        denominacion
      }
      flotante
      papel
      activo
      valor
      creadoEn
      usuario {
        id
        persona {
          id
          nombre
        }
      }
    }
  }
`;

export const monedaBilletePorMonedaId = gql`
  query ($id: ID!) {
    data: monedaBilletePorMonedaId(id: $id) {
      id
      moneda {
        id
        denominacion
      }
      flotante
      papel
      activo
      valor
      creadoEn
      usuario {
        id
        persona {
          id
          nombre
        }
      }
    }
  }
`;

export const monedaBilletessSearch = gql`
  query ($texto: String) {
    monedaBilletess: monedaBilletessSearch(texto: $texto) {
      id
      responsable {
        id
        persona {
          id
          nombre
        }
      }
      tipoMonedaBilletes {
        id
        descripcion
        autorizacion
      }
      autorizadoPor {
        id
        persona {
          id
          nombre
        }
      }
      observacion
      creadoEn
      usuario {
        id
        persona {
          id
          nombre
        }
      }
      monedaBilletesDetalleList {
        id
        moneda {
          id
          denominacion
        }
        cambio {
          id
          valorEnGs
        }
        cantidad
      }
    }
  }
`;

export const monedaBilletesQuery = gql`
  query ($id: ID!) {
    data: monedaBilletes(id: $id) {
      id
      moneda {
        id
        denominacion
      }
      flotante
      papel
      activo
      valor
      creadoEn
      usuario {
        id
        persona {
          id
          nombre
        }
      }
    }
  }
`;

export const saveMonedaBilletes = gql`
  mutation saveMonedaBilletes($entity: MonedaBilletesInput!) {
    data: saveMonedaBilletes(monedaBilletes: $entity) {
      id
      moneda {
        id
        denominacion
      }
      flotante
      papel
      activo
      valor
      creadoEn
      usuario {
        id
        persona {
          id
          nombre
        }
      }
    }
  }
`;

export const deleteMonedaBilletesQuery = gql`
  mutation deleteMonedaBilletes($id: ID!) {
    deleteMonedaBilletes(id: $id)
  }
`;
