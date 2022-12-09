import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class certificate1670512760191 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'certificate',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'nodeId',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'expiredDay',
            type: 'timestamp',
          },
          {
            name: 'issuedDate',
            type: 'timestamp',
          },
          {
            name: 'certificateIssue',
            type: 'varchar',
          },
          {
            name: 'isIssued',
            type: 'boolean',
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

    await queryRunner.createForeignKey(
      'certificate',
      new TableForeignKey({
        columnNames: ['nodeId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'node',
        onDelete: 'CASCADE',
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('certificate');
  }
}
