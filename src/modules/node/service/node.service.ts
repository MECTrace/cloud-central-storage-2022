import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { Node } from '../entity/node.entity';
import { shuffleArray } from 'src/util/shuffleArray';
import { IResAccessToken, IResCPU, IResStatusVM, IResRAM } from '../interfaces';
import { UpdateNodeDto } from '../dto/update-node-dto';

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
        '"node"."vmName"',
        '"node"."status"',
        '"node"."nodeURL"',
        '"node"."createdAt"',
        '"node"."updatedAt"',
      ])
      .orderBy('name', 'ASC')
      .execute() as Promise<Node[]>;
  }

  /**
   * It returns a promise that resolves to a node with the given name
   * @param {string} name - string
   * @returns A promise of a node
   */
  async findOne(name: string): Promise<Node> {
    return this.nodeRepository.findOne({
      name,
    });
  }

  /**
   * It returns a promise of an array of objects with the properties id and name
   * @returns An array of objects with the id and name properties.
   */
  async getNode(): Promise<{ id: string; name: string }[]> {
    return this.nodeRepository
      .createQueryBuilder()
      .select(['id', 'name'])
      .execute() as Promise<{ id: string; name: string }[]>;
  }

  /**
   * It returns the name of the node with the given id
   * @param {string} nodeId - string - The id of the node you want to get.
   * @returns An array of objects with a name property.
   */
  async getNodeById(nodeId: string): Promise<{ name: string }[]> {
    return this.nodeRepository
      .createQueryBuilder()
      .select(['name'])
      .where({
        id: nodeId,
      })
      .execute() as Promise<{ name: string }[]>;
  }

  async updateNode(id: string, data: UpdateNodeDto) {
    await this.nodeRepository.update(id, data);
    return this.getNodeById(id);
  }

  /**
   * It makes a POST request to the Azure AD endpoint, passing in the client ID, client secret, and
   * tenant ID, and returns the access token
   * @returns The access token is being returned.
   */
  async getAccessToken() {
    const url = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/token`;

    const payload = {
      grant_type: 'client_credentials',
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      resource: 'https://management.azure.com/',
    };

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const res: IResAccessToken = await firstValueFrom(
      this.httpService.post(url, payload, { headers: headers }),
    );
    return res.data.access_token;
  }

  /**
   * It gets the CPU usage of a VM in the last 10 minutes
   * @param {string} vmName - The name of the VM you want to get the CPU usage for.
   * @returns The CPU usage of the VM.
   */
  async getCPU(vmName: string) {
    const access_token = await this.getAccessToken();

    const headersRequest = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    };

    const now = new Date();
    const beginTime = new Date(
      new Date().setTime(now.getTime() - 10 * 60 * 1000),
    ).toISOString();
    const endTime = new Date(now).toISOString();

    const url =
      `https://management.azure.com/subscriptions/${process.env.SUBSCRIPTION_ID}/` +
      `resourceGroups/${process.env.RESOURCE_GROUP}/providers/Microsoft.Compute/virtualMachines/${vmName}/providers/` +
      `microsoft.insights/metrics?api-version=2018-01-01&metricnames=Percentage%20CPU&` +
      `timespan=${beginTime}/${endTime}`;

    const res: IResCPU = await firstValueFrom(
      this.httpService.get(url, { headers: headersRequest }),
    );

    const timeseries_data = res.data.value[0].timeseries[0].data;
    for (let i = timeseries_data.length - 1; i >= 0; i--) {
      if (Object.keys(timeseries_data[i]).length == 2) {
        return timeseries_data[i];
      }
    }
  }

  // get CPU current node
  async getCPUCurrentNode() {
    const cpu_usage = await this.getCPU(process.env.VM_NAME);
    return {
      vmName: process.env.VM_NAME,
      cpuUsage: cpu_usage.average,
      updateAt: cpu_usage.timeStamp,
    };
  }

  // get available node
  async getAvailableNode(currentNode: string, cpuLimit: number) {
    // get data node list
    const nodeList = await this.findAll();

    // filter node that we need to get cpu
    const vmOfNodes: Array<{
      name: string;
      vmName: string;
      nodeURL: string;
    }> = [];

    nodeList
      .filter((element) => element.status === 'On' && element.id != currentNode)
      .forEach((element) =>
        vmOfNodes.push({
          name: element.name,
          vmName: element.vmName,
          nodeURL: element.nodeURL,
        }),
      );

    // call api get cpu and add to available node list
    const vmOfAvailableNodes = [];

    for (const vm of vmOfNodes) {
      const cpu = await this.getCPU(vm.vmName);

      if (cpu.average < cpuLimit) {
        vmOfAvailableNodes.push({
          vmName: vm.vmName,
          name: vm.name,
          nodeURL: vm.nodeURL,
          cpuUsage: cpu.average,
          updateAt: cpu.timeStamp,
        });
      }
    }
    return {
      availableNode: shuffleArray(vmOfAvailableNodes),
    };
  }

  async updateStatus(
    vm: { nodeId: string; vmName: string; name: string },
    access_token: string,
  ) {
    const headersRequest = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    };

    const url =
      `https://management.azure.com/subscriptions/${process.env.SUBSCRIPTION_ID}/` +
      `resourceGroups/${process.env.RESOURCE_GROUP}/providers/Microsoft.Compute/` +
      `virtualMachines/${vm.vmName}/instanceView?api-version=2022-11-01`;

    try {
      const res: IResStatusVM = await firstValueFrom(
        this.httpService.get(url, { headers: headersRequest }),
      );

      const statusVM = res.data.statuses.at(-1).code;
      if (statusVM == 'PowerState/deallocated') {
        await this.updateNode(vm.nodeId, { status: 'Down' } as UpdateNodeDto);
        throw Error();
      } else {
        await this.updateNode(vm.nodeId, { status: 'On' } as UpdateNodeDto);
        return 'On';
      }
    } catch {
      await this.updateNode(vm.nodeId, { status: 'Down' } as UpdateNodeDto);
      return 'Down';
    }
  }

  async updateStatusAllNodes() {
    const node_list = await this.findAll();
    const vm_list: Array<{ nodeId: string; vmName: string; name: string }> = [];

    const promises = [];

    node_list.forEach((element) => {
      vm_list.push({
        nodeId: element.id,
        vmName: element.vmName,
        name: element.name,
      });
    });

    const access_token = await this.getAccessToken();
    for (const vm of vm_list) {
      promises.push(
        this.updateStatus(vm, access_token).catch((err) => console.log(err))
      );
    }

    Promise.all(promises)
      .then((response) => console.log(response))
      .catch((err) => console.log(err));

    return '[Done] Update Successfully';
  }

  async getRAM(vmName: string) {
    const access_token = await this.getAccessToken();

    const headersRequest = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    };

    // Get VM details to retrieve total memory
    const vmUrl = `https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Compute/virtualMachines/${vmName}?api-version=2021-03-01`;
    const vmRes = await firstValueFrom(
      this.httpService.get(vmUrl, { headers: headersRequest }),
    );
    const hardwareProfile = vmRes.data.properties.hardwareProfile;
    const totalMemoryInBytes = hardwareProfile.memorySizeInMB * 1024 * 1024;

    const now = new Date();
    const beginTime = new Date(
      new Date().setTime(now.getTime() - 10 * 60 * 1000),
    ).toISOString();
    const endTime = new Date(now).toISOString();

    const url =
      `https://management.azure.com/subscriptions/${process.env.SUBSCRIPTION_ID}/` +
      `resourceGroups/${process.env.RESOURCE_GROUP}/providers/Microsoft.Compute/virtualMachines/${vmName}/providers/` +
      `microsoft.insights/metrics?api-version=2018-01-01&metricnames=Percentage%20CPU&` +
      `timespan=${beginTime}/${endTime}`;

    const res: IResRAM = await firstValueFrom(
      this.httpService.get(url, { headers: headersRequest }),
    );

    const timeseries_data = res.data.value[0].timeseries[0].data;

    for (let i = timeseries_data.length - 1; i >= 0; i--) {
      if (Object.keys(timeseries_data[i]).length == 2) {
        const availableMemory = timeseries_data[i].average;
        const percentAvailable = (availableMemory / totalMemoryInBytes) * 100;
        return percentAvailable.toFixed(2);
      }
    }
  }
}
