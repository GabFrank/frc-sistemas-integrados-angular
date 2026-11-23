import gql from "graphql-tag";

/** Versión mínima del desktop (ej. "4.12.0"). null = sin control. No pide rol. */
export const versionMinimaDesktopQuery = gql`
  {
    data: versionMinimaDesktop
  }
`;

/** null o vacío apaga el control. Solo ADMIN. */
export const setVersionMinimaDesktopMutation = gql`
  mutation ($version: String) {
    data: setVersionMinimaDesktop(version: $version)
  }
`;
