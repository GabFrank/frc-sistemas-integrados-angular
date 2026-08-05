import gql from "graphql-tag";

export const proveedorServicioQuery = gql`
  query ($id: ID!) {
    data: proveedorServicio(id: $id) {
      id
      nombreContacto
      numeroContacto
      creadoEn
      persona {
        id
        nombre
        documento
        apodo
        telefono
      }
      usuario {
        id
      }
    }
  }
`;

export const proveedorServicioPorPersona = gql`
  query ($personaId: ID!) {
    data: proveedorServicioPorPersona(personaId: $personaId) {
      id
      nombreContacto
      numeroContacto
      creadoEn
      persona {
        id
        nombre
        documento
        apodo
        telefono
      }
      usuario {
        id
      }
    }
  }
`;

export const proveedorServicioSearchPage = gql`
  query ($texto: String, $page: Int, $size: Int) {
    data: proveedorServicioSearchPage(texto: $texto, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        nombreContacto
        numeroContacto
        creadoEn
        persona {
          id
          nombre
          documento
          apodo
        }
      }
    }
  }
`;

export const saveProveedorServicio = gql`
  mutation saveProveedorServicio($entity: ProveedorServicioInput!) {
    data: saveProveedorServicio(proveedorServicio: $entity) {
      id
      nombreContacto
      numeroContacto
      creadoEn
      persona {
        id
        nombre
        documento
        apodo
        telefono
      }
    }
  }
`;

export const deleteProveedorServicioQuery = gql`
  mutation deleteProveedorServicio($id: ID!) {
    deleteProveedorServicio(id: $id)
  }
`;
