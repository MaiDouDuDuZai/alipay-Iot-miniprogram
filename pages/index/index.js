let app = getApp();
let delaySleepSeconds = 10;

Page({
  data: {
    timer: {
      sleep: {id:0, count: 0}
    },
    isSleep: false, //休眠模式，隐藏按钮
    adsType: 'image',
    systemInfo: {},
    swiperData: {},
    swiperCurrent: 0,
    duration: 800,
    interval: 5000,
    autoplay: true,
    circular: true,
    indicatorDots: false,
    qrcode: '',
    video: {
      src: '',
    },
    merchant: {},
    keyEventHandler: {
      131: function(r){
        if( !app.page.checkLogin() ) return;
        if(!parseFloat(r.amount)){
          my.showToast({content: '金额不能为0'});
          return;
        }
        if(app.Data.merchant.hasMemberCard){
          this.cash(r.amount);
        }else{
          app.order.posConfirm({ totalAmount: r.amount, onerror: ()=>my.hideLoading() });
        }
      },
      133: function(){ my.hideLoading() },
      134: function(){ getApp().setting.entry(); },
    },
    isWebsocketOnline: false,
    voiceQueueLength: 0,
  },
  onLoad(query) {
    app.page.onLoad(this);
    if( !app.page.checkLogin() ) return;
    this.videoContext = my.createVideoContext('myVideo');
    if(query.referer == 'login'){
      my.closeSocket(); //关闭websocket以触发重连
    }
  },
  onShow(){
    app.page.onShow(this);
    this.setData({
      mode: {...app.Data.config.mode},
    });
    // # 开始接收指令
    my.ix.startMonitorTinyCommand({
      success: (r) => {
        console.log("开始接收指令 success", r);
      },
      fail: (r) => {
        console.log("开始接收指令 fail, errorCode:" + r.error);
      }
    });
    // # 等待指令的接收
    my.ix.onMonitorTinyCommand((r) => {
      console.log("接收指令 received data:", r);
      console.log("金额:", r.totalAmount);
      if(r.totalAmount > 0) {
        this.cash(r.totalAmount, 'tinyCommand');
      }
    });
    this.wakeup();
  },
  onReady() {
    app.page.onReady(this);
    this.setData({merchant: app.Data.merchant});
    app.initAds(()=>{
      let ads = app.Data.ads.index;
      if(ads.type == 'video'){
        this.setData({
          adsType: ads.type,
          'video.src': ads.video
        })
      }else{
        this.setData({
          adsType: ads.type,
          swiperData: ads.swiperData,
          interval: ads.interval
        });
      }
    })
  },
  onHide(){
    app.page.onHide(this);
    // # 关闭指令的接收
    my.ix.offMonitorTinyCommand();
    this.sleep();
  },
  onUnload(){
    app.page.onUnload(this);
  },
  onOptionMenuClick(e) {
    app.page.onOptionMenuClick(this);
  },
  swiperClick: function(e) {
    if(app.Data.dev){
      this.cash('0.01');
    }
  },
  methods: {
    swiperChange: function(e) {
      console.log(e.detail.current);
      this.setData({
        swiperCurrent: e.detail.current
      });
    }
  },
  //跳转收银页
  cash(amount, target = ''){
    if( !app.page.checkLogin() ) return;
    my.navigateTo({url:'/pages/cash/cash?amount=' + amount + '&target=' + target});
  },
  //加入会员
  joinMember(){
    app.native.faceVerify().then(res=>{
      let user_id = res.buyerId;
      my.showLoading();
      app.request({
        method: 'POST',
        url: app.api.alipay_card_open,
        data: { user_id: user_id},
        success: res => {
          if(res.status == '0'){
            return showToast({ content: res.message});
          }
          my.navigateTo({url: '/pages/member/card/card?user_id=' + user_id});
        }
      })
    }).catch(err=>{
      my.showToast({ content: err.errorMessage})
    });
  },
  //唤醒
  wakeup(){
    this.setData({isSleep: false});
    this.delaySleep();
  },
  //无操作进入休眠
  delaySleep(){
    clearTimeout(this.data.timer.sleep.id);
    this.data.timer.sleep.id = setTimeout(()=>this.sleep(), delaySleepSeconds * 1000)
  },
  sleep(){
    this.setData({isSleep: true});
  },
  onError(){
    this.videoContext.play();
  },
});
