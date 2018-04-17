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
    localStorage.setItem('yts_gpsLat', '-1');
    localStorage.setItem('yts_gpsLon', '-1');
    navigator.geolocation.getCurrentPosition(onGpsSuccess, onGpsError, { enableHighAccuracy: true });
}

function onGpsSuccess(position) {
    localStorage.setItem('yts_gpsLat', position.coords.latitude);
    localStorage.setItem('yts_gpsLon', position.coords.longitude);
    console.log('GPS Success');

    // finish setting up the app
    if (localStorage.getItem('yts_deviceId') === null) {
        var guid = createGuid();
        localStorage.setItem('yts_deviceId', guid);
    }
    localStorage.setItem('yts_devicePlatform', getPlatform());

    getAppSettings('', true);

    setUrl();
}

function onGpsError(error) {
    localStorage.setItem('yts_gpsLat', '-1');
    localStorage.setItem('yts_gpsLon', '-1');
    console.log('GPS Error: ' + error.code + ': ' + error.message);
}

function getAppSettings(setting, forceRefresh) {
    // gets a setting from the settings string
    // available settings are: loginType, password, emergencyNumber, numberAction
    var retVal = undefined;

    // default the parameters
    setting = setting || '';
    forceRefresh = forceRefresh || false;

    if (forceRefresh) {
        // gets the app settings from the server
        localStorage.setItem('yts_appSettings', '');
        var rq = createWebRequest('http://www.solvtopia.com/yestosex.asp?action=settings&deviceid=' + localStorage.getItem('yts_deviceId') + '&platform=' + localStorage.getItem('yts_devicePlatform'));
        if (rq) {
            rq.onload = function () {
                var rs = rq.responseText;
                rs = rs.substr(0, rs.indexOf('<') - 1);
                localStorage.setItem('yts_appSettings', rs);

                // pull the named setting from the settings string
                if (setting !== '') { retVal = getSettingByName(rs, setting); }

                console.log('Platform: ' + localStorage.getItem('yts_devicePlatform'));
                console.log('DeviceId: ' + localStorage.getItem('yts_deviceId'));
                console.log('GPS: ' + localStorage.getItem('yts_gpsLat') + ', ' + localStorage.getItem('yts_gpsLon'));
                console.log('AppSettings: ' + localStorage.getItem('yts_appSettings'));
                console.log('PhoneNumber: ' + localStorage.getItem('yts_phoneNumber'));
            };
            //rq.onreadystatechange = handler;
            rq.send();
        }
    }

    // pull the named setting from the settings string
    if (setting !== '' && !forceRefresh) { retVal = getSettingByName(localStorage.getItem('yts_appSettings'), setting); }

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
        window.location.href = 'home.html';
    };
    img.onerror = function () {
        loaded = false;
    };

    // timer to go to the unavailable page if the image cannot be loaded after a set amount of time
    setTimeout(function () {
        if (loaded === false) {
            window.location.href = 'unavailable.html';
        } else {
            window.location.href = 'home.html';
        }
    }, time);

    img.src = "http://solvtopia.com/images/empty.png?" + Math.random();
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