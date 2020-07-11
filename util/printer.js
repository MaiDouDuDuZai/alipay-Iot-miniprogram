function initPrinter(complete = ''){
  console.log('初始化打印机')
  let app = getApp();
  if( app.Data.dev ){
    return complete();
  }
  app.Data.printer = my.getStorageSync({ key: 'printer' }).data || [];
  if(app.Data.printer.length){
    console.log('已设置打印机：' + app.Data.printer.length);
    printTest(); //疑似蜻蜓Bug,机器重启后首次打印无效,暂时用打印测试页的方式解决
    complete && complete();
  }else{
    console.log('未获取到打印机，尝试查询');
    my.ix.queryPrinter({
      success: (r) => {
        let printer = r.usb;
        app.Data.printer = printer;
        my.setStorageSync({ key: 'printer', data: printer });
        if(printer.length){
          console.log('已连接打印机：' + app.Data.printer.length);
          printTest(); //疑似蜻蜓Bug,机器重启后首次打印无效,暂时用打印测试页的方式解决
        }else{
          console.log('未连接打印机');
        }
        complete && complete();
      }
    });
  }
  //实时监测打印机变化
  my.ix.startMonitorPrinter({
    'success':(r)=>{ console.log('开始监听打印机') }, 
    'fail':()=>{}
  });
  my.ix.onMonitorPrinter({
    'success':(r)=>{
      app.Data.printer = r.usb;
      my.setStorageSync({ key: 'printer', data: r.usb });
      if(r.usb.length){
        console.log('%c打印机已连接','color:blue');
        my.showToast({content: '打印机已连接'});
      }else{
        console.log('%c打印机未连接','color:blue');
      }
    }, 
    'fail':()=>{}
  });
}

//打印测试
function printTest(multi = 0){
  let app = getApp();
  let amount = '123456.78', 
      trade_gate = '测试',
      padlen = 0;

  multi = multi || app.Data.config.printMulti;
  padlen = 32 - 4 - (trade_gate.length * 2);
  trade_gate = '交易类型'.padEnd(padlen, ' ') + trade_gate;
  padlen = 32 - 5 - amount.length - 2;
  let amount1 = '订单总金额'.padEnd(padlen, ' ') + amount + '元';
  padlen = 32 - 4 - amount.length - 2;
  let amount2 = '商户实收'.padEnd(padlen, ' ') + amount + '元';
  let cmds = [
    {'cmd':'addSetFontForHRICharacter', 'args':['FONTA']},
    {'cmd':'addSelectCharacterFont', 'args':['FONTA']},
    {'cmd':'addSelectJustification', 'args': ['CENTER']},
    {'cmd':'addSelectPrintModes', 'args':['FONTA', 'OFF', 'ON', 'ON', 'OFF']},
    {'cmd':'addText', 'args':['打印测试']},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
    {'cmd':'addSelectPrintModes', 'args':['FONTA', 'OFF', 'OFF', 'OFF', 'OFF']},
    {'cmd':'addText', 'args':['--------------------------------']},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
    {'cmd':'addText', 'args':['商品'.padEnd( 32 - 2 - 8, ' ') + '价格(￥)']},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
  ];

  let goods = [
    {goods_name: "商品1(一二)", price: "1", num: 1},
    {goods_name: "商品2(一/二/三)", price: "0.01", num: 101},
  ];
  for(let good of goods){
    good.price = String((good.price * good.num).toFixed(2));
    padlen = 32 - good.price.length;
    for(let i = 0; i < good.goods_name.length; i++){
      if(/[\u4E00-\u9FA5]/.test(good.goods_name[i])){
        padlen--;
      }
    }
    cmds.push({'cmd':'addText', 'args':[(good.goods_name + 'x' + good.num).padEnd(padlen, ' ') + good.price]});
    cmds.push({'cmd':'addPrintAndLineFeed', 'args':[]});
  }
  cmds = cmds.concat([
    {'cmd':'addText', 'args':['--------------------------------']},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
    {'cmd':'addText', 'args':[trade_gate]},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
    {'cmd':'addText', 'args':[amount1]},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
    {'cmd':'addText', 'args':[amount2]},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
    {'cmd':'addText', 'args':['--------------------------------']},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
    {'cmd':'addSelectJustification', 'args': ['LEFT']},
    {'cmd':'addText', 'args':['商户订单号: ']},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
    {'cmd':'addCODE128General', 'args':['20190812125119359698', '400', '100']},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
    {'cmd':'addText', 'args':['日期时间:    ' + app.util.dateFormatter()]},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
    {'cmd':'addText', 'args':['--------------------------------']},
    {'cmd':'addPrintAndFeedLines', 'args':[2]}
  ]);
  for(let i = 1; i < multi; i++){
    cmds = cmds.concat(cmds);
  }
  for( let p of app.Data.printer ){
    my.ix.printer({
      target: p.id,
      cmds: cmds,
      success: (r) => {},
      fail: (r) => {
        console.warn(r.errorMessage)
      } 
    }).catch( err => {
      //catch隐藏报错
    });
  }
}

