export interface IGetBySendNodeId {
  fileId: string;
  sendNode: string;
  sendNodeId: string;
  receiveNodeId: string;
  receiveNode: string;
  status: string;
  createdAt: string;
  fileType: string;
  policyName: string;
}

export interface IGetByFileIdResponse {
  id: string;
  sendNodeId: string;
  receiveNodeId: string;
  fileId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  policyName: string;
}

export interface IEventResult {
  event_id: string;
  event_sendNodeId: string;
  event_receiveNodeId: string;
  event_fileId: string;
  event_status: string;
  event_createdAt: string;
  event_updatedAt: string;
  event_policyName: string;
}

export interface IInsertResult {
  raw: [{ id: string }];
}

export interface ISendDataEvent {
  sendNodeId: string;
  receiveNodeId: string;
  data: {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: bigint;
  };
  timestamp: bigint;
}
