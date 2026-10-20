const health = (request, response) => {
    response.status(200).json({
        status: 'ok',
        service: 'security-checker-api',
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
    })
}

module.exports = { health }