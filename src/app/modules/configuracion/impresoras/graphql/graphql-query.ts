import gql from "graphql-tag";

const CAMPOS = `
  id
  nombre
  activo
  esPredeterminada
  sucursal {
    id
    nombre
  }
  tipo
  uso
  conexion
  colaCups
  ip
  puerto
  smbHost
  smbRecurso
  smbUsuario
  smbDominio
  perfilPapel
  columnas
  anchoMm
  altoMm
  marca
  codepage
  compartidaEnCentral
  creadoEn
`;

export const impresorasQuery = gql`
  query ($page: Int, $size: Int) {
    data: impresoras(page: $page, size: $size) {
      ${CAMPOS}
    }
  }
`;

export const impresoraSearchPageQuery = gql`
  query ($texto: String, $page: Int, $size: Int) {
    data: impresoraSearchPage(texto: $texto, page: $page, size: $size) {
      content {
        ${CAMPOS}
      }
      totalElements
      totalPages
      size
      number
    }
  }
`;

export const impresoraQuery = gql`
  query ($id: ID!) {
    data: impresora(id: $id) {
      ${CAMPOS}
    }
  }
`;

export const impresorasDelSistemaQuery = gql`
  query {
    data: impresorasDelSistema
  }
`;

export const saveImpresora = gql`
  mutation saveImpresora($entity: ImpresoraInput!) {
    data: saveImpresora(impresora: $entity) {
      ${CAMPOS}
    }
  }
`;

export const deleteImpresoraQuery = gql`
  mutation deleteImpresora($id: ID!) {
    deleteImpresora(id: $id)
  }
`;

export const dispositivosParaInstalarQuery = gql`
  query {
    data: dispositivosParaInstalar {
      clase
      uri
      nombre
      descripcion
    }
  }
`;

export const instalarImpresoraCupsMutation = gql`
  mutation ($nombreCola: String!, $uri: String!, $raw: Boolean) {
    instalarImpresoraCups(nombreCola: $nombreCola, uri: $uri, raw: $raw)
  }
`;

export const imprimirPruebaEnImpresoraMutation = gql`
  mutation ($impresoraId: ID!) {
    data: imprimirPruebaEnImpresora(impresoraId: $impresoraId)
  }
`;

export const recursosSmbQuery = gql`
  query ($host: String!, $usuario: String, $dominio: String, $password: String) {
    data: recursosSmb(host: $host, usuario: $usuario, dominio: $dominio, password: $password) {
      clase
      uri
      nombre
      descripcion
    }
  }
`;

export const estadoColasQuery = gql`
  query {
    data: estadoColas {
      nombre
      estado
      razon
      habilitada
    }
  }
`;

export const instalarImpresoraSmbMutation = gql`
  mutation (
    $nombreCola: String!
    $host: String!
    $recurso: String!
    $usuario: String
    $dominio: String
    $password: String
    $raw: Boolean
  ) {
    data: instalarImpresoraSmb(
      nombreCola: $nombreCola
      host: $host
      recurso: $recurso
      usuario: $usuario
      dominio: $dominio
      password: $password
      raw: $raw
    )
  }
`;

export const reactivarColaMutation = gql`
  mutation ($nombreCola: String!) {
    data: reactivarCola(nombreCola: $nombreCola)
  }
`;
