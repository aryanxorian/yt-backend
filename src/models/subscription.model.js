import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // the subscriber
        ref:"User"
    },
    channel: {
        type: Schema.Types.ObjectId, // the channel the subscriber is subscribing
        ref:"User"
    }
    
}, {timestamps:true})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)