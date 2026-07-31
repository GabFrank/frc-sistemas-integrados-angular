import gql from 'graphql-tag';

const cuentaBancariaFields = `
  id
  numero
  tipoCuenta
  saldo
  saldoReservado
  titular
  alias
  activo
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
