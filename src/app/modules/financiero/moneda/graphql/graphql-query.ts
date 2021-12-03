import gql from "graphql-tag";

export const monedasQuery = gql`
  {
    data: monedas {
      id
      denominacion
      simbolo
      pais {
        id
        descripcion
      }
      cambio
      monedaBilleteList {
        id
        flotante
        papel
        activo
        valor
        moneda {
          id
          denominacion
        }
      }
    }
  }
`;

export const monedasSearch = gql`
  query ($texto: String) {
    monedas: monedasSearch(texto: $texto) {
      id
      denominacion
      simbolo
      pais {
        id
        descripcion
      }
      cambio
      monedaBilleteList {
        id
        flotante
        papel
        activo
        valor
        moneda {
          id
          denominacion
        }
      }
    }
  }
`;

export const monedaQuery = gql`
  query ($id: ID!) {
    moneda(id: $id) {
      id
      denominacion
      simbolo
      pais {
        id
        descripcion
      }
      cambio
      monedaBilleteList {
        id
        flotante
        papel
        activo
        valor
        moneda {
          id
          denominacion
        }
      }
    }
  }
`;

export const saveMoneda = gql`
  mutation saveMoneda($entity: MonedaInput!) {
    data: saveMoneda(moneda: $entity) {
      id
      denominacion
      simbolo
      pais {
        id
        descripcion
      }
      cambio
      monedaBilleteList {
        id
        flotante
        papel
        activo
        valor
      }
    }
  }
`;

export const deleteMonedaQuery = gql`
  mutation deleteMoneda($id: ID!) {
    deleteMoneda(id: $id)
  }
`;
