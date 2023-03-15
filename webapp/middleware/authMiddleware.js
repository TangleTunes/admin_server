const { get_user } = require('../util/tangletunes');

const authMiddleware = async (req, res, next) => {
    if (req.session.address) {
        req.user = await get_user(req.session.address)
        return next()
    }
    
    return res.redirect('/');
}

module.exports = authMiddleware;