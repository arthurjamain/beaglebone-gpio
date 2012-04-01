var fs      = require('fs'),
    sys     = require('sys'),
    spawn   = require('child_process').spawn,
    path    = require('path'),
    pollers = [],
    _       = require('./underscore')._,
    pins    = require('./config').pins,
    _pollingscript = 'polling.py';
        
exports.addInputListener = function(opt) {
    
    _.defaults(opt, {   speed: 'fast',
                        edge: 'falling',
                        pull: 'down',
                        key: pollers.length,
                        port: 80});
    
    addListener(opt);
    
    /**
     * 
     * Configure selected pin
     * 
     **/
     
    function addListener(opt) {
        var pin = pins[opt.pin];
        if(pin.mux) {
            // First, Muxing
            try {
                // Mux options on 7 bits
                // We want mode 7 to do gpio input -> xxxx111 -> 7
                // We alswo want pullup activated -> xxx0111 -> 7
                // ... And input to be activated -> x1x0111 -> 39
                var muxval = 39;
                if(opt.pull && opt.pull == 'up') 
                    muxval += 16;
                
                if(opt.speed && opt.speed == 'slow')
                    muxval += 64;
                
                var muxfile = fs.openSync(
                    "/sys/kernel/debug/omap_mux/" + pin.mux, "w"
                );
                // The val is written as an hex value
                fs.writeSync(muxfile, muxval.toString(16), null);
            } catch(ex3) {  
                console.log("Exception3: " + ex3);
                return false;
            }
            
            // Then, export the pin
            try {
                fs.writeFileSync("/sys/class/gpio/export", "" + pin.gpio);
            } catch(ex2) {
                console.log("PIN already exported: " + pin.gpio);
            }  
            // Finaly, set its options
            try {
                // Direction is in
                fs.writeFileSync("/sys/class/gpio/gpio" + pin.gpio + "/direction", 'in');
                // Edge : falling, rising, both
                if(opt.edge == 'falling' || opt.edge == 'rising' || opt.edge == 'both')
                    fs.writeFileSync("/sys/class/gpio/gpio" + pin.gpio + "/edge", opt.edge);
                
                _listen("/sys/class/gpio/gpio" + pin.gpio + "/value", opt.method, opt.key, opt.port);
            }
            catch(ex4) {
                console.log('Exception4: '+ex4);
                return false;
            }  
        }
    }
     
    
    /**
     * 
     * Listen for change on value file of the specified GPIO
     * 
     **/
    
    function _listen(valuePath, method, key, port) {
        var scriptpath = path.join(__dirname, _pollingscript);
        console.log('python', [scriptpath, valuePath, method, port]);
        pollers[key] = spawn('python', [scriptpath, valuePath, method, port]);
        
        console.log('Listening to '+key+' with HTTP callback '+method);
        
        pollers[key].on('exit', function (code) {
            console.log('child process exited with code ' + code);
        });
    };
    
    function removeListener(key) {
        pollers[key].exit();   
    }
};


exports.addOutputControl = function(opt) {
    
};
