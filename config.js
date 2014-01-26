function config() {
    var environment = (process.env.NODE_ENV ? process.env.NODE_ENV : 'rahul');
    var config_file = './configs/' + environment + '.js';
    var config_data;
    try {
        config_data = require(config_file);
    } catch (err) {
        if (err.code && err.code === 'MODULE_NOT_FOUND') {
            console.error('No config file matching NODE_ENV=' + process.env.NODE_ENV 
                          + '. Requires "' + __dirname + '/' + process.env.NODE_ENV + '.js"');
            process.exit(1);
        } else {
            throw err;
        }
    }

    return config_data;
}

module.exports = config;