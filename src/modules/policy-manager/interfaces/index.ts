export interface ResSinglePolicy {
  nodeId: string;
  policyId: string;
}

export interface ResAllPolices {
  nodeList: any[];
  id: string;
  policyName: string;
  description: string;
  cpuOverPercent: number;
  cpuLessThanPercent: number;
  numberResendNode: number;
  activated: boolean;
}

export interface ResPolices {
  id: string;
  policyName: string;
  nodeName: string;
  description: string;
  cpuOverPercent: number;
  cpuLessThanPercent: number;
  numberResendNode: number;
  activated: boolean;
}

export interface ResPoliceByNodeId {
  nodeId: string;
  nodeName: string;
  policyId: string;
  policyName: string;
  cpuOverPercent: number;
  cpuLessThanPercent: number;
  numberResendNode: number;
  activated: boolean;
}
