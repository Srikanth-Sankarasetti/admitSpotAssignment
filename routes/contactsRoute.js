const express = require("express");
const { routeProtector } = require("./../controllers/authController");
const {
  createContact,
  getAllContacts,
  deleteContactById,
  updateContact,
  batchProcessContacts,
  uploadExcelContacts,
  downloadContactsExcel,
} = require("./../controllers/contactController");

const { upload } = require("./../mildlewares/fileUpload");
const {
  createContactValidation,
} = require("../mildlewares/ContactvalidationEorror");

router = express.Router();

router
  .route("/")
  .get(routeProtector, getAllContacts)
  .post(routeProtector, createContactValidation, createContact);

router
  .route("/:id")
  .delete(routeProtector, deleteContactById)
  .patch(routeProtector, updateContact);

router.route("/batchUpdating").post(routeProtector, batchProcessContacts);
router
  .route("/upload/excel")
  .post(routeProtector, upload.single("file"), uploadExcelContacts);

router.route("/download/excel").get(routeProtector, downloadContactsExcel);
module.exports = router;
