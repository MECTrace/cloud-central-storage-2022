const splitNumberFromName = (name: string) => {
  const number = name.replace('EDGE ', '');
  return 'ptanode' + parseInt(number).toString();
};

export const getPrefixDomain = (nameOfNode: string) => {
  if (nameOfNode !== 'CLOUD CENTRAL')
    return splitNumberFromName(nameOfNode) + '.';
  return 'ptacloud.';
};