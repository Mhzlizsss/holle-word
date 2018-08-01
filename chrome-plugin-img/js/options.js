document.addEventListener('DOMContentLoaded', function () {
    chrome.storage.sync.get('jlsoftHost', function (items) {
        var url = items['jlsoftHost'];

        if (!url) {
            url = 'http://';
        }

        document.querySelector('#urltext').value = url;
        document.querySelector('#savebtn').addEventListener('click', function () {
            chrome.storage.sync.set({
                                        'jlsoftHost': document.querySelector(
                                            '#urltext').value.replace(/(http:\/\/.*)\/$/, '$1')
                                    }, function () {
                alert('保存成功，请关闭配置页');
            });
        });
    });
});
