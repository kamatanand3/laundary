// middleware/errorHandler.js
export function errorHandler(err, _req, res, _next) {
  console.error(err);
  res.status(err.status || 500).json({
    ok: false,
    error: err.message || "Internal Server Error",
  });
}
