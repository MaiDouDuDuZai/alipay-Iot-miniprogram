let app = getApp();

Page({
  data: {
    thumb: '/image/avatar.jpg',
    person: {},
    merchant: {},
    config: {},
    version: app.Data.version,
    keyEventHandler:{
      133: function(){ my.navigateBack() }
    }
  },
  onLoad() {
    if( !app.page.checkLogin() ) return;
    this.setData({
      person: app.Data.person,
      merchant: app.Data.merchant,
      config: app.Data.config
    });
  },
  onShow() {
    app.page.onShow(this);
  },
  onReady() {},
  onHide() {
    app.page.onHide(this);
  },
  onUnload() {
    app.page.onUnload(this);
  },
  gotoPanel(){
    my.navigateTo({url: '/pages/setting/webpanel/webpanel'});
  },
  gotoPrinter(){
    my.navigateTo({url: '/pages/setting/printer/printer'})
  },
  gotoTrade(){
    my.navigateTo({url: '/pages/setting/trade/trade'});
  },
  gotoDisplay(){
    my.navigateTo({url: '/pages/setting/display/display'});
  },
  gotoMode(){
    my.navigateTo({url: '/pages/setting/mode/mode'});
  },
  sysSetting(){
    my.ix.startApp({ appName: 'settings' });
  },
  logout() {
    app.setting.logout();
  },
  clearCache(){
    my.removeStorageSync({ key: 'config' });
    my.removeStorageSync({ key: 'printer' });
    my.showToast({ content: '成功' });
  },
  openModal() {
    this.setData({
      modalOpened: true,
    });
  },
  onModalClose() {
    this.setData({
      modalOpened: false,
    });
  },
});