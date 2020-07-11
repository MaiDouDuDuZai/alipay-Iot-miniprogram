let app = getApp();
Page({
  data: {
    totalAmount: '',
    biz_type: '', //支付类型 normal|charge
    trade_type: '', // face_code|bar_code|card
    showGoods: false,
    goods: [],
    paying: false, //支付中状态，支付按钮加载中状态
    canIUse: app.Data.canIUse,
    dev: app.Data.dev,
    timer: {
      tiktok: { id: 0, count: 60, show: true },
    },
    keyEventHandler: {
      131: function(r){ 
        if(parseFloat(r.amount) != 0){
          this.setData({ totalAmount: r.amount });
        }
        this.confirm();
      },
      133: function(){ my.navigateBack() },
      134: function(){ getApp().setting.entry(); },
    }
  },
  /**
   * query.amount 收款金额
   * query.showGoods 是否带商品，为真时表示从自助下单页面跳转过来
   * query.target 谁发起支付 tinyCommand:小指令 keyboard:小键盘
   */
  onLoad(query) {
    app.page.onLoad(this);
    if( !app.page.checkLogin() ) return;
    this.data.totalAmount = ( parseFloat(query.amount) || '' ) + '';
    //完整重置金额、购物车(简单收银)
    if(!query.showGoods){
      app.Data.order = {
        ...app.Data.order,
        totalAmount: 0,
        total_price: 0,
        pay_price: 0,
        goods: [],
      };
      app.order.clearStatus();
    }
    this.setData({ 
      hasMemberCard: app.Data.merchant.hasMemberCard,
      showGoods: query.showGoods,
      goods: app.Data.order.goods,
    });
    if(query.target != 'tinyCommand'){
      !app.Data.voiceQueue.length && app.native.voiceQueuePlay([{api: 'speech', option: {text: '请选择支付方式'}}]);
    }
    //二维码识别
    my.ix.onCodeScan({
      success: (r) => {
          console.log('code: ' + r.code);
          let tradeGate = app.order.tradeGate(r.code);
          if(!tradeGate){
            return my.showToast({content: '付款码无效'});
          }
          this.setData({ paying: true});
          !app.Data.voiceQueue.length && my.ix.speech({text: '扫码成功'});
          //结束扫码
          // my.ix.offCodeScan();
          app.order.posConfirm({
            biz_type: 'normal',
            trade_type: 'bar_code',
            totalAmount: this.data.totalAmount,
            barCode: r.code,
            onerror: ()=>{
              this.setData({ paying: false});
            },
            onCashierClose: ()=>{
              console.log('onCashierClose')
            },
            oncancel: ()=>{
            }
          });
      },
      fail: (r) => {
          console.log('error: ' + r.errorMessage);
      }
    });
  },
  onShow() {
    app.page.onShow(this);
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
        this.setData({ totalAmount: r.totalAmount })
      } else {
        my.navigateBack();
      }
    });
  },
  onReady() {
    app.page.onReady(this);
    this.autoCancel();
  },
  onHide() {
    app.page.onHide(this);
    this.setData({ 
      'timer.tiktok.show': false 
    });
    clearTimeout(this.data.timer.tiktok.id);
    // # 关闭指令的接收
    my.ix.offMonitorTinyCommand();
  },
  onUnload() {
    app.page.onUnload(this);
    my.ix.offCashierEventReceive();
    //结束扫码
    my.ix.offCodeScan();
  },
  onOptionMenuClick() {
    app.page.onOptionMenuClick(this);
  },
  memberCash(){
    //刷脸核身
    app.native.faceVerify().then(res=>{
      let user_id = res.buyerId;
      //查询会员信息
      my.showLoading();
      app.request({
        method: 'POST',
        url: app.api.alipay_card_userinfo,
        data: { user_id: user_id},
        success: res => {
          //非会员止步
          if(res.status == 0){
            return my.showToast({ content: res.message});
          }
          my.redirectTo({url: '/pages/member/cash/cash?user_id=' + user_id + '&amount=' + this.data.totalAmount});
        }
      })
    }).catch(err=>{
      my.showToast({ content: err.errorMessage})
    });
  },
  //确认付款
  confirm(e){
    if(this.data.paying) return;
    let biz_type = 'normal', trade_type = '';
    if(e){
      switch(e.target.dataset.type){
        case 'normal':
        case 'charge':
        biz_type = e.target.dataset.type;
        break;
        case 'card':
        trade_type = 'card';
        break;
      }
    }
    this.setData({ paying: true, biz_type, trade_type });
    app.order.posConfirm({
      biz_type,
      trade_type,
      totalAmount: this.data.totalAmount,
      onerror: ()=>{
        this.setData({ paying: false})
      },
      onCashierClose: ()=>{
        console.log('onCashierClose')
      },
      oncancel: ()=>{
        // my.navigateBack();
      }
    });
  },
  //操作超时处理
  autoCancel(){
    clearTimeout(this.data.timer.tiktok.id);
    if(this.data.timer.tiktok.count <= 0){
      return this.cancel();
    }
    this.setData({
      'timer.tiktok.count': this.data.timer.tiktok.count - 1,
    });
    this.data.timer.tiktok.id = setTimeout(()=>this.autoCancel(), 1000)
  },
  cancel(){
    my.navigateBack({delta: 5});
  }
});