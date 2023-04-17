export interface IGetAccessToken {
  access_token: string;
}

export interface IResAccessToken {
  data: IGetAccessToken;
}

export interface IGetCPU {
  value: Array<{
    timeseries: Array<{
      data: Array<{ average: number; timeStamp: string }>;
    }>;
  }>;
}

export interface IResCPU {
  data: IGetCPU;
}

export interface IGetStatusVM {
  statuses: Array<{ code: string }>;
}

export interface IResStatusVM {
  data: IGetStatusVM;
}

export interface IResRAM {
  data: {
    value: {
      timeseries: {
        data: {
          average: number;
          timeGrain: string;
        }[];
      }[];
    }[];
  };
}