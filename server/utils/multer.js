import multer from "multer";
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp') // Specify the directory where uploaded files will be stored
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname) // Rename the file to prevent naming conflicts
    }
  })
  
  // Initialize Multer upload middleware
  export const upload = multer({ storage: storage });