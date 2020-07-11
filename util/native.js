/**
 * @param object data {out_trade_no: xxx, totalAmount: xxx}
 */
function cashier(data, close = '') {
  let app = getApp();
  return new Promise((resolve, reject)=>{
    if(app.Data.dev){
      return resolve({ barCode: '282850640530337893', codeType: 'C' });
    }
    console.log('收银台开启', data)
    //todo: 全局收银台状态置1
    app.Data.cashier.status = 1;
    my.ix.startApp({
      appName: 'cashier', 
      bizNo: data.out_trade_no || app.Data.order.out_trade_no,
      totalAmount: data.totalAmount,
      // showScanPayResult: true,
      faceLoadingTimeout: 5,
      scanLoadingTimeout: 5,
      //扫码刷脸成功
      success: async (r) => {
        console.log('扫码刷脸', r)
        //收银台事件监听
        my.ix.onCashierEventReceive((r) => {
          console.log('收银台事件:', r)
          if (r.bizType == 'RESULT_CLOSED'){
            //收银台关闭
            app.Data.cashier.status = 0;
            my.ix.offCashierEventReceive();
            close && close();
          }else if (r.bizType == 'RESULT_BTN_FUNCTION'){
            //收银台自定义按钮按下
          }else if (r.bizType == 'RESULT_MEMBER'){
            //支付结果页会员开卡
          }else{
            console.log('RESULT: '+r.keyCode)
          }
        });
        resolve(r)
      }
    }).catch(err => {
      console.log('收银台异常:', err)
      my.showToast({ content: err.errorMessage});
      reject(err)
    })
  })
}

/**
 * 刷脸核身
 * return {success, buyerId, deviceSn, error, errorMessage, ftoken}
 */
function faceVerify(){
  let app = getApp();
  return new Promise((resolve, reject) => {
    if(app.Data.dev){
      return resolve({buyerId: '2088002958819394'});
    }
    if(!app.Data.canIUse.faceVerify){
      return reject({errorMessage: '当前收银台版本不支持刷脸核身'});
    }
    my.ix.faceVerify({
      option: 'life',
      success: (r) => {
        console.log('faceVerify success', r);
        resolve(r);
      },
      fail: (r) => {
        console.log('faceVerify fail', r);
        reject(r);
      }
    });
  });
}

function playAudio(){
  let app = getApp();
  let order = app.Data.order;
  //刷脸语音和原生收银台语音重复
  // if(order.trade_type == 'face_code'){
  //   return;
  // }
  if(order.status == 3){
    app.native.voiceQueuePlay([{api: 'speech', option: {text: order.errorMessage}}]);
    return;
  }
  if(order.trade_type == 'card'){
    app.native.voiceQueuePlay([{api: 'speech', option: {text: '会员卡支付成功'}}, {api: 'voicePlay', option: {eventId: 'ONLYPRICE', number: order.totalAmount}}]);
    return;
  }
  if(order.biz_type == 'charge'){
    app.native.voiceQueuePlay([{api: 'speech', option: {text: '会员卡充值成功'}}, {api: 'voicePlay', option: {eventId: 'ONLYPRICE', number: order.charge_amount}}]);
    return;
  }
  app.native.voiceQueuePlay([{api: 'voicePlay', option: {eventId: 'ZFDZ', number: order.totalAmount}}]);
}

/**
 * 会员领卡
 */
