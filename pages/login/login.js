let app = getApp();
let delaySeconds = 65;

Page({
  data: {
    timer: {
      tiktok: { id: 0, count: delaySeconds },
    },
    showTiktok: false,
    per_phone: '',
    API_URL: '', // view
    version: app.Data.version,
  },
  /**
   * @param per_phone
   */
  onLoad(query) {
    //带参自动登录
    if(query.per_phone){
      this.data.per_phone = query.per_phone;
      this.data.API_URL = app.Data.config.API_URL;
      this.onLogin();
    }else{
      this.setData({ API_URL: app.Data.config.API_URL })
    }
  },
  onReady() {
    if (my.canIUse('hideBackHome')) {
      my.hideBackHome();
    }
    // this.delayGoBack();
  },
  onShow() {},
  onHide(){
    app.page.onHide(this);
  },
  onUnload(){
    app.page.onUnload(this);
  },
  onTitleClick() {},
  onInputApiurl(e) {
    this.data.API_URL = e.detail.value;
    // this.restartDelayGoBack();
  },
  onInputPerphone(e) {
    this.data.per_phone = e.detail.value;
    // this.restartDelayGoBack();
  },
  restartDelayGoBack(){
    this.data.timer.tiktok.count = delaySeconds;
    // this.delayGoBack();
  },
  delayGoBack(){
    clearTimeout(this.data.timer.tiktok.id);
    if(this.data.timer.tiktok.count <= 0){
      if(getCurrentPages().length == 1){
        return my.reLaunch({url: '/pages/index/index'});
      }
      return my.navigateBack();
    }
    this.setData({
      'timer.tiktok.count': this.data.timer.tiktok.count - 1,
      showTiktok: delaySeconds - this.data.timer.tiktok.count >= 5 ? true : false
    });
    this.data.timer.tiktok.id = setTimeout(()=>this.delayGoBack(), 1000)
  },
  onLogin() {
    if(!this.data.per_phone){
      my.showToast({ type: 'exception', content: '店员手机必填' });
      return;
    }
    if(!this.data.API_URL){
      my.showToast({ type: 'exception', content: '系统域名必填' });
      return;
    }
    app.Data.config.API_URL = this.data.API_URL;
    my.showLoading();
    app.request({
      url: app.api.login,
      method: 'POST',
      data: {
        per_phone: this.data.per_phone,
      },
      dataType: 'json',
      success: (res) => {
        if(res.status == '0'){
          return my.showToast({ content: res.message});
        }
        console.log('%c登录成功','color:blue');
        //登陆后页面会跳转，不用hideLoading
        app.Data.person = res.contents;
        my.setStorageSync({ key: 'person', data: res.contents });
        my.setStorageSync({ key: 'config', data: app.Data.config });
        app.initMerchant(()=>{
          my.reLaunch({ url: '/pages/index/index?referer=login' })
        });
      }
    });
  },
});
