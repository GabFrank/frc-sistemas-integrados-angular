import gql from "graphql-tag";

export const familiasQuery = gql`
  {
    data: familias {
      id
      nombre
      descripcion
      activo
      icono
      posicion
      subfamilias {
        id
        nombre
        descripcion
        activo
        icono
        subfamiliaList {
          id
          nombre
          descripcion
          activo
          icono
        }
      }
    }
  }
`;

export const familiasSearch = gql`
  query ($texto: String,$page:Int, $size:Int) {
    data: familiaSearch(texto: $texto, page: $page, size: $size) {
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
        descripcion
        activo
        icono
        posicion
        creadoEn
        usuario {
          id
        }
        subfamilias {
          id
          descripcion
          activo
          icono
          subfamiliaList {
            id
            descripcion
            activo
            icono
          }
        }
      }
    }
  }
`;

export const familiaQuery = gql`
  query ($id: ID!) {
    data: familia(id: $id) {
      id
      nombre
      descripcion
      activo
      icono
      posicion
      subfamilias {
        id
        descripcion
        activo
        icono
        subfamiliaList {
          id
          descripcion
          activo
          icono
        }
      }
    }
  }
`;

export const saveFamilia = gql`
  mutation saveFamilia($entity: FamiliaInput!) {
    data: saveFamilia(familia: $entity) {
      id
      nombre
      descripcion
      activo
      icono
      posicion
      creadoEn
      subfamilias {
        id
        descripcion
        activo
        icono
        subfamiliaList {
          id
          descripcion
          activo
          icono
        }
      }
    }
  }
`;

export const deleteFamiliaQuery = gql`
  mutation deleteFamilia($id: ID!) {
    deleteFamilia(id: $id)
  }
`;

export const countFamiliaQuery = gql`
  {
    countFamilia
  }
`;
