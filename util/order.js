let _timer = {
  query: { id:0, count:0 }, //轮询定时器
  clear: function( index ){
    clearTimeout(this[index].id);
    this[index] = { id:0, count:0 };
  }
};

function getTimer(){
  console.log(_timer)
}

/**
 * 清除订单状态，清除时机：
 * 1.网络请求出错后
 * 2.发起支付前
 * 3.支付中断时
 * 4.购物车信息需要在支付前收集，不清空
 */
function clearStatus(){
  let app = getApp();
  app.Data.order = {
    ...app.Data.order,
    biz_type: 'normal',
    // totalAmount: '', //简单收银
    // total_price: '', //订单收银
    // pay_price: '', //订单收银
    // goods: [], //订单收银
    out_trade_no: '',
    barCode: '',
    trade_type: '',
    card_no: '',
    pay_result: {},
    query_result: {},
    time_create: '',
    status: 0,
    member: false,
    printed: false,
    errorMessage: '',
  };
  console.log('clear order status');
}

/**
 * 确认金额/收款
 * 调用支付接口前中断支付：订单状态置零
 * 调用支付接口后中断支付：订单状态置三
 * 金额必传，防止充值和下单金额混淆
 * 购物车信息需要在支付前收集到全局变量
 * @param totalAmount
 * @param onerror
 * @param onCashierClose
 * @param oncancel
 * @param showMessagePage 是否显示结果页,选否可在afterPay中自定义查询
 */
async function posConfirm(param = {}){
  let app = getApp();
  app.order.clearStatus();
  param = {
    biz_type: 'normal',
    card_no: '',
    trade_type: '',
    totalAmount: 0,
    total_price: 0,
    pay_price: 0,
    showMessagePage: true, //是否跳转结果页，如果置否，可在afterPay回调内自定义查询
    beforePay: ()=>{},
    afterPay: ()=>{},
    onerror: ()=>{},
    onCashierClose: ()=>{}, 
    oncancel: ()=>{},
    ...param
  };
  let out_trade_no = '',
      barCode = param.barCode || '',
      pay_result = {},
      res = '',
      { biz_type, card_no, trade_type, totalAmount, total_price, pay_price, 
        onerror, onCashierClose, oncancel, beforePay, afterPay
      } = param;
  beforePay();
  totalAmount = totalAmount || pay_price;
  app.Data.order = {
    ...app.Data.order,
    biz_type,
    card_no,
    trade_type,
    totalAmount,
    total_price, 
    pay_price, 
    out_trade_no,
    barCode,
    pay_result: {},
    query_result: {},
    time_create: Date.parse(new Date())/1000,
    status: 1,
    member: false,
    printed: false,
  };
  if( !totalAmount || parseFloat(totalAmount) == 0 ){
    my.showToast({ type: 'exception', content: '金额不能为0' })
    app.Data.order.status = 0;
    return onerror();
  }
  if(app.Data.order.trade_type == 'card' && !card_no){
    my.showToast({ type: 'exception', content: '缺少参数[card_no]'})
    app.Data.order.status = 0;
    return onerror();
  }
  //获取订单号
  res = await app.order.getOutTradeNo().catch(err => {
    my.showToast({ type: 'exception', content: '获取订单号运行出错(FE)' });
    return false;
  });
  if(!res) return onerror();
  if(res.status == 0){
    my.showToast({ type: 'exception', content: res.message });
    return onerror();
  }
  //获取付款凭证
  if(app.Data.order.trade_type != 'card' && !barCode){
    //收银台
    let cashier_res = await app.native.cashier({ totalAmount }, ()=>{
      //收银台关闭回调(仅刷脸)
      app.Data.cashier.status = 0;
      onCashierClose();
      //收银台在查询完成后关闭
      if(app.Data.order.status == 3) return my.reLaunch({url: '/pages/message/message?act=msg'});
    }).catch((err) => {
      //已退出刷脸服务(Z6012)(刷脸后取消)
      if(err.error == 1005){
        oncancel();
      }
      //用户取消(刷脸前取消)
      if(err.error == 1500){
        oncancel();
      }
      //提示收银台已运行,可能是以下情况：1.收银台已经在运行(不可见)， 2.重复点击按钮导致重复唤起收银台
      if( err.errorMessage == '收银台已经在运行，请等待退出后重试'){
        my.ix.exitApp({ appName: 'cashier' });
        my.showToast({ content: '收银台已经在运行,请重新发起支付' });
      }
      app.Data.order.status = 0;
      return false;
    });
    if(!cashier_res){
      app.Data.order.status = 0;
      return onerror();
    }
    barCode = barCode || cashier_res.barCode || '';//收银台
    trade_type = trade_type || {'F':'face_code', 'C':'bar_code'}[cashier_res.codeType]; //收银台
    app.Data.order = {
      ...app.Data.order,
      barCode,
      trade_type,
      trade_gate: app.order.tradeGate(barCode)
    };
    //扫码后收银台立即关闭但不触发收银台关闭事件
    if(trade_type == 'bar_code' || app.Data.dev){
      app.Data.cashier.status = 0;
      onCashierClose();
    }
  }
  //发起支付
  let pay_res = await app.order.pay().catch(err => {
    return false;
  });
  if(!pay_res) return onerror();
  afterPay();
  //支付接口返回失败，不用查询
  if(pay_res.status == 0){
    return app.Data.cashier.status == 1 ? false : my.reLaunch({url: '/pages/message/message?act=msg'});
  }
  //查询
  if(param.showMessagePage){
    //刷脸不展示结果页(非充值)
    if(app.Data.order.trade_type == 'face_code'){
      app.order.query({
        success: () => {
          if(app.Data.order.status == 2) return my.reLaunch({url: '/pages/index/index'});
          if(app.Data.cashier.status == 0) return my.reLaunch({url: '/pages/message/message?act=msg'});
        },
        fail: () => {
          if(app.Data.cashier.status == 0) my.reLaunch({url: '/pages/message/message?act=msg'});
        }
      });
      return;
    }
    my.reLaunch({ url: '/pages/message/message?act=query&type=waiting&title=查询中' });
  }
}
/**
 * 支付订单
 * 会改变订单全局变量：status, member, errorMessage, pay_result
 */
