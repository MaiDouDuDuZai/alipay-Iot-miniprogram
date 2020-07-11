let app = getApp();

/**
 * 页面加载时实时查询打印机列表,并缓存
 */
Page({
  data: {
    printMulti: 1,
    printer: [], //{id,name,statusReason}
    modalOpened4: true
  },
  onLoad() {
    !app.Data.dev && my.showLoading({content: '查询打印机'}) && my.ix.queryPrinter({
      success: (r) => {
        let printer = r.usb;
        my.hideLoading();
        if(printer.length == 0){
          my.showToast({content: '未找到打印机'});
        }
        this.setData({ printer: printer });
        app.Data.printer = printer;
        my.setStorageSync({ key: 'printer', data: printer });
      },
      fail: (r) => {
        my.hideLoading();
        my.showToast({content: r.errorMessage || '查询出错'});
      }
    });
  },
  onUnload(){},
  onPrintMultiChange(v){
    app.Data.config.printMulti = v;
    my.setStorageSync({ key: 'config', data: app.Data.config });
  },
  printTest(){
    app.printer.printTest();
  },
});