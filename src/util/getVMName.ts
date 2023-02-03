export const getVMName = (name: string) => {
  let vmName = '';
  if (name.split(' ')[0] === 'Edge') {
    vmName = 'fptEdgeNode' + name.split(' ')[1];
  } else {
    vmName = 'edgeCloudCentral';
  }
  return vmName;
};
