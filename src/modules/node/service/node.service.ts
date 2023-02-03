import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { getVMName } from 'src/util/getVMName';
import { Repository } from 'typeorm';
import { Node } from '../entity/node.entity';

@Injectable()
export class NodeService {
  constructor(
    @InjectRepository(Node)
    private nodeRepository: Repository<Node>,
    private httpService: HttpService,
  ) {}

  /**
   * Find all Edges with corresponding RSUs, OBUs
   * @returns {Promise<ListNodeDto>}
   */
  async findAll(): Promise<Node[]> {
    return this.nodeRepository
      .createQueryBuilder('node')
      .select([
        '"node"."id"',
        '"node"."name"',
        '"node"."typeNode"',
        '"node"."status"',
        '"node"."createdAt"',
        '"node"."updatedAt"',
      ])
      .orderBy('name', 'ASC')
      .execute() as Promise<Node[]>;
  }

  async findOne(name: string): Promise<Node> {
    return this.nodeRepository.findOne({
      name,
    });
  }

  async getNode(): Promise<{ id: string; name: string }[]> {
    return this.nodeRepository
      .createQueryBuilder()
      .select(['id', 'name'])
      .execute() as Promise<{ id: string; name: string }[]>;
  }

  async getNodeById(nodeId: string): Promise<{ name: string }[]> {
    return this.nodeRepository
      .createQueryBuilder()
      .select(['name'])
      .where({
        id: nodeId,
      })
      .execute() as Promise<{ name: string }[]>;
  }

  async getAccessToken() {
    const url = process.env.VM_URL;

    const payload = {
      grant_type: 'client_credentials',
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      resource: 'https://management.azure.com/',
    };

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const { data } = await firstValueFrom(
      this.httpService.post(url, payload, { headers: headers }),
    );
    return data.access_token;
  }

  async getCPU(vmName: string) {
    let access_token = await this.getAccessToken();

    const headersRequest = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    };

    let now = new Date();
    let beginTime = new Date(
      new Date().setTime(now.getTime() - 5 * 60 * 1000),
    ).toISOString();
    let endTime = new Date(now).toISOString();

    const url =
      `https://management.azure.com/subscriptions/${process.env.SUBSCRIPTION_ID}/` +
      `resourceGroups/${process.env.RESOURCE_GROUP}/providers/Microsoft.Compute/virtualMachines/${vmName}/providers/` +
      `microsoft.insights/metrics?api-version=2018-01-01&metricnames=Percentage%20CPU&` +
      `timespan=${beginTime}/${endTime}`;

    const { data } = await firstValueFrom(
      this.httpService.get(url, { headers: headersRequest }),
    );

    const timeseries_data = data.value[0].timeseries[0].data;
    for (let i = timeseries_data.length - 1; i >= 0; i--) {
      if (Object.keys(timeseries_data[i]).length == 2) {
        return timeseries_data[i];
      }
    }
    return [];
  }

  async getCPUCurrentNode() {
    const cpu_usage = await this.getCPU(process.env.VM_NAME);
    return {
      vmName: process.env.VM_NAME,
      cpuUsage: cpu_usage.average,
      updateAt: cpu_usage.timeStamp,
    };
  }

  async getAvailableNode() {
    // Chinh lai thanh cloud url
    // const url = 'http://localhost:3001/api/node/list';
    const url = process.env.NODE_URL + '/api/node/list';

    // get data node list
    const { data } = await firstValueFrom(this.httpService.get(url));

    const nameOfAvailableNodes = [];
    const vmOfNodes = [];
    const vmOfAvailableNodes = [];

    // get available node
    data
      .filter(
        (element) =>
          element.status === 'On' && element.id != process.env.NODE_ID,
      )
      .forEach((element) => nameOfAvailableNodes.push(element.name));

    // get name of vms
    nameOfAvailableNodes.forEach((element) => {
      const vmName = getVMName(element);
      vmOfNodes.push(vmName);
    });

    // call api get usage cpu
    for (const vmName of vmOfNodes) {
      const cpu = await this.getCPU(vmName);
      // set 1 for debug only
      if (cpu.average < 1) {
        vmOfAvailableNodes.push({
          vmName: vmName,
          cpuUsage: cpu.average,
          updateAt: cpu.timeStamp,
        });
      }
    }
    return {
      availableNode: vmOfAvailableNodes,
    };
  }

  // async getSendNode() {
  //   const availableNode = await this.getAvailableNode();
  //   return await shuffleArray(availableNode["availableNode"]);
  // }
}
