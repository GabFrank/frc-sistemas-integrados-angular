import gql from 'graphql-tag';

export const formatosQrPosActivosQuery = gql`
  query formatosQrPosActivos {
    data: formatosQrPosActivos {
      id
      nombre
      patron
      mapeo
      ejemplo
      activo
      proveedorServicioId
    }
  }
`;

/** ABM: va contra el CENTRAL, que es donde se administran los formatos. */
export const formatosQrPosQuery = gql`
  query formatosQrPos {
    data: formatosQrPos {
      id
      nombre
      patron
      mapeo
      ejemplo
      activo
      creadoEn
      proveedorServicio {
        id
        persona {
          id
          nombre
        }
      }
    }
  }
`;

export const saveFormatoQrPosMutation = gql`
  mutation saveFormatoQrPos($input: FormatoQrPosInput!) {
    data: saveFormatoQrPos(input: $input) {
      id
      nombre
      patron
      mapeo
      ejemplo
      activo
    }
  }
`;

export const desactivarFormatoQrPosMutation = gql`
  mutation desactivarFormatoQrPos($id: ID!) {
    data: desactivarFormatoQrPos(id: $id)
  }
`;
