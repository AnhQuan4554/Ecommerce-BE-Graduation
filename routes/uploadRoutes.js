import path from "path";
import express from "express";
import multer from "multer";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const extname = path.extname(file.originalname);
    cb(
      null,
      `${file.fieldname}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 10)}${extname}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpe?g|png|webp/;
  const mimetypes = /image\/jpe?g|image\/png|image\/webp/;

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (filetypes.test(extname) && mimetypes.test(mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Images only"), false);
  }
};

const upload = multer({ storage, fileFilter });
const uploadMultipleImages = upload.array("image", 10); // Cho phép tối đa 10 ảnh

router.post("/", (req, res) => {
  uploadMultipleImages(req, res, (err) => {
    if (err) {
      res.status(400).send({ message: err.message });
    } else if (req.files && req.files.length > 0) {
      const uploadedImages = req.files.map((file) => `/${file.path}`);
      res.status(200).send({
        message: "Images uploaded successfully",
        images: uploadedImages,
      });
    } else {
      res.status(400).send({ message: "No image files provided" });
    }
  });
});

export default router;
