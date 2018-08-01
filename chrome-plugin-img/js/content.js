chrome.runtime.onMessage.addListener(function (message) {
    switch (message.name) {
        case 'showDuplication':
            // TODO 可以根据后台返回的信息插入一段 HTML 到页面中，目前插入的JSON数据
            //console.log(message);
            chrome.storage.sync.get('jlsoftHost', function (items) {
                var url = items.jlsoftHost;
                //备注
                message.data.lastNote = message.data.lastNote?message.data.lastNote.replace(/(\r\n)|(\n)/g, '<br/>'):'';
                //console.log(url);
                var ht = '';
                if (message.data.lastNote) {
                    ht += `
                        <div>
                            <div style="text-align: center;background: #485f5f;height: 25px; line-height: 25px;color: #fff;font-size: 13px;"><span>最新备注</span></div>
                            <p style="padding: 5px 6px;">${message.data.lastNote}</p>
                        </div>
                    `;
                }

                var html = `
                    <div style="width: 200px;border: 1px solid gray;border-radius: 3px;position: fixed;z-index: 8000;top: 80px;right: 0;overflow-x: hidden;background: #fff;font-size: 12px;">
                        <div style="color: #fff;height:30px; line-height: 30px;font-weight: bold;font-size: 18px; text-align: center;background: #135665">
                            <a id="cl" style="float: right;color: #fff;cursor: pointer;">&times;</a>
                            简历查重
                        </div>
                        <ul style="list-style: none;padding: 0;">
                           <li><span style="margin: 0 6px;height:25px; line-height: 25px;">姓名:</span><a href="${url}/webapp/#/nav/candidate/detail?id=${message.data.current.candidate_id}" target="_blank">${message.data.chineseName}</a></li>
                           <li><span style="margin: 0 6px;height:25px; line-height: 25px;">公司:</span><span style="display: inline-block;max-width: 140px;text-overflow: ellipsis;white-space: nowrap;" title="${message.data.company.name}">${message.data.company.name}</span></li>
                           <li><span style="margin: 0 6px;height:25px; line-height: 25px;">职位:</span><span style="display: inline-block;max-width: 140px;text-overflow: ellipsis;white-space: nowrap;" title="${message.data.title}">${message.data.title}</span></li>
                           <li><span style="margin: 0 6px;height:25px; line-height: 25px;">拥有:</span><span>${message.data.owner.chineseName}</span></li>
                           <li><span style="margin: 0 6px;height:25px; line-height: 25px;">日期:</span><span>${message.data.lastUpdate}</span></li>
                        </ul>
                `;
                html += ht;
                html += '</div>';
                $('body').append(html);
            });
            //$('body').append('<div style="width: 200px;height: 150px;border: 1px solid gray; position: fixed;top: 200px;right: 0;overflow: auto;">' + JSON.stringify(message.data) + '</div>');
            break;
    }
});
$('body').on('click','#cl',function(){
    $(this).parent().parent().hide();
});
//延时两秒抓取
setTimeout(function () {
    chrome.extension.connect({name: 'checkDuplication'}).postMessage(
        {html: document.documentElement.outerHTML, url:window.location.href});
}, 2000);





