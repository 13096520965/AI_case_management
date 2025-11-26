// 统一后端响应格式，便于前端展示与兼容
module.exports = {
  ok: (res, data = {}, message = 'success', status = 200) => {
    return res.status(status).json({ success: true, code: 0, message, data });
  },

  list: (res, items = [], meta = {}, message = 'success', status = 200) => {
    return res.status(status).json({ success: true, code: 0, message, data: { items, meta } });
  },

  fail: (res, code = 1, message = 'error', httpStatus = 500, error = null) => {
    return res.status(httpStatus).json({ success: false, code, message, error });
  }
};
