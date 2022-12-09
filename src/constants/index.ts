export const SocketEvents = {
  CENTRAL_INIT: 'CENTRAL_INIT',
  CENTRAL_UPDATE: 'CENTRAL_UPDATE',
  NODE_INIT: 'NODE_INIT',
  NODE_UPDATE: 'NODE_UPDATE',
};

export const STATUS = {
  SUCCESS: 'Succeeded',
  FAIL: 'Failed',
  PENDING: 'Pending',
};

export const SocketStatus = {
  FAIL: 2,
  SUCCESS: 1,
  DONE: -1,
  PENDING: 0,
};

export const CORS_ORIGIN = [process.env.FE_URL, process.env.NODE_URL_01];

export const WEB_SOCKET_GATEWAY = {
  origin: CORS_ORIGIN,
  credentials: true,
  preflightContinue: false,
};
export const SWAGGER_API = {
  query: {
    page: 'page',
  },
  params: {
    sendNodeId: 'sendNodeId',
  },
};