function pay() {
  let app = getApp();
  let order = app.Data.order;
  let url = '', data = '';
  //带商品
  if( order.goods.length && order.biz_type != 'charge'){
    url = app.api.pay_order;
    data = {
      out_trade_no: order.out_trade_no,
      trade_type: order.trade_type, 
      biz_type: order.biz_type || 'normal',
      auth_code: order.barCode || '',
      card_no: order.card_no,
      total_price: order.total_price || order.totalAmount,
      pay_price: order.pay_price || order.totalAmount,
      goods: order.goods,
    };
  }else{
    url = app.api.pay;
    data = {
      out_trade_no: order.out_trade_no,
      trade_type: order.trade_type,
      biz_type: order.biz_type,
      auth_code: order.barCode || '',
      card_no: order.card_no,
      total_amount: order.totalAmount,
    };
  }
  return new Promise((resolve, reject)=>{
    if(app.Data.dev){
      return resolve({
        status:"1",
        message:"query",
        contents: {}
      });
    }
    app.request({
      url: url,
      method: 'POST',
      data: data,
      dataType: 'json',
      success: (res) => {
        app.Data.order.pay_result = res;
        app.Data.order.member = res.contents.card_info || res.card_info || false;
        if(res.status == '0'){
          app.Data.order.status = 3;
          app.Data.order.errorMessage = res.message;
        }else{
          if(res.message != 'query'){
            app.Data.order.status = 2;
          }
        }
        resolve(res)
      },
      fail: function(res) {
        app.Data.order.status = 3;
        app.Data.order.errorMessage = res.message || '请求支付失败';
        reject('请求支付失败')
      }
    });
  })
}
/**
 * 退款订单
 * @param string out_trade_no
 * @param function success
 * @param function fail
 */
function refund( option = {} ){
  let app = getApp();
  option = {
    ...{
      out_trade_no: '',
      success: () => {},
      fail: () => {}
    },
    ...option
  };
  my.showLoading();
  app.request({
    url: app.api.refund,
    method: 'POST',
    data: {
      out_trade_no: option.out_trade_no,
    },
    dataType: 'json',
    success: function(res) {
      if(res.status == 0){
        return my.showToast({ type: 'exception', content: res.message});
      }
      my.showToast({ type: 'success', content: '退款成功'});
      option.success(res);
    }
  });
}
/**
 * 获取订单号
 */
function getOutTradeNo() {
  let app = getApp();
  let url = '', data = {};
  //充值时可能携带商品信息，需要单独判断
  if ( app.Data.order.biz_type == 'charge'){
    url = app.api.get_out_trade_no_cash; //前缀P
  }else{
    if( app.Data.order.goods && app.Data.order.goods.length ){
      url = app.api.get_out_trade_no_mall; //前缀D
    }else{
      url = app.api.get_out_trade_no_cash;
    }
  }
  return new Promise((resolve, reject)=>{
    app.request({
      url: url,
      method: 'POST',
      data: data,
      dataType: 'json',
      success: (res) => {
        if(res.status == '0'){
          app.Data.order.status = 0;
        }
        app.Data.order.out_trade_no = res.contents.out_trade_no || res.contents;
        resolve(res)
      },
      fail: function(res) {
        app.Data.order.status = 0;
        reject('获取订单号失败');
      }
    })
  })
}
/**
 * 查询订单
 * 会改变订单全局变量：status, errorMessage
 * @param option {page,success,fail}
 */
