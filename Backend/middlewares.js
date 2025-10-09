const {userSchema,loginSchema} = require("./schema");

module.exports.validateUser = (req,res,next) => {
    const {error} = userSchema.validate(req.body);
    // console.log(error);

    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        return res.status(401).json({errMsg});
    }

    next();
}

module.exports.validateLogin = (req,res,next) => {
    const {error} = loginSchema.validate(req.body);
    // console.log(error);

    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        return res.status(401).json({errMsg});
    }

    next();
}