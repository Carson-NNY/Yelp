// schemas.js 
// 这里 error handle 不是handle client side会出现的invalid input,
//  而是server side (通过Postman等平台发送的data)
const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');  //  it helps prevent malicous input from hacker (insert scripts... )

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
            //  do not forget: npm i sanitize-html for sanitizeHtml(..) to work, which is to strip scripts...
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension)

module.exports.campgroundSchema = Joi.object({
    // 这里选择campground 因为我们别的file 中的form submit 的形式就是 campground[...], 所以这里也是利用这个
    campground: Joi.object({
        title: Joi.string().required().escapeHTML(),
        price: Joi.number().required().min(0),
        location: Joi.string().required().escapeHTML(),
        description: Joi.string().required().escapeHTML()
    }).required(),
     // set deleteImages not required
    deleteImages: Joi.array()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        body: Joi.string().required().escapeHTML()
    }).required()
})





