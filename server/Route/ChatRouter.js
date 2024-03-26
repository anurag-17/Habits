const express = require("express");
const {
  newGroupChat,
  getMyChat,
  getMyGroups,
  addMembers,
  removeMember,
  leaveGroup,
  sendAttachments,
  getChatDetails,
  renameGroup,
  deleteChat,
  getMessages
} = require("../Controller/Chat");
const { isAuthJWT, authorizeRoles } = require("../Utils/jwt");
const { attachmentsMulter } = require("../Utils/multer");
const router = express.Router();

router.route("/new").post(isAuthJWT, newGroupChat);
router.route("/my").get(isAuthJWT, getMyChat);
router.route("/my/groups").get(isAuthJWT, getMyGroups);
router.route("/addMembers").put(isAuthJWT, addMembers);
router.route("/removeMember").put(isAuthJWT, removeMember);
router.route("/leave/:chatId").delete(isAuthJWT, leaveGroup);
router.route("/addAttachments").post(isAuthJWT, attachmentsMulter, sendAttachments);
router.route("/message/:id").get(isAuthJWT, getMessages);

router.route("/:id") //chatId
  .get(isAuthJWT, getChatDetails)
  .put(isAuthJWT, renameGroup)
  .delete(isAuthJWT, deleteChat);

module.exports = router;
