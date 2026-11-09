import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const sql = readFileSync(
  new URL('../../database/original/gymhung_demo.original.sql', import.meta.url),
  'utf8',
);
const excluded = new Set([
  'PasswordHash',
  'RequestData',
  'ResponseData',
  'ContextData',
  'ReferenceData',
  'OldData',
  'NewData',
  'IPAddress',
  'UserAgent',
]);
const camel = (name) => name[0].toLowerCase() + name.slice(1);
const tables = [...sql.matchAll(/CREATE TABLE (\w+)\s*\(([\s\S]*?)\n\);/g)].map(
  ([, name, body]) => {
    const fields = body
      .split('\n')
      .map((line) =>
        line
          .trim()
          .match(
            /^(\w+) (BIGINT|INT|BIT|DECIMAL|NVARCHAR|DATETIME2|DATE|TIME)(?:\(([^)]+)\))?\s+(.+)/,
          ),
      )
      .filter(Boolean)
      .filter((m) => !excluded.has(m[1]))
      .map(([, col, type, len, tail]) => ({
        key: camel(col),
        sql: col,
        type:
          type === 'BIGINT'
            ? 'id'
            : type === 'BIT'
              ? 'boolean'
              : ['INT', 'DECIMAL'].includes(type)
                ? 'number'
                : ['DATE', 'TIME', 'DATETIME2'].includes(type)
                  ? type.toLowerCase()
                  : 'text',
        required:
          tail.includes('NOT NULL') &&
          !tail.includes('DEFAULT') &&
          !tail.includes('IDENTITY'),
        nullable: !tail.includes('NOT NULL') && !tail.includes('PRIMARY KEY'),
        maxLength:
          type === 'NVARCHAR' && len !== 'MAX' ? Number(len) : undefined,
        readonly:
          /IDENTITY/.test(tail) ||
          ['CreatedAt', 'UpdatedAt', 'AssignedAt', 'LastLoginAt'].includes(col),
        integer: type === 'INT',
      }));
    const key =
      fields.find((f) => f.readonly && f.type === 'id')?.key ?? fields[0].key;
    return { name, key, fields };
  },
);
mkdirSync(new URL('../src/types/', import.meta.url), { recursive: true });
writeFileSync(
  new URL('../src/types/entities.ts', import.meta.url),
  '// Generated from the checked-in SQL schema; sensitive columns are intentionally excluded.\nexport type Id = string;\nexport type Scalar = string | number | boolean | null | undefined;\nexport type EntityRecord = Record<string, Scalar>;\n' +
    tables
      .map(
        (t) =>
          `export interface ${t.name} {\n${t.fields.map((f) => `  ${f.key}${f.nullable ? '?' : ''}: ${f.type === 'id' ? 'Id' : f.type === 'number' ? 'number' : f.type === 'boolean' ? 'boolean' : 'string'}${f.nullable ? ' | null' : ''};`).join('\n')}\n}`,
      )
      .join('\n') +
    `\nexport interface EntityMap {\n${tables.map((t) => `  ${t.name}: ${t.name};`).join('\n')}\n}\nexport type TableName = keyof EntityMap;\nexport type WorkspaceData = { [K in TableName]: EntityMap[K][] };\nexport type Draft<K extends TableName> = Partial<EntityMap[K]>;\nexport const asRecord = (value: object): EntityRecord => value as EntityRecord;\n`,
);
writeFileSync(
  new URL('../src/types/schema.ts', import.meta.url),
  `// UI metadata generated from SQL. No database connection is made.\nimport type { TableName } from './entities';\nexport interface SchemaField { key: string; sql: string; type: string; required: boolean; nullable: boolean; maxLength?: number; readonly: boolean; integer: boolean; }\nexport const schema: Record<TableName, {name: TableName; key: string; fields: SchemaField[]}> = ${JSON.stringify(Object.fromEntries(tables.map((t) => [t.name, t])), null, 2)};\n`,
);
console.log(`Generated safe frontend types for ${tables.length} tables.`);
