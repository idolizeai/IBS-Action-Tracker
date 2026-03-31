const success = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

const created = (res, data) => success(res, data, 201);

const error = (res, message, statusCode = 400) =>
  res.status(statusCode).json({ success: false, error: message });

const notFound = (res, message = 'Not found') => error(res, message, 404);

module.exports = { success, created, error, notFound };
