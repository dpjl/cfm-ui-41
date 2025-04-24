export function parseMediaId(id: string) {
  const isDeleted = id.startsWith('!');
  const cleanId = isDeleted ? id.slice(1) : id;
  const isVideo = cleanId.startsWith('v');
  // group_id = partie numérique avant le point
  const groupId = cleanId.split('.')[0].replace(/^v/, '');
  return {
    isDeleted,
    isVideo,
    cleanId,
    groupId,
    raw: id
  };
} 