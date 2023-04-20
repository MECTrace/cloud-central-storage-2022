import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository, Timestamp } from 'typeorm';
import { Node } from '../entity/node.entity';
import { shuffleArray } from 'src/util/shuffleArray';
import { IResAccessToken, IResCPU, IResStatusVM, IResAzureMetricAverage } from '../interfaces';
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
  async getNodeById(nodeId: string) {
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
      .where({
        id: nodeId,
      })
      .execute() as Promise<Node[]>;
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

  async getAvailableMemory(vmName: string) {
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

    const availableMemoryURL =
      `https://management.azure.com/subscriptions/${process.env.SUBSCRIPTION_ID}/` +
      `resourceGroups/${process.env.RESOURCE_GROUP}/providers/Microsoft.Compute/virtualMachines/${vmName}/providers/` +
      `microsoft.insights/metrics?api-version=2018-01-01&metricnames=Available%20Memory%20Bytes&` +
      `timespan=${beginTime}/${endTime}&aggregation=average`;

    const res: IResAzureMetricAverage = await firstValueFrom(
      this.httpService.get(availableMemoryURL, { headers: headersRequest }),
    );

    const availableMemoryData = res.data.value[0].timeseries[0].data;
    for (let i = availableMemoryData.length - 1; i >= 0; i--) {
      if (Object.keys(availableMemoryData[i]).length == 2) {
        return availableMemoryData[i].average;
      }
    }
  }

  async getTotalNetwork(vmName: string) {
    const access_token = await this.getAccessToken();

    const headersRequest = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    };

    const now = new Date();
    const beginTime = new Date(
      new Date().setTime(now.getTime() - 60 * 60 * 1000),
    ).toISOString();
    const endTime = new Date(now).toISOString();

    const totalNetWorkInURL =
      `https://management.azure.com/subscriptions/${process.env.SUBSCRIPTION_ID}/` +
      `resourceGroups/${process.env.RESOURCE_GROUP}/providers/Microsoft.Compute/virtualMachines/${vmName}/providers/` +
      `microsoft.insights/metrics?api-version=2018-01-01&metricnames=Network%20In%20Total&` +
      `timespan=${beginTime}/${endTime}&aggregation=average`;

    const resTotalNetWorkIn: IResAzureMetricAverage = await firstValueFrom(
      this.httpService.get(totalNetWorkInURL, { headers: headersRequest }),
    );

    const totalNetWorkInData =
      resTotalNetWorkIn.data.value[0].timeseries[0].data.filter(
        (item) => Object.keys(item).length == 2,
      );

    totalNetWorkInData.forEach((item) => (item.average = item.average / 1024));

    const totalNetWorkOutURL =
      `https://management.azure.com/subscriptions/${process.env.SUBSCRIPTION_ID}/` +
      `resourceGroups/${process.env.RESOURCE_GROUP}/providers/Microsoft.Compute/virtualMachines/${vmName}/providers/` +
      `microsoft.insights/metrics?api-version=2018-01-01&metricnames=Network%20Out%20Total&` +
      `timespan=${beginTime}/${endTime}&aggregation=average`;

    const resTotalNetWorkOut: IResAzureMetricAverage = await firstValueFrom(
      this.httpService.get(totalNetWorkOutURL, { headers: headersRequest }),
    );

    const totalNetWorkOutData =
      resTotalNetWorkOut.data.value[0].timeseries[0].data.filter(
        (item) => Object.keys(item).length == 2,
      );

    totalNetWorkOutData.forEach(
      (item) => (item.average = item.average / 1024 ** 2),
    );

    return {
      totalNetworkIn: totalNetWorkInData,
      totalNetworkOut: totalNetWorkOutData,
    };
  }

  async getDiskOperator(vmName: string) {
    const access_token = await this.getAccessToken();

    const headersRequest = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    };

    const now = new Date();
    const beginTime = new Date(
      new Date().setTime(now.getTime() - 60 * 60 * 1000),
    ).toISOString();
    const endTime = new Date(now).toISOString();

    const diskReadURL =
      `https://management.azure.com/subscriptions/${process.env.SUBSCRIPTION_ID}/` +
      `resourceGroups/${process.env.RESOURCE_GROUP}/providers/Microsoft.Compute/virtualMachines/${vmName}/providers/` +
      `microsoft.insights/metrics?api-version=2018-01-01&metricnames=Disk%20Read%20Bytes&` +
      `timespan=${beginTime}/${endTime}&aggregation=average`;

    const resDiskRead: IResAzureMetricAverage = await firstValueFrom(
      this.httpService.get(diskReadURL, { headers: headersRequest }),
    );

    const resDiskReadData = resDiskRead.data.value[0].timeseries[0].data.filter(
      (item) => Object.keys(item).length == 2,
    );

    resDiskReadData.forEach(
      (item) => (item.average = item.average / 1024 ** 2),
    );

    const diskWriteURL =
      `https://management.azure.com/subscriptions/${process.env.SUBSCRIPTION_ID}/` +
      `resourceGroups/${process.env.RESOURCE_GROUP}/providers/Microsoft.Compute/virtualMachines/${vmName}/providers/` +
      `microsoft.insights/metrics?api-version=2018-01-01&metricnames=Disk%20Write%20Bytes&` +
      `timespan=${beginTime}/${endTime}&aggregation=average`;

    const resDiskWrite: IResAzureMetricAverage = await firstValueFrom(
      this.httpService.get(diskWriteURL, { headers: headersRequest }),
    );

    const resDiskWriteData =
      resDiskWrite.data.value[0].timeseries[0].data.filter(
        (item) => Object.keys(item).length == 2,
      );

    resDiskWriteData.forEach(
      (item) => (item.average = item.average / 1024 ** 2),
    );

    return {
      diskReadOperator: resDiskReadData,
      diskWriteOperator: resDiskWriteData,
    };
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

  async getCPUByNodeId(nodeId: string) {
    const vmName = (await this.getNodeById(nodeId))[0].vmName;
    const cpuUsage = await this.getCPU(vmName);
    return {
      vmName: vmName,
      cpuUsage: cpuUsage.average,
      updateAt: cpuUsage.timeStamp,
    };
  }

  async getRAMByNodeId(nodeId: string) {
    const vmName = (await this.getNodeById(nodeId))[0].vmName;
    const availableMemory = await this.getAvailableMemory(vmName);
    const totalMemory = vmName == 'edgeCloudCentral' ? 4 : 2;
    return {
      vmName: vmName,
      ramUsage:
        100 - Math.round((availableMemory * 100) / (totalMemory * 1024 ** 3)),
      updateAt: new Date(),
    };
  }

  async getTotalNetworkByNodeId(nodeId: string) {
    const vmName = (await this.getNodeById(nodeId))[0].vmName;
    const totalNetWork = await this.getTotalNetwork(vmName);
    return {
      vmName: vmName,
      totalNetWorkIn: totalNetWork.totalNetworkIn,
      totalNetWorkOut: totalNetWork.totalNetworkOut,
      updateAt: new Date(),
    };
  }

  async getDiskOperatorByNodeId(nodeId: string) {
    const vmName = (await this.getNodeById(nodeId))[0].vmName;
    const diskOperator = await this.getDiskOperator(vmName);
    return {
      vmName: vmName,
      diskReadOperator: diskOperator.diskReadOperator,
      diskWriteOperator: diskOperator.diskWriteOperator,
      updateAt: new Date(),
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
        this.updateStatus(vm, access_token).catch((err) => console.log(err)),
      );
    }

    Promise.all(promises)
      .then((response) => console.log(response))
      .catch((err) => console.log(err));

    return '[Done] Update Successfully';
  }
}
