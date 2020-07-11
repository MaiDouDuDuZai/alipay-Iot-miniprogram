let app = getApp();

Page({
  data: {},
  onLoad() {
    app.page.onLoad(this);
    this.webViewContext = my.createWebViewContext('web-view-1');
  },
  onShow(){
    app.page.onShow(this);
  },
  // 接收来自H5的消息
  onMessage(e) {
    console.log(e); //{'sendToMiniProgram': '0'}
    // 向H5发送消息
    this.webViewContext.postMessage({'sendToWebView': '1'});
  },
  onOptionMenuClick() {
    app.page.onOptionMenuClick(this);
  },
});
