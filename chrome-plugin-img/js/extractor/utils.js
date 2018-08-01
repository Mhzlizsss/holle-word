(function (window, $) {

    var URL = {
        LINKEDIN: 'http://www.linkedin.com'
    };

    var profileID = '';
    var phone = '';
    var email = '';
    var timeid = (new Date).getTime();

    var domain = (function () {
        var hostname = location.hostname;
        return hostname.replace(/^(.*?)\.(.*?)\..*/g, "$2");
    }());

    function showDuplicationResult(data) {
        if (data.timeid !== timeid) {
            return;
        }
        var $result = $('');

        $.get(chrome.extension.getURL("templates/extractor/check-result.html")).done(
            function (res) {
                chrome.storage.sync.get('jlsoftHost', function (items) {
                    var host = items['jlsoftHost'] || null;
                    data.host = host;

                    if (data.list && data.list.length) {
                        data.data = data.list[0];

                        data.data.exp = data.data.experiences[0];
                    }

                    var temp = Mustache.render(res, data);

                    $result.html(temp);
                });

            });
    }

    function responseToBase64(response) {
        var uInt8Array = new Uint8Array(response);
        var i = uInt8Array.length;
        var binaryString = new Array(i);
        while (i--) {
            binaryString[i] = String.fromCharCode(uInt8Array[i]);
        }
        var data = binaryString.join('');
        var base64 = window.btoa(data);
        return base64;
    }

    function getImg(el, onload_func) {
        var x = new XMLHttpRequest();
        // x.onload = onload_func;
        x.onload = onload_func;
        x.responseType = 'arraybuffer';
        $el = $(el);
        if ($el.length) {
            var src = $el.attr('src');
            x.open('GET', src, true);
            x.send();
        } else {
            onload_func();
        }
    }

    function getBase64(obj, deferred) {
        var promises = [];
        var dfdImage = $.Deferred();
        promises.push(dfdImage.promise());
        getImg('.telephone-img', function () {
            if (this.response) {
                obj['mobile_base64'] = responseToBase64(this.response);
            }
            dfdImage.resolve();
        });
        var dfdEmail = $.Deferred();
        promises.push(dfdEmail.promise());
        getImg('.email-img', function (context) {
            if (this.response) {
                obj['email_base64'] = responseToBase64(this.response);
            }

            dfdEmail.resolve();
        });

        $.when.apply($, promises).done(function () {
            deferred.resolve();
        });
    }

    function getContact(data) {
        if (data.timeid !== timeid) {
            return;
        }

        phone = data.data ? data.data['mobile'] : '';
        email = data.data ? data.data['email'] : '';

        utils.checkDuplication(data.host);

        if (data.deferred) {
            data.deferred.resolve();
        }
    }

    chrome.extension.onConnect.addListener(function (port) {
        port.onMessage.addListener(function (message, port) {
            var portName = port.name;
            switch (portName) {
                case 'checkedDuplication':
                    showDuplicationResult(message);
                    break;
                case 'extracting':
                    utils.extracting(message);
                    break;
                case 'getContact':
                    getContact(message);
                    break;
            }
        });
    });

    var utils = {
        extracting: function (host) {
            var $html = $('html').clone();
            $html.find('.jlsoft-toolbar').remove();
            var additionalInfo = {
                html: [$html[0].outerHTML],
                host: host,
                _id: profileID
            };

            var deferred = $.Deferred();

            deferred.done(function () {
                chrome.extension.connect({name: "extracting"}).postMessage(additionalInfo);
            });

            switch (domain) {
                // for liepin
                case "liepin":
                case "lietou":
                    getBase64(additionalInfo, deferred);
                    break;
                default:
                    deferred.resolve();
                    break;
            }
        },

        collectBaseInfo: function (dfd, host) {
            console.log(domain);
            switch (domain) {
                case "51job":
                    var url = window.location.search;
                    var text = $('body').text().trim();

                    if (/hidUserID/ig.test(url)) {
                        profileID = url.replace(/.*?hidUserID=(\d*)&.*/ig, '$1');
                    } else {
                        profileID = text.match(/\(ID:\d*\)/igm)[0];
                        profileID = profileID.replace(/\D/ig, '');
                    }
                    phone = text.match(/\b(\d{11})\b/igm).trim();
                    email = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b/igm).trim();
                    if (phone) {
                        phone = phone[0];
                    } else {
                        phone = '';
                    }

                    if (email) {
                        email = email[0];
                    } else {
                        email = '';
                    }
                    this.checkDuplication(host);
                    dfd.resolve();

                    break;
                case "zhaopin":
                    profileID =
                        $('.resume-left-tips-id:eq(0)').text().trim().replace(/^ID:(.*)$/gm, "$1");
                    var summary = $('.summary-bottom').text().trim();
                    phone = summary.replace(/.*?[(手机)|(Mobile)]：(\d*).*/gi, '$1').trim();
                    email = summary.replace(/.*?E-mail：(.*).*/gi, '$1').trim();
                    this.checkDuplication(host);
                    dfd.resolve();
                    break;
                case "liepin":
                case "lietou":
                    var data = {};
                    var deferred = $.Deferred();
                    profileID =
                        $('.resume-side').text().trim().replace(/^.*(\d{8}).*(?:.|\s)+.*$/gm, "$1");

                    deferred.done(function () {

                        chrome.storage.sync.get('jlsoftHost', function (items) {
                            var host = items['jlsoftHost'] || null;
                            if (host) {
                                data['host'] = host;
                                data['deferred'] = dfd;
                                data['timeid'] = timeid;
                                chrome.extension.connect({name: "requestContact"}).postMessage(
                                    data);
                                dfd.resolve();
                            } else {
                                dfd.resolve();
                            }
                        });
                    });
                    getBase64(data, deferred);

                    break;
                case "linkedin":
                    if ($('#relationship-public-profile-link').length) {
                        profileID = $('#relationship-public-profile-link a').attr('href');
                    } else if ($('[name="webProfileURL"]').length) {
                        profileID = $('[name="webProfileURL"]').attr('href');
                    } else if ($('dl.public-profile').length) {
                        profileID = 'http://' + $('dl.public-profile dd span').text().trim();
                    }

                    // if ($('[id*="member-"]').length) {
                    //     var id = $('[id*="member-"]').eq(0).attr('id').replace('member-', '');

                    //     $.get(URL.LINKEDIN.replace('<id>', id)).done(function (res) {
                    //         if (res.status === 'success') {
                    //             email = res.contact_data.emails_extended[0] ?
                    // res.contact_data.emails_extended[0].email : ''; phone =
                    // res.contact_data.phone_numbers[0] ? res.contact_data.phone_numbers[0].number
                    // : ''; }

                    //         dfd.resolve();
                    //     });
                    // } else {
                    //     dfd.resolve();
                    // }
                    this.checkDuplication(host);
                    dfd.resolve();
                    break;
                case 'buildhr':
                    profileID = $('.print_content h1 span').text().replace(/^\D*(\d*).*/gm, '$1');
                    var info = $('.pro_lf').text();
                    phone = info.replace(/\n/gm, '').replace(/.*手机：(\d*).*/ig, '$1');
                    email = info.replace(/\n/gm, '').replace(/.*E-mail：(.*)/ig, '$1').trim();

                    this.checkDuplication(host);

                    dfd.resolve();
                    break;
                default:
                    this.checkDuplication(host);
                    dfd.resolve();
                    break;
            }
        },

        checkDuplication: function (host, bool) {
            console.log({
                            host: host,
                            id: profileID,
                            phone: phone,
                            email: email,
                            // login: bool,
                            timeid: timeid
                        });
            chrome.extension.connect({name: "checkDuplication"}).postMessage({
                                                                                 host: host,
                                                                                 id: profileID,
                                                                                 phone: phone,
                                                                                 email: email,
                                                                                 // login: bool,
                                                                                 timeid: timeid
                                                                             });
        }
    };

    window.u = utils;
}(window, jQuery));
