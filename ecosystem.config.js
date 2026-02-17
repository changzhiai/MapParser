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
        {
            name: 'map-parser-backend',
            script: 'npm',
            args: 'start',
            cwd: './server',
            env: {
                NODE_ENV: 'production',
                SERVER_PORT: 4002,
            },
        },
    ],
};
