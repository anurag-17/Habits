const getOtherMember = (members, userId) =>
  members.find((member) => member._id.toString() !== userId.toString());

module.exports = { getOtherMember };
