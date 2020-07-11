import request from '/util/request';
import api from '/util/api';
import canIUse from '/util/canIUse';
import native from '/util/native';
import page from '/util/page';
import printer from '/util/printer';
import setting from '/util/setting';
import order from '/util/order';
import util from '/util/util';
//my.getAppIdSync()需要基础库 1.20.0，暂不支持
App({
  Data: {
    deviceInfo: native.deviceInfo(),
    systemInfo: my.getSystemInfoSync(), //主要用到标题栏高度
    version: '0.2.7',
    SN: "",
    person: {}, // 登录店员
    merchant: {
      merchant_id: '',
      merchant_name: '',
      hasMemberCard: false,
      card_charge: [], //会员充值方案
    },
    card:{ //会员卡配置
      alipay:{
        is_card: false, //是否启用会员卡
        is_charge: false, //是否开启储值功能
        card_id: '',
        card_bg_url: '',
        card_logo_url: '',
        card_show_name: '',
        card_activateurl: { long: '', short: ''}, //会员卡领卡投放链接
      }
    },
    config: {
      API_URL: "demo.tryyun.net",
      printMulti: 1, //打印联数
      mode: { name: '独立收银', value: '1', url: '/pages/cash/cash'}, //收银模式
    },
    order: {
      out_trade_no: '',
      totalAmount: '', //简单收银
      total_price: '', //订单收银
      pay_price: '', //订单收银
      goods: [], //订单收银
      charge_amount: '',
      trade_gate:'', //alipay|weixin
      barCode: '',
      card_no: '', //会员卡号
      biz_type: 'normal', // normal|charge
      trade_type: '', // face_code|bar_code|card
      pay_result: {}, // 调用pay接口返回的数据
      query_result: {}, // 调用query接口返回的数据
      status: 0, //0 未支付, 1 支付中, 2 支付成功, 3 支付失败
      member: false, //订单会员
      errorMessage: '', //错误提示
    },
    cashier: { status: 0 },
    ads: {
      index: {interval: 5, swiperData: []}, //首页海报
      message: '' //支付结果页
    },
    printer: [], // usb打印机
    canIUse: canIUse,
    dev: util.isDev(),
    websocket: { //设备状态监测timer
      connect: 0,
      heartbeat: 0,
    },
    mock: false, //使用mock数据
    voiceQueue: [], //支付到账语音队列，不为空时默认正在播放语音，通过 app.native.voiceQueuePlay 入队
    location: '', //定位，经纬度逗号分隔
  },
  onError(msg) {
    my.hideLoading();
  },
  onLaunch(options) {
    console.log('获取本机配置');
    let cache_config = my.getStorageSync({ key: 'config' }).data;
    if( cache_config ){
      //同域名保持登录
      if( this.Data.config.API_URL == cache_config.API_URL ){
        this.Data.person = my.getStorageSync({ key: 'person' }).data || this.Data.person;
        this.Data.config.mode = cache_config.mode;
        this.initMerchant();
      }
    }
    this.Data.SN = this.Data.deviceInfo.hardware.serialno;
    console.log('运行环境', ( this.Data.dev ? '模拟器 ' : '真机 ' ) + this.Data.SN);
    this.init_websocket();
    printer.initPrinter( ()=>{});
    //keyCode: 131-收款 132-刷脸 133-取消 134-设置
    my.ix.onKeyEventChange( r => {
      console.log('键盘事件:', r);
      let currentPage = getApp().native.getCurrentPage();
      if(currentPage && currentPage.data.keyEventHandler){
        currentPage.data.keyEventHandler[r.keyCode] && currentPage.data.keyEventHandler[r.keyCode].call(currentPage, r);
      }
    });
    //获取位置
    my.canIUse('getLocation') && my.getLocation({
      success: (res) => {
        console.log('定位成功');
        this.Data.location = [res.longitude, res.latitude].join(',');
      },
      fail: () => {
        console.log('定位失败');
      },
    })
  },
  onShow(options) {
    // 启动或进入前台
  },
  onHide() {
    // 从前台进入后台
  },
  api,
  native,
  page,
  request,
  setting,
  order,
  util,
  printer,
  //初始化商户信息
  initMerchant( complete = '' ){
    if(!complete) complete = ()=>{};
    let app = getApp(),
        person = app.Data.person,
        merchant = app.Data.merchant;
    merchant = {
      ...merchant,
      merchant_id: person.merchant_id || '',
      merchant_no: person.merchant_no || '',
      merchant_name: person.merchant_name || '',
    };
    if( person.card && person.card.alipay && Number(person.card.alipay.is_card) ){
      merchant = {
        ...merchant,
        hasMemberCard: true,
        card_charge: person.card_charge
      };
      app.Data.card.alipay = {
        ...app.Data.card.alipay,
        ...person.card.alipay
      };
    }
    app.Data.merchant = merchant;
    console.log('商户会员卡' + ( merchant.hasMemberCard ? '已' : '未' ) + '配置');
    return complete();
  },
  /* 设备在线监测
   * 1 此方法全局只要调用一次
   * 2 实测真机调试可容错：多次调用 init_websocket、多次调用 my.connectSocket
   * 3 可利用 my.closeSocket 触发重连
   */
  init_websocket(){
    //防止(鬼知道哪里)多次调用导致重复监听，实测真机调试有效，模拟器无效
    my.offSocketOpen();
    my.offSocketMessage();
    my.offSocketError();
    my.offSocketClose();
    let app = getApp();
    my.onSocketOpen(res => {
      console.log('WebSocket 连接已打开！(' + app.Data.config.API_URL + ')');
      app.util.send_heartbeat();
      //显示首页图标
      let currentPage = app.native.getCurrentPage();
      if(currentPage.route == 'pages/index/index'){
        currentPage.setData({isWebsocketOnline: true});
      }
    });
    my.onSocketMessage(function(res) {
      console.log('收到服务器内容');
      res = JSON.parse(res.data);
      if(res.command == 'speech'){
        app.native.voiceQueuePlay([{api: 'speech', option: {text: res.contents.text}}, {api: 'voicePlay', option: {eventId: 'ONLYPRICE', number: res.contents.amount}}]);
      }
      let currentPage = app.native.getCurrentPage();
      if(currentPage.route == 'pages/index/index'){
        currentPage.setData({isWebsocketOnline: true});
      }
    })
    my.onSocketError(function(res){
      console.log('WebSocket 连接打开失败，请检查！(' + app.Data.config.API_URL + ')');
      //打开失败会触发onSocketClose
    });
    my.onSocketClose(function(res) {
      console.log('WebSocket 已关闭！');
      clearTimeout(app.Data.websocket.heartbeat);
      app.Data.websocket.connect = setTimeout( ()=>{
        my.connectSocket({ url: 'wss://' + app.Data.config.API_URL + '/websocket' });
      }, 5000);
      //隐藏首页图标
      let currentPage = app.native.getCurrentPage();
      if(currentPage.route == 'pages/index/index'){
        currentPage.setData({isWebsocketOnline: false});
      }
    })
    my.connectSocket({ url: 'wss://' + app.Data.config.API_URL + '/websocket' });
  },
  /**
   * 初始化海报
   */
  initAds( complete = ()=>{} ){
    let app = getApp();
    //如果已获取过不重复请求
    // if(app.Data.ads.index.type){
    //   return complete();
    // }
    //app onLaunch有showLoading，此处不再重复
    app.request({
      url: app.api.slider,
      method: 'POST',
      data: {},
      dataType: 'json',
      success: (res) => {
        if(res.status == '0'){
          return my.showToast({ content: res.message});
        }
        let indexAds = {};
        if(res.contents.type == 'video'){
          indexAds = {
            type: 'video',
            video: res.contents.video
          }
        }else{
          indexAds = {
            type: 'image',
            swiperData: res.contents.item,
            interval: res.contents.time * 1000
          };
        }
        app.Data.ads = {
          index: indexAds,
          message: 'https://' + app.Data.config.API_URL + '/uploads/test/cash_result.jpg?t='+new Date().getTime()
        };
        complete(res);
      }
    });
  }
});
