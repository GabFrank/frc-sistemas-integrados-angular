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

/**
 * Los activos, pero pedidos al CENTRAL.
 *
 * Existe aparte de `formatosTerminalPosActivosQuery` porque el type `FormatoTerminalPos` esta
 * declarado DISTINTO en los dos backends: central expone `proveedorServicio` (el objeto, que es
 * lo que tiene para dar) y filial expone `proveedorServicioId` (el escalar, que es lo unico que
 * baja por replicacion). Mandarle a central la seleccion del filial hace que GraphQL rechace la
 * query ENTERA con "Cannot query field proveedorServicioId" --no degrada, no devuelve el resto:
 * la lista queda vacia y el alta de terminal, que exige formato, se vuelve imposible.
 *
 * El nombre de la operacion es el mismo en los dos lados; lo unico que cambia es que se pide.
 */
export const formatosTerminalPosActivosCentralQuery = gql`
  query formatosTerminalPosActivos {
    data: formatosTerminalPosActivos {
      id
      nombre
      tipo
      patron
      mapeo
      ejemplo
      activo
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