function query( option ){
  clearTimeout(_timer.query.id);
  option = {
    page: false,
    success: ()=>{},
    fail: err=>{},
    ...option
  };
  const status_map = {
    'SUCCESS': '支付成功',
    'CLOSED': '交易关闭',
    'REFUND': '已退款',
    'NOTPAY': '未支付',
    'PAYERROR': '支付失败',
    'USERPAYING': '支付中',
  };  
  let app = getApp(), 
      order = app.Data.order,
      query_from_timestamp = new Date().valueOf(),
      query_to_timestamp = 0,
      query_inteval_milliseconds = 0; //校正请求延迟导致的轮询间隔误差

  app.request({
    url: app.api.query,
    method: 'POST',
    data: {
      out_trade_no: order.out_trade_no,
      biz_type: order.biz_type,
      card_no: order.card_no || '',
    },
    dataType: 'json',
    success: (res) => {
      //没有正确返回json格式
      if(typeof res == 'string'){
        app.Data.order.status = 3;
        app.Data.order.errorMessage = '返回格式错误（String）';
        option.fail();
        return;
      }
      app.Data.order.query_result = res;
      app.Data.order.member = (res.contents && res.contents.card_info) || res.card_info || false;
      app.Data.order.charge_amount = res.contents.charge_amount;
      if(res.status == 0){
        if(res.message == 'RETRY'){
          if(_timer.query.count < 6) {
            _timer.query.count++;
            option.page && option.page.setData({ subTitle: '重试中' + ''.padEnd(_timer.query.count, '.') });
            query_to_timestamp = new Date().valueOf();
            query_inteval_milliseconds = 5000 - ( query_to_timestamp - query_from_timestamp );
            _timer.query.id = setTimeout(() => {
              app.order.query(option);
            }, query_inteval_milliseconds);
          } else {
            app.Data.order.query_result = { status:0, message: '请与收银员确认支付结果' };
            _timer.clear('query');
            query_success(), option.success();
          }
          return;
        }
        res.message = res.message == 'PAYERROR' ? '支付失败' : res.message;
        return query_success(), option.success();
      }
      switch(res.message) {
        case 'SUCCESS':
          _timer.clear('query');
          query_success(), option.success();
        break;
        case 'USERPAYING':
          if(_timer.query.count < 6) {
            _timer.query.count++;
            option.page && option.page.setData({ subTitle: '等待客户支付' + ''.padEnd(_timer.query.count, '.') });
            query_to_timestamp = new Date().valueOf();
            query_inteval_milliseconds = 5000 - ( query_to_timestamp - query_from_timestamp );
            _timer.query.id = setTimeout(() => {
              app.order.query(option);
            }, query_inteval_milliseconds);
          } else {
            app.Data.order.query_result = { status:0, message: '操作超时' };
            _timer.clear('query');
            query_success(), option.success();
          }
        break;
        default:
          app.Data.order.query_result = { status:0, message: '订单状态未知' };
          _timer.clear('query');
          query_success(), option.success();
        break;
      }
    },
    fail: (err) => {
      app.Data.order.query_result = { status:0, message: '请与收银员确认支付结果' };
      _timer.clear('query');
      query_fail(), option.fail();
    }
  });
}

//查询成功
function query_success(){
  let app = getApp();
  if( app.Data.order.query_result.status == 0 ) return query_fail();
  app.printer.printReceipt();
  app.Data.order.status = 2;
  console.log('会员信息', app.Data.order.member)
}

//查询失败
function query_fail(){
  let app = getApp();
  app.Data.order.status = 3;
  app.Data.order.errorMessage = app.Data.order.query_result.message;
}

//支付通道
function tradeGate(auth_code){
  let trade_gate = '';
  auth_code = auth_code + '';
  if(auth_code.length == 18) {
    if(/^(10|11|12|13|14|15)/.test(auth_code)) {
      trade_gate = "weixin";
    }
  }
  if(auth_code.length >= 16 && auth_code.length <= 24) {
    if(/^(25|26|27|28|29|30)/.test(auth_code)) {
      trade_gate = "alipay";
    }
  }
  return trade_gate;
}

export default {posConfirm, pay, refund, getOutTradeNo, query, tradeGate, clearStatus, getTimer};