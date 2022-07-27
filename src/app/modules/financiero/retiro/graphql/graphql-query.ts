import gql from "graphql-tag";

export const retirosQuery = gql`
  {
    data: retiros {
      id
      responsable {
        id
      }
      estado
      observacion
      cajaSalida {
        id
      }
      cajaEntrada {
        id
      }
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      retiroDetalleList{
        id
        moneda{
          id
          denominacion
        }
        cambio
        cantidad
      }
    }
  }
`;

export const retiroQuery = gql`
  query ($id: ID!) {
    data: retiro(id: $id) {
      id
      responsable {
        id
      }
      estado
      observacion
      cajaSalida {
        id
      }
      cajaEntrada {
        id
      }
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      retiroDetalleList{
        id
        moneda{
          id
          denominacion
        }
        cambio
        cantidad
      }
    }
  }
`;

export const saveRetiro = gql`
  mutation saveRetiro($entity:RetiroInput!, $retiroDetalleInputList: [RetiroDetalleInput], $printerName: String, $local: String) {
    data: saveRetiro(retiro: $entity, retiroDetalleInputList: $retiroDetalleInputList, printerName: $printerName, local: $local) {
      id
      responsable {
        id
      }
      estado
      observacion
      cajaSalida {
        id
      }
      cajaEntrada {
        id
      }
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      retiroDetalleList{
        id
        moneda{
          id
          denominacion
        }
        cambio
        cantidad
      }
    }
  }
`;

export const deleteRetiroQuery = gql`
  mutation deleteRetiro($id: ID!) {
    deleteRetiro(id: $id)
  }
`;
