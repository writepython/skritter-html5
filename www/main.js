(function() {

    requirejs.config({
        baseUrl: './',
        callback: loadLibraries,
        locale: undefined,
        paths: app.configs.paths,
        shim: app.configs.shim,
        urlArgs: app.isLocalhost() ? "bust=" + (new Date()).getTime() : undefined
    });

    function loadLibraries() {
        requirejs(['application/Libraries'], function() {
            $(document).ready(loadApplication);
        });
    }

    function loadApplication() {
        requirejs(['application/Application'], function(Application) {
            window.app = $.extend(new Application(), window.app);
            window.app.start();
        });
    }

})();