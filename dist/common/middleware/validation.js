"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validation_GQL = exports.validation = void 0;
const global_error_handler_1 = require("../utilts/global-error-handler");
const graphql_1 = require("graphql");
const validation = (schema) => {
    return (req, res, next) => {
        const validationError = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            if (req?.file) {
                req.body.attachment = req.file;
            }
            if (req?.files) {
                req.body.attachments = req.files;
            }
            const result = schema[key].safeParse(req[key]);
            if (!result.success) {
                validationError.push(result.error.message);
                // throw new AppError(result.error.message, 400);
            }
        }
        if (validationError.length > 0) {
            throw new global_error_handler_1.AppError(JSON.parse(validationError), 400);
        }
        return next();
    };
};
exports.validation = validation;
const Validation_GQL = async (schema, data) => {
    const errorValidation = [];
    const result = await schema.safeParseAsync(data);
    if (!result?.success) {
        const errors = result.error.issues.map((err) => {
            return {
                path: err.path[0],
                message: err.message,
            };
        });
        errorValidation.push(...errors);
    }
    if (errorValidation.length) {
        throw new graphql_1.GraphQLError("Validation failed", {
            extensions: {
                code: "BAD_REQUEST",
                status: 400,
                errors: errorValidation,
            },
        });
    }
};
exports.Validation_GQL = Validation_GQL;