//打印小票 一个中文字符占用两个长度，数字符号空格占用一个长度
function printReceipt(complete = res=>{}){
  let app = getApp();
  if(app.Data.order.printed) return; //防重打
  app.Data.order.printed = true;
  let amount = app.Data.order.totalAmount, 
      trade_gate = {alipay: '支付宝', weixin: '微信'}[app.Data.order.trade_gate] || '其它',
      padlen = 0;
  trade_gate = app.Data.order.trade_type == 'card' ? '会员支付' : trade_gate;
  let multi = app.Data.config.printMulti;
  padlen = 32 - 4 - (trade_gate.length * 2);
  trade_gate = '交易类型'.padEnd(padlen, ' ') + trade_gate;
  padlen = 32 - 5 - amount.length - 2;
  let amount1 = '订单总金额'.padEnd(padlen, ' ') + amount + '元';
  padlen = 32 - 4 - amount.length - 2;
  let amount2 = '商户实收'.padEnd(padlen, ' ') + amount + '元';
  let cmds = [
    {'cmd':'addSetFontForHRICharacter', 'args':['FONTA']},
    {'cmd':'addSelectCharacterFont', 'args':['FONTA']},
    {'cmd':'addSelectJustification', 'args': ['CENTER']},
    {'cmd':'addSelectPrintModes', 'args':['FONTA', 'OFF', 'ON', 'ON', 'OFF']},
    {'cmd':'addText', 'args':[app.Data.person.store_name == '默认门店' ? app.Data.person.merchant_name : app.Data.person.store_name]},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
    {'cmd':'addSelectPrintModes', 'args':['FONTA', 'OFF', 'OFF', 'OFF', 'OFF']},
  ];
  let goods = app.Data.order.goods;
  if(goods && app.Data.order.biz_type == 'normal'){
    cmds = cmds.concat([
      {'cmd':'addText', 'args':['--------------------------------']},
      {'cmd':'addPrintAndLineFeed', 'args':[]},
      {'cmd':'addText', 'args':['商品'.padEnd( 32 - 2 - 8, ' ') + '价格(￥)']},
      {'cmd':'addPrintAndLineFeed', 'args':[]},
    ]);
    if( typeof goods == 'string' ){
      goods = JSON.parse(goods);
    }
    for(let good of goods){
      good.price = String((good.price * good.num).toFixed(2));
      padlen = 32 - good.price.length;
      for(let i = 0; i < good.goods_name.length; i++){
        if(/[\u4E00-\u9FA5]/.test(good.goods_name[i])){
          padlen--;
        }
      }
      cmds.push({'cmd':'addText', 'args':[(good.goods_name + 'x' + good.num).padEnd(padlen, ' ') + good.price]});
      cmds.push({'cmd':'addPrintAndLineFeed', 'args':[]});
    }
  }
  cmds = cmds.concat([
    {'cmd':'addText', 'args':['--------------------------------']},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
    {'cmd':'addText', 'args':[trade_gate]},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
    {'cmd':'addText', 'args':[amount1]},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
    {'cmd':'addText', 'args':[amount2]},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
    {'cmd':'addText', 'args':['--------------------------------']},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
    {'cmd':'addSelectJustification', 'args': ['LEFT']},
    {'cmd':'addText', 'args':['商户订单号: ']},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
    {'cmd':'addCODE128General', 'args':[app.Data.order.out_trade_no, '400', '100']},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
    {'cmd':'addText', 'args':['日期时间:    ' + app.util.timestampFormatter(app.Data.order.time_create, 'Y-M-D h:m:s')]},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
    {'cmd':'addText', 'args':['--------------------------------']},
    {'cmd':'addPrintAndFeedLines', 'args':[2]}
  ]);
  for(let i = 1; i < multi; i++){
    cmds = cmds.concat(cmds);
  }
  if(!app.Data.printer.length){
    complete();
    return false;
  }
  for( let p of app.Data.printer ){
    my.ix.printer({
      target: p.id,
      cmds: cmds,
      success: (r) => {
        complete(r);
      },
      fail: (r) => {
        console.warn(r.errorMessage)
        complete(r);
      } 
    }).catch( err => {
      //catch隐藏报错
    });;
  }
  console.log('打印小票')
}

function printBarcode(code = ''){
  let app = getApp();
  let cmds = [
    {'cmd':'addCODE128General', 'args':[code, '400', '100']},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
    {'cmd':'addPrintAndLineFeed', 'args':[]},
  ];
  for( let p of app.Data.printer ){
    my.ix.printer({
      target: p.id,
      cmds: cmds,
      success: (r) => {},
      fail: (r) => {
        console.warn(r.errorMessage)
      } 
    }).catch( err => {
      //catch隐藏报错
    });
  }
}

export default {initPrinter, printTest, printReceipt, printBarcode};