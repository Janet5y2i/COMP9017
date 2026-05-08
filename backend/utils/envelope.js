/**
 * Helper function to envelope a OK response
 */
export function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

/**
 * Helper function to envelope a error response
 */
export function fail(res, error, status = 400) {
  return res.status(status).json({ success: false, error });
}

