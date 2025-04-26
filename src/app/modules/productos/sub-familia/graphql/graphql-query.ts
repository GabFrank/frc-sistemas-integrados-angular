import gql from "graphql-tag";

export const subfamiliasQuery = gql`
  {
    data: subfamilias {
      id
      nombre
      descripcion
      icono
      posicion
      subfamilia {
        id
      }
      activo
      subfamiliaList {
        id
        nombre
      }
    }
  }
`;

export const subfamiliasSearch = gql`
  query ($familiaId: ID, $texto: String, $page: Int, $size: Int) {
    data: subfamiliaSearch(
      familiaId: $familiaId
      texto: $texto
      page: $page
      size: $size
    ) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        nombre
        familia {
          id
        }
        creadoEn
        descripcion
        activo
        icono
        posicion
        creadoEn
        usuario {
          id
        }
      }
    }
  }
`;

export const findByDescripcionSinFamilia = gql`
  query ($texto: String, $page: Int, $size: Int) {
    data: findByDescripcionSinFamilia(texto: $texto, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        nombre
        familia {
          id
          nombre
        }
        creadoEn
        descripcion
        activo
        icono
        posicion
        creadoEn
        usuario {
          id
        }
      }
    }
  }
`;

export const subfamiliaQuery = gql`
  query ($id: ID!) {
    data: subfamilia(id: $id) {
      id
      nombre
      descripcion
      icono
      posicion
      subfamilia {
        id
      }
      activo
      subfamiliaList {
        id
        nombre
      }
    }
  }
`;

export const saveSubfamilia = gql`
  mutation saveSubfamilia($entity: SubfamiliaInput!) {
    data: saveSubfamilia(subfamilia: $entity) {
      id
      nombre
      familia {
        id
      }
      creadoEn
      descripcion
      activo
      icono
      posicion
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const deleteSubfamiliaQuery = gql`
  mutation deleteSubfamilia($id: ID!) {
    deleteSubfamilia(id: $id)
  }
`;

export const countSubfamiliaQuery = gql`
  {
    countSubfamilia
  }
`;
