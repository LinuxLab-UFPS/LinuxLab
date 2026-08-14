/** Nombre del grupo Unix dentro del contenedor, derivado del id del curso. */
function groupNameOf(groupId) {
  return `grp_${groupId.replace(/-/g, "").substring(0, 8)}`
}

module.exports = { groupNameOf }
