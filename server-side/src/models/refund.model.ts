import mongoose, { Schema, Document, Types } from "mongoose";
import { IRefund } from "./refund.interace";

export interface IRefundDocument extends IRefund, Document {}

const refundSchema = new Schema<IRefundDocument>({
 
    refund_id: {
         type: String,
     },
    order_id: {
           type: Types.ObjectId,
     },
        order_reference:  {
         type: String,
     },
        product_id: {
         type: Types.ObjectId,
     },
        product_name:  {
         type: String,
     },
        refund_price:  {
         type: Number,
     },
        refund_admin:  {
         type: String,
     },
        refund_admin_id:  {
         type: String,
     },
        refund_date:  {
         type: Date,
     },
});

export const Refund = mongoose.model<IRefundDocument>(
  "Refund",
  refundSchema
);
