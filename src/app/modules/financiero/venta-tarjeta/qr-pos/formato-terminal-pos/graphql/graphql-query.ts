import gql from 'graphql-tag';

/**
 * Lo que el PDV lee del FILIAL para poder trabajar sin internet. Sin `proveedorServicio`: alla
 * viaja el id pelado y el nombre no hace falta en la caja.
 */
export const formatosTerminalPosActivosQuery = gql`
  query formatosTerminalPosActivos {
    data: formatosTerminalPosActivos {
      id
      nombre
      tipo
      patron
      mapeo
      ejemplo
      activo
      proveedorServicioId
    }
  }
`;

/** ABM: va contra el CENTRAL, que es donde se administran los formatos. */
export const formatosTerminalPosQuery = gql`
  query formatosTerminalPos {
    data: formatosTerminalPos {
      id
      nombre
      tipo
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

export const saveFormatoTerminalPosMutation = gql`
  mutation saveFormatoTerminalPos($input: FormatoTerminalPosInput!) {
    data: saveFormatoTerminalPos(input: $input) {
      id
      nombre
      tipo
      patron
      mapeo
      ejemplo
      activo
    }
  }
`;

export const desactivarFormatoTerminalPosMutation = gql`
  mutation desactivarFormatoTerminalPos($id: ID!) {
    data: desactivarFormatoTerminalPos(id: $id)
  }
`;

/**
 * Cuantas terminales usan este formato.
 *
 * Se consulta ANTES de ofrecer desactivar: el backend rechaza desactivar uno en uso, y es mejor
 * decirselo al usuario antes que dejarlo intentar y comerse el error.
 */
export const terminalesQueUsanFormatoQuery = gql`
  query terminalesQueUsanFormato($id: ID!) {
    data: terminalesQueUsanFormato(id: $id)
  }
`;
