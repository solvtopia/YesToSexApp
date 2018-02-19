var app = {
    // Application Constructor
    initialize: function () {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function () {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function () {
        app.receivedEvent('deviceready');

        setupTheApp();
    },
    // Update DOM on a Received Event
    receivedEvent: function (id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

function setupTheApp() {
    // this catches the querystring if the app is opend from a link
    var queryString;
    function handleOpenURL(url) {
        setTimeout(function () {
            if (url !== "") {
                queryString = url.substr(url.lastIndexOf('//') + 1, url.length).replace('/', '');
            }
        }, 0);
    }

    // get the gps location
    localStorage.setItem('ss_gpsLat', '-1');
    localStorage.setItem('ss_gpsLon', '-1');
    navigator.geolocation.getCurrentPosition(onGpsSuccess, onGpsError, { enableHighAccuracy: true });
}

function onGpsSuccess(position) {
    localStorage.setItem('ss_gpsLat', position.coords.latitude);
    localStorage.setItem('ss_gpsLon', position.coords.longitude);
    console.log('GPS Success');

    // finish setting up the app
    if (localStorage.getItem('ss_deviceId') === null) {
        var guid = createGuid();
        localStorage.setItem('ss_deviceId', guid);
    }
    localStorage.setItem('ss_devicePlatform', getPlatform());

    getAppSettings('', true);

    setUrl();
}

function onSimSuccess(result) {
    localStorage.setItem('ss_phoneNumber', result.phoneNumber);
    console.log('SIM Success');
}

function onCallSuccess(result) {
    console.log('Call Success');
}


// Android only: check sim permission
function hasSimReadPermission() {
    window.plugins.sim.hasReadPermission(successReadPermissionCallback, errorReadPermissionCallback);
}

// Android only: request sim permission
function requestSimReadPermission() {
    window.plugins.sim.requestReadPermission(successRequestReadPermissionCallback, errorRequestReadPermissionCallback);
}

function successReadPermissionCallback() {
    localStorage.setItem('ss_phoneNumber', 'Unavailable');
    window.plugins.sim.getSimInfo(onSimSuccess, onSimError);
}

function successRequestReadPermissionCallback() {
    successReadPermissionCallback();
}

function onGpsError(error) {
    localStorage.setItem('ss_gpsLat', '-1');
    localStorage.setItem('ss_gpsLon', '-1');
    console.log('GPS Error: ' + error.code + ': ' + error.message);
}

function onSimError(error) {
    localStorage.setItem('ss_phoneNumber', 'Unavailable');
    console.log('SIM Error: ' + error.code + ': ' + error.message);
}

function onCallError(result) {
    console.log('Call Error: ' + result);
}

function errorReadPermissionCallback() {
    requestSimReadPermission();
}
function errorRequestReadPermissionCallback() { }

function getAppSettings(setting, forceRefresh) {
    // gets a setting from the settings string
    // available settings are: loginType, password, emergencyNumber, numberAction
    var retVal = undefined;

    // default the parameters
    setting = setting || '';
    forceRefresh = forceRefresh || false;

    if (forceRefresh) {
        // gets the app settings from the server
        localStorage.setItem('ss_appSettings', '');
        var rq = createWebRequest('http://www.solvtopia.com/safelysocial.asp?action=settings&deviceid=' + localStorage.getItem('ss_deviceId') + '&platform=' + localStorage.getItem('ss_devicePlatform'));
        if (rq) {
            rq.onload = function () {
                var rs = rq.responseText;
                rs = rs.substr(0, rs.indexOf('<') - 1);
                localStorage.setItem('ss_appSettings', rs);

                // pull the named setting from the settings string
                if (setting !== '') { retVal = getSettingByName(rs, setting); }

                console.log('Platform: ' + localStorage.getItem('ss_devicePlatform'));
                console.log('DeviceId: ' + localStorage.getItem('ss_deviceId'));
                console.log('GPS: ' + localStorage.getItem('ss_gpsLat') + ', ' + localStorage.getItem('ss_gpsLon'));
                console.log('AppSettings: ' + localStorage.getItem('ss_appSettings'));
                console.log('PhoneNumber: ' + localStorage.getItem('ss_phoneNumber'));
            };
            //rq.onreadystatechange = handler;
            rq.send();
        }
    }

    // pull the named setting from the settings string
    if (setting !== '' && !forceRefresh) { retVal = getSettingByName(localStorage.getItem('ss_appSettings'), setting); }

    return retVal;
}

function getSettingByName(settings, settingName) {
    var retVal = undefined;

    var partsOfStr = settings.split('|');
    partsOfStr.forEach(function (element) {
        if (element.toLowerCase().startsWith(settingName.toLowerCase())) {
            var parts = element.split('=');
            retVal = parts[1];
        }
    });

    console.log('Named Setting: (' + settingName + ') ' + retVal);

    return retVal;
}

// set the url
function setUrl() {
    var loaded = false;
    var time = 3000;

    // check to see if solvtopia.com is reachable by loading a small image from the site
    // if it loads the image, redirect to the home page
    // if it doesn't load, redirect to the unavailable page
    var img = document.body.appendChild(document.createElement("img"));
    img.onload = function () {
        loaded = true;
        //if (localStorage.getItem('ss_deviceLoggedIn') !== null) {
        //    // if the user has already logged in before then send them straight to the home
        //    window.location.href = 'switchboard.html';
        //} else { window.location.href = 'login.html'; }
        window.location.href = 'switchboard.html';
    };
    img.onerror = function () {
        loaded = false;
    };

    // timer to go to the unavailable page if the image cannot be loaded after a set amount of time
    setTimeout(function () {
        if (loaded === false) {
            window.location.href = 'unavailable.html';
        } else {
            //if (localStorage.getItem('ss_deviceLoggedIn') !== null) {
            //    // if the user has already logged in before then send them straight to the home
            //    window.location.href = 'switchboard.html';
            //} else { window.location.href = 'login.html'; }
            window.location.href = 'switchboard.html';
        }
    }, time);

    img.src = "http://solvtopia.com/images/empty.png?" + Math.random();
}

function logCall(a) {
    var rq = createWebRequest('http://www.solvtopia.com/safelysocial.asp?action=log&a=' + a + '&n=' + localStorage.getItem('ss_phoneNumber') + '&t=' + getParameterByName('t') + '&lat=' + localStorage.getItem('ss_gpsLat') + '&lon=' + localStorage.getItem('ss_gpsLon') + '&deviceid=' + localStorage.getItem('ss_deviceId') + '&platform=' + localStorage.getItem('ss_devicePlatform'));
    if (rq) {
        rq.onload = function () {
            var rs = rq.responseText;

            console.log('Call action (' + a + ') from GPS ' + localStorage.getItem('ss_gpsLat') + ', ' + localStorage.getItem('ss_gpsLon'));
        };
        //rq.onreadystatechange = handler;
        rq.send();
    }
}


// *****************************************************************************************************************
// WORKERS *********************************************************************************************************
// *****************************************************************************************************************

function getPlatform() {
    var agt = navigator.userAgent.toLowerCase();

    if (agt.indexOf('iphone') > 0) {
        return 'iPhone';
    } else if (agt.indexOf('ipod') > 0) {
        return 'iPod';
    } else if (agt.indexOf('ipad') > 0) {
        return 'iPad';
    } else if (agt.indexOf('android') > 0 && agt.indexOf('mobile') > 0) {
        return 'AndroidPhone';
    } else if (agt.indexOf('android') > 0) {
        return 'AndroidTablet';
    } else if (agt.indexOf('winphone') > 0) {
        return 'WindowsPhone';
    } else {
        return 'Desktop';
    }
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function createWebRequest(url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
        xhr.open('post', url, true);
    } else if (typeof XDomainRequest !== "undefined") {
        xhr = new XDomainRequest();
        xhr.open('post', url);
    } else {
        xhr = null;
    }
    return xhr;
}

// create a guid for the device id
function createGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}