module.exports = {
    apps: [
        {
            name: 'map-parser',
            script: 'npm',
            args: 'start',
            env: {
                NODE_ENV: 'production',
                PORT: 3002,
            },
        },
    ],
};
