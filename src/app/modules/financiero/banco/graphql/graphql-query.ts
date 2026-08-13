import gql from 'graphql-tag';

const bancoFields = `
  id
  nombre
  codigo
  creadoEn
`;

export const bancosQuery = gql`
  query ($page: Int, $size: Int) {
    data: bancos(page: $page, size: $size) {
      ${bancoFields}
    }
  }
`;

export const saveBancoMutation = gql`
  mutation saveBanco($banco: BancoInput!) {
    data: saveBanco(banco: $banco) {
      ${bancoFields}
    }
  }
`;

export const deleteBancoMutation = gql`
  mutation deleteBanco($id: ID!) {
    data: deleteBanco(id: $id)
  }
`;
