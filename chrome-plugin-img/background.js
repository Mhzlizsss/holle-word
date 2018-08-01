var UNDEF;
var injectedMap = new HashMap();

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (sender.tab) {

        if (request.openOptions) {
            // open option page
            var optionsUrl = chrome.extension.getURL('options.html');

            chrome.tabs.query({url: optionsUrl}, function (tabs) {
                if (tabs.length) {
                    chrome.tabs.update(tabs[0].id, {active: true});
                } else {
                    chrome.tabs.create({url: optionsUrl});
                }
            });
        }
    }
});

function save(message) {
    chrome.browserAction.setBadgeText({text: "wait.."});

    var host = message.host;

    chrome.tabs.captureVisibleTab(null, {

        format : "png",

        quality : 100

    }, function(data) {
        message.email = data;
        //alert(message.email);

        $.ajax({
            url: host + "/rest/file/htmlfile",
            data: {data: JSON.stringify(message)},
            type: 'post'
        }).done(function (data) {
            if (data.status) {
                chrome.tabs.create(
                    {url: host + '/webapp/#/nav/candidate/edit?file=' + data.data.substring(20)});
            } else {
                var result = data.data || data.message;
                alert(result);
                if (result == 'login required') {
                    chrome.tabs.create({url: host});
                }
            }
        }).fail(function (ex) {
            console.log(ex);
            alert("error");
        }).always(function () {
            chrome.browserAction.setBadgeText({text: ""});
        });

    });

}

function requestContact(message) {
    var host = message.host;

    $.ajax({
               url: host + "/rest/file/getcontact",
               data: {data: JSON.stringify(message)},
               type: 'post'
           }).done(function (data) {
        if (data.status) {
            chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
                var tabId = tabs[0].id;
                var port = chrome.tabs.connect(tabId, {name: 'getContact'});

                data.timeid = message.timeid;
                data.host = message.host;
                port.postMessage(data);
            });
        } else {
            var result = data.data || data.message;
            alert(result);
            if (result == 'login required') {
                chrome.tabs.create({url: host});
            }
        }
    }).fail(function () {
        chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
            var data = {};
            var tabId = tabs[0].id;
            var port = chrome.tabs.connect(tabId, {name: 'getContact'});
            data.timeid = message.timeid;
            data.host = message.host;
            port.postMessage(data);
        });
    });
}

function checkDuplication(message, port) {
    chrome.storage.sync.get('jlsoftHost', function (items) {
        $.post(items.jlsoftHost + '/rest/file/htmlfileauto',
               {data: JSON.stringify({html: [message.html],url: message.url })}, function (result) {
                if (result.status && result.data.id) {
                    chrome.tabs.sendMessage(port.sender.tab.id,
                                            {name: 'showDuplication', data: result.data});
                }
            });
    });

}

chrome.extension.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (message, port) {
        switch (port.name) {
            case 'extracting':
                save(message);
                break;
            case 'checkDuplication':
                checkDuplication(message, port);
                break;
            case 'requestContact':
                requestContact(message);
                break;
        }

    });
});

// click action to extract
chrome.browserAction.onClicked.addListener(function (tab) {
    console.log(tab);
    chrome.storage.sync.get('jlsoftHost', function (items) {
        var host = items['jlsoftHost'] || null;
        var port;
        if (host) {
            try {
                if (injectedMap.containsKey(tab.id)) {
                    port = chrome.tabs.connect(tab.id, {name: 'extracting'});
                    port.postMessage(host);
                } else {
                    injectedMap.put(tab.id, tab);
                    chrome.tabs.executeScript(null, {file: "js/libs/jquery/jquery-2.1.0.min.js"},
                                              function () {
                                                  chrome.tabs.executeScript(null,
                                                                            {file: "js/extractor/utils.js"},
                                                                            function () {
                                                                                port =
                                                                                    chrome.tabs.connect(
                                                                                        tab.id,
                                                                                        {name: 'extracting'});
                                                                                port.postMessage(
                                                                                    host);
                                                                            });
                                              });
                }
            } catch (ex) {
                console.log(ex);
                alert(ex);
            }
        } else {
            chrome.tabs.create({url: "options.html"});
        }
    });

});
