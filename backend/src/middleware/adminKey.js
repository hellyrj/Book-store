export const requireAdminKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) return res.status(401).json({ error: "API key required" });

  if (apiKey !== process.env.ADMIN_API_KEY)
    return res.status(403).json({ error: "Invalid API key" });

  next(); // API key is valid → allow admin actions
};
