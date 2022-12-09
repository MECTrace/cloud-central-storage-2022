import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class createTableEventFileNode1652070264353
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'event',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'sendNodeId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'receiveNodeId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'fileId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'node',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'name',
            isNullable: false,
            isUnique: true,
            type: 'varchar',
          },
          {
            name: 'typeNode',
            isNullable: false,
            type: 'int',
          },
          {
            name: 'status',
            isNullable: false,
            type: 'varchar',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'file',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'fileName',
            isNullable: false,
            type: 'varchar',
          },
          {
            name: 'fileType',
            isNullable: false,
            type: 'varchar',
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'path',
            type: 'varchar',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'event',
      new TableForeignKey({
        columnNames: ['sendNodeId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'node',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'event',
      new TableForeignKey({
        columnNames: ['receiveNodeId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'node',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'event',
      new TableForeignKey({
        columnNames: ['fileId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'file',
        onDelete: 'CASCADE',
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('node');
    await queryRunner.dropTable('file');
    await queryRunner.dropTable('event');
  }
}
