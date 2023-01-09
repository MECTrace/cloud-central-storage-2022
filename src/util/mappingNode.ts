export const getPrefixDomain = (nameOfNode: string) => {
  const number = nameOfNode.replace('Edge', '').trim();
  return 'ptanode' + parseInt(number).toString();
};
