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

export const CORS_ORIGIN = [process.env.FE_URL, 'http://localhost:3000'];

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

const CERTIFICATE_FOLDER = 'cert/';
export const ROOT_CA = CERTIFICATE_FOLDER + process.env.CA_CERT;
export const CLOUD_KEY = CERTIFICATE_FOLDER + process.env.CLOUD_KEY;
export const CLOUD_CERT = CERTIFICATE_FOLDER + process.env.CLOUD_CERT;
export const CLOUD_REQ = CERTIFICATE_FOLDER + 'cloud-req.pem';
export const CERTIFICATE_API = '/api/certificate';
export const FORCE_UPLOAD_API = CERTIFICATE_API + '/forceUploadCertificate';
