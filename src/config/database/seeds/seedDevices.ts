import { Node } from 'src/modules/node/entity/node.entity';
import { Connection } from 'typeorm';
import { Factory, Seeder } from 'typeorm-seeding';

export default class SeedDevices implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<void> {
    await connection
      .createQueryBuilder()
      .insert()
      .into(Node)
      .values([
        { name: 'Cloud Central', typeNode: 0, status: 'Down' },
        { name: 'Edge 01', typeNode: 1, status: 'Down' },
        { name: 'Edge 02', typeNode: 1, status: 'Down' },
        { name: 'Edge 03', typeNode: 1, status: 'Down' },
        { name: 'Edge 04', typeNode: 1, status: 'Down' },
        { name: 'Edge 05', typeNode: 1, status: 'Down' },
        { name: 'Edge 06', typeNode: 1, status: 'Down' },
        { name: 'Edge 07', typeNode: 1, status: 'Down' },
        { name: 'Edge 08', typeNode: 1, status: 'Down' },
        { name: 'Edge 09', typeNode: 1, status: 'Down' },
      ])
      .execute();
  }
}
