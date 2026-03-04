
import { Router } from "express";
import { getStudentProfile } from "../controllers/studentV2.controller";
import { requireAccessTokenV2, roleAuthenticateV2 } from "../middlewares/authV2.middleware";

const router = Router();

router.get("/profile/:id_number",   
  requireAccessTokenV2, 
  roleAuthenticateV2(["Student"]), 
  getStudentProfile)

export default router;
