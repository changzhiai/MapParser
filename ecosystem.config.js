module.exports = {
    apps: [
        {
            name: 'map-parser',
            script: 'npm',
            args: 'run serve',
            env: {
                NODE_ENV: 'production',
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
