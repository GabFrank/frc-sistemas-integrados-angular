import gql from 'graphql-tag';

export const subfamiliasQuery = gql`
  {
    data : subfamilias {
      id
    nombre
    descripcion
    icono
    posicion
    subfamilia{
      id
    }
    activo
    subfamiliaList{
      id
      nombre
    }
    }
  }
`;

export const subfamiliasSearch = gql`
  query ($texto: String) {
    data: subfamiliaSearch(texto: $texto) {
      id
    nombre
    descripcion
    icono
    posicion
    subfamilia{
      id
    }
    activo
    subfamiliaList{
      id
      nombre
    }
    }
  }
`;

export const subfamiliaQuery = gql`
  query ($id: ID!) {
    data : subfamilia(id: $id) {
      id
    nombre
    descripcion
    icono
    posicion
    subfamilia{
      id
    }
    activo
    subfamiliaList{
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
    descripcion
    icono
    posicion
    subfamilia{
      id
    }
    activo
    subfamiliaList{
      id
      nombre
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
