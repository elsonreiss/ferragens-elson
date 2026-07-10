// Declaração de tipos mínima para o pacote "pg", cobrindo apenas a API usada
// neste projeto (Pool / PoolClient / query). Escrita à mão para evitar
// conflito de versão com @types/pg (que assume pg-types@4, mas o pg
// instalado aqui usa pg-types@2 internamente).
declare module "pg" {
  export interface QueryResultRow {
    // "any" (não "unknown") de propósito: espelha o @types/pg oficial, que usa
    // esse índice para permitir passar qualquer interface concreta de linha
    // (ex: ProductRow) como R sem precisar declarar um índice explícito nela.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [column: string]: any;
  }

  export interface QueryResult<R extends QueryResultRow = QueryResultRow> {
    rows: R[];
    rowCount: number | null;
  }

  export interface PoolConfig {
    connectionString?: string;
    max?: number;
    ssl?: false | { rejectUnauthorized?: boolean };
  }

  export class PoolClient {
    query<R extends QueryResultRow = QueryResultRow>(
      text: string,
      params?: unknown[]
    ): Promise<QueryResult<R>>;
    release(): void;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    connect(): Promise<PoolClient>;
    query<R extends QueryResultRow = QueryResultRow>(
      text: string,
      params?: unknown[]
    ): Promise<QueryResult<R>>;
    end(): Promise<void>;
    // Usado em connection.ts para ajustar o timezone da sessão a cada nova
    // conexão do pool (evento "connect" do pg, emitido com o PoolClient recém-
    // conectado).
    on(event: "connect", listener: (client: PoolClient) => void): this;
  }

  // Usado em connection.ts para desativar o parse automático de colunas de
  // data/hora em objetos Date — o projeto trata essas colunas como texto
  // (mesmo formato que o SQLite sempre devolveu) em todas as entidades e
  // funções de formatação.
  export const types: {
    setTypeParser(oid: number, parser: (value: string) => unknown): void;
    builtins: {
      DATE: number;
      TIMESTAMP: number;
      TIMESTAMPTZ: number;
      [name: string]: number;
    };
  };
}
