"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const user_enum_1 = require("../../common/enum/user.enum");
const post_model_js_1 = __importDefault(require("./post.model.js"));
const userSchema = new mongoose_1.default.Schema({
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
            return this.provider == user_enum_1.ProviderEnum.system ? true : false;
        },
        min: 6,
        max: 30,
        trim: true,
    },
    createdAt: Date,
    address: {
        type: String,
        required: function () {
            return this.provider == user_enum_1.ProviderEnum.system ? true : false;
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
        type: mongoose_1.Types.ObjectId,
        ref: "User",
        default: null,
    },
    gender: {
        type: String,
        enum: Object.values(user_enum_1.GenderEnum),
        default: user_enum_1.GenderEnum.male,
    },
    changeCredential: Date,
    phone: {
        type: String,
        trim: true,
    },
    profilePic: String,
    age: {
        type: Number,
        required: function () {
            return this.provider == user_enum_1.ProviderEnum.system ? true : false;
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
        enum: Object.values(user_enum_1.RoleEnum),
        default: user_enum_1.RoleEnum.user,
    },
    provider: {
        type: String,
        enum: Object.values(user_enum_1.ProviderEnum),
        default: user_enum_1.ProviderEnum.system,
    },
    friends: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery: true,
});
userSchema
    .virtual("userName")
    .get(function () {
    return this.firstName + " " + this.lastName;
})
    .set(function (value) {
    this.set({ firstName: value.split(" ")[0], lastName: value.split(" ")[1] });
});
const userModel = mongoose_1.default.models.User ||
    mongoose_1.default.model("User", userSchema);
userSchema.post("findOneAndUpdate", async function (doc) {
    if (!doc?.deletedAt)
        return;
    const userId = doc._id;
    await post_model_js_1.default.updateMany({ createdBy: userId }, { deletedAt: new Date() });
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
exports.default = userModel;
