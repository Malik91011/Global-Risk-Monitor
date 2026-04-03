export function requireAuth(req, res, next) {
    const apiKey = req.headers["x-api-key"] || req.query.apiKey;
    const validKey = process.env.API_KEY || "dev_secret_key";
    if (!apiKey || apiKey !== validKey) {
        res.status(401).json({ error: "Unauthorized", message: "Invalid or missing API key" });
        return;
    }
    next();
}
