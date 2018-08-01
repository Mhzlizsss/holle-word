$(function () {
    var $body = $('body');

    var toolbar = {
        init: function () {
            $.get(chrome.extension.getURL("templates/extractor/main.html")).done(function (res) {
                var temp = Mustache.render(res);
                $body.append(temp);
                toolbar.$container = $('.jlsoft-toolbar');
                toolbar.y = parseInt(toolbar.$container.css('top'));
                // get jlsoft host
                chrome.storage.sync.get('jlsoftHost', function (items) {
                    var host = items['jlsoftHost'] || null;

                    $body.on('click', '.jlsoft-toolbar a.jlsoft-import-trigger', function () {
                        // jlsoft host if it doesn't exist open option page
                        if (!host) {
                            chrome.runtime.sendMessage({openOptions: true}, function () {
                            });
                        } else {
                            if ($('.jlsoft-check-result').children().length && !$(
                                    '.jlsoft-check-result').find('.jlsoft-nologin').length) {
                                u.extracting(host);
                            } else {
                                u.collectBaseInfo($.Deferred(), host);
                            }
                        }
                    });

                    u.collectBaseInfo($.Deferred(), host);
                    u.checkDuplication(host, false);
                });

            });
        },
        draggable: function () {
            var startX = 0, startY = 0, x = 0, y = 0;

            $body.on('mousedown', '.jlsoft-drag-handle', function (event) {
                // Prevent default dragging of selected content
                event.preventDefault();
                $(this).addClass('jlsoft-drag-handle-show');
                $body.on('mousemove', mousemove);
                $body.on('mouseup', mouseup);
            });

            function mousemove(event) {
                toolbar.y = y = event.clientY;
                x = event.clientX;

                toolbar.$container.css({
                                           top: y + $(window).scrollTop(),
                                           left: x,
                                           right: 'initial'
                                       });
            }

            function mouseup() {
                $('.jlsoft-drag-handle').removeClass('jlsoft-drag-handle-show');
                $body.unbind('mousemove', mousemove);
                $body.unbind('mouseup', mouseup);
            }
        },
        scroll: function () {
            $(window).on('scroll', function (e) {
                var s = $body.scrollTop();

                toolbar.$container.css({
                                           top: s + toolbar.y
                                       });
            });
        }
    };

    toolbar.init();
    toolbar.draggable();
    toolbar.scroll();
});
