import { Request, Response } from "express";
import { IStudent } from "../models/student.interface";
import { Student } from "../models/student.model";


export const getStudentProfile = async(req: Request, res: Response)=>{
  try{
    const {id_number} = req.params;
    const profile: IStudent | null = await Student.findOne({id_number})
    .select('id_number first_name last_name course year email campus -_id');;
    if(!profile){
      return res.status(404).json({message: "Profile Not Found!"});
    }
    return res.status(200).json({ data: profile });
  }catch(error){
    console.error('Error fetching student profile:', error);
    return res.status(500).json({ message: 'Server error' });  
  }
}
