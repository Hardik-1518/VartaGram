import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    _id: {type: String, required: true },
    email: {type: String, required: true },
    full_name: {type: String, required: true },
    username: {type: String, unique: true },
    bio: {type: String, default: 'Hey there! I am using VartaGram.' },
    profile_picture: {type: String, default: '' },
    cover_photo: {type: String, default: '' },
    location: {type: String, default: '' },
    followers: [{type: String, ref: 'User' }],
    following: [{type: String, ref: 'User' }],
    connections: [{type: String, ref: 'User' }],
},{timestamps: true, minimize: false})

// Add indexes for frequently queried fields
userSchema.index({ username: 1 }); // For username searches
userSchema.index({ email: 1 }); // For email lookups
userSchema.index({ followers: 1 }); // For follower queries
userSchema.index({ following: 1 }); // For following queries

const User = mongoose.model('User', userSchema)

export default User