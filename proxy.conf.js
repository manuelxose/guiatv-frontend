const PROXY_CONFIG = {
    "/api/tmdb/*": {
        "target": "https://api.themoviedb.org",
        "secure": false,
        "changeOrigin": true,
        "logLevel": "debug",
        "pathRewrite": {
            "^/api/tmdb": ""
        },
        "headers": {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        "onError": function(err, req, res) {
            console.log("TMDb API Proxy Error:", err.message);
            res.writeHead(500, {
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({
                error: 'TMDb API temporarily unavailable',
                message: err.message
            }));
        }
    }
};

module.exports = PROXY_CONFIG;
