const multer = require("multer");
const AppError = require("./appError");
const path = require("path");

// Configure multer for file upload (storage and filter)
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "files");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); //file extension extraction
    console.log(ext);
    cb(null, `user-${req.id}-${Date.now()}${ext}`);
  },
});

//filter only accept .csv or .xlsx files

const multerFilter = (req, file, cb) => {
  console.log("File MIME Type:", file.mimetype);
  console.log("File Original Name:", file.originalname);
  const filetypes = /csv|xlsx/;
  const mimetype = filetypes.test(file.mimetype); // Test against MIME type
  const extname = filetypes.test(
    file.originalname.split(".").pop().toLowerCase()
  );
  const csvMimetype = "text/csv";
  const xlsxMimetype =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  const isCsv =
    file.mimetype === csvMimetype &&
    filetypes.test(file.originalname.split(".").pop().toLowerCase());
  const isXlsx =
    file.mimetype === xlsxMimetype &&
    filetypes.test(file.originalname.split(".").pop().toLowerCase());

  console.log(isCsv, isXlsx);
  if (isCsv || isXlsx) {
    cb(null, true); // Accept the file if it matches
  } else {
    cb(new AppError("Only .csv and .xlsx files are allowed!", 400), false); // Reject the file if it doesn't match
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

module.exports = { upload };
