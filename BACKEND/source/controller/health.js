const health = (request, response) => {
    response.status(200).json({
        success: true,
        data: { status: 'ok' },
    })
}

module.exports = { health }