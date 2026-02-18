module.exports = {
    apps: [
        {
            name: 'map-parser',
            script: 'npx',
            args: 'serve -s out -p 3002',
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
