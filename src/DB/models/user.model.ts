import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  GenderEnum,
  RoleEnum,
  ProviderEnum,
} from "../../common/enum/user.enum";
import { Model } from "mongoose";
import { eventEmitter } from "../../common/utilts/email/email.event.js";
import {
  generateOTP,
  sendEmail,
} from "../../common/utilts/email/send.email.js";
import { emailTemplate } from "../../common/utilts/email/email.template.js";
import { Hash } from "../../common/utilts/security/hash.security.js";
import postModel from "./post.model.js";

export interface IUser {
  firstName: string;
  lastName: string;
  userName?: string;
  email: string;
  password: string;
  confirmed: boolean;
  age: number;
  phone?: string;
  address?: string;
  gender?: GenderEnum;
  role?: RoleEnum;
  profilePic?: string;
  provider?: ProviderEnum;
  friends: Types.ObjectId[];
  createdAt?: Date;
  deletedAt?: Date;
  deletedBy: Types.ObjectId;
  isDeleted: boolean;
  changeCredential: Date;
  updatedAt?: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 20,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 20,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider == ProviderEnum.system ? true : false;
      },
      min: 6,
      max: 30,
      trim: true,
    },
    createdAt: Date,
    address: {
      type: String,
      required: function () {
        return this.provider == ProviderEnum.system ? true : false;
      },
      min: 4,
      max: 30,
      trim: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: Types.ObjectId,
      ref: "User",
      default: null,
    },
    gender: {
      type: String,
      enum: Object.values(GenderEnum),
      default: GenderEnum.male,
    },
    changeCredential: Date,

    phone: {
      type: String,
      trim: true,
    },
    profilePic: String,
    age: {
      type: Number,
      required: function (): boolean {
        return this.provider == ProviderEnum.system ? true : false;
      },
      min: 18,
      max: 60,
    },

    confirmed: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: Object.values(RoleEnum),
      default: RoleEnum.user,
    },
    provider: {
      type: String,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.system,
    },
    friends: [{ type: Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery: true,
  },
);

userSchema
  .virtual("userName")
  .get(function () {
    return this.firstName + " " + this.lastName;
  })
  .set(function (value: string) {
    this.set({ firstName: value.split(" ")[0], lastName: value.split(" ")[1] });
  });
const userModel: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", userSchema);

userSchema.post("findOneAndUpdate", async function (doc) {
  if (!doc?.deletedAt) return;

  const userId = doc._id;

  await postModel.updateMany({ createdBy: userId }, { deletedAt: new Date() });
});

// userSchema.pre("validate", function (){
//   console.log("----pre validate hook ")
// })

// userSchema.post("validate", function (){
//   console.log("----post validate hook ")
// })

// userSchema.pre(
//   "save",
//   function (this: HydratedDocument<IUser> & { is_new: boolean }) {
//     console.log("------------------pre hook 1------------------");
//     console.log(this.isNew);
//     this.is_new = this.isNew;

//     if (this.isModified("password")) {
//       this.password = Hash({ plainText: this.password });
//     }
//   },
// );

// userSchema.post("save", async function () {
//   console.log("------------------post hook 2------------------");

//   const that = this as HydratedDocument<IUser> & { is_new: boolean };
//   console.log(that.is_new);

//   if (that.is_new) {
//     const otp = await generateOTP();
//     eventEmitter.emit("confirmed", async () => {
//       await sendEmail({
//         to: this.email,
//         subject: "hello from saraha app",
//         html: emailTemplate(this.userName, otp),
//       });
//     });
//   }
// });
// userSchema.pre(
//   "updateOne",{ document: true , query: false},
//   function (this: HydratedDocument<IUser> & { is_new: boolean }) {
//     console.log("----post validate hook ");
//     console.log(this);
//   },
// );
// userSchema.pre("insertMany", function (doc) {
//   console.log("=========== ore insertMany ====");
// });
// userSchema.post("insertMany", function (doc) {
//   console.log("=========== post insertMany ====");
// });

// userSchema.pre("findOne", function () {
//   console.log("=========== pre hook findOne ====");
//   console.log(this.getQuery());
//   const query = this.getQuery() as any;
//   const { paranoid, ...rest } = query;
//   console.log({ rest });
//   if (paranoid == false) {
//     this.setQuery({ ...rest });
//   } else {
//     this.setQuery({ ...rest, deletedAt: { $exists: false } });
//   }
// });
export default userModel;