function addCardAuth(){
  let app = getApp();
  let codeMsg = {
    JSAPI_SERVICE_TERMINATED: '用户取消',
    JSAPI_PARAM_INVALID: 'URL 为空或非法参数',
    JSAPI_SYSTEM_ERROR: '系统错误',
    TIMEOUT: '操作超时'
  };
  let iotCodeMsg = {
    ILLEGAL_NULL_ARGUMENT: '非法空参数',
    INVALID_APPLY_CARD_LINK: '非法的开卡链接',
    OPEN_FORM_TEMPLATE_NOT_EXIST: '开放表单配置信息不存在',
    ALREADY_ACTIVE_CARD: '会员已有会员卡',
    OPEN_FORM_FIELD_NOT_PERMITTED: '表单字段商家无权限',
    OPEN_FORM_USER_LACK_INFO: '表单字段用户无信息',
    SYSTEM_ERROR: '系统异常'
  };
  my.addCardAuth({
    url: app.Data.card.alipay.card_activateurl.long,
    success: (res) => {
      if(res.result.success === false){
        let resultCode = res.result.resultCode;
        return my.showToast({content: iotCodeMsg[resultCode] || resultCode});
      }
      my.showLoading();
      app.request({
        url: res.callbackUrl + '&platform=iot',
        method: 'POST',
        dataType: 'json',
        success(){
          my.showToast({content: '授权成功'});
          my.navigateTo({url:'/pages/member/card/card'});
        }
      })
    },
    fail: (res) => {
      if(res.errorMessage){
        if(typeof res.errorMessage == 'string'){
          return my.showToast({content: res.errorMessage});
        }
        return my.showToast({content: iotCodeMsg[res.errorMessage.resultCode]});
      }
      if(codeMsg[res.code]){
        return my.showToast({content: codeMsg[res.code]});
      }
      my.showToast({content: '授权失败'});
    },
  }).catch(function(e){
    console.log(JSON.stringify(e))
  });
}

/**
 * 设备固件、硬件信息
 */
function deviceInfo(){
  let v = my.ix.getVersionSync({packageName: 'zoloz.phone.android.alipay.com.dragonfly'});
  //收银台版本号
  let cashier = v ? v.versionName + '-' + v.versionCode : 'dev';
  //容器版本号
  v = my.ix.getVersionSync();
  let container = v ? v.versionName + '-' + v.versionCode : 'dev';
  //设备序列号
  let serialno = my.ix.getSysPropSync({ key: 'ro.serialno' });
  serialno = serialno && serialno.value || 'SN';
  //设备型号
  let model = my.ix.getSysPropSync({ key: 'ro.product.model' });
  model = model && model.value || 'dev';
  return {
    firmware: {
      cashier,
      container
    },
    hardware: {
      serialno,
      model
    }
  }
}

/*
 * 播放语音队列
 * @param voice Object 要排队的语音，含两个语音播报接口的配置 [{api: 'speech', option: {text: 'xxx'}}, {api: 'voicePlay', option: {eventId: 'ZFDZ', number: '0.01'}}] 
 */
function voiceQueuePlay(voice){
  let app = getApp();
  //判断队列是否正忙，队列不为空默认正在播放
  let isBusy = app.Data.voiceQueue.length;
  if(voice){
    app.Data.voiceQueue.push(voice);
    //队列忙时避免重复播放
    if(isBusy){
      //首页显示排队数
      let currentPage = app.native.getCurrentPage();
      if(currentPage.route == 'pages/index/index'){
        currentPage.setData({voiceQueueLength: app.Data.voiceQueue.length});
      }
      return;
    }
  }
  //首页显示排队数
  let currentPage = app.native.getCurrentPage();
  if(currentPage.route == 'pages/index/index'){
    currentPage.setData({voiceQueueLength: app.Data.voiceQueue.length});
  }
  //播放一条
  if(!app.Data.voiceQueue.length) return;
  voice = app.Data.voiceQueue[0];
  if(app.Data.dev){
    setTimeout(()=>{
      app.Data.voiceQueue.shift();
      app.native.voiceQueuePlay();
    }, 2000);
    return;
  }
  my.ix[voice[0].api]({
    ...voice[0].option,
    success: () => {
      if(!voice[1]){
        app.Data.voiceQueue.shift();
        app.native.voiceQueuePlay();
        return;
      }
      my.ix[voice[1].api]({
        ...voice[1].option,
        success: () => {
          app.Data.voiceQueue.shift();
          app.native.voiceQueuePlay();
        },
        fail: () => {
          console.log('播放失败，跳过')
          app.Data.voiceQueue.shift();
          app.native.voiceQueuePlay();
        }
      })
    },
    fail: () => {
      console.log('播放失败，跳过')
      app.Data.voiceQueue.shift();
      app.native.voiceQueuePlay();
    }
  })
}

function getCurrentPage(){
  let pageStack = getCurrentPages();
  return pageStack && pageStack.length && pageStack[ pageStack.length - 1 ];
}

export default {cashier, faceVerify, playAudio, addCardAuth, deviceInfo, voiceQueuePlay, getCurrentPage};