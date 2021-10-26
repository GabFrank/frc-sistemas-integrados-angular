import gql from "graphql-tag";

export const formasPagoQuery = gql`
  {
    data: formasPago {
      id
      descripcion
      activo
      movimientoCaja
      autorizacion
      cuentaBancaria {
        id
      }
    }
  }
`;

//"Validation error of type FieldUndefined: Field 'movimientoCaja' in type 'FormaPago' is undefined @ 'formasPago/movimientoCaja'"

export const formaPagoQuery = gql`
  query ($id: ID!) {
    formaPago(id: $id) {
      id
      descripcion
      activo
      movimientoCaja
      autorizacion
      cuentaBancaria {
        id
      }
    }
  }
`;

export const saveFormaPago = gql`
  mutation saveFormaPago($entity: FormaPagoInput!) {
    data: saveFormaPago(formaPago: $entity) {
      id
    }
  }
`;

export const deleteFormaPagoQuery = gql`
  mutation deleteFormaPago($id: ID!) {
    deleteFormaPago(id: $id)
  }
`;
