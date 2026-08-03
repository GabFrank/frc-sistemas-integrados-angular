import gql from 'graphql-tag';

const cuentaBancariaFields = `
  id
  numero
  nombre
  tipoCuenta
  saldo
  saldoReservado
  titular
  alias
  activo
  disponibleOperacionesFinancieras
  permiteSaldoNegativo
  persona {
    id
    nombre
    documento
  }
  banco {
    id
    nombre
    codigo
  }
  moneda {
    id
    denominacion
    simbolo
  }
  creadoEn
`;

export const cuentasBancariasQuery = gql`
  query ($page: Int, $size: Int) {
    data: cuentasBancarias(page: $page, size: $size) {
      ${cuentaBancariaFields}
    }
  }
`;

export const cuentasBancariasOperablesQuery = gql`
  query {
    data: cuentasBancariasOperables {
      ${cuentaBancariaFields}
    }
  }
`;

export const saveCuentaBancariaMutation = gql`
  mutation saveCuentaBancaria($cuentaBancaria: CuentaBancariaInput!) {
    data: saveCuentaBancaria(cuentaBancaria: $cuentaBancaria) {
      ${cuentaBancariaFields}
    }
  }
`;

export const deleteCuentaBancariaMutation = gql`
  mutation deleteCuentaBancaria($id: ID!) {
    data: deleteCuentaBancaria(id: $id)
  }
`;
