const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

/*
** Collection Name: Users
*/

const userSchema = new Schema(
  {
    firstName     : { type: String, required: true },
    lastName      : { type: String, required: true },
    email         : { type: String, required: true, unique: true },
    password      : { type: String, required: true },
    profileImage  : { type: String, required: true },
    dateOfBirth   : { type: Date, required: true },
    isDeleted     : { type: Boolean, default: false }
  },
  { timestamps: true }
);

/*
**  Generate password hash
*/
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  next();
});

/*
**  Check unique email
*/
userSchema.pre('save', true, function (next, done) {
  let self = this;
  mongoose.models['user'].findOne({
    _id: { $ne: self._id },
    email: self.email,
    isDeleted: false
  },
  function (err, user) {
    if (err || user) {
      done(err ? err : new Error(`User with ${self.email} email is already registered.`));
    }
    done();
  });
  next();
});

/*
**  Validate users password
*/
userSchema.methods.isValidPassword = async function (password) {
  const user = this;
  const compare = await bcrypt.compare(password, user.password);
  return compare;
};


module.exports = mongoose.model('user', userSchema, 'users');