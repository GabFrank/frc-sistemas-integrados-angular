import gql from "graphql-tag";

export const monedasQuery = gql`
  {
    data: monedas {
      id
      denominacion
      simbolo
      activo
      principal
      decimales
      reglaRedondeo
      redondeoMultiplo
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
    data: monedasSearch(texto: $texto) {
      id
      denominacion
      simbolo
      activo
      principal
      decimales
      reglaRedondeo
      redondeoMultiplo
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
      activo
      principal
      decimales
      reglaRedondeo
      redondeoMultiplo
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
      activo
      principal
      decimales
      reglaRedondeo
      redondeoMultiplo
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

/**
 * Monedas del ABM, con `codigoIso`. Va aparte de `monedasQuery` porque esa la usa todo el sistema
 * (el PDV incluido) y un campo que el central no conoce hace fallar la consulta entera: si esta
 * falla, el ABM vuelve a `monedasQuery` y oculta el campo.
 */
export const monedasAbmQuery = gql`
  {
    data: monedas {
      id
      denominacion
      simbolo
      activo
      principal
      decimales
      reglaRedondeo
      redondeoMultiplo
      codigoIso
      pais {
        id
        descripcion
      }
      cambio
    }
  }
`;

/** Campos de moneda que devuelven las consultas de moneda por módulo (solo existen en un central nuevo). */
const MONEDA_DE_MODULO_CAMPOS = `
  id
  denominacion
  simbolo
  activo
  principal
  decimales
  reglaRedondeo
  redondeoMultiplo
  codigoIso
`;

export const monedaDeModuloQuery = gql`
  query ($modulo: ModuloMoneda!, $sucursalId: ID) {
    data: monedaDeModulo(modulo: $modulo, sucursalId: $sucursalId) {
      ${MONEDA_DE_MODULO_CAMPOS}
    }
  }
`;

export const monedaEmpresaQuery = gql`
  {
    data: monedaEmpresa {
      ${MONEDA_DE_MODULO_CAMPOS}
    }
  }
`;
